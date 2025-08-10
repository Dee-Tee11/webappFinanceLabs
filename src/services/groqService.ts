// lib/groqService.ts (VERSÃO FINAL CORRIGIDA E OTIMIZADA)

import { supabase } from '@/utils/supabase/client';
import { TablesInsert } from '@/utils/supabase/types';

// Função auxiliar para converter valores para número de forma segura
function safeParseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Converte para string, remove caracteres inválidos e substitui vírgula por ponto
  const cleanValue = String(value)
    .replace(/[^\d.,\-]/g, '') 
    .replace(',', '.');
  
  const parsed = parseFloat(cleanValue);
  
  // Verifica se o valor é um número válido
  if (isNaN(parsed) || !isFinite(parsed)) {
    return null;
  }
  
  return parsed;
}

// Função principal que invoca a Edge Function
export async function extractDataBasedOnFileType(
  text: string,
  fileType: 'pdf' | 'image'
): Promise<Partial<TablesInsert<'receipts'>>> {
  console.log(`🔍 Invocando Edge Function 'groq-parseWebapp' para tipo: ${fileType}`);
  console.log(`[groqService] Dados recebidos: text length = ${text ? text.length : 'N/A'}, fileType = ${fileType}`);

  try {
    // Validação dos parâmetros de entrada
    if (!text || text.trim().length === 0) {
      throw new Error('Texto extraído está vazio ou inválido');
    }
    if (!fileType || (fileType !== 'pdf' && fileType !== 'image')) {
      throw new Error('Tipo de ficheiro deve ser "pdf" ou "image"');
    }

    const requestPayload = {
      text: text.trim(), 
      fileType 
    };
    
    console.log('📤 Dados sendo enviados para Edge Function:', {
      textLength: requestPayload.text.length,
      fileType: requestPayload.fileType,
      textPreview: requestPayload.text.substring(0, 200) + '...'
    });

    // Obter o token de acesso da sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("Erro ao obter sessão ou sessão inexistente:", sessionError);
      throw new Error("Utilizador não autenticado.");
    }

    const { data: parsed, error } = await supabase.functions.invoke('groq-parseWebapp', {
      body: requestPayload,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    // Diagnóstico detalhado do erro, se houver
    if (error) {
      console.error('❌ Detalhes completos do erro da Edge Function:', error);
      // Com a correção do CORS na Edge Function, o erro "Failed to send request" não deve mais ocorrer.
      // O erro agora será mais específico se a função retornar um status de erro.
      throw new Error(`Falha na comunicação com a Edge Function: ${error.message}`);
    }

    console.log('📥 Resposta da Edge Function:', {
      dataType: typeof parsed,
      hasData: !!parsed,
      dataKeys: parsed ? Object.keys(parsed) : null
    });

    if (!parsed) {
      console.error('❌ A Edge Function não retornou dados válidos');
      throw new Error('A Edge Function não retornou dados.');
    }

    console.log('✅ Dados recebidos da Edge Function:', parsed);

    // Mapeia os dados recebidos para o formato da tua tabela 'receipts'
    let data: Partial<TablesInsert<'receipts'>>;

    if (fileType === 'pdf') {
      console.log('📊 Mapeando dados da FATURA PDF');
      data = {
        merchant_name: parsed.prestadorServico || parsed.empresaCliente || null,
        total_amount: safeParseNumber(parsed.totalPagar) ?? safeParseNumber(parsed.totalDocumento),
        date_detected: parsed.dataEmissao || null,
        categoria: 'fatura',
        valor_iva: safeParseNumber(parsed.valorIva),
        extracted_text: text,
        // Podes mapear outros campos específicos de PDF aqui se existirem na tua tabela
      };
    } else {
      console.log('📊 Mapeando dados do RECIBO');
      data = {
        merchant_name: parsed.merchantName || null,
        total_amount: safeParseNumber(parsed.totalValue),
        date_detected: parsed.dateDetected || null,
        categoria: parsed.categoria || 'despesa',
        valor_iva: safeParseNumber(parsed.valor_iva),
        extracted_text: text,
      };
    }

    // Validação final para garantir que dados minimamente úteis foram extraídos
    if (!data.merchant_name && !data.total_amount) {
      console.warn('⚠️ Dados extraídos incompletos (sem comerciante ou valor), mas continuando...');
    }

    console.log('✅ Dados finais mapeados:', data);
    return data;

  } catch (error) {
    console.error('❌ Erro no serviço de extração de dados:', error);
    
    // Propaga o erro com uma mensagem contextualizada
    if (error instanceof Error) {
      throw new Error(`Falha na extração de dados: ${error.message}`);
    } else {
      throw new Error('Falha na extração de dados: Erro desconhecido');
    }
  }
}

// Função para detetar automaticamente o tipo de documento com base no texto
export function detectDocumentTypeFromText(text: string): 'pdf' | 'image' {
  if (!text || typeof text !== 'string') {
    return 'image'; // Fallback padrão
  }

  const pdfIndicators = [
    'fatura-recibo',
    'atcud',
    'portal das finanças',
    'retenção na fonte irs',
    'base de incidência',
    'total do documento',
    'total a pagar',
    'prestador de serviços',
  ];

  const lowerText = text.toLowerCase();
  const indicatorCount = pdfIndicators.filter(indicator =>
    lowerText.includes(indicator.toLowerCase())
  ).length;

  // Se encontrar 2 ou mais indicadores, é provável que seja uma fatura de PDF
  const isPdf = indicatorCount >= 2;
  
  console.log(`📄 Detecção de tipo: ${isPdf ? 'PDF' : 'IMAGE'} (${indicatorCount} indicadores encontrados)`);
  
  return isPdf ? 'pdf' : 'image';
}

// Função para validar os dados extraídos antes de guardar
export function validateExtractedData(data: Partial<TablesInsert<'receipts'>>): string[] {
  const errors: string[] = [];
  
  if (!data.merchant_name && !data.total_amount) {
    errors.push('Nenhum dado significativo foi extraído (nome do comerciante ou valor)');
  }
  
  if (data.date_detected) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date_detected)) {
      errors.push('Data detectada não está no formato correto (AAAA-MM-DD)');
    }
  }
  
  if (data.total_amount !== null && typeof data.total_amount !== 'undefined' && data.total_amount < 0) {
    errors.push('Valor total não pode ser negativo');
  }
  
  if (data.valor_iva !== null && typeof data.valor_iva !== 'undefined' && data.valor_iva < 0) {
    errors.push('Valor do IVA não pode ser negativo');
  }
  
  return errors;
}