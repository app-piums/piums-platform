"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { countries, type Country } from "../../../lib/countries";
import PasswordStrengthIndicator, { calculatePasswordStrength } from "../../../components/PasswordStrengthIndicator";
import { useAuth } from "../../../contexts/AuthContext";
import { Footer } from "@/components/Footer";
import { getErrorMessage } from "@/lib/errors";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

interface FieldError {
  nombre?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  pais?: string;
  telefono?: string;
  ciudad?: string;
  birthDate?: string;
  documentType?: string;
  documentNumber?: string;
  documentFrontUrl?: string;
  documentSelfieUrl?: string;
  terms?: string;
}

type DocumentType = "DPI" | "PASSPORT" | "RESIDENCE_CARD";

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  DPI: "DPI (Documento Personal de Identificación)",
  PASSPORT: "Pasaporte",
  RESIDENCE_CARD: "Tarjeta de Residencia",
};

export default function RegisterArtistPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);

  // Step 1
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Step 3 — Identity document
  const [documentType, setDocumentType] = useState<DocumentType>("DPI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentFrontUrl, setDocumentFrontUrl] = useState("");
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [documentSelfieUrl, setDocumentSelfieUrl] = useState("");
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview, setBackPreview] = useState("");
  const [selfiePreview, setSelfiePreview] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const maxBirthDate = new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    const firstErrorField = Object.keys(errors).find(key => errors[key as keyof FieldError]);
    if (firstErrorField) {
      document.getElementById(firstErrorField)?.focus();
    }
  }, [errors]);

  const validateField = (field: string, value: string | boolean): string => {
    switch (field) {
      case "nombre":
        if (!value || typeof value !== 'string' || !value.trim()) return "Por favor ingresa tu nombre completo";
        if (value.trim().length < 2) return "Tu nombre debe tener al menos 2 caracteres";
        return "";
      case "email":
        if (!value || typeof value !== 'string') return "El correo electrónico es obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Por favor ingresa un correo válido";
        return "";
      case "password":
        if (!value || typeof value !== 'string') return "Por favor crea una contraseña";
        if (calculatePasswordStrength(value).score < 3) return "Tu contraseña debe ser más segura";
        return "";
      case "confirmPassword":
        if (!value || typeof value !== 'string') return "Por favor confirma tu contraseña";
        if (value !== password) return "Las contraseñas no coinciden";
        return "";
      case "pais":
        if (!selectedCountry) return "Selecciona tu país";
        return "";
      case "telefono":
        if (!value || typeof value !== "string")
          return "El teléfono es necesario";
        if (value.length < 8) return "Ingresa un número de teléfono válido";
        return "";
      case "ciudad":
        if (!value || typeof value !== "string" || !value.trim())
          return "La ciudad es obligatoria";
        if (value.trim().length < 2) return "Ingresa una ciudad válida";
        return "";
      case "birthDate": {
        if (!value || typeof value !== "string") return "La fecha de nacimiento es obligatoria";
        const birth = new Date(value);
        const today = new Date();
        const age =
          today.getFullYear() -
          birth.getFullYear() -
          (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        if (age < 18) return "Debes ser mayor de 18 años para registrarte";
        return "";
      }
      case "documentType":
        if (!value) return "Selecciona el tipo de documento";
        return "";
      case "documentNumber":
        if (!value || typeof value !== "string" || !value.trim())
          return "El número de documento es obligatorio";
        if (value.trim().length < 6)
          return "El número debe tener al menos 6 caracteres";
        return "";
      case "documentFrontUrl":
        if (!value) return "Sube la foto frontal de tu documento";
        return "";
      case "documentSelfieUrl":
        if (!value) return "Sube tu selfie con el documento";
        return "";
      case "terms":
        if (!value) return "Debes aceptar los términos y condiciones";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (field: string, value: string | boolean) => {
    setTouched({ ...touched, [field]: true });
    setErrors({ ...errors, [field]: validateField(field, value) });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find((c) => c.code === e.target.value);
    setSelectedCountry(country || null);
    handleBlur("pais", !!country);
  };

  const canProceedToStep2 = () =>
    !["nombre", "email", "password", "confirmPassword"].some((f) =>
      validateField(
        f,
        f === "nombre"
          ? nombre
          : f === "email"
          ? email
          : f === "password"
          ? password
          : confirmPassword
      )
    );

  const handleNextToStep2 = () => {
    const step1Errors: FieldError = {
      nombre: validateField("nombre", nombre),
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    };
    setErrors(step1Errors);
    setTouched({ nombre: true, email: true, password: true, confirmPassword: true });
    if (Object.values(step1Errors).some((e) => e)) {
      setGeneralError("Por favor completa todos los campos correctamente");
      return;
    }
    setGeneralError("");
    setStep(2);
  };

  const handleNextToStep3 = () => {
    const step2Errors: FieldError = {
      pais: validateField("pais", ""),
      telefono: validateField("telefono", telefono),
      ciudad: validateField("ciudad", ciudad),
      birthDate: validateField("birthDate", birthDate),
      terms: validateField("terms", acceptTerms),
    };
    setErrors(step2Errors);
    setTouched((prev) => ({
      ...prev,
      pais: true,
      telefono: true,
      ciudad: true,
      birthDate: true,
      terms: true,
    }));
    if (Object.values(step2Errors).some((e) => e)) {
      setGeneralError("Por favor completa todos los campos del paso 2");
      return;
    }
    setGeneralError("");
    setStep(3);
  };

  // ── Document upload ───────────────────────────────────────────────────────

  const uploadFile = async (
    file: File,
    folder: "front" | "back" | "selfie",
    setUploading: (v: boolean) => void,
    setUrl: (u: string) => void,
    setPreview: (p: string) => void
  ) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/users/documents/upload?folder=${folder}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir imagen");
      const data = await res.json();
      setUrl(data.url);
      setPreview(URL.createObjectURL(file));
      setErrors((prev) => ({
        ...prev,
        [`document${folder.charAt(0).toUpperCase() + folder.slice(1)}Url`]: "",
      }));
    } catch (err) {
      setGeneralError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setGeneralError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/firebase-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al registrarse con Google");

      if (data.user) login(data.user);
      // New users go to onboarding, existing users go to dashboard
      router.push(data.isNewUser ? "/artist/onboarding" : "/artist/dashboard");
    } catch (err: unknown) {
      setGeneralError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
    router.push("/artist/onboarding");
  };

  const handleAcceptLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          sessionStorage.setItem("piums_artist_location", JSON.stringify(coords));
        },
        () => {}
      );
    }
    setShowLocationModal(false);
    router.push("/artist/onboarding");
  };

  // ── Reusable upload image block ───────────────────────────────────────────
  const renderUploadBox = (
    label: string,
    hint: string,
    folder: "front" | "back" | "selfie",
    uploading: boolean,
    preview: string,
    errorKey: keyof FieldError,
    setUploading: (v: boolean) => void,
    setUrl: (u: string) => void,
    setPreview: (p: string) => void,
    optional?: boolean
  ) => (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
        {label}{" "}
        {optional ? (
          <span className="text-xs text-zinc-400">(opcional)</span>
        ) : (
          <span className="text-red-500">*</span>
        )}
      </label>
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={label}
            className="w-full h-36 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={() => {
              setPreview("");
              setUrl("");
            }}
            className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
            touched[errorKey] && errors[errorKey]
              ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-900/10"
              : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
          }`}
        >
          {uploading ? (
            <svg className="h-6 w-6 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {uploading ? "Subiendo…" : "Haz clic o arrastra la imagen"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadFile(file, folder, setUploading, setUrl, setPreview);
                setTouched((prev) => ({ ...prev, [errorKey]: true }));
              }
            }}
          />
        </label>
      )}
      {touched[errorKey] && errors[errorKey] && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors[errorKey]}</p>
      )}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    const step3Errors: FieldError = {
      documentType: validateField("documentType", documentType),
      documentNumber: validateField("documentNumber", documentNumber),
      documentFrontUrl: validateField("documentFrontUrl", documentFrontUrl),
      documentSelfieUrl: validateField("documentSelfieUrl", documentSelfieUrl),
    };
    setErrors(step3Errors);
    setTouched((prev) => ({
      ...prev,
      documentType: true,
      documentNumber: true,
      documentFrontUrl: true,
      documentSelfieUrl: true,
    }));

    if (Object.values(step3Errors).some((e) => e)) {
      setGeneralError("Por favor completa la verificación de identidad");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          password,
          pais: selectedCountry?.code,
          telefono: selectedCountry ? `${selectedCountry.dialCode}${telefono}` : telefono,
          ciudad,
          birthDate,
          documentType,
          documentNumber,
          documentFrontUrl,
          documentBackUrl: documentBackUrl || undefined,
          documentSelfieUrl,
        }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Ocurrió un error al crear tu cuenta.");

      if (data.user) login(data.user);
      setShowSuccess(true);
      setTimeout(() => setShowLocationModal(true), 1000);
    } catch (err: unknown) {
      setGeneralError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 py-12 px-4 dark:from-zinc-950 dark:to-zinc-900">
        <div className="w-full max-w-md">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Paso {step} de 3
              </span>
              <span className="text-xs text-zinc-500">
                {step === 1
                  ? "Información básica"
                  : step === 2
                  ? "Datos de contacto"
                  : "Verificación de identidad"}
              </span>
            </div>
            <div className="h-2 bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-700">
              <div
                className="h-full bg-[#FF6A00] transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-6 rounded-xl bg-white p-8 shadow-xl dark:bg-zinc-900">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Image
                  src="/logo.png"
                  alt="Piums"
                  width={48}
                  height={48}
                  priority
                  className="h-12 w-auto"
                />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Crea tu perfil de artista
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Únete a PIUMS y monetiza tu talento creativo
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
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ¡Cuenta creada exitosamente! Redirigiendo...
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 1: Basic info ──────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nombre" name="nombre" type="text" autoComplete="name" required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      onBlur={(e) => handleBlur("nombre", e.target.value)}
                      className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                        touched.nombre && errors.nombre
                          ? "border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:ring-zinc-500 dark:border-zinc-700"
                      }`}
                      placeholder="Juan Pérez"
                    />
                    {touched.nombre && errors.nombre && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.nombre}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email" name="email" type="email" autoComplete="email" required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={(e) => handleBlur("email", e.target.value)}
                      className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                        touched.email && errors.email
                          ? "border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:ring-zinc-500 dark:border-zinc-700"
                      }`}
                      placeholder="tu@email.com"
                    />
                    {touched.email && errors.email && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
                      Contraseña <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password" name="password" type="password" autoComplete="new-password" required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setShowPasswordRequirements(true)}
                      onBlur={(e) => {
                        handleBlur("password", e.target.value);
                        setShowPasswordRequirements(false);
                      }}
                      className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                        touched.password && errors.password
                          ? "border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:ring-zinc-500 dark:border-zinc-700"
                      }`}
                      placeholder="••••••••"
                    />
                    {touched.password && errors.password && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
                    )}
                    <PasswordStrengthIndicator
                      password={password}
                      show={showPasswordRequirements || password.length > 0}
                    />
                  </div>

                  {/* Confirmar Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
                      Confirmar contraseña <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                      className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                        touched.confirmPassword && errors.confirmPassword
                          ? "border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:ring-zinc-500 dark:border-zinc-700"
                      }`}
                      placeholder="••••••••"
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextToStep2}
                    disabled={!canProceedToStep2()}
                    className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    Continuar →
                  </button>
                </div>
              )}

              {/* ── STEP 2: Contact ─────────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* País */}
                  <div>
                    <label htmlFor="pais" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
                      País <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="pais" name="pais" required
                      value={selectedCountry?.code || ""}
                      onChange={handleCountryChange}
                      className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                        touched.pais && errors.pais
                          ? "border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:ring-zinc-500 dark:border-zinc-700"
                      }`}
                    >
                      <option value="">Selecciona tu país</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                    {touched.pais && errors.pais && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.pais}</p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
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
                        id="telefono" name="telefono" type="tel" autoComplete="tel" required
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                        onBlur={(e) => handleBlur("telefono", e.target.value)}
                        className={`flex-1 rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                          touched.telefono && errors.telefono
                            ? "border-red-500 focus:ring-red-500"
                            : "border-zinc-300 focus:ring-zinc-500 dark:border-zinc-700"
                        }`}
                        placeholder="12345678"
                        maxLength={15}
                      />
                    </div>
                    {touched.telefono && errors.telefono && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.telefono}</p>
                    )}
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label htmlFor="ciudad" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
                      Ciudad <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="ciudad" name="ciudad" type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      onBlur={(e) => handleBlur("ciudad", e.target.value)}
                      className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                        touched.ciudad && errors.ciudad
                          ? "border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:ring-zinc-500 dark:border-zinc-700"
                      }`}
                      placeholder="Ej: Guatemala City, Quetzaltenango…"
                    />
                    {touched.ciudad && errors.ciudad && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.ciudad}</p>
                    )}
                  </div>

                  {/* Fecha de nacimiento */}
                  <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
                      Fecha de nacimiento <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="birthDate" name="birthDate" type="date"
                      max={maxBirthDate}
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      onBlur={(e) => handleBlur("birthDate", e.target.value)}
                      className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                        touched.birthDate && errors.birthDate
                          ? "border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:ring-zinc-500 dark:border-zinc-700"
                      }`}
                    />
                    {touched.birthDate && errors.birthDate && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.birthDate}</p>
                    )}
                    <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Debes ser mayor de 18 años
                    </p>
                  </div>

                  {/* Términos */}
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
                        <a href="/terms" className="font-medium underline">
                          Términos y Condiciones
                        </a>{" "}
                        y la{" "}
                        <a href="/privacy" className="font-medium underline">
                          Política de Privacidad
                        </a>
                      </span>
                    </label>
                    {touched.terms && errors.terms && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.terms}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleNextToStep3}
                      className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900"
                    >
                      Continuar →
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      ← Volver
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Identity document ───────────────────────────── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-900/20 dark:border-amber-700">
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Para proteger a nuestra comunidad, todos los artistas deben verificar
                      su identidad antes de publicar servicios.
                    </p>
                  </div>

                  {/* Tipo de documento */}
                  <div>
                    <label htmlFor="documentType" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
                      Tipo de documento <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="documentType"
                      value={documentType}
                      onChange={(e) => {
                        setDocumentType(e.target.value as DocumentType);
                        if (e.target.value !== "DPI") {
                          setDocumentBackUrl("");
                          setBackPreview("");
                        }
                      }}
                      className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 dark:border-zinc-700"
                    >
                      {Object.entries(DOCUMENT_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Número de documento */}
                  <div>
                    <label htmlFor="documentNumber" className="block text-sm font-medium text-zinc-700 mb-1 dark:text-zinc-300">
                      Número de documento <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="documentNumber"
                      name="documentNumber"
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      onBlur={(e) => handleBlur("documentNumber", e.target.value)}
                      className={`block w-full rounded-lg border px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                        touched.documentNumber && errors.documentNumber
                          ? "border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:ring-zinc-500 dark:border-zinc-700"
                      }`}
                      placeholder={documentType === "DPI" ? "Ej: 1234567890101" : "Ej: A12345678"}
                    />
                    {touched.documentNumber && errors.documentNumber && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.documentNumber}</p>
                    )}
                  </div>

                  {/* Front photo */}
                  {renderUploadBox(
                    "Foto frontal del documento",
                    "Foto clara de la parte delantera de tu DPI, pasaporte o tarjeta",
                    "front",
                    uploadingFront,
                    frontPreview,
                    "documentFrontUrl",
                    setUploadingFront,
                    setDocumentFrontUrl,
                    setFrontPreview
                  )}

                  {/* Back photo — only for DPI */}
                  {documentType === "DPI" &&
                    renderUploadBox(
                      "Foto posterior del documento",
                      "Foto clara de la parte trasera de tu DPI",
                      "back",
                      uploadingBack,
                      backPreview,
                      "documentFrontUrl",
                      setUploadingBack,
                      setDocumentBackUrl,
                      setBackPreview,
                      true
                    )}

                  {/* Selfie with document */}
                  {renderUploadBox(
                    "Selfie sosteniendo el documento",
                    "Foto tuya sujetando el documento junto a tu rostro claramente visible",
                    "selfie",
                    uploadingSelfie,
                    selfiePreview,
                    "documentSelfieUrl",
                    setUploadingSelfie,
                    setDocumentSelfieUrl,
                    setSelfiePreview
                  )}

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900"
                    >
                      {loading ? "Creando tu cuenta..." : "Crear mi cuenta de artista"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      ← Volver
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-center text-xs text-zinc-400">o regístrate con</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={googleLoading}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {googleLoading ? (
                      <svg className="h-4 w-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    Google
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Próximamente"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-400 cursor-not-allowed opacity-50 transition-all"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.875v2.256h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Próximamente"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-400 cursor-not-allowed opacity-50 transition-all"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                    </svg>
                    TikTok
                  </button>
                </div>
                <div className="text-center text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">¿Ya tienes cuenta? </span>
                  <a href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                    Inicia sesión aquí
                  </a>
                </div>
                <div className="text-center">
                  <a
                    href="/register/client"
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    ¿Eres cliente? Regístrate aquí
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

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
              <h3 className="text-xl font-bold text-zinc-900 mb-2 dark:text-zinc-50">Permiso de Ubicación</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Necesitamos tu ubicación para mostrarte oportunidades cerca de ti y gestionar tus servicios localmente.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleAcceptLocation}
                className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
              >
                Permitir Ubicación
              </button>
              <button
                onClick={handleSkipLocation}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Ahora No
              </button>
            </div>
            <p className="mt-4 text-xs text-center text-zinc-500">
              Puedes cambiar esto más tarde en la configuración
            </p>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
