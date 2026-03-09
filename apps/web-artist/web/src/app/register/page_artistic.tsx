"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";

interface FieldError {
  nombre?: string;
  email?: string;
  password?: string;
  role?: string;
  terms?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  // Form fields
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'artista' | 'cliente'>('artista');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // UI state
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateField = (field: string, value: string | boolean): string => {
    switch (field) {
      case "nombre":
        if (!value || typeof value !== 'string' || !value.trim()) 
          return "Ingresa tu nombre artístico";
        if (value.trim().length < 2) 
          return "Mínimo 2 caracteres";
        return "";
      case "email":
        if (!value || typeof value !== 'string') 
          return "El email es obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) 
          return "Email inválido";
        return "";
      case "password":
        if (!value || typeof value !== 'string') 
          return "Crea una contraseña";
        if (value.length < 8) 
          return "Mínimo 8 caracteres";
        return "";
      case "role":
        if (!value || typeof value !== 'string') 
          return "Selecciona tu rol";
        return "";
      case "terms":
        if (!value) 
          return "Debes aceptar los términos";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    // Validate all fields
    const newErrors: FieldError = {
      nombre: validateField("nombre", nombre),
      email: validateField("email", email),
      password: validateField("password", password),
      role: validateField("role", role),
      terms: validateField("terms", acceptTerms),
    };

    setErrors(newErrors);
    setTouched({
      nombre: true,
      email: true,
      password: true,
      role: true,
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
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear tu cuenta");
      }

      // Update auth state
      if (data.user) {
        login(data.user);
      }
      
      setShowSuccess(true);
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Permanent+Marker&family=Inter:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        
        .font-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .font-marker {
          font-family: 'Permanent Marker', cursive;
        }
        
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
        }

        .custom-shadow {
          box-shadow: 12px 12px 0px 0px rgba(255, 106, 0, 0.2);
        }

        .skew-section {
          transform: skewY(-2deg);
        }

        .skew-content {
          transform: skewY(2deg);
        }

        .rotate-section {
          transform: rotate(1deg);
        }

        .rotate-content {
          transform: rotate(-1deg);
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px white inset;
          -webkit-text-fill-color: #1a1614;
          border-color: #FF6A00;
        }

        .role-card input:checked ~ div {
          background-color: #FF6A00;
          color: white;
          border-color: #FF6A00;
        }

        .role-card:hover div {
          transform: scale(1.05) rotate(-1.5deg);
        }

        .role-card input:checked ~ div:hover {
          transform: scale(1.02) rotate(-0.5deg);
        }
      `}</style>

      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF9F6] via-[#FFF5EB] to-[#FAF9F6]"></div>
        
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 border-[15px] border-[#FF6A00]/10 rounded-full"></div>
        <div className="absolute top-1/3 -right-32 w-80 h-80 border-[12px] border-[#00AEEF]/10 rounded-full"></div>
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 border-[10px] border-[#FF6A00]/5 rounded-full blur-sm"></div>
        
        {/* Material icons decorations */}
        <span className="material-symbols-outlined absolute top-40 right-10 text-8xl text-[#00AEEF]/10 rotate-12">
          draw
        </span>
        <span className="material-symbols-outlined absolute bottom-32 left-20 text-7xl text-[#FF6A00]/10 -rotate-12">
          palette
        </span>
        <span className="material-symbols-outlined absolute top-1/2 right-1/4 text-6xl text-[#00AEEF]/10 rotate-45">
          music_note
        </span>
      </div>

      {/* Main content */}
      <div className="relative min-h-screen flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-7xl">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left side - Brand presentation */}
            <div className="lg:col-span-3 space-y-8">
              {/* Title with hand-drawn underline */}
              <div className="space-y-4">
                <h1 className="font-grotesk text-6xl md:text-7xl font-bold text-[#1a1614] leading-tight">
                  JOIN THE
                  <br />
                  <span className="relative inline-block">
                    <span className="text-[#FF6A00] font-marker tracking-wide">CREATIVE</span>
                    <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none">
                      <path d="M2 10C52 4 102 7 152 5C172 4 192 6 198 8" stroke="#FF6A00" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <br />
                  <span className="font-grotesk">REVOLUTION</span>
                </h1>
                <p className="text-xl text-[#1a1614]/70 font-grotesk max-w-xl">
                  Descubre, conecta y colabora con artistas increíbles. Tu próximo proyecto comienza aquí.
                </p>
              </div>

              {/* Role selection cards */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#00AEEF] tracking-wider font-grotesk uppercase">
                  ELIGE TU ROL
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Artist card */}
                  <label className="role-card cursor-pointer block group">
                    <input
                      type="radio"
                      name="role"
                      value="artista"
                      checked={role === 'artista'}
                      onChange={(e) => {
                        setRole('artista');
                        handleBlur('role', 'artista');
                      }}
                      className="sr-only peer"
                    />
                    <div className="relative bg-white border-4 border-[#1a1614] p-8 transition-all duration-300 ease-out overflow-hidden">
                      {/* Background icon */}
                      <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-[#FF6A00]/5">
                        palette
                      </span>
                      
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-start justify-between">
                          <span className="material-symbols-outlined text-5xl text-[#FF6A00]">
                            palette
                          </span>
                          <span className="material-symbols-outlined text-2xl text-green-500 opacity-0 peer-checked:opacity-100 transition-opacity">
                            verified
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="text-2xl font-bold text-[#1a1614] font-grotesk">
                            Soy Artista
                          </h4>
                          <p className="text-sm text-[#1a1614]/60 mt-2 font-grotesk">
                            Muestra tu talento, conecta con clientes y haz crecer tu carrera artística
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#00AEEF] font-bold font-grotesk">
                          <span className="material-symbols-outlined text-sm">
                            arrow_forward
                          </span>
                          <span>Crear perfil de artista</span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Client card */}
                  <label className="role-card cursor-pointer block group">
                    <input
                      type="radio"
                      name="role"
                      value="cliente"
                      checked={role === 'cliente'}
                      onChange={(e) => {
                        setRole('cliente');
                        handleBlur('role', 'cliente');
                      }}
                      className="sr-only peer"
                    />
                    <div className="relative bg-white border-4 border-[#1a1614] p-8 transition-all duration-300 ease-out overflow-hidden">
                      {/* Background icon */}
                      <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-[#00AEEF]/5">
                        hub
                      </span>
                      
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-start justify-between">
                          <span className="material-symbols-outlined text-5xl text-[#00AEEF]">
                            hub
                          </span>
                          <span className="material-symbols-outlined text-2xl text-green-500 opacity-0 peer-checked:opacity-100 transition-opacity">
                            verified
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="text-2xl font-bold text-[#1a1614] font-grotesk">
                            Busco Talento
                          </h4>
                          <p className="text-sm text-[#1a1614]/60 mt-2 font-grotesk">
                            Descubre artistas increíbles y contrata servicios para tus proyectos
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#00AEEF] font-bold font-grotesk">
                          <span className="material-symbols-outlined text-sm">
                            arrow_forward
                          </span>
                          <span>Explorar artistas</span>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {touched.role && errors.role && (
                  <p className="text-sm text-red-600 font-grotesk">{errors.role}</p>
                )}
              </div>

              {/* Creator avatars */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-gradient-to-br from-[#FF6A00] to-[#FF8F3E] flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-gradient-to-br from-[#00AEEF] to-[#39C0F7] flex items-center justify-center text-white font-bold">
                    B
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-gradient-to-br from-[#FF6A00] to-[#FF8F3E] flex items-center justify-center text-white font-bold">
                    C
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-gradient-to-br from-[#00AEEF] to-[#39C0F7] flex items-center justify-center text-white font-bold">
                    D
                  </div>
                </div>
                <p className="text-sm font-medium text-[#1a1614]/70 font-grotesk">
                  Únete a <span className="font-bold text-[#FF6A00]">5,000+</span> creadores increíbles
                </p>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="lg:col-span-2">
              <div className="skew-section rotate-section bg-[#FF6A00] p-1 custom-shadow">
                <div className="skew-content rotate-content bg-white p-10 border-2 border-[#FF6A00]">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-[#1a1614] font-grotesk">
                        ¡Empecemos!
                      </h2>
                      <p className="text-sm text-[#1a1614]/60 mt-2 font-grotesk">
                        Crea tu cuenta en segundos
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {generalError && (
                        <div className="bg-red-50 border-2 border-red-200 p-4 rounded">
                          <p className="text-sm text-red-800 font-grotesk">{generalError}</p>
                        </div>
                      )}

                      {showSuccess && (
                        <div className="bg-green-50 border-2 border-green-200 p-4 rounded">
                          <p className="text-sm text-green-800 font-grotesk font-bold">
                            ✨ ¡Cuenta creada! Redirigiendo...
                          </p>
                        </div>
                      )}

                      {/* Creative Name */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#00AEEF] tracking-wider uppercase font-grotesk flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">
                            badge
                          </span>
                          NOMBRE CREATIVO / ALIAS
                        </label>
                        <input
                          type="text"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          onBlur={() => handleBlur('nombre', nombre)}
                          className="w-full px-0 py-3 text-lg font-medium text-[#1a1614] bg-transparent border-0 border-b-2 border-[#FF6A00] focus:outline-none focus:border-[#00AEEF] transition-colors font-grotesk placeholder:text-[#1a1614]/30"
                          placeholder="Tu nombre artístico"
                          disabled={loading}
                        />
                        {touched.nombre && errors.nombre && (
                          <p className="text-xs text-red-600 font-grotesk">{errors.nombre}</p>
                        )}
                      </div>

                      {/* Digital Mailbox */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#00AEEF] tracking-wider uppercase font-grotesk flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">
                            mail
                          </span>
                          BUZÓN DIGITAL
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => handleBlur('email', email)}
                          className="w-full px-0 py-3 text-lg font-medium text-[#1a1614] bg-transparent border-0 border-b-2 border-[#FF6A00] focus:outline-none focus:border-[#00AEEF] transition-colors font-grotesk placeholder:text-[#1a1614]/30"
                          placeholder="tu@email.com"
                          disabled={loading}
                        />
                        {touched.email && errors.email && (
                          <p className="text-xs text-red-600 font-grotesk">{errors.email}</p>
                        )}
                      </div>

                      {/* Secret Key */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#00AEEF] tracking-wider uppercase font-grotesk flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">
                            key
                          </span>
                          CLAVE SECRETA
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => handleBlur('password', password)}
                          className="w-full px-0 py-3 text-lg font-medium text-[#1a1614] bg-transparent border-0 border-b-2 border-[#FF6A00] focus:outline-none focus:border-[#00AEEF] transition-colors font-grotesk placeholder:text-[#1a1614]/30"
                          placeholder="••••••••"
                          disabled={loading}
                        />
                        {touched.password && errors.password && (
                          <p className="text-xs text-red-600 font-grotesk">{errors.password}</p>
                        )}
                      </div>

                      {/* Terms checkbox */}
                      <div className="space-y-2">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => {
                              setAcceptTerms(e.target.checked);
                              handleBlur('terms', e.target.checked);
                            }}
                            className="w-5 h-5 mt-0.5 border-2 border-[#FF6A00] rounded accent-[#FF6A00] focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2 cursor-pointer"
                            disabled={loading}
                          />
                          <span className="text-sm text-[#1a1614]/70 font-grotesk group-hover:text-[#1a1614] transition-colors">
                            Acepto los{" "}
                            <Link href="/terms" className="text-[#FF6A00] font-bold hover:text-[#00AEEF] underline">
                              términos y condiciones
                            </Link>{" "}
                            y la{" "}
                            <Link href="/privacy" className="text-[#FF6A00] font-bold hover:text-[#00AEEF] underline">
                              política de privacidad
                            </Link>
                          </span>
                        </label>
                        {touched.terms && errors.terms && (
                          <p className="text-xs text-red-600 font-grotesk">{errors.terms}</p>
                        )}
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF6A00] hover:bg-[#FF8F3E] disabled:bg-[#FF6A00]/50 text-white font-bold py-4 text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 disabled:hover:translate-y-0 disabled:cursor-not-allowed font-grotesk uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <span className="material-symbols-outlined animate-spin">
                              progress_activity
                            </span>
                            Creando cuenta...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">
                              rocket_launch
                            </span>
                            ¡Empezar ahora!
                          </>
                        )}
                      </button>

                      {/* Login link */}
                      <div className="text-center">
                        <p className="text-sm text-[#1a1614]/60 font-grotesk">
                          ¿Ya tienes cuenta?{" "}
                          <Link href="/login" className="text-[#FF6A00] font-bold hover:text-[#00AEEF] underline">
                            Inicia sesión
                          </Link>
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* "Let's Go!" rotated badge */}
              <div className="relative mt-8 flex justify-end">
                <div className="relative -rotate-12">
                  <div className="bg-[#00AEEF] text-white px-6 py-3 font-marker text-xl border-4 border-[#1a1614] shadow-lg">
                    Let's Go! ✨
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t-2 border-[#1a1614]/10">
            <div className="text-center">
              <p className="text-sm text-[#1a1614]/60 font-grotesk">
                <span className="font-bold text-[#FF6A00]">PIUMS STUDIO</span> • Conectando creativos desde 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
