"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import logoInvertidoRecortado from "@/assets/logoInvertidoRecortado.png";
import icon from "@/assets/icon.png";
import { createClient } from "@/utils/supabase/client";

export default function AuthPage() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nif, setNif] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Failed to log in: " + error.message);
    } else {
      router.push("/dashboard");
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    // Sign out any existing user
    await supabase.auth.signOut();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nif: nif,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    // Temporarily bypass Supabase signup for debugging redirect
    window.location.href = '/auth/confirm';
    // return; // No need for return here, as window.location.href will navigate away

    // Original Supabase signup logic (commented out for now)
    // await supabase.auth.signOut();
    // const { error } = await supabase.auth.signUp({
    //   email,
    //   password,
    //   options: {
    //     data: {
    //       nif: nif,
    //     },
    //     emailRedirectTo: `${location.origin}/auth/callback`,
    //   },
    // });

    // if (error) {
    //   setError("Failed to sign up: " + error.message);
    // } else {
    //   window.location.href = '/auth/confirm';
    // }
    // setIsLoading(false);
  };

  // Keep isLoading true until the redirect happens
  // setIsLoading(false); // Removed to prevent re-render interference

  return (
    <div className="min-h-[100dvh] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-md w-full space-y-8">
          {/* Logo/Icon */}
          <div className="text-center">
            <div className="mx-auto mb-8 flex justify-center">
              <Image
                src={icon}
                alt="FinanceLabs Icon"
                width={80}
                height={80}
                className="rounded-full shadow-lg"
              />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSigningUp ? "Crie a sua conta" : "Bem-vindo de volta!"}
            </h1>
            <p className="text-gray-600">
              {isSigningUp ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
              <button
                onClick={() => {
                  setIsSigningUp(!isSigningUp);
                  setError("");
                  setMessage("");
                }}
                className="text-blue-600 hover:text-blue-500 font-medium underline"
              >
                {isSigningUp ? "Faça login" : "Registe-se agora"}
              </button>
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSigningUp ? "signup" : "login"}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Form */}
              <form
                onSubmit={isSigningUp ? handleSignUp : handleLogin}
                className="space-y-6"
              >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Endereço de email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                placeholder="Insira o seu email"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400 pr-12"
                  placeholder="Insira a sua palavra-passe"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {isSigningUp && (
              <div>
                <label
                  htmlFor="nif"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  NIF
                </label>
                <input
                  id="nif"
                  name="nif"
                  type="text"
                  required
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="Insira o seu NIF"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Remember me & Forgot password (only for login) */}
            {!isSigningUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Lembrar-me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
                  disabled={isLoading}
                >
                  Esqueceu a palavra-passe?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              {isLoading
                ? isSigningUp
                  ? "A registar..."
                  : "A entrar..."
                : isSigningUp
                ? "Registar"
                : "Entrar"}
            </button>
          </form>
        </motion.div>
      </AnimatePresence>

          {/* Messages */}
          {message && (
            <p className="text-center text-sm text-green-500">{message}</p>
          )}
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#667eea] to-[#764ba2] items-center justify-center text-white">
        <div className="text-center px-8">
          <Image
            src={logoInvertidoRecortado}
            alt="FinanceLabs Logo"
            width={160}
            height={160}
            className="mb-6 mx-auto"
          />
          <h2 className="text-4xl font-bold mb-4">
            Junte-se a milhares de utilizadores
          </h2>
          <p className="text-xl text-white/80 max-w-md mx-auto">
            Experimente o futuro da produtividade com a nossa plataforma
            inovadora
          </p>
        </div>
      </div>
    </div>
  );
}
