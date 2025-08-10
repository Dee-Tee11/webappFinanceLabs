// src/contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);

      // Verificar se há uma sessão válida
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao obter sessão:", error);
        return;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        console.log("Sessão restaurada para:", session.user.email);
      } else {
        console.log("Nenhuma sessão ativa encontrada");
      }
    } catch (error) {
      console.error("Erro ao inicializar autenticação:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    // Inicializar autenticação
    initializeAuth();

    // Escutar mudanças no estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Casos específicos de tratamento
      switch (event) {
        case "SIGNED_IN":
          console.log("Usuário logado com sucesso");
          // Redirecionar para dashboard após login
          router.push("/dashboard");
          break;
        case "SIGNED_OUT":
          console.log("Usuário deslogado");
          setUser(null);
          setSession(null);
          // Redirecionar para login após logout
          router.push("/");
          break;
        case "TOKEN_REFRESHED":
          console.log("Token renovado automaticamente");
          break;
        case "USER_UPDATED":
          console.log("Dados do usuário atualizados");
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth, initializeAuth]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro no login:", error.message);
      }

      return { error };
    } catch (error) {
      console.error("Erro inesperado no login:", error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Erro no registro:", error.message);
      }

      return { error };
    } catch (error) {
      console.error("Erro inesperado no registro:", error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      return { error };
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      return { error: error as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
