"use client";

import React, { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginAction } from "@/actions/auth";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const supabaseRef = useRef<ReturnType<typeof createClient>>();
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Che, hubo un problema al conectar con Google. Intentá de nuevo.");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Por favor, completá todos los campos.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const result = await loginAction({ email, password, next: nextParam });
      
      setErrorMsg(result?.error ?? "Las credenciales no coinciden. Verificá los datos.");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Hubo un error inesperado. Intentalo más tarde.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1C1917]/70 backdrop-blur-xl border border-[#F59E0B]/10 rounded-lg p-8 shadow-[0_8px_32px_rgba(12,10,9,0.5)]">
      {/* Status Alerts */}
      {errorParam === "auth" && !errorMsg && (
        <div className="mb-6 p-3 rounded-md bg-[#690005]/20 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs font-sans">
          Tu sesión expiró o las credenciales no son válidas. Volvé a ingresar.
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-3 rounded-md bg-[#690005]/20 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs font-sans">
          {errorMsg}
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleLogin}
        className="w-full h-12 bg-transparent hover:bg-[#F59E0B]/5 border border-[#a08e7a]/40 hover:border-[#F59E0B]/50 text-[#e8e1df] font-sans font-medium rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        <span>Continuá con Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-grow h-[1px] bg-[#534434]/30" />
        <span className="text-xs font-sans text-[#d8c3ad]/50 uppercase tracking-widest">O ingresá con email</span>
        <div className="flex-grow h-[1px] bg-[#534434]/30" />
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleEmailLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-sans font-semibold text-[#d8c3ad] uppercase tracking-wider mb-2">
            Tu email institucional
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-[#a08e7a]/60" />
            </span>
            <input
              type="email"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@unlar.edu.ar"
              className="block w-full pl-10 pr-3 py-3 bg-[#0C0A09]/60 border border-[#534434]/40 rounded-xl text-sm font-sans text-[#e8e1df] placeholder-[#a08e7a]/50 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-sans font-semibold text-[#d8c3ad] uppercase tracking-wider">
              Contraseña
            </label>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-[#a08e7a]/60" />
            </span>
            <input
              type="password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu clave secreta"
              className="block w-full pl-10 pr-3 py-3 bg-[#0C0A09]/60 border border-[#534434]/40 rounded-xl text-sm font-sans text-[#e8e1df] placeholder-[#a08e7a]/50 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] disabled:opacity-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#F59E0B] hover:bg-[#D97707] text-[#0C0A09] font-sans font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
        >
          {loading ? (
            <span>Cargando...</span>
          ) : (
            <>
              <span>Entrar</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="mt-8 text-center">
        <p className="text-xs font-sans text-[#d8c3ad]/70">
          ¿No tenés una cuenta?{" "}
          <Link
            href="/register"
            className="text-[#F59E0B] hover:text-[#D97707] hover:underline font-semibold"
          >
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0C0A09] relative overflow-hidden px-4">
      {/* Background Ambience Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#F59E0B]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#E2775F]/10 blur-[120px] pointer-events-none" />
      
      {/* Visual Canvas Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(245, 158, 11, 0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#F59E0B]/15 flex items-center justify-center border border-[#F59E0B]/30 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <Sparkles className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <h1 className="font-heading font-semibold text-3xl text-[#e8e1df] tracking-tight">
            UNLaR <span className="text-[#F59E0B]">Connect</span>
          </h1>
          <p className="font-sans text-sm text-[#d8c3ad]/80 mt-1 text-center">
            ¡Qué bueno verte de nuevo! Ingresá para conectar con tu comunidad.
          </p>
        </div>

        <Suspense 
          fallback={
            <div className="bg-[#1C1917]/70 backdrop-blur-xl border border-[#F59E0B]/10 rounded-lg p-8 shadow-[0_8px_32px_rgba(12,10,9,0.5)] flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#F59E0B] animate-spin mb-4" />
              <span className="text-sm font-sans text-[#d8c3ad]">Cargando formulario...</span>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
