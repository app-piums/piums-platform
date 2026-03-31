"use client";

import { useState, FormEvent } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface FieldError {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "email":
        if (!value) return "El correo es requerido";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Correo inválido";
        return "";
      case "password":
        if (!value) return "La contraseña es requerida";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, value);
    setErrors({ ...errors, [field]: error });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    const newErrors: FieldError = {
      email: validateField("email", email),
      password: validateField("password", password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (Object.values(newErrors).some((e) => e)) {
      setGeneralError("Por favor corrige los errores antes de continuar");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Left brand panel (lg+) ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 20% 60%, rgba(255,106,0,0.25) 0%, transparent 65%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(255,154,60,0.12) 0%, transparent 55%)' }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)' }} />

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6A00] shadow-lg shadow-[#FF6A00]/30">
                <span className="text-base font-bold text-white">P</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Piums</span>
            </div>
          </div>

          {/* Tagline central */}
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Panel de<br />
              <span className="text-[#FF6A00]">Administración</span><br />
              centralizado.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Gestiona usuarios, artistas, reservas y contenido de la plataforma desde un único lugar.
            </p>

            {/* Stats */}
            <div className="mt-8 flex gap-8">
              {[['100%', 'Control'], ['Real‑time', 'Datos'], ['Seguro', 'Acceso']].map(([val, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-white">{val}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-600">
            Acceso restringido · Solo administradores autorizados
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white lg:border-l lg:border-gray-100">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6A00]">
              <span className="text-base font-bold text-white">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Piums Admin</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido de nuevo</h1>
            <p className="mt-1 text-sm text-gray-400">Inicia sesión en el panel de administración</p>
          </div>

          {/* General error */}
          {generalError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <svg className="h-4 w-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm text-red-600">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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
                onBlur={(e) => handleBlur("email", e.target.value)}
                placeholder="admin@piums.app"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none transition focus:ring-2 focus:ring-[#FF6A00]/25 focus:border-[#FF6A00] ${
                  touched.email && errors.email
                    ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
              />
              {touched.email && errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => handleBlur("password", e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-300 outline-none transition focus:ring-2 focus:ring-[#FF6A00]/25 focus:border-[#FF6A00] ${
                    touched.password && errors.password
                      ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword
                    ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#FF6A00] py-2.5 text-sm font-semibold text-white hover:bg-[#e05e00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Verificando...
                </span>
              ) : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
