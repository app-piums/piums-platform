"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FieldError {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "email":
        if (!value) return "El email es requerido";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    // Validar todos los campos
    const newErrors: FieldError = {
      email: validateField("email", email),
      password: validateField("password", password),
    };

    setErrors(newErrors);
    setTouched({
      email: true,
      password: true,
    });

    // Si hay errores, no enviar
    if (Object.values(newErrors).some((error) => error)) {
      setGeneralError("Por favor corrige los errores antes de continuar");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      // Guardar token en localStorage
      localStorage.setItem("token", data.token);
      
      // Redirigir al dashboard o home
      router.push("/");
    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {generalError && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">{generalError}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => handleBlur("email", e.target.value)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                  touched.email && errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                }`}
                placeholder="tu@email.com"
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={(e) => handleBlur("password", e.target.value)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                  touched.password && errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                }`}
                placeholder="••••••••"
              />
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              ¿No tienes cuenta?{" "}
            </span>
            <a
              href="/register"
              className="font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
            >
              Regístrate aquí
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
