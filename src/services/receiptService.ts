// src/services/receiptService.ts
import { extractTextWithEdge } from "./edgeService";
import { extractDataBasedOnFileType } from "./groqService";
import { supabase } from "../utils/supabase/client";
import { Tables, TablesInsert } from "../utils/supabase/types";

/**
 * Extrai dados de um arquivo (imagem ou PDF) sem salvar no banco de dados
 * @param file - O arquivo a ser processado
 * @returns Promise com os dados extraídos do recibo
 */
export async function extractReceiptData(
  file: File
): Promise<Partial<TablesInsert<"receipts">>> {
  try {
    console.log("🔄 Iniciando extração de dados via Edge Function...");

    // 1. Extrair texto usando a Edge Function (que chama o OCR)
    const ocrText = await extractTextWithEdge(file);

    if (!ocrText || ocrText.trim().length === 0) {
      throw new Error(
        "Não foi possível extrair texto do arquivo. A Edge Function não retornou conteúdo."
      );
    }

    // 2. Determinar o tipo de arquivo para o Groq (ainda útil para prompts diferentes)
    const fileType = file.type === "application/pdf" ? "pdf" : "image";

    console.log(`🧠 Extraindo dados com Groq para ${fileType}...`);
    const parsedData = await extractDataBasedOnFileType(ocrText, fileType);

    console.log("✅ Dados extraídos com sucesso!");
    return parsedData;
  } catch (error) {
    console.error("❌ Erro na extração de dados:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido durante a extração de dados");
    }
  }
}

/**
 * Salva um recibo no banco de dados
 * @param receiptData - Os dados do recibo a serem salvos
 * @returns Promise com os dados do recibo salvo
 */
export async function saveReceipt(
  receiptData: Partial<TablesInsert<"receipts">>
): Promise<Tables<"receipts">> {
  try {
    console.log("💾 Salvando recibo no Supabase...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Usuário não autenticado. Faça login para continuar.");
    }

    const { data, error } = await supabase
      .from("receipts")
      .insert([
        {
          ...receiptData,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao salvar no Supabase:", error);
      throw new Error(`Erro ao salvar recibo: ${error.message}`);
    }

    console.log("✅ Recibo salvo com sucesso!");
    return data;
  } catch (error) {
    console.error("❌ Erro ao salvar o recibo:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido ao salvar o recibo");
    }
  }
}

/**
 * Busca todos os recibos do usuário atual usando a Edge Function.
 * @returns Promise com array de recibos ordenados por data (mais recente primeiro)
 */
export async function getAllReceipts(): Promise<Tables<"receipts">[]> {
  try {
    console.log("🔍 Buscando recibos via Edge Function...");

    // Obter o token de acesso da sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("❌ Erro ao obter sessão ou sessão inexistente:", sessionError);
      throw new Error("Usuário não autenticado.");
    }

    // Chamar a Edge Function com o token de autenticação
    const { data, error } = await supabase.functions.invoke('get-receiptsWebapp', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error("❌ Erro ao chamar a Edge Function:", error);
      throw new Error(`Erro ao buscar recibos: ${error.message}`);
    }

    // A resposta da função contém um objeto { receipts: [...] }
    const receipts = data.receipts || [];

    console.log(`📋 ${receipts.length} recibos encontrados`);
    return receipts;

  } catch (error) {
    console.error("❌ Erro na busca de recibos:", error);
    // Retorna array vazio em caso de erro para não quebrar a UI
    return [];
  }
}

/**
 * Busca um recibo específico por ID
 * @param id - ID do recibo
 * @returns Promise com o recibo ou null se não encontrado
 */
export async function getReceiptById(
  id: string
): Promise<Tables<"receipts"> | null> {
  try {
    console.log(`🔍 Buscando recibo com ID: ${id}`);

    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Erro ao buscar recibo:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Erro na busca do recibo:", error);
    return null;
  }
}

/**
 * Atualiza um recibo existente
 * @param id - ID do recibo
 * @param updates - Dados a serem atualizados
 * @returns Promise com o recibo atualizado
 */
export async function updateReceipt(
  id: string,
  updates: Partial<TablesInsert<"receipts">>
): Promise<Tables<"receipts"> | null> {
  try {
    console.log(`🔄 Atualizando recibo com ID: ${id}`);

    const { data, error } = await supabase
      .from("receipts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao atualizar recibo:", error);
      throw new Error(`Erro ao atualizar recibo: ${error.message}`);
    }

    console.log("✅ Recibo atualizado com sucesso!");
    return data;
  } catch (error) {
    console.error("❌ Erro na atualização do recibo:", error);
    throw error;
  }
}

/**
 * Deleta um recibo
 * @param id - ID do recibo
 * @returns Promise<boolean> - true se deletado com sucesso
 */
export async function deleteReceipt(id: string): Promise<boolean> {
  try {
    console.log(`🗑️ Deletando recibo com ID: ${id}`);

    const { error } = await supabase.from("receipts").delete().eq("id", id);

    if (error) {
      console.error("❌ Erro ao deletar recibo:", error);
      throw new Error(`Erro ao deletar recibo: ${error.message}`);
    }

    console.log("✅ Recibo deletado com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro na deleção do recibo:", error);
    throw error;
  }
}

/**
 * Busca recibos por categoria
 * @param categoria - Categoria a filtrar
 * @returns Promise com array de recibos da categoria
 */
export async function getReceiptsByCategory(
  categoria: string
): Promise<Tables<"receipts">[]> {
  try {
    console.log(`🔍 Buscando recibos da categoria: ${categoria}`);

    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("categoria", categoria)
      .order("date_detected", { ascending: false });

    if (error) {
      console.error("❌ Erro ao buscar recibos por categoria:", error);
      return [];
    }

    console.log(
      `📋 ${data?.length || 0} recibos encontrados na categoria ${categoria}`
    );
    return data || [];
  } catch (error) {
    console.error("❌ Erro na busca por categoria:", error);
    return [];
  }
}

/**
 * Busca recibos por período de datas
 * @param startDate - Data de início (formato YYYY-MM-DD)
 * @param endDate - Data de fim (formato YYYY-MM-DD)
 * @returns Promise com array de recibos no período
 */
export async function getReceiptsByDateRange(
  startDate: string,
  endDate: string
): Promise<Tables<"receipts">[]> {
  try {
    console.log(`🔍 Buscando recibos entre ${startDate} e ${endDate}`);

    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .gte("date_detected", startDate)
      .lte("date_detected", endDate)
      .order("date_detected", { ascending: false });

    if (error) {
      console.error("❌ Erro ao buscar recibos por período:", error);
      return [];
    }

    console.log(`📋 ${data?.length || 0} recibos encontrados no período`);
    return data || [];
  } catch (error) {
    console.error("❌ Erro na busca por período:", error);
    return [];
  }
}
