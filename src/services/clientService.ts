// src/services/clientService.ts
import {
  supabase,
  getCurrentUser,
  isAuthenticated,
} from "../utils/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "../utils/supabase/types";

/**
 * Cria um novo perfil de cliente
 * @param clientData - Os dados do cliente a serem criados
 * @returns Promise com os dados do cliente criado
 */
export async function createClient(
  clientData: Omit<TablesInsert<"user_profiles">, "id">
): Promise<Tables<"user_profiles">> {
  try {
    console.log("💾 Criando perfil de cliente no Supabase...");

    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado. Faça login para continuar.");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .insert([
        {
          ...clientData,
          id: user.id, // Usar o ID do usuário autenticado
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao criar perfil no Supabase:", error);
      throw new Error(`Erro ao criar perfil: ${error.message}`);
    }

    console.log("✅ Perfil de cliente criado com sucesso!");
    return data;
  } catch (error) {
    console.error("❌ Erro ao criar perfil de cliente:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido ao criar perfil de cliente");
    }
  }
}

/**
 * Busca o perfil do cliente atual
 * @returns Promise com o perfil do cliente ou null se não encontrado
 */
export async function getCurrentClient(): Promise<Tables<"user_profiles"> | null> {
  try {
    console.log("🔍 Buscando perfil do cliente atual...");

    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado. Faça login para continuar.");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Nenhum registro encontrado
        console.log("ℹ️ Perfil de cliente não encontrado");
        return null;
      }
      console.error("❌ Erro ao buscar perfil:", error);
      throw new Error(`Erro ao buscar perfil: ${error.message}`);
    }

    console.log("✅ Perfil do cliente encontrado!");
    return data;
  } catch (error) {
    console.error("❌ Erro na busca do perfil:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido na busca do perfil");
    }
  }
}

/**
 * Busca um cliente específico por ID
 * @param id - ID do cliente
 * @returns Promise com o cliente ou null se não encontrado
 */
export async function getClientById(
  id: string
): Promise<Tables<"user_profiles"> | null> {
  try {
    console.log(`🔍 Buscando cliente com ID: ${id}`);

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log("ℹ️ Cliente não encontrado");
        return null;
      }
      console.error("❌ Erro ao buscar cliente:", error);
      throw new Error(`Erro ao buscar cliente: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("❌ Erro na busca do cliente:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido na busca do cliente");
    }
  }
}

/**
 * Busca um cliente por NIF
 * @param nif - NIF do cliente
 * @returns Promise com o cliente ou null se não encontrado
 */
export async function getClientByNif(
  nif: string
): Promise<Tables<"user_profiles"> | null> {
  try {
    console.log(`🔍 Buscando cliente com NIF: ${nif}`);

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("nif", nif)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log("ℹ️ Cliente não encontrado com este NIF");
        return null;
      }
      console.error("❌ Erro ao buscar cliente por NIF:", error);
      throw new Error(`Erro ao buscar cliente por NIF: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("❌ Erro na busca do cliente por NIF:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido na busca do cliente por NIF");
    }
  }
}

/**
 * Atualiza o perfil do cliente atual
 * @param updates - Dados a serem atualizados
 * @returns Promise com o perfil atualizado
 */
export async function updateCurrentClient(
  updates: TablesUpdate<"user_profiles">
): Promise<Tables<"user_profiles"> | null> {
  try {
    console.log("🔄 Atualizando perfil do cliente atual...");

    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado. Faça login para continuar.");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao atualizar perfil:", error);
      throw new Error(`Erro ao atualizar perfil: ${error.message}`);
    }

    console.log("✅ Perfil atualizado com sucesso!");
    return data;
  } catch (error) {
    console.error("❌ Erro na atualização do perfil:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido na atualização do perfil");
    }
  }
}

/**
 * Atualiza um cliente específico por ID
 * @param id - ID do cliente
 * @param updates - Dados a serem atualizados
 * @returns Promise com o cliente atualizado
 */
