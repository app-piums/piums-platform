"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import Link from "next/link";
import { countries, type Country } from "../../lib/countries";
import PasswordStrengthIndicator, { calculatePasswordStrength } from "../../components/PasswordStrengthIndicator";
import { useAuth } from "../../contexts/AuthContext";
import { Footer } from "@/components/Footer";

interface FieldError {
  nombre?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  pais?: string;
  telefono?: string;
}

export default function RegisterPage() {
  const { t } = useTranslation('register');
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Form fields
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [telefono, setTelefono] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // UI state
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-focus en primer campo con error
  useEffect(() => {
    const firstErrorField = Object.keys(errors).find(key => errors[key as keyof FieldError]);
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField);
      element?.focus();
    }
  }, [errors]);

  const validateField = (field: string, value: string | boolean): string => {
    switch (field) {
      case "nombre":
        if (!value || typeof value !== 'string' || !value.trim()) 
          return t('errorNombreRequired');
        if (value.trim().length < 2) 
          return t('errorNombreShort');
        return "";
      case "email":
        if (!value || typeof value !== 'string') 
          return t('errorEmailRequired');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) 
          return t('errorEmailInvalid');
        return "";
      case "password":
        if (!value || typeof value !== 'string') 
          return t('errorPasswordRequired');
        const strength = calculatePasswordStrength(value as string);
        if (strength.score < 3) 
          return t('errorPasswordWeak');
        return "";
      case "confirmPassword":
        if (!value || typeof value !== 'string') 
          return t('errorConfirmPasswordRequired');
        if (value !== password) 
          return t('errorPasswordsMismatch');
        return "";
      case "pais":
        if (!selectedCountry) 
          return t('errorCountryRequired');
        return "";
      case "telefono":
        if (!value || typeof value !== 'string') 
          return t('errorTelefonoRequired');
        if ((value as string).length < 8) 
          return t('errorTelefonoInvalid');
        return "";
      case "terms":
        if (!value) 
          return t('errorTermsRequired');
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (field: string, value: string | boolean) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, value);
    setErrors({ ...errors, [field]: error });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find((c) => c.code === e.target.value);
    setSelectedCountry(country || null);
    handleBlur("pais", !!country);
  };

  const canProceedToStep2 = () => {
    const step1Errors = {
      nombre: validateField("nombre", nombre),
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    };
    
    return !Object.values(step1Errors).some(error => error);
  };

  const handleNextStep = () => {
    // Validar paso 1
    const step1Errors: FieldError = {
      nombre: validateField("nombre", nombre),
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    };

    setErrors(step1Errors);
    setTouched({
      nombre: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.values(step1Errors).some(error => error)) {
      setGeneralError("Por favor completa todos los campos correctamente");
      return;
    }

    setGeneralError("");
    setStep(2);
  };

  const requestLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        console.log('Geolocalización no disponible en este navegador');
        return;
      }

      // Intentar obtener la ubicación actual (sin bloquear la UI)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('📍 Ubicación obtenida:', location);
          
          // TODO: Enviar la ubicación al backend
          // fetch('/api/user/location', { 
          //   method: 'POST', 
          //   body: JSON.stringify(location),
          //   credentials: 'include'
          // })
        },
        (error) => {
          console.log('ℹ️ Usuario no permitió ubicación:', error.message);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.error('Error solicitando ubicación:', error);
    }
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
    window.location.href = "/onboarding";
  };

  const handleAcceptLocation = async () => {
    await requestLocationPermission();
    setShowLocationModal(false);
    window.location.href = "/onboarding";
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
      terms: validateField("terms", acceptTerms),
    };

    setErrors(newErrors);
    setTouched({
      nombre: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    if (Object.values(newErrors).some((error) => error)) {
      setGeneralError("Por favor revisa la información ingresada");
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
        }),
        credentials: 'include', // 🔒 Importante para cookies httpOnly
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ocurrió un error al crear tu cuenta. Intenta nuevamente.");
      }

      // 🔒 Token se guarda automáticamente en httpOnly cookie
      // Actualizar estado global de autenticación
      if (data.user) {
        login(data.user);
      }
      
      // ✅ Mostrar feedback de éxito
      setShowSuccess(true);
      
      // Mostrar modal de ubicación después de 1 segundo
      setTimeout(() => {
        setShowLocationModal(true);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 py-12 px-4 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Paso {step} de 2
            </span>
            <span className="text-xs text-zinc-500">
              {step === 1 ? "Información básica" : "Datos de contacto"}
            </span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-700">
            <div
              className="h-full bg-[#FF6A00] transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-6 rounded-xl bg-white p-8 shadow-xl dark:bg-zinc-900">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/logo.jpg" 
                alt="Piúms" 
                width={150} 
                height={50}
                priority
                className="h-12 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Descubre artistas increíbles
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Crea tu cuenta gratis para reservar los mejores artistas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
            {generalError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{generalError}</p>
              </div>
            )}

            {showSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 dark:bg-green-900/20 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-800 dark:text-green-200">¡Cuenta creada exitosamente! Redirigiendo...</p>
                </div>
              </div>
            )}

            {/* Step 1: Información básica */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label
                    htmlFor="nombre"
                    className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300"
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
                    className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                      touched.nombre && errors.nombre
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {touched.nombre && errors.nombre && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300"
                  >
                    Correo electrónico <span className="text-red-500">*</span>
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
                    className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                      touched.email && errors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                    }`}
                    placeholder="tu@email.com"
                  />
                  {touched.email && errors.email && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Contraseña */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300"
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
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={(e) => {
                      handleBlur("password", e.target.value);
                      setShowPasswordRequirements(false);
                    }}
                    className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                      touched.password && errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                    }`}
                    placeholder="••••••••"
                  />
                  {touched.password && errors.password && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                  
                  <PasswordStrengthIndicator
                    password={password}
                    show={showPasswordRequirements || password.length > 0}
                  />
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300"
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
                    className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                      touched.confirmPassword && errors.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                    }`}
                    placeholder="••••••••"
                  />
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceedToStep2()}
                  className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Continuar →
                </button>
              </div>
            )}

            {/* Step 2: Datos de contacto */}
            {step === 2 && (
              <div className="space-y-4">
                {/* País con bandera */}
                <div>
                  <label
                    htmlFor="pais"
                    className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300"
                  >
                    País <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="pais"
                    name="pais"
                    required
                    value={selectedCountry?.code || ""}
                    onChange={handleCountryChange}
                    className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                      touched.pais && errors.pais
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                    }`}
                  >
                    <option value="">Selecciona tu país</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  {touched.pais && errors.pais && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.pais}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label
                    htmlFor="telefono"
                    className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300"
                  >
                    Número de teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                      <span className="text-xl">{selectedCountry?.flag || "🌍"}</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {selectedCountry?.dialCode || "+___"}
                      </span>
                    </div>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                      onBlur={(e) => handleBlur("telefono", e.target.value)}
                      className={`flex-1 rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                        touched.telefono && errors.telefono
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700"
                      }`}
                      placeholder="12345678"
                      maxLength={15}
                    />
                  </div>
                  {touched.telefono && errors.telefono && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.telefono}</p>
                  )}
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Solo números, sin espacios ni guiones
                  </p>
                </div>

                {/* Términos y condiciones */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => {
                        setAcceptTerms(e.target.checked);
                        handleBlur("terms", e.target.checked);
                      }}
                      className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Acepto los{" "}
                      <Link href="/terms" className="font-medium underline hover:text-zinc-900 dark:hover:text-zinc-50">
                        Términos y Condiciones
                      </Link>{" "}
                      y la{" "}
                      <Link href="/privacy" className="font-medium underline hover:text-zinc-900 dark:hover:text-zinc-50">
                        Política de Privacidad
                      </Link>
                    </span>
                  </label>
                  {touched.terms && errors.terms && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.terms}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {loading ? "Creando tu cuenta..." : "Crear mi cuenta"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    ← Volver
                  </button>
                </div>

                {/* Mensaje de confianza */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Tu información está protegida y segura
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-center text-xs text-zinc-400">o regístrate con</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { window.location.href = `/api/auth/google`; }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => { window.location.href = `/api/auth/facebook`; }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.875v2.256h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => { window.location.href = `/api/auth/tiktok`; }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                  </svg>
                  TikTok
                </button>
              </div>
              <div className="text-center text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">¿Ya tienes cuenta? </span>
                <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                  Inicia sesión aquí
                </Link>
              </div>
              <div className="text-center">
                <a
                  href={process.env.NEXT_PUBLIC_ARTIST_APP_URL || 'http://127.0.0.1:3001/register'}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  ¿Eres artista? Únete a <span className="font-semibold ml-0.5">Piums for Artists</span>
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Permiso de Ubicación */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 dark:bg-zinc-900">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 dark:bg-blue-900">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2 dark:text-zinc-50">
                Permiso de Ubicación
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Activar tu ubicación nos ayudará a mostrarte los mejores artistas cerca de ti y mejorar tu experiencia.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAcceptLocation}
                className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Permitir Ubicación
              </button>
              <button
                onClick={handleSkipLocation}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Ahora No
              </button>
            </div>

            <p className="mt-4 text-xs text-center text-zinc-500 dark:text-zinc-500">
              Puedes cambiar esto más tarde en la configuración
            </p>
          </div>
        </div>
      )}
    </div>
    <Footer />
  </>
  );
}
