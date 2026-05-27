"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Upload, X } from "lucide-react";
import { countries, type Country } from "../../../lib/countries";
import PasswordStrengthIndicator, { calculatePasswordStrength } from "../../../components/PasswordStrengthIndicator";
import { useAuth } from "../../../contexts/AuthContext";
import { SmokeyBackground } from "@/components/ui/smokey-background";
import { getErrorMessage } from "@/lib/errors";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";


interface FieldError {
  avatarUrl?: string;
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

  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

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

  const maxBirthDate = new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split("T")[0];

  useEffect(() => {
    const firstErrorField = Object.keys(errors).find((key) => errors[key as keyof FieldError]);
    if (firstErrorField) document.getElementById(firstErrorField)?.focus();
  }, [errors]);

  const validateField = (field: string, value: string | boolean): string => {
    switch (field) {
      case "nombre":
        if (!value || typeof value !== "string" || !value.trim()) return "Por favor ingresa tu nombre completo";
        if (value.trim().length < 2) return "Tu nombre debe tener al menos 2 caracteres";
        return "";
      case "email":
        if (!value || typeof value !== "string") return "El correo electrónico es obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Por favor ingresa un correo válido";
        return "";
      case "password":
        if (!value || typeof value !== "string") return "Por favor crea una contraseña";
        if (calculatePasswordStrength(value).score < 3) return "Tu contraseña debe ser más segura";
        return "";
      case "confirmPassword":
        if (!value || typeof value !== "string") return "Por favor confirma tu contraseña";
        if (value !== password) return "Las contraseñas no coinciden";
        return "";
      case "pais":
        if (!selectedCountry) return "Selecciona tu país";
        return "";
      case "telefono":
        if (!value || typeof value !== "string") return "El teléfono es necesario";
        if ((value as string).length < 8) return "Ingresa un número de teléfono válido";
        return "";
      case "ciudad":
        if (!value || typeof value !== "string" || !value.trim()) return "La ciudad es obligatoria";
        return "";
      case "birthDate": {
        if (!value || typeof value !== "string") return "La fecha de nacimiento es obligatoria";
        const birth = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear() -
          (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        if (age < 18) return "Debes ser mayor de 18 años para registrarte";
        return "";
      }
      case "documentType":
        if (!value) return "Selecciona el tipo de documento";
        return "";
      case "documentNumber":
        if (!value || typeof value !== "string" || !value.trim()) return "El número de documento es obligatorio";
        if (value.trim().length < 6) return "El número debe tener al menos 6 caracteres";
        return "";
      case "avatarUrl":
        if (!value) return "Sube tu foto de perfil";
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
      validateField(f, f === "nombre" ? nombre : f === "email" ? email : f === "password" ? password : confirmPassword)
    ) && !validateField("avatarUrl", avatarUrl);

  const handleNextToStep2 = () => {
    const step1Errors: FieldError = {
      avatarUrl: validateField("avatarUrl", avatarUrl),
      nombre: validateField("nombre", nombre),
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    };
    setErrors(step1Errors);
    setTouched({ avatarUrl: true, nombre: true, email: true, password: true, confirmPassword: true });
    if (Object.values(step1Errors).some(Boolean)) { setGeneralError("Por favor completa todos los campos correctamente"); return; }
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
    setTouched((prev) => ({ ...prev, pais: true, telefono: true, ciudad: true, birthDate: true, terms: true }));
    if (Object.values(step2Errors).some(Boolean)) { setGeneralError("Por favor completa todos los campos del paso 2"); return; }
    setGeneralError("");
    setStep(3);
  };

  const uploadFile = async (
    file: File,
    folder: string,
    setUploading: (v: boolean) => void,
    setUrl: (u: string) => void,
    setPreview: (p: string) => void
  ) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/users/documents/upload?folder=${folder}`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error al subir imagen");
      const data = await res.json();
      setUrl(data.url);
      setPreview(URL.createObjectURL(file));
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
      router.push(data.isNewUser ? "/artist/onboarding" : "/artist/dashboard");
    } catch (err: unknown) {
      setGeneralError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSkipLocation = () => { setShowLocationModal(false); router.push("/artist/onboarding"); };
  const handleAcceptLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => sessionStorage.setItem("piums_artist_location", JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })),
      () => {}
    );
    setShowLocationModal(false);
    router.push("/artist/onboarding");
  };

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
    setTouched((prev) => ({ ...prev, documentType: true, documentNumber: true, documentFrontUrl: true, documentSelfieUrl: true }));
    if (Object.values(step3Errors).some(Boolean)) { setGeneralError("Por favor completa la verificación de identidad"); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, email, password,
          pais: selectedCountry?.code,
          telefono: selectedCountry ? `${selectedCountry.dialCode}${telefono}` : telefono,
          ciudad, birthDate, avatarUrl, documentType, documentNumber,
          documentFrontUrl, documentBackUrl: documentBackUrl || undefined, documentSelfieUrl,
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

  const inputBase = "block w-full rounded-xl bg-white/5 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B35] focus:ring-0 transition-colors";
  const inputError = "border-red-400/60 bg-red-500/10 focus:border-red-400";
  const inputOk = "border-white/20";
  const labelBase = "block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider";
  const errorMsg = "mt-1.5 text-xs text-red-400";

  const renderUploadBox = (
    label: string,
    hint: string,
    folder: string,
    uploading: boolean,
    preview: string,
    errorKey: keyof FieldError,
    setUploading: (v: boolean) => void,
    setUrl: (u: string) => void,
    setPreview: (p: string) => void,
    optional?: boolean
  ) => (
    <div>
      <label className={labelBase}>
        {label}{" "}
        {optional ? <span className="text-white/30 normal-case">(opcional)</span> : <span className="text-[#FF6B35]">*</span>}
      </label>
      <p className="mb-2 text-xs text-white/30">{hint}</p>
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="w-full h-36 object-cover rounded-xl border border-white/10" />
          <button
            type="button"
            onClick={() => { setPreview(""); setUrl(""); }}
            className="absolute top-2 right-2 rounded-full bg-red-500/80 backdrop-blur-sm p-1 text-white hover:bg-red-500 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${
          touched[errorKey] && errors[errorKey]
            ? "border-red-400/50 bg-red-500/10"
            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/8"
        }`}>
          {uploading ? (
            <svg className="h-6 w-6 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Upload className="h-6 w-6 text-white/30" />
          )}
          <span className="text-xs text-white/40">{uploading ? "Subiendo…" : "Haz clic o arrastra la imagen"}</span>
          <input
            type="file" accept="image/*" className="sr-only" disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { uploadFile(file, folder, setUploading, setUrl, setPreview); setTouched((prev) => ({ ...prev, [errorKey]: true })); }
            }}
          />
        </label>
      )}
      {touched[errorKey] && errors[errorKey] && <p className={errorMsg}>{errors[errorKey]}</p>}
    </div>
  );

  const stepLabels = ["Perfil básico", "Contacto", "Verificación"];

  return (
    <>
      <main className="relative bg-gray-950">
        <SmokeyBackground color="#FF6B35" backdropBlurAmount="sm" className="fixed inset-0" />
        <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/40 pointer-events-none z-[1]" />

        <div className="relative z-10 flex flex-col items-center pt-14 pb-24 px-4 min-h-screen">

          {/* Hero header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-5">
              <Image src="/logo-white.png" alt="PIUMS" width={56} height={56} className="h-14 w-auto drop-shadow-lg" priority unoptimized />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Monetiza tu talento<br />
              <span className="text-[#FF6B35]">con PIUMS</span>
            </h1>
            <p className="mt-3 text-sm text-white/50 max-w-xs mx-auto">
              Crea tu perfil de artista y conecta con cientos de clientes
            </p>
          </div>

          {/* Progress */}
          <div className="w-full max-w-md mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/50">Paso {step} de 3</span>
              <span className="text-xs text-white/30">{stepLabels[step - 1]}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6B35] rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Glass card */}
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">{stepLabels[step - 1]}</h2>
              <p className="mt-1 text-sm text-white/40">
                {step === 1 ? "Tu foto y datos de acceso" : step === 2 ? "Para personalizar tu experiencia" : "Verificamos tu identidad para proteger la comunidad"}
              </p>
            </div>

            {generalError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-3">
                <svg className="h-4 w-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{generalError}</p>
              </div>
            )}
            {showSuccess && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-green-500/20 border border-green-400/30 px-4 py-3">
                <svg className="h-4 w-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-300">¡Cuenta creada! Redirigiendo...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="glass-form space-y-5" ref={formRef}>

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <>
                  {/* Avatar upload */}
                  <div className="flex flex-col items-center gap-3">
                    <label className={`${labelBase} self-start`}>Foto de perfil <span className="text-[#FF6B35]">*</span></label>
                    <label className="cursor-pointer group relative">
                      <div className={`h-24 w-24 rounded-full overflow-hidden border-2 transition-colors flex items-center justify-center bg-white/10 ${
                        touched.avatarUrl && errors.avatarUrl ? "border-red-400/60" : "border-white/20 group-hover:border-[#FF6B35]/60"
                      }`}>
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                        ) : uploadingAvatar ? (
                          <svg className="h-6 w-6 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      {avatarPreview ? (
                        <button type="button"
                          onClick={(e) => { e.preventDefault(); setAvatarPreview(""); setAvatarUrl(""); }}
                          className="absolute -top-1 -right-1 rounded-full bg-red-500/80 p-0.5 text-white hover:bg-red-500">
                          <X size={12} />
                        </button>
                      ) : (
                        <div className="absolute bottom-0 right-0 rounded-full bg-[#FF6B35] p-1.5">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="sr-only" disabled={uploadingAvatar}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setTouched((prev) => ({ ...prev, avatarUrl: true }));
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          await uploadFile(file, "avatar" as any, setUploadingAvatar, setAvatarUrl, setAvatarPreview);
                        }}
                      />
                    </label>
                    <p className="text-xs text-white/30">JPG, PNG o WebP · máx. 5MB</p>
                    {touched.avatarUrl && errors.avatarUrl && <p className="text-xs text-red-400">{errors.avatarUrl}</p>}
                  </div>

                  <div>
                    <label htmlFor="nombre" className={labelBase}>Nombre completo</label>
                    <input id="nombre" name="nombre" type="text" autoComplete="name"
                      value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={(e) => handleBlur("nombre", e.target.value)}
                      placeholder="Juan Pérez"
                      className={`${inputBase} ${touched.nombre && errors.nombre ? inputError : inputOk}`} />
                    {touched.nombre && errors.nombre && <p className={errorMsg}>{errors.nombre}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className={labelBase}>Correo electrónico</label>
                    <input id="email" name="email" type="email" autoComplete="email"
                      value={email} onChange={(e) => setEmail(e.target.value)} onBlur={(e) => handleBlur("email", e.target.value)}
                      placeholder="tu@email.com"
                      className={`${inputBase} ${touched.email && errors.email ? inputError : inputOk}`} />
                    {touched.email && errors.email && <p className={errorMsg}>{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="password" className={labelBase}>Contraseña</label>
                    <div className="relative">
                      <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setShowPasswordRequirements(true)}
                        onBlur={(e) => { handleBlur("password", e.target.value); setShowPasswordRequirements(false); }}
                        placeholder="••••••••"
                        className={`${inputBase} pr-11 ${touched.password && errors.password ? inputError : inputOk}`} />
                      <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {touched.password && errors.password && <p className={errorMsg}>{errors.password}</p>}
                    <PasswordStrengthIndicator password={password} show={showPasswordRequirements || password.length > 0} />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className={labelBase}>Confirmar contraseña</label>
                    <div className="relative">
                      <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                        placeholder="••••••••"
                        className={`${inputBase} pr-11 ${touched.confirmPassword && errors.confirmPassword ? inputError : inputOk}`} />
                      <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && <p className={errorMsg}>{errors.confirmPassword}</p>}
                  </div>

                  <button type="button" onClick={handleNextToStep2}
                    className="w-full rounded-xl bg-[#FF6B35] hover:bg-[#e05e00] py-3 text-sm font-semibold text-white transition-all active:scale-[0.99] mt-2">
                    Continuar →
                  </button>
                </>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <>
                  <div>
                    <label htmlFor="pais" className={labelBase}>País</label>
                    <select id="pais" name="pais" value={selectedCountry?.code || ""} onChange={handleCountryChange}
                      className={`${inputBase} appearance-none ${touched.pais && errors.pais ? inputError : inputOk}`}>
                      <option value="" className="bg-gray-900">Selecciona tu país</option>
                      {countries.map((c) => (<option key={c.code} value={c.code} className="bg-gray-900">{c.flag} {c.name}</option>))}
                    </select>
                    {touched.pais && errors.pais && <p className={errorMsg}>{errors.pais}</p>}
                  </div>

                  <div>
                    <label htmlFor="telefono" className={labelBase}>Teléfono</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/20 px-3 py-3 shrink-0">
                        <span className="text-lg">{selectedCountry?.flag || "🌎"}</span>
                        <span className="text-sm font-medium text-white/70">{selectedCountry?.dialCode || "+___"}</span>
                      </div>
                      <input id="telefono" name="telefono" type="tel" autoComplete="tel"
                        value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))} onBlur={(e) => handleBlur("telefono", e.target.value)}
                        placeholder="12345678" maxLength={15}
                        className={`${inputBase} flex-1 ${touched.telefono && errors.telefono ? inputError : inputOk}`} />
                    </div>
                    {touched.telefono && errors.telefono && <p className={errorMsg}>{errors.telefono}</p>}
                  </div>

                  <div>
                    <label htmlFor="ciudad" className={labelBase}>Ciudad</label>
                    <input id="ciudad" name="ciudad" type="text"
                      value={ciudad} onChange={(e) => setCiudad(e.target.value)} onBlur={(e) => handleBlur("ciudad", e.target.value)}
                      placeholder="Guatemala City, Quetzaltenango…"
                      className={`${inputBase} ${touched.ciudad && errors.ciudad ? inputError : inputOk}`} />
                    {touched.ciudad && errors.ciudad && <p className={errorMsg}>{errors.ciudad}</p>}
                  </div>

                  <div>
                    <label htmlFor="birthDate" className={labelBase}>Fecha de nacimiento</label>
                    <input id="birthDate" name="birthDate" type="date" max={maxBirthDate}
                      value={birthDate} onChange={(e) => setBirthDate(e.target.value)} onBlur={(e) => handleBlur("birthDate", e.target.value)}
                      className={`${inputBase} ${touched.birthDate && errors.birthDate ? inputError : inputOk}`} />
                    {touched.birthDate && errors.birthDate && <p className={errorMsg}>{errors.birthDate}</p>}
                    <p className="mt-1.5 text-xs text-white/30">Debes ser mayor de 18 años</p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptTerms}
                      onChange={(e) => { setAcceptTerms(e.target.checked); handleBlur("terms", e.target.checked); }}
                      className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 accent-[#FF6B35]" />
                    <span className="text-sm text-white/60 leading-relaxed">
                      Acepto los{" "}
                      <a href="/terms" className="text-[#FF6B35] hover:text-[#ff8a5e] underline">Términos y Condiciones</a>{" "}
                      y la{" "}
                      <a href="/privacy" className="text-[#FF6B35] hover:text-[#ff8a5e] underline">Política de Privacidad</a>
                    </span>
                  </label>
                  {touched.terms && errors.terms && <p className={errorMsg}>{errors.terms}</p>}

                  <div className="space-y-3 pt-1">
                    <button type="button" onClick={handleNextToStep3}
                      className="w-full rounded-xl bg-[#FF6B35] hover:bg-[#e05e00] py-3 text-sm font-semibold text-white transition-all active:scale-[0.99]">
                      Continuar →
                    </button>
                    <button type="button" onClick={() => setStep(1)}
                      className="w-full rounded-xl bg-white/5 border border-white/15 py-3 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white/80 transition-all">
                      ← Volver
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 px-4 py-3">
                    <p className="text-xs text-amber-300 leading-relaxed">
                      Para proteger a nuestra comunidad, todos los artistas deben verificar su identidad antes de publicar servicios.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="documentType" className={labelBase}>Tipo de documento</label>
                    <select id="documentType" value={documentType}
                      onChange={(e) => { setDocumentType(e.target.value as DocumentType); if (e.target.value !== "DPI") { setDocumentBackUrl(""); setBackPreview(""); } }}
                      className={`${inputBase} appearance-none ${inputOk}`}>
                      {Object.entries(DOCUMENT_LABELS).map(([val, label]) => (
                        <option key={val} value={val} className="bg-gray-900">{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="documentNumber" className={labelBase}>Número de documento</label>
                    <input id="documentNumber" name="documentNumber" type="text"
                      value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} onBlur={(e) => handleBlur("documentNumber", e.target.value)}
                      placeholder={documentType === "DPI" ? "Ej: 1234567890101" : "Ej: A12345678"}
                      className={`${inputBase} ${touched.documentNumber && errors.documentNumber ? inputError : inputOk}`} />
                    {touched.documentNumber && errors.documentNumber && <p className={errorMsg}>{errors.documentNumber}</p>}
                  </div>

                  {renderUploadBox("Foto frontal del documento", "Foto clara de la parte delantera de tu documento", "front", uploadingFront, frontPreview, "documentFrontUrl", setUploadingFront, setDocumentFrontUrl, setFrontPreview)}
                  {documentType === "DPI" && renderUploadBox("Foto posterior del documento", "Foto clara de la parte trasera de tu DPI", "back", uploadingBack, backPreview, "documentFrontUrl", setUploadingBack, setDocumentBackUrl, setBackPreview, true)}
                  {renderUploadBox("Selfie sosteniendo el documento", "Foto tuya sujetando el documento con tu rostro visible", "selfie", uploadingSelfie, selfiePreview, "documentSelfieUrl", setUploadingSelfie, setDocumentSelfieUrl, setSelfiePreview)}

                  <div className="space-y-3 pt-1">
                    <button type="submit" disabled={loading}
                      className="w-full rounded-xl bg-[#FF6B35] hover:bg-[#e05e00] py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creando tu cuenta...
                        </>
                      ) : "Crear mi cuenta de artista"}
                    </button>
                    <button type="button" onClick={() => setStep(2)}
                      className="w-full rounded-xl bg-white/5 border border-white/15 py-3 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white/80 transition-all">
                      ← Volver
                    </button>
                  </div>
                </>
              )}

              {/* OAuth + links */}
              <div className="pt-5 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-white/10" />
                  <span className="text-xs text-white/30 uppercase tracking-wider">o regístrate con</span>
                  <div className="flex-1 border-t border-white/10" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={handleGoogleRegister} disabled={googleLoading}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/90 hover:bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                    {googleLoading ? (
                      <svg className="h-4 w-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
                  <button type="button" disabled title="Próximamente"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/30 cursor-not-allowed opacity-50">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.875v2.256h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                  <button type="button" disabled title="Próximamente"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/30 cursor-not-allowed opacity-50">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
                    </svg>
                    TikTok
                  </button>
                </div>

                <div className="text-center text-sm">
                  <span className="text-white/40">¿Ya tienes cuenta? </span>
                  <a href="/login" className="font-semibold text-[#FF6B35] hover:text-[#ff8a5e] transition-colors">Inicia sesión aquí</a>
                </div>
                <div className="text-center">
                  <a href="/register/client"
                    className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    ¿Eres cliente? <span className="font-semibold ml-0.5 text-[#FF6B35]">Regístrate aquí</span>
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>


      {/* Modal de Ubicación */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 bg-[#FF6B35]/20 rounded-full flex items-center justify-center mb-4 border border-[#FF6B35]/30">
                <svg className="w-7 h-7 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Permiso de Ubicación</h3>
              <p className="text-sm text-white/50">
                Necesitamos tu ubicación para mostrarte oportunidades cerca de ti y gestionar tus servicios localmente.
              </p>
            </div>
            <div className="space-y-3">
              <button onClick={handleAcceptLocation}
                className="w-full rounded-xl bg-[#FF6B35] hover:bg-[#e05e00] py-3 text-sm font-semibold text-white transition-all">
                Permitir ubicación
              </button>
              <button onClick={handleSkipLocation}
                className="w-full rounded-xl bg-white/5 border border-white/15 py-3 text-sm font-medium text-white/60 hover:bg-white/10 transition-all">
                Ahora no
              </button>
            </div>
            <p className="mt-4 text-xs text-center text-white/25">Puedes cambiarlo más tarde en configuración</p>
          </div>
        </div>
      )}
    </>
  );
}
