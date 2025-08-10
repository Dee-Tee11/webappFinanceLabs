import { supabase } from '@/utils/supabase/client';

export async function extractTextWithEdge(file: File): Promise<string> {
  console.log("Invoking Edge Function to process file...", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  try {
    // Verificar se o ficheiro é válido
    if (!file) {
      throw new Error("No file provided");
    }

    // Verificar o tamanho do ficheiro (limite da OCR.space: 1MB)
    const maxSize = 1024 * 1024; // 1MB (limite da OCR.space)
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB for OCR processing`);
    }

    // Verificar tipos de ficheiro suportados pela OCR.space
    if (!isFileTypeSupported(file)) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: JPEG, PNG, WebP, PDF`);
    }

    // Criar FormData
    const formData = new FormData();
    formData.append("file", file);

    console.log("Calling Supabase Edge Function...");

    const { data, error } = await supabase.functions.invoke("ocr-extractWebApp", {
      body: formData,
      headers: {
        // Não definir Content-Type para FormData - o browser faz automaticamente
      }
    });

    console.log("Edge Function Response:", { data, error });

    if (error) {
      console.error("Edge Function Error:", error);
      throw new Error(`Edge Function error: ${error.message || 'Unknown error'}`);
    }

    // Verificar se a resposta tem a estrutura esperada
    if (!data) {
      console.warn("Edge Function returned null/undefined data");
      throw new Error("Edge Function returned no data");
    }

    // Verificar se há texto extraído
    if (!data.extractedText && data.extractedText !== "") {
      console.warn("Edge Function returned no extracted text:", data);
      
      // Se há uma mensagem de erro na resposta
      if (data.error) {
        throw new Error(`OCR Error: ${data.error}`);
      }
      
      // Se não há erro mas também não há texto
      console.log("No text could be extracted from the file");
      return "";
    }

    console.log("Successfully extracted text length:", data.extractedText.length);
    return data.extractedText;

  } catch (error) {
    console.error("Error in extractTextWithEdge:", error);
    
    // Re-throw com mais contexto
    if (error instanceof Error) {
      throw new Error(`Failed to extract text: ${error.message}`);
    } else {
      throw new Error("Failed to extract text: Unknown error occurred");
    }
  }
}

// Função auxiliar para validar tipos de ficheiro suportados pela OCR.space
export function isFileTypeSupported(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/tiff',
    'image/bmp',
    'application/pdf'
  ];
  
  // Também verificar extensões de ficheiro como fallback
  const fileName = file.name.toLowerCase();
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp', '.pdf'];
  
  return supportedTypes.includes(file.type) || 
         supportedExtensions.some(ext => fileName.endsWith(ext));
}

// Função wrapper que inclui validação de tipo
export async function extractTextWithValidation(file: File): Promise<string> {
  if (!isFileTypeSupported(file)) {
    throw new Error(`Unsupported file type: ${file.type}. Supported types: JPEG, PNG, WebP, GIF, TIFF, BMP, PDF`);
  }
  
  return extractTextWithEdge(file);
}

// Função para redimensionar imagem se necessário (para otimizar OCR)
export function resizeImageIfNeeded(file: File, maxWidth = 2000, maxHeight = 2000): Promise<File> {
  return new Promise((resolve) => {
    if (file.type === 'application/pdf') {
      // PDFs não precisam de redimensionamento
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
      const newWidth = width * ratio;
      const newHeight = height * ratio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Desenhar imagem redimensionada
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, { type: file.type });
          resolve(resizedFile);
        } else {
          resolve(file); // Fallback para o ficheiro original
        }
      }, file.type, 0.9); // 90% quality
    };

    img.onerror = () => resolve(file); // Fallback para o ficheiro original
    img.src = URL.createObjectURL(file);
  });
}