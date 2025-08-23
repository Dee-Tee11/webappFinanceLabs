// supabase/functions/ocr-vision/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Google Cloud Vision API configuration
const GOOGLE_CREDENTIALS = Deno.env.get("GOOGLE_CREDENTIALS");
const GOOGLE_PROJECT_ID = Deno.env.get("GOOGLE_PROJECT_ID");

interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface VisionRequest {
  requests: [{
    image: {
      content?: string;
    };
    features: [{
      type: string;
      maxResults?: number;
    }];
    imageContext?: {
      languageHints?: string[];
    };
  }];
}

interface VisionResponse {
  responses: [{
    textAnnotations?: Array<{
      description: string;
      boundingPoly?: any;
    }>;
    fullTextAnnotation?: {
      text: string;
      pages?: any[];
    };
    error?: {
      code: number;
      message: string;
    };
  }];
}

// Função para obter token de acesso do Google - VERSÃO COM MELHOR TRATAMENTO DE CHAVE
async function getGoogleAccessToken(): Promise<string> {
  try {
    if (!GOOGLE_CREDENTIALS) {
      throw new Error("GOOGLE_CREDENTIALS not found in environment variables");
    }

    console.log("Parsing Google credentials...");
    const credentials: GoogleCredentials = JSON.parse(GOOGLE_CREDENTIALS);
    
    console.log("Creating JWT for service account:", credentials.client_email);
    const now = Math.floor(Date.now() / 1000);
    
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    };

    // Create base64url encoded header and payload
    const headerB64 = btoa(JSON.stringify(header))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const payloadB64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    console.log("Processing private key...");
    
    // Clean the private key - handle both escaped and unescaped newlines
    let privateKeyPem = credentials.private_key;
    if (privateKeyPem.includes('\\n')) {
      privateKeyPem = privateKeyPem.replace(/\\n/g, '\n');
    }
    
    // Verify it's a proper PEM format
    if (!privateKeyPem.includes('-----BEGIN PRIVATE KEY-----') || 
        !privateKeyPem.includes('-----END PRIVATE KEY-----')) {
      throw new Error("Invalid private key format - missing PEM headers");
    }
    
    // Extract just the base64 content (remove headers and whitespace)
    const keyContent = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/[\r\n\s]/g, '');
    
    console.log("Key content extracted, base64 length:", keyContent.length);
    
    // Convert base64 to ArrayBuffer with better error handling
    let keyBytes;
    try {
      const binaryString = atob(keyContent);
      keyBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        keyBytes[i] = binaryString.charCodeAt(i);
      }
    } catch (decodeError) {
      throw new Error(`Failed to decode private key base64: ${decodeError.message}`);
    }
    
    console.log("Private key decoded, attempting to import...");
    
    // Try multiple import formats as Google keys can vary
    let cryptoKey;
    const importErrors = [];
    
    // Try PKCS#8 first (most common for Google service accounts)
    try {
      cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        keyBytes.buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );
      console.log("✅ Successfully imported key as PKCS#8");
    } catch (pkcs8Error) {
      importErrors.push(`PKCS#8: ${pkcs8Error.message}`);
      console.log("❌ PKCS#8 import failed, trying alternatives...");
      
      // If PKCS#8 fails, the key might be in a different format
      // Let's try to convert or use a different approach
      throw new Error(`Private key import failed. This might be due to key format incompatibility. PKCS#8 error: ${pkcs8Error.message}`);
    }
    
    if (!cryptoKey) {
      throw new Error(`Failed to import private key. Tried formats: ${importErrors.join('; ')}`);
    }
    
    console.log("Signing JWT...");
    const textEncoder = new TextEncoder();
    const signatureData = textEncoder.encode(`${headerB64}.${payloadB64}`);
    
    let signature;
    try {
      signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        signatureData
      );
    } catch (signError) {
      throw new Error(`JWT signing failed: ${signError.message}`);
    }
    
    // Convert signature to base64url
    const signatureArray = new Uint8Array(signature);
    const signatureB64 = btoa(String.fromCharCode(...signatureArray))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;
    console.log("JWT created successfully, length:", jwt.length);

    console.log("Requesting access token from Google...");
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    console.log("Token response status:", tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token request failed:", errorText);
      
      // Log more details for debugging
      try {
        const errorObj = JSON.parse(errorText);
        if (errorObj.error === 'invalid_grant') {
          throw new Error(`Invalid JWT grant. This could be due to: 1) Incorrect service account email, 2) Wrong private key, 3) Clock skew, or 4) Insufficient permissions. Error: ${errorObj.error_description || 'No description'}`);
        }
      } catch (parseError) {
        // Error response is not JSON
      }
      
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log("✅ Access token obtained successfully");
    
    if (!tokenData.access_token) {
      throw new Error("No access token in response");
    }
    
    return tokenData.access_token;

  } catch (error) {
    console.error("Authentication error details:", {
      message: error.message,
      stack: error.stack?.substring(0, 500) // Limit stack trace length
    });
    
    // Provide helpful error messages
    if (error.message.includes('JSON.parse')) {
      throw new Error(`Invalid GOOGLE_CREDENTIALS format: ${error.message}`);
    }
    if (error.message.includes('importKey') || error.message.includes('ASN.1')) {
      throw new Error(`Private key format issue: ${error.message}. Try regenerating your Google Service Account key.`);
    }
    
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Função para extração de texto - sem alterações significativas
async function extractTextWithVision(
  imageBase64: string, 
  detectLanguage = false,
  retryCount = 0
): Promise<{ text: string; confidence?: number; language?: string }> {
  const maxRetries = 2;
  
  try {
    console.log(`Vision API attempt ${retryCount + 1}/${maxRetries + 1}`);
    
    const accessToken = await getGoogleAccessToken();
    
    const visionRequest: VisionRequest = {
      requests: [{
        image: {
          content: imageBase64
        },
        features: [{
          type: "DOCUMENT_TEXT_DETECTION",
          maxResults: 1
        }],
        imageContext: detectLanguage ? {
          languageHints: ["pt", "en"]
        } : undefined
      }]
    };

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visionRequest),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Vision API Error Response:", errorBody);
      
      if ((response.status === 429 || response.status >= 500) && retryCount < maxRetries) {
        console.log(`Retrying due to status ${response.status}...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return extractTextWithVision(imageBase64, detectLanguage, retryCount + 1);
      }
      
      throw new Error(`Vision API request failed: ${response.status} - ${errorBody}`);
    }

    const result: VisionResponse = await response.json();
    console.log("Vision API Response received");
    console.log("Full Vision API Response:", JSON.stringify(result, null, 2));

    if (result.responses?.[0]?.error) {
      const error = result.responses[0].error;
      console.error("Vision API Processing Error:", error);
      
      if (retryCount < maxRetries) {
        console.log("Retrying due to processing error...");
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return extractTextWithVision(imageBase64, detectLanguage, retryCount + 1);
      }
      
      throw new Error(`Vision API error: ${error.message}`);
    }

    const response_data = result.responses?.[0];
    let extractedText = "";
    let confidence = undefined;
    let detectedLanguage = undefined;

    if (response_data?.fullTextAnnotation?.text) {
      extractedText = response_data.fullTextAnnotation.text;
    } else if (response_data?.textAnnotations?.[0]) {
      extractedText = response_data.textAnnotations[0].description;
    }

    if (response_data?.textAnnotations && response_data.textAnnotations.length > 1) {
      const wordAnnotations = response_data.textAnnotations.slice(1);
      if (wordAnnotations.length > 0) {
        confidence = Math.min(0.95, 0.7 + (wordAnnotations.length / 100));
      }
    }

    console.log(`Extracted text length: ${extractedText.length} characters`);
    
    if (extractedText.length > 0) {
      console.log("Text preview:", extractedText.substring(0, 200) + (extractedText.length > 200 ? "..." : ""));
    }
    
    return {
      text: extractedText,
      confidence,
      language: detectedLanguage
    };
    
  } catch (error) {
    console.error("Vision API error:", error);
    
    if (retryCount < maxRetries && !error.message.includes('API request failed')) {
      console.log(`Retrying due to error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
      return extractTextWithVision(imageBase64, detectLanguage, retryCount + 1);
    }
    
    throw error;
  }
}

// Função para converter arquivo para base64 - CORRIGIDA
async function fileToBase64(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    
    // Processamento em chunks para arquivos grandes
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    
    return btoa(binary);
  } catch (error) {
    console.error("Error converting file to base64:", error);
    throw new Error(`Failed to convert file to base64: ${error.message}`);
  }
}

