import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Usar a secret correta que você tem no Supabase
const OCR_API_KEY = Deno.env.get("EXPO_PUBLIC_OCR_SPACE_API_KEY");
const OCR_API_URL = "https://api.ocr.space/parse/image";

// Função melhorada para extração de texto com retry logic
async function extractText(formData: FormData, retryCount = 0): Promise<string> {
  const maxRetries = 2;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

  try {
    console.log(`OCR attempt ${retryCount + 1}/${maxRetries + 1}`);
    
    const response = await fetch(OCR_API_URL, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OCR API Error Response:", errorBody);
      
      // Se é erro 429 (rate limit) ou 503 (service unavailable), tenta novamente
      if ((response.status === 429 || response.status >= 500) && retryCount < maxRetries) {
        console.log(`Retrying due to status ${response.status}...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000)); // Wait 2s, 4s, 6s
        return extractText(formData, retryCount + 1);
      }
      
      throw new Error(`OCR API request failed: ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    console.log("OCR API Response received");

    // Verificar se houve erro no processamento
    if (result.IsErroredOnProcessing) {
      const errorMessage = result.ErrorMessage || "OCR processing failed";
      console.error("OCR Processing Error:", errorMessage);
      
      if (retryCount < maxRetries) {
        console.log("Retrying due to processing error...");
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return extractText(formData, retryCount + 1);
      }
      
      throw new Error(errorMessage);
    }

    // Verificar se há resultados
    if (!result.ParsedResults || result.ParsedResults.length === 0) {
      console.warn("No parsed results returned from OCR");
      return "";
    }

    const extractedText = result.ParsedResults[0]?.ParsedText || "";
    console.log(`Extracted text length: ${extractedText.length} characters`);
    
    // Log parcial do texto para debug (primeiros 200 caracteres)
    if (extractedText.length > 0) {
      console.log("Text preview:", extractedText.substring(0, 200) + (extractedText.length > 200 ? "..." : ""));
    }
    
    return extractedText;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      if (retryCount < maxRetries) {
        console.log("Retrying due to timeout...");
        return extractText(formData, retryCount + 1);
      }
      throw new Error('OCR request timed out after multiple attempts');
    }
    
    // Para outros erros, só retry se não foi já tentado muito
    if (retryCount < maxRetries && !error.message.includes('API request failed')) {
      console.log(`Retrying due to error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
      return extractText(formData, retryCount + 1);
    }
    
    throw error;
  }
}

// Função para validar e otimizar parâmetros OCR baseado no tipo de ficheiro
function optimizeOcrParameters(file: File, formData: FormData) {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;
  
  // Configurações básicas
  formData.append("apikey", OCR_API_KEY!);
  formData.append("language", "por"); // Português
  formData.append("detectorientation", "true");
  formData.append("scale", "true");
  formData.append("istable", "true");
  
  // Configurações específicas por tipo de ficheiro
  if (fileType === "application/pdf" || fileName.endsWith('.pdf')) {
    formData.append("filetype", "PDF");
    formData.append("ocrengine", "2"); // Engine 2 é melhor para PDFs
  } else {
    // Para imagens
    formData.append("filetype", "Auto");
    
    // Escolher engine baseado no tipo de imagem
    if (fileName.includes('receipt') || fileName.includes('invoice') || fileName.includes('recibo') || fileName.includes('fatura')) {
      formData.append("ocrengine", "2"); // Engine 2 para documentos
    } else {
      formData.append("ocrengine", "1"); // Engine 1 para imagens gerais
    }
  }
}

serve(async (req) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    // Check if API key is available
    if (!OCR_API_KEY) {
      console.error("EXPO_PUBLIC_OCR_SPACE_API_KEY environment variable not set");
      return new Response(JSON.stringify({ 
        error: "OCR API key not configured",
        details: "Please set EXPO_PUBLIC_OCR_SPACE_API_KEY in your environment variables"
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    console.log("API Key found, parsing form data...");
    
    let formData;
    try {
      formData = await req.formData();
    } catch (formError) {
      console.error("Error parsing form data:", formError);
      return new Response(JSON.stringify({ 
        error: "Invalid form data",
        details: "Could not parse multipart form data"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    const file = formData.get("file") as File;

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

    // Validate file size (OCR.space free tier has 1MB limit)
    const maxSize = 1024 * 1024; // 1MB
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

    // Validate file type
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
      'image/gif', 'image/tiff', 'image/bmp', 'application/pdf'
    ];
    
    const fileName = file.name.toLowerCase();
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp', '.pdf'];
    
    const isValidType = supportedTypes.includes(file.type) || 
                       supportedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
      console.error(`Unsupported file type: ${file.type}`);
      return new Response(JSON.stringify({ 
        error: "Unsupported file type",
        details: `Supported types: ${supportedTypes.join(', ')}`
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    console.log("Preparing OCR request...");
    const ocrFormData = new FormData();
    ocrFormData.append("file", file);
    
    // Otimizar parâmetros OCR
    optimizeOcrParameters(file, ocrFormData);

    console.log("Calling OCR API...");
    const extractedText = await extractText(ocrFormData);

    const processingTime = Date.now() - startTime;
    console.log(`OCR processing completed successfully in ${processingTime}ms`);
    
    return new Response(JSON.stringify({ 
      extractedText,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        processingTime: processingTime,
        textLength: extractedText.length
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
    
    // Determinar o status code baseado no tipo de erro
    let statusCode = 500;
    if (error.message.includes('File too large')) statusCode = 400;
    if (error.message.includes('Unsupported file type')) statusCode = 400;
    if (error.message.includes('No file provided')) statusCode = 400;
    if (error.message.includes('API request failed')) statusCode = 502;
    if (error.message.includes('timed out')) statusCode = 504;
    
    return new Response(JSON.stringify({ 
      error: error.message || "Unknown error occurred",
      details: error.stack,
      processingTime: processingTime
    }), {
      status: statusCode,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  }
});

console.log("OCR Edge Function initialized and ready to serve requests");