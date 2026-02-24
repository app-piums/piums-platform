"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { countries, type Country } from "../../lib/countries";
import PasswordStrengthIndicator, { calculatePasswordStrength } from "../../components/PasswordStrengthIndicator";
import { useAuth } from "../../contexts/AuthContext";
import { Footer } from "@/components/Footer";

interface FieldError {
  nombre?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  pais?: string;
  telefono?: string;
  terms?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Form fields
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<'cliente' | 'artista'>('cliente');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [telefono, setTelefono] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  
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
          return "Por favor ingresa tu nombre completo";
        if (value.trim().length < 2) 
          return "Tu nombre debe tener al menos 2 caracteres";
        return "";
      case "email":
        if (!value || typeof value !== 'string') 
          return "El correo electrónico es obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) 
          return "Por favor ingresa un correo válido";
        return "";
      case "password":
        if (!value || typeof value !== 'string') 
          return "Por favor crea una contraseña";
        const strength = calculatePasswordStrength(value);
        if (strength.score < 3) 
          return "Tu contraseña debe ser más segura";
        return "";
      case "confirmPassword":
        if (!value || typeof value !== 'string') 
          return "Por favor confirma tu contraseña";
        if (value !== password) 
          return "Las contraseñas no coinciden";
        return "";
      case "role":
        if (!value || typeof value !== 'string') 
          return "Selecciona un tipo de cuenta";
        return "";
      case "pais":
        if (!selectedCountry) 
          return "Selecciona tu país";
        return "";
      case "telefono":
        if (!value || typeof value !== 'string') 
          return "El teléfono es necesario";
        if (value.length < 8) 
          return "Ingresa un número de teléfono válido";
        return "";
      case "terms":
        if (!value) 
          return "Debes aceptar los términos y condiciones";
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
      role: validateField("role", role),
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
      role: validateField("role", role),
    };

    setErrors(step1Errors);
    setTouched({
      nombre: true,
      email: true,
      password: true,
      confirmPassword: true,
      role: true,
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
          setUserLocation(location);
          setLocationPermission('granted');
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
          setLocationPermission('denied');
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
    router.push("/dashboard");
  };

  const handleAcceptLocation = async () => {
    await requestLocationPermission();
    setShowLocationModal(false);
    router.push("/dashboard");
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
      role: validateField("role", role),
      pais: validateField("pais", ""),
      telefono: validateField("telefono", telefono),
      terms: validateField("terms", acceptTerms),
    };

    setErrors(newErrors);
    setTouched({
      nombre: true,
      email: true,
      password: true,
      confirmPassword: true,
      role: true,
      pais: true,
      telefono: true,
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
          role,
          pais: selectedCountry?.name,
          codigoPais: selectedCountry?.dialCode,
          telefono,
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
    } catch (err: any) {
      setGeneralError(err.message);
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
              className="h-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-50"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-6 rounded-xl bg-white p-8 shadow-xl dark:bg-zinc-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Crear cuenta
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Únete a Piums y comienza tu viaje musical
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

                {/* Selector de Rol */}
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-zinc-700 mb-3 dark:text-zinc-300"
                  >
                    ¿Cómo quieres usar Piums? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Opción Cliente */}
                    <button
                      type="button"
                      onClick={() => {
                        setRole('cliente');
                        handleBlur('role', 'cliente');
                      }}
                      className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                        role === 'cliente'
                          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-800'
                          : 'border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
                      }`}
                    >
                      {role === 'cliente' && (
                        <div className="absolute top-2 right-2">
                          <svg className="h-5 w-5 text-zinc-900 dark:text-zinc-50" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="flex flex-col items-center text-center">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 dark:bg-blue-900">
                          <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">Cliente</span>
                        <span className="text-xs text-zinc-600 mt-1 dark:text-zinc-400">Buscar y contratar artistas</span>
                      </div>
                    </button>

                    {/* Opción Artista */}
                    <button
                      type="button"
                      onClick={() => {
                        setRole('artista');
                        handleBlur('role', 'artista');
                      }}
                      className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                        role === 'artista'
                          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-800'
                          : 'border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
                      }`}
                    >
                      {role === 'artista' && (
                        <div className="absolute top-2 right-2">
                          <svg className="h-5 w-5 text-zinc-900 dark:text-zinc-50" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="flex flex-col items-center text-center">
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-3 dark:bg-purple-900">
                          <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">Artista</span>
                        <span className="text-xs text-zinc-600 mt-1 dark:text-zinc-400">Ofrecer mis servicios</span>
                      </div>
                    </button>
                  </div>
                  {touched.role && errors.role && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
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
                      <a href="/terms" className="font-medium underline hover:text-zinc-900 dark:hover:text-zinc-50">
                        Términos y Condiciones
                      </a>{" "}
                      y la{" "}
                      <a href="/privacy" className="font-medium underline hover:text-zinc-900 dark:hover:text-zinc-50">
                        Política de Privacidad
                      </a>
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

            <div className="text-center text-sm pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400">
                ¿Ya tienes cuenta?{" "}
              </span>
              <a
                href="/login"
                className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
              >
                Inicia sesión aquí
              </a>
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
                {role === 'artista' 
                  ? 'Necesitamos tu ubicación para mostrarte oportunidades cerca de ti y ayudarte a gestionar tus servicios localmente.'
                  : 'Activar tu ubicación nos ayudará a mostrarte los mejores artistas cerca de ti y mejorar tu experiencia.'}
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
    <Footer />
  </>
    </div>
  );
}