export async function updateClient(
  id: string,
  updates: TablesUpdate<"user_profiles">
): Promise<Tables<"user_profiles"> | null> {
  try {
    console.log(`🔄 Atualizando cliente com ID: ${id}`);

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao atualizar cliente:", error);
      throw new Error(`Erro ao atualizar cliente: ${error.message}`);
    }

    console.log("✅ Cliente atualizado com sucesso!");
    return data;
  } catch (error) {
    console.error("❌ Erro na atualização do cliente:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido na atualização do cliente");
    }
  }
}

/**
 * Deleta o perfil do cliente atual
 * @returns Promise<boolean> - true se deletado com sucesso
 */
export async function deleteCurrentClient(): Promise<boolean> {
  try {
    console.log("🗑️ Deletando perfil do cliente atual...");

    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado. Faça login para continuar.");
    }

    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", user.id);

    if (error) {
      console.error("❌ Erro ao deletar perfil:", error);
      throw new Error(`Erro ao deletar perfil: ${error.message}`);
    }

    console.log("✅ Perfil deletado com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro na deleção do perfil:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido na deleção do perfil");
    }
  }
}

/**
 * Deleta um cliente específico por ID
 * @param id - ID do cliente
 * @returns Promise<boolean> - true se deletado com sucesso
 */
export async function deleteClient(id: string): Promise<boolean> {
  try {
    console.log(`🗑️ Deletando cliente com ID: ${id}`);

    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Erro ao deletar cliente:", error);
      throw new Error(`Erro ao deletar cliente: ${error.message}`);
    }

    console.log("✅ Cliente deletado com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro na deleção do cliente:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erro desconhecido na deleção do cliente");
    }
  }
}

/**
 * Busca todos os clientes (útil para administradores)
 * @returns Promise com array de clientes ordenados por data de atualização
 */
export async function getAllClients(): Promise<Tables<"user_profiles">[]> {
  try {
    console.log("🔍 Buscando todos os clientes...");

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("❌ Erro ao buscar clientes:", error);
      return [];
    }

    console.log(`📋 ${data?.length || 0} clientes encontrados`);
    return data || [];
  } catch (error) {
    console.error("❌ Erro na busca de clientes:", error);
    return [];
  }
}

/**
 * Verifica se o cliente atual possui um perfil completo
 * @returns Promise<boolean> - true se o perfil está completo
 */
export async function hasCompleteProfile(): Promise<boolean> {
  try {
    const client = await getCurrentClient();

    if (!client) {
      return false;
    }

    // Verifica se todos os campos obrigatórios estão preenchidos
    return !!(client.nif && client.nif.trim().length > 0);
  } catch (error) {
    console.error("❌ Erro ao verificar perfil completo:", error);
    return false;
  }
}

/**
 * Verifica se o usuário está autenticado e tem um perfil
 * @returns Promise<boolean> - true se está autenticado e tem perfil
 */
export async function isAuthenticatedWithProfile(): Promise<boolean> {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return false;
    }

    const client = await getCurrentClient();
    return !!client;
  } catch (error) {
    console.error("❌ Erro ao verificar autenticação com perfil:", error);
    return false;
  }
}

/**
 * Valida se um NIF já está em uso por outro cliente
 * @param nif - NIF a ser validado
 * @param excludeId - ID do cliente a excluir da validação (opcional)
 * @returns Promise<boolean> - true se o NIF está disponível
 */
export async function isNifAvailable(
  nif: string,
  excludeId?: string
): Promise<boolean> {
  try {
    console.log(`🔍 Verificando disponibilidade do NIF: ${nif}`);

    let query = supabase.from("user_profiles").select("id").eq("nif", nif);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Erro ao verificar NIF:", error);
      return false;
    }

    const isAvailable = !data || data.length === 0;
    console.log(
      `${isAvailable ? "✅" : "❌"} NIF ${
        isAvailable ? "disponível" : "já em uso"
      }`
    );

    return isAvailable;
  } catch (error) {
    console.error("❌ Erro na verificação do NIF:", error);
    return false;
  }
}
