"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sdk } from "@piums/sdk";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { SmokeyBackground } from "@/components/ui/smokey-background";

interface FieldError {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const { t } = useTranslation("login");
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setGeneralError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await fetch("/api/auth/firebase-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al autenticar con Google");

      if (data.token) {
        localStorage.setItem("token", data.token);
        sdk.setAuthToken(data.token);
      }
      if (data.user) login(data.user);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : "Error al iniciar sesión con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "email":
        if (!value) return t("errorEmailRequired");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("errorEmailInvalid");
        return "";
      case "password":
        if (!value) return t("errorPasswordRequired");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    const newErrors: FieldError = {
      email: validateField("email", email),
      password: validateField("password", password),
    };

    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (Object.values(newErrors).some((error) => error)) {
      setGeneralError(t("errorGeneral"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t("errorLogin"));
      if (data.token) {
        localStorage.setItem("token", data.token);
        sdk.setAuthToken(data.token);
      } else {
        sdk.setAuthToken(null);
      }
      if (data.user) login(data.user);

      const redirect = new URLSearchParams(window.location.search).get("redirect");
      window.location.href = redirect || "/dashboard";
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errorGeneral");
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative w-screen h-screen bg-gray-950 overflow-hidden">
      <SmokeyBackground color="#FF6B35" backdropBlurAmount="sm" />

      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-sm my-auto">
          <div className="p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">

            {/* Logo + heading */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Image src="/logo-white.png" alt="PIUMS" width={48} height={48} className="h-12 w-auto" priority unoptimized />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Bienvenido de nuevo</h1>
                <p className="mt-1 text-sm text-white/60">Inicia sesión para continuar</p>
              </div>
            </div>

            {/* Error general */}
            {generalError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-3">
                <svg className="h-4 w-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{generalError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Email — floating label */}
              <div className="space-y-1">
                <div className="relative z-0">
                  <input
                    type="email"
                    id="login_email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => handleBlur("email", e.target.value)}
                    placeholder=" "
                    className={`peer block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 transition-colors ${
                      touched.email && errors.email
                        ? "border-red-400 focus:border-red-400"
                        : "border-white/40 focus:border-[#FF6B35]"
                    }`}
                  />
                  <label
                    htmlFor="login_email"
                    className="absolute text-sm text-white/60 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-[#FF6B35]"
                  >
                    Correo electrónico
                  </label>
                </div>
                {touched.email && errors.email && (
                  <p className="text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password — floating label */}
              <div className="space-y-1">
                <div className="relative z-0">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login_password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={(e) => handleBlur("password", e.target.value)}
                    placeholder=" "
                    className={`peer block py-2.5 px-0 pr-10 w-full text-sm text-white bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 transition-colors ${
                      touched.password && errors.password
                        ? "border-red-400 focus:border-red-400"
                        : "border-white/40 focus:border-[#FF6B35]"
                    }`}
                  />
                  <label
                    htmlFor="login_password"
                    className="absolute text-sm text-white/60 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-[#FF6B35]"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-2.5 text-white/40 hover:text-white/70 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="text-xs text-red-400">{errors.password}</p>
                )}
                <div className="flex justify-end pt-0.5">
                  <Link href="/forgot-password" className="text-xs text-white/50 hover:text-[#FF6B35] transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FF6B35] hover:bg-[#e05e00] rounded-xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verificando...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-white/20" />
                <span className="text-xs text-white/40 uppercase tracking-wider">o continúa con</span>
                <div className="flex-1 border-t border-white/20" />
              </div>

              {/* OAuth */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/90 hover:bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <svg className="h-4 w-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Google
                </button>

                <button
                  type="button"
                  disabled
                  title="Próximamente"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/30 cursor-not-allowed opacity-50 transition-all"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.875v2.256h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                  </svg>
                  Facebook
                </button>

                <button
                  type="button"
                  onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "https://backend.piums.io"}/api/auth/tiktok`; }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-2.5 text-xs font-semibold text-white focus:outline-none transition-all"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
                  </svg>
                  TikTok
                </button>
              </div>

              {/* Register */}
              <p className="text-center text-sm text-white/50">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="font-semibold text-[#FF6B35] hover:text-[#ff8a5e] transition-colors">
                  Regístrate gratis
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
