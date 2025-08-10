// supabase/functions/groq-parseWebapp/index.ts (VERSÃO FINAL CORRIGIDA)

import { corsHeaders } from '../_shared/cors.ts';

const GROQ_API_KEY = Deno.env.get("EXPO_PUBLIC_GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Função para extrair dados de recibos genéricos (imagens)
async function extractGenericData(text: string) {
  const prompt = `
Analisa o seguinte texto de um recibo português e extrai as informações especificadas.
Devolve APENAS um objeto JSON válido com os seguintes campos:

- merchantName: O nome da loja ou comerciante
- totalValue: O valor total da compra (como número, sem símbolos)
- dateDetected: A data da transação no formato AAAA-MM-DD
- categoria: "despesa" (para recibos genéricos)
- valor_iva: O valor total do IVA (como número, sem símbolos)

Se um valor não for encontrado, usa null para esse campo.
Converte datas de DD/MM/AAAA para AAAA-MM-DD.
Remove todos os símbolos monetários (€) dos valores.

Texto do Recibo:
"""
${text}
"""`;

  try {
    console.log("-> [Generic] Tentando chamar a API da Groq...");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-saba-24b",
        messages: [
          {
            role: "system",
            content: "És um especialista em documentos comerciais portugueses. Respondes APENAS com JSON válido, sem explicações adicionais.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    console.log(`<- [Generic] Resposta da Groq recebida com status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("<- [Generic] Erro na API da Groq:", errorText);
      throw new Error(`Groq API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Groq API returned no content.");
    }

    console.log("Raw Groq response:", content);

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.log("Initial JSON parse failed, trying to extract JSON from response...");
      
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error("Failed to parse extracted JSON:", secondParseError);
          throw new Error("Could not parse JSON from Groq response");
        }
      } else {
        console.error("No JSON object found in response:", content);
        throw new Error("No valid JSON found in Groq response");
      }
    }

    const cleanedData = {
      merchantName: parsedData.merchantName || null,
      totalValue: parsedData.totalValue ? Number(String(parsedData.totalValue).replace(/[^\d.,]/g, '').replace(',', '.')) || null : null,
      dateDetected: parsedData.dateDetected || null,
      categoria: parsedData.categoria || "despesa",
      valor_iva: parsedData.valor_iva ? Number(String(parsedData.valor_iva).replace(/[^\d.,]/g, '').replace(',', '.')) || null : null,
    };

    console.log("Cleaned data:", cleanedData);
    return cleanedData;

  } catch (error) {
    console.error("Error in extractGenericData:", error);
    throw error;
  }
}

// Função para extrair dados de faturas (PDF)
async function extractPdfData(text: string) {
  const prompt = `
Analisa o seguinte texto extraído de um PDF de fatura portuguesa e extrai as informações especificadas.
Este é um documento fiscal português com campos específicos.

Devolve APENAS um objeto JSON válido com os seguintes campos:

- prestadorServico: Nome completo da pessoa que presta o serviço
- empresaCliente: Nome da empresa que contrata o serviço
- totalDocumento: Valor do "TOTAL DO DOCUMENTO" (como número, sem €)
- totalPagar: Valor do "TOTAL A PAGAR" (como número, sem €)
- valorIva: Valor do IVA (como número, sem €)
- retencaoIRS: Valor da retenção na fonte IRS (como número, sem €)
- dataEmissao: Data de emissão no formato AAAA-MM-DD
- numeroFatura: Número da fatura completo
- nifPrestador: NIF do prestador de serviços
- nifCliente: NIF da empresa cliente
- categoria: "fatura"
- descricaoServico: Descrição do serviço prestado

Instruções importantes:
- Converte datas de DD/MM/AAAA para AAAA-MM-DD
- Remove símbolos € e converte valores para números
- Identifica corretamente prestador (pessoa física) vs cliente (empresa)
- Se um campo não existir, usa null

Texto da Fatura:
"""
${text}
"""`;

  try {
    console.log("-> [PDF] Tentando chamar a API da Groq...");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-saba-24b",
        messages: [
          {
            role: "system",
            content: `És um especialista em documentos fiscais portugueses... Respondes APENAS com JSON válido.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.05,
        max_tokens: 1500,
      }),
    });
    
    console.log(`<- [PDF] Resposta da Groq recebida com status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("<- [PDF] Erro na API da Groq:", errorText);
      throw new Error(`Groq API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Groq API returned no content.");
    }

    console.log("Raw Groq PDF response:", content);

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.log("Initial JSON parse failed for PDF, trying to extract JSON...");
      
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error("Failed to parse extracted JSON:", secondParseError);
          throw new Error("Could not parse JSON from Groq response");
        }
      } else {
        console.error("No JSON object found in response:", content);
        throw new Error("No valid JSON found in Groq response");
      }
    }

    const cleanedData = {
      prestadorServico: parsedData.prestadorServico || null,
      empresaCliente: parsedData.empresaCliente || null,
      totalDocumento: parsedData.totalDocumento ? Number(String(parsedData.totalDocumento).replace(/[^\d.,]/g, '').replace(',', '.')) || null : null,
      totalPagar: parsedData.totalPagar ? Number(String(parsedData.totalPagar).replace(/[^\d.,]/g, '').replace(',', '.')) || null : null,
      valorIva: parsedData.valorIva ? Number(String(parsedData.valorIva).replace(/[^\d.,]/g, '').replace(',', '.')) || null : null,
      retencaoIRS: parsedData.retencaoIRS ? Number(String(parsedData.retencaoIRS).replace(/[^\d.,]/g, '').replace(',', '.')) || null : null,
      dataEmissao: parsedData.dataEmissao || null,
      numeroFatura: parsedData.numeroFatura || null,
      nifPrestador: parsedData.nifPrestador || null,
      nifCliente: parsedData.nifCliente || null,
      categoria: "fatura",
      descricaoServico: parsedData.descricaoServico || null,
    };

    console.log("Cleaned PDF data:", cleanedData);
    return cleanedData;

  } catch (error) {
    console.error("Error in extractPdfData:", error);
    throw error;
  }
}

