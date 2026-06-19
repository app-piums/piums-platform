"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Reset password form (when token is present)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Forgot password form
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 8) {
      setResetError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      await authApi.resetPassword(token!, newPassword);
      setResetDone(true);
    } catch (err: any) {
      setResetError(err?.message ?? "Error al restablecer la contraseña");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">
            {token ? "Nueva contraseña" : "Recuperar contraseña"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {token
              ? "Ingresa tu nueva contraseña para el panel de administración."
              : "Te enviaremos un enlace para restablecer tu contraseña."}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          {token ? (
            resetDone ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-600">Contraseña actualizada correctamente.</p>
                <Link href="/login" className="block w-full rounded-xl bg-[#FF6A00] py-2.5 text-sm font-semibold text-white text-center hover:bg-[#e05e00] transition-colors">
                  Iniciar sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nueva contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
                  />
                </div>
                {resetError && <p className="text-xs text-red-500">{resetError}</p>}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-xl bg-[#FF6A00] py-2.5 text-sm font-semibold text-white hover:bg-[#e05e00] disabled:opacity-50 transition-colors"
                >
                  {resetLoading ? "Guardando…" : "Guardar contraseña"}
                </button>
              </form>
            )
          ) : sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-600">
                Si existe una cuenta con ese correo, recibirás un enlace en los próximos minutos.
              </p>
              <p className="text-xs text-zinc-400">Revisa también tu carpeta de spam.</p>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@piums.app"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#FF6A00] py-2.5 text-sm font-semibold text-white hover:bg-[#e05e00] disabled:opacity-50 transition-colors"
              >
                {loading ? "Enviando…" : "Enviar enlace"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 text-center">
          <Link href="/login" className="text-xs text-zinc-400 hover:text-[#FF6A00] transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}
