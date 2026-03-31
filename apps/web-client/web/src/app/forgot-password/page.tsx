"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Step = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success — don't leak whether email exists
      setStep('sent');
    } catch {
      setError("No se pudo enviar el correo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-96 xl:w-[480px] flex-col justify-between bg-zinc-950 px-12 py-14">
        <Image src="/logo.png" alt="PIUMS" width={100} height={34} className="h-9 w-auto" priority />
        <div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            Recupera el acceso<br />
            <span className="text-[#FF6A00]">a tu cuenta</span>
          </h2>
          <p className="mt-4 text-sm text-gray-400">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>
        <p className="text-xs text-gray-600">© 2026 PIUMS Platform</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white lg:border-l lg:border-gray-100">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Image src="/logo.png" alt="PIUMS" width={90} height={30} className="h-8 w-auto" priority />
          </div>

          {step === 'form' ? (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h1>
                <p className="mt-1 text-sm text-gray-400">
                  Ingresa tu correo y te enviaremos un enlace de recuperación.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <svg className="h-4 w-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none transition hover:border-gray-300 focus:ring-2 focus:ring-[#FF6A00]/25 focus:border-[#FF6A00]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#FF6A00] py-2.5 text-sm font-semibold text-white hover:bg-[#e05e00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : "Enviar enlace de recuperación"}
                </button>
              </form>
            </>
          ) : (
            /* ── Success state ── */
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Revisa tu correo</h1>
              <p className="mt-2 text-sm text-gray-500">
                Si <span className="font-medium text-gray-700">{email}</span> está registrado,
                recibirás un enlace para restablecer tu contraseña.
              </p>
              <p className="mt-4 text-xs text-gray-400">
                ¿No lo ves? Revisa tu carpeta de spam.
              </p>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio de sesión
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
