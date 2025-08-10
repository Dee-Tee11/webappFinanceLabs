// src/utils/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Cliente singleton para uso no lado do cliente
export const supabase = createClient();

// Função para verificar se o usuário está autenticado
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return false;
  }
};

// Função para obter o usuário atual
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
};

// Função para fazer logout seguro
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
};
