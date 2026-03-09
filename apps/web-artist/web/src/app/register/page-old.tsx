"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "../../lib/countries";

interface FieldError {
  nombre?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  pais?: string;
  telefono?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pais, setPais] = useState("");
  const [codigoPais, setCodigoPais] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "nombre":
        if (!value.trim()) return "El nombre es requerido";
        if (value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres";
        return "";
      case "email":
        if (!value) return "El email es requerido";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido";
        return "";
      case "password":
        if (!value) return "La contraseña es requerida";
        if (value.length < 6) return "Mínimo 6 caracteres";
        return "";
      case "confirmPassword":
        if (!value) return "Confirma tu contraseña";
        if (value !== password) return "Las contraseñas no coinciden";
        return "";
      case "pais":
        if (!value) return "Selecciona un país";
        return "";
      case "telefono":
        if (!value) return "El teléfono es requerido";
        if (value.length < 8) return "Mínimo 8 dígitos";
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

  const handlePaisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = countries.find((c) => c.name === e.target.value);
    if (selectedCountry) {
      setPais(selectedCountry.name);
      setCodigoPais(selectedCountry.dialCode);
      handleBlur("pais", selectedCountry.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    // Validar todos los campos
    const newErrors: FieldError = {
      nombre: validateField("nombre", nombre),
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
      pais: validateField("pais", pais),
      telefono: validateField("telefono", telefono),
    };

    setErrors(newErrors);
    setTouched({
      nombre: true,
      email: true,
      password: true,
      confirmPassword: true,
      pais: true,
      telefono: true,
    });

    // Si hay errores, no enviar
    if (Object.values(newErrors).some((error) => error)) {
      setGeneralError("Por favor corrige los errores antes de continuar");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          email,
          password,
          pais,
          codigoPais,
          telefono,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar usuario");
      }

      // Guardar token en localStorage
      localStorage.setItem("token", data.token);
      
      // Redirigir al home
      router.push("/");
    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Crear cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Regístrate para comenzar. Los campos con <span className="text-red-500">*</span> son obligatorios
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {generalError && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">{generalError}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="name"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onBlur={(e) => handleBlur("nombre", e.target.value)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                  touched.nombre && errors.nombre
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                }`}
                placeholder="Juan Pérez"
              />
              {touched.nombre && errors.nombre && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
              )}
            </div>

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

            {/* País */}
            <div>
              <label
                htmlFor="pais"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                País <span className="text-red-500">*</span>
              </label>
              <select
                id="pais"
                name="pais"
                required
                value={pais}
                onChange={handlePaisChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                  touched.pais && errors.pais
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                }`}
              >
                <option value="">Selecciona un país</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name} ({country.dialCode})
                  </option>
                ))}
              </select>
              {touched.pais && errors.pais && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pais}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                El código telefónico se agregará automáticamente
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label
                htmlFor="telefono"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={codigoPais || "+___"}
                  disabled
                  className="w-24 rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-50"
                />
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                  onBlur={(e) => handleBlur("telefono", e.target.value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                    touched.telefono && errors.telefono
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                  }`}
                  placeholder="12345678"
                  maxLength={15}
                />
              </div>
              {touched.telefono && errors.telefono && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telefono}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Solo números, sin espacios ni guiones
              </p>
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
                autoComplete="new-password"
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
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Mínimo 6 caracteres
              </p>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Confirmar contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                  touched.confirmPassword && errors.confirmPassword
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                }`}
                placeholder="••••••••"
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              ¿Ya tienes cuenta?{" "}
            </span>
            <a
              href="/login"
              className="font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
            >
              Inicia sesión aquí
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