function getVisionFeatureType(file: File): string {
  const fileName = file.name.toLowerCase();
  
  if (fileName.includes('receipt') || 
      fileName.includes('invoice') || 
      fileName.includes('recibo') || 
      fileName.includes('fatura') ||
      file.type === 'application/pdf') {
    return 'DOCUMENT_TEXT_DETECTION';
  }
  
  return 'TEXT_DETECTION';
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests - CORRIGIDO
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  if (req.method !== "POST") {
    console.warn("Method not allowed:", req.method);
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count, error: countError } = await supabase
      .from("api_usage")
      .select("*", { count: "exact", head: true })
      .eq("service", "Google Cloud Vision")
      .gte("created_at", firstDayOfMonth.toISOString());

    if (countError) {
      throw countError;
    }

    if (count !== null && count >= 1000) {
      return new Response(
        JSON.stringify({
          error: "Monthly limit of 1000 requests exceeded for Google Cloud Vision.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    // Verificar credenciais do Google
    if (!GOOGLE_CREDENTIALS) {
      console.error("GOOGLE_CREDENTIALS environment variable not set");
      return new Response(JSON.stringify({ 
        error: "Google Cloud Vision API credentials not configured",
        details: "Please set GOOGLE_CREDENTIALS in your environment variables"
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    console.log("Google credentials found, parsing form data...");
    
    // Parse form data com tratamento de erro melhorado
    let formData;
    try {
      const contentType = req.headers.get('content-type') || '';
      console.log("Content-Type:", contentType);
      
      if (!contentType.includes('multipart/form-data')) {
        throw new Error('Content-Type must be multipart/form-data');
      }
      
      formData = await req.formData();
      console.log("Form data parsed successfully");
    } catch (formError) {
      console.error("Error parsing form data:", formError);
      return new Response(JSON.stringify({ 
        error: "Invalid form data",
        details: `Could not parse multipart form data: ${formError.message}`
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    const file = formData.get("file") as File;
    const detectLanguage = formData.get("detectLanguage") === "true";

    if (!file) {
      console.error("No file provided in request");
      return new Response(JSON.stringify({ 
        error: "No file provided",
        details: "Please include a file in the 'file' field of the form data"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Validar tamanho do arquivo
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error(`File too large: ${file.size} bytes (max: ${maxSize} bytes)`);
      return new Response(JSON.stringify({ 
        error: "File too large", 
        details: `Maximum file size is ${maxSize / 1024 / 1024}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    // Validar tipo do arquivo
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
      'image/gif', 'image/tiff', 'image/bmp'
    ];
    
    const fileName = file.name.toLowerCase();
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp'];
    
    const isValidType = supportedTypes.includes(file.type) || 
                       supportedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidType && file.type !== 'application/pdf') {
      console.error(`Unsupported file type: ${file.type}`);
      return new Response(JSON.stringify({ 
        error: "Unsupported file type",
        details: `Supported types: ${supportedTypes.join(', ')}. PDFs require special handling.`
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    // Lidar com PDFs
    if (file.type === 'application/pdf') {
      return new Response(JSON.stringify({ 
        error: "PDF processing not yet implemented",
        details: "PDF files require conversion to images first. This feature is coming soon."
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    console.log("Converting file to base64...");
    const imageBase64 = await fileToBase64(file);
    console.log(`Base64 conversion completed, length: ${imageBase64.length}`);

    console.log("Calling Google Vision API...");
    const result = await extractTextWithVision(imageBase64, detectLanguage);

    const { error: insertError } = await supabase
      .from("api_usage")
      .insert({ service: "Google Cloud Vision" });

    if (insertError) {
      console.error("Error logging API usage:", insertError);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Vision API processing completed successfully in ${processingTime}ms`);
    
    return new Response(JSON.stringify({ 
      success: true,
      extractedText: result.text,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        processingTime: processingTime,
        textLength: result.text.length,
        confidence: result.confidence,
        language: result.language,
        provider: 'google-cloud-vision'
      }
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Error processing file (${processingTime}ms):`, error);
    
    // Determinar status code baseado no tipo de erro
    let statusCode = 500;
    if (error.message.includes('File too large')) statusCode = 400;
    if (error.message.includes('Unsupported file type')) statusCode = 400;
    if (error.message.includes('No file provided')) statusCode = 400;
    if (error.message.includes('API request failed')) statusCode = 502;
    if (error.message.includes('Authentication failed')) statusCode = 401;
    if (error.message.includes('Invalid form data')) statusCode = 400;
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Unknown error occurred",
      details: error.stack,
      processingTime: processingTime,
      provider: 'google-cloud-vision'
    }), {
      status: statusCode,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  }
});

console.log("Google Cloud Vision OCR Edge Function initialized and ready to serve requests");