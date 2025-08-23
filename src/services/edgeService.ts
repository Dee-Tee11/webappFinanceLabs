// src/services/edgeService.ts
import { supabase } from '@/utils/supabase/client';

interface OCRMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  processingTime: number;
  textLength: number;
  confidence?: number;
  language?: string;
  provider: string;
}

interface OCRResponse {
  extractedText: string;
  metadata: OCRMetadata;
  error?: string;
}

export async function extractTextWithEdge(
  file: File, 
  detectLanguage: boolean = false
): Promise<string> {
  try {
    // Verificar se o ficheiro é válido
    if (!file) {
      throw new Error("No file provided");
    }

    // Verificar o tamanho do ficheiro (Google Vision: 10MB limite)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB for Google Vision processing`);
    }

    // Verificar tipos de ficheiro suportados pelo Google Vision
    if (!isFileTypeSupported(file)) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: JPEG, PNG, WebP, GIF, TIFF, BMP`);
    }

    // Criar FormData
    const formData = new FormData();
    formData.append("file", file);
    if (detectLanguage) {
      formData.append("detectLanguage", "true");
    }

    const { data, error } = await supabase.functions.invoke("ocr-extractWebApp", {
      body: formData,
      headers: {
        // Não definir Content-Type para FormData - o browser faz automaticamente
      }
    });

    console.log("Google Vision Response:", { data, error });

    if (error) {
      if (error.message.includes("429")) {
        throw new Error(
          "Monthly limit of 1000 requests exceeded for Google Cloud Vision."
        );
      }
      console.error("Edge Function Error:", error);
      throw new Error(`Edge Function error: ${error.message || 'Unknown error'}`);
    }

    // Verificar se a resposta tem a estrutura esperada
    if (!data) {
      throw new Error("Edge Function returned no data");
    }

    // Verificar se há texto extraído
    if (!data.extractedText && data.extractedText !== "") {
      // Se há uma mensagem de erro na resposta
      if (data.error) {
        throw new Error(`Google Vision OCR Error: ${data.error}`);
      }
      
      // Se não há erro mas também não há texto
      return "";
    }

    return data.extractedText;

  } catch (error) {
    console.error("Error in extractTextWithEdge (Google Vision):", error);
    
    // Re-throw com mais contexto
    if (error instanceof Error) {
      throw new Error(`Failed to extract text with Google Vision: ${error.message}`);
    } else {
      throw new Error("Failed to extract text: Unknown error occurred");
    }
  }
}

// Função auxiliar para validar tipos de ficheiro suportados pelo Google Vision
export function isFileTypeSupported(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/tiff',
    'image/bmp'
    // PDFs requerem processamento especial
  ];
  
  // Também verificar extensões de ficheiro como fallback
  const fileName = file.name.toLowerCase();
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp'];
  
  return supportedTypes.includes(file.type) || 
         supportedExtensions.some(ext => fileName.endsWith(ext));
}

// Função wrapper que inclui validação de tipo
export async function extractTextWithValidation(
  file: File, 
  detectLanguage: boolean = false
): Promise<string> {
  if (!isFileTypeSupported(file)) {
    throw new Error(`Unsupported file type: ${file.type}. Google Vision supports: JPEG, PNG, WebP, GIF, TIFF, BMP`);
  }
  
  return extractTextWithEdge(file, detectLanguage);
}

// Função para redimensionar imagem se necessário (ainda útil para otimização)
export function resizeImageIfNeeded(
  file: File, 
  maxWidth = 2048, 
  maxHeight = 2048,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    if (file.type === 'application/pdf') {
      // PDFs não são suportados diretamente ainda
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const { width, height } = img;
      
      // Se a imagem já está dentro dos limites, retorna o ficheiro original
      if (width <= maxWidth && height <= maxHeight) {
        resolve(file);
        return;
      }

      // Calcular novo tamanho mantendo aspect ratio
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Melhorar qualidade de rendering
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, { 
            type: file.type,
            lastModified: file.lastModified
          });
          resolve(resizedFile);
        } else {
          resolve(file); // Fallback para o ficheiro original
        }
      }, file.type, quality);
    };

    img.onerror = () => {
      resolve(file); // Fallback para o ficheiro original
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// Função helper para extrair texto com redimensionamento automático
export async function extractTextWithAutoResize(
  file: File,
  detectLanguage: boolean = false,
  autoResize: boolean = true
): Promise<string> {
  try {
    let processedFile = file;
    
    if (autoResize && isFileTypeSupported(file)) {
      processedFile = await resizeImageIfNeeded(file);
    }
    
    return await extractTextWithEdge(processedFile, detectLanguage);
  } catch (error) {
    console.error("Error in extractTextWithAutoResize:", error);
    throw error;
  }
}

// Função para estimar a qualidade do texto extraído (baseado em heurísticas)
export function estimateTextQuality(text: string): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Verificar se há texto
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      issues: ['Nenhum texto foi extraído'],
      suggestions: ['Verifique se a imagem está clara e contém texto legível']
    };
  }

  // Verificar densidade de caracteres especiais (pode indicar OCR ruim)
  const specialChars = text.match(/[^a-zA-Z0-9\s\.\,\!\?\-\(\)\[\]]/g);
  const specialCharRatio = specialChars ? specialChars.length / text.length : 0;
  
  if (specialCharRatio > 0.3) {
    score -= 30;
    issues.push('Muitos caracteres especiais detectados');
    suggestions.push('A imagem pode estar desfocada ou com baixa resolução');
  }

  // Verificar palavras muito curtas ou fragmentadas
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const shortWords = words.filter(word => word.length === 1);
  const shortWordRatio = shortWords.length / Math.max(words.length, 1);
  
  if (shortWordRatio > 0.4) {
    score -= 25;
    issues.push('Muitas palavras fragmentadas');
    suggestions.push('Tente melhorar a qualidade da imagem ou iluminação');
  }

  // Verificar linhas quebradas (muitas linhas muito curtas)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const shortLines = lines.filter(line => line.trim().length < 10);
  const shortLineRatio = shortLines.length / Math.max(lines.length, 1);
  
  if (shortLineRatio > 0.5) {
    score -= 20;
    issues.push('Formatação de texto fragmentada');
    suggestions.push('O documento pode estar inclinado ou com baixo contraste');
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions
  };
}