// Handler principal da Edge Function
Deno.serve(async (req) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ✅ CORREÇÃO: Centraliza os cabeçalhos de resposta para garantir CORS em todos os casos
  const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    if (!GROQ_API_KEY) {
      console.error("❌ GROQ API key not set");
      return new Response(JSON.stringify({ error: "Groq API key not configured" }), {
        status: 500,
        headers: responseHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: responseHeaders,
      });
    }

    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: "Invalid Content-Type", details: `Expected application/json, got ${contentType}` }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error("❌ Error parsing request JSON:", jsonError);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body", details: jsonError.message }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const { text, fileType } = requestBody || {};

    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.error("❌ Missing or invalid 'text' field");
      return new Response(JSON.stringify({ error: "Invalid 'text' field", details: "'text' must be a non-empty string." }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    if (!fileType || (fileType !== 'pdf' && fileType !== 'image')) {
      console.error("❌ Missing or invalid 'fileType' field");
      return new Response(JSON.stringify({ error: "Invalid 'fileType' field", details: "fileType must be 'pdf' or 'image'." }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    let extractedData;
    try {
      if (fileType === 'pdf') {
        extractedData = await extractPdfData(text);
      } else {
        extractedData = await extractGenericData(text);
      }
    } catch (extractionError) {
      console.error("❌ Error during data extraction:", extractionError);
      return new Response(JSON.stringify({ error: "Data extraction failed", details: extractionError.message }), {
        status: 500,
        headers: responseHeaders,
      });
    }

    console.log(`✅ Data extraction completed in ${Date.now() - startTime}ms`);
    return new Response(JSON.stringify(extractedData), {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Unexpected error (${processingTime}ms):`, error);
    
    // ✅ CORREÇÃO CRÍTICA: Adiciona cabeçalhos CORS à resposta de erro final
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      status: 500,
      headers: responseHeaders,
    });
  }
});