import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Camera, Music, Mic2, Monitor, Video, Sparkles } from "lucide-react";

const DISCIPLINES = [
  { Icon: Camera,   label: "Fotografía",  color: "#14B8A6" },
  { Icon: Music,    label: "Música",       color: "#A855F7" },
  { Icon: Video,    label: "Video",        color: "#F59E0B" },
  { Icon: Mic2,     label: "Animadores",   color: "#EC4899" },
  { Icon: Monitor,  label: "Creadores",    color: "#3B82F6" },
  { Icon: Sparkles, label: "Performance",  color: "#FF6B35" },
];

const ARTIST_APP_URL = process.env.NEXT_PUBLIC_ARTIST_URL || "http://127.0.0.1:3001";

export function Footer() {
  return (
    <footer style={{ background: "#050505", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#fafafa", position: "relative", overflow: "hidden" }}>
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16" style={{ position: "relative", zIndex: 1 }}>

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src="/logo-white.png"
              alt="Piums"
              width={80}
              height={24}
              className="h-6 w-auto mb-4"
              unoptimized
            />
            <p className="text-sm font-medium mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
              El mercado creativo de Guatemala.
            </p>

            {/* Discipline pills 2×3 */}
            <div className="grid grid-cols-2 gap-2 mb-6 max-w-xs">
              {DISCIPLINES.map(({ Icon, label, color }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  {label}
                </span>
              ))}
            </div>

            {/* Mini stats */}
            <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.25)" }}>
              <span style={{ color: "#FF6B35" }}>500+</span> artistas
              <span className="mx-2" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span style={{ color: "#FF6B35" }}>2,400+</span> reservas
              <span className="mx-2" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span style={{ color: "#FF6B35" }}>4.8</span>★
            </p>

            <div className="flex items-center gap-4">
              <a href="https://instagram.com/piums.io" target="_blank" rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.4)" }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://facebook.com/piums.io" target="_blank" rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.4)" }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://tiktok.com/@piums.io" target="_blank" rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.4)" }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Para clientes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.22)" }}>
              Para clientes
            </p>
            <ul className="space-y-3">
              {[
                { label: "Explorar artistas", href: "/login" },
                { label: "Crear cuenta gratis", href: "/register" },
                { label: "Cómo funciona", href: "/login" },
                { label: "Iniciar sesión", href: "/login" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm transition-opacity hover:opacity-90"
                    style={{ color: "rgba(255,255,255,0.45)" }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.22)" }}>
              Empresa
            </p>
            <ul className="space-y-3">
              {[
                { label: "Sobre Piums", href: "/nosotros" },
                { label: "Contacto", href: "/contacto" },
                { label: "Términos y condiciones", href: "/terminos" },
                { label: "Privacidad", href: "/privacidad" },
                { label: "Reclamos y disputas", href: "/reclamos" },
                { label: "Sistemas automatizados", href: "/automatizacion" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm transition-opacity hover:opacity-90"
                    style={{ color: "rgba(255,255,255,0.45)" }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* App download strip */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <p className="text-sm font-semibold mb-0.5">Descarga la app Piums</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Gestiona reservas desde tu móvil. Disponible para iOS y Android.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={process.env.NEXT_PUBLIC_CLIENT_APP_IOS || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-opacity hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div>
                <div className="text-[9px] leading-none" style={{ color: "rgba(255,255,255,0.35)" }}>Disponible en</div>
                <div className="text-xs font-semibold leading-tight">App Store</div>
              </div>
            </a>
            <a
              href={process.env.NEXT_PUBLIC_CLIENT_APP_ANDROID || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-opacity hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.19.96.07l11.37-6.57-2.39-2.39-9.94 8.89zm-1.76-20.1C1.16 3.96 1 4.34 1 4.8v14.4c0 .46.16.84.42 1.14l.06.06 8.07-8.07v-.19L1.42 3.6l-.06.06zm17.16 8.67l-2.3-1.33-2.67 2.67 2.67 2.67 2.31-1.33c.66-.38.66-1.01 0-1.68h-.01zm-15.4 9.28L14.55 13l-2.39-2.39L3.18 2.24C2.86 2.12 2.52 2.14 2.22 2.31c-.61.35-.61 1.31 0 1.68l.14.08L14.55 12 2.36 20.43l-.14.08c-.61.37-.61 1.33 0 1.68.3.17.64.19.96.07l-.14-.08.14.08z"/>
              </svg>
              <div>
                <div className="text-[9px] leading-none" style={{ color: "rgba(255,255,255,0.35)" }}>Disponible en</div>
                <div className="text-xs font-semibold leading-tight">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-3">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
              © {new Date().getFullYear()} Piums. Todos los derechos reservados.
            </p>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
              style={{ border: "1px solid rgba(255,107,53,0.2)", color: "rgba(255,107,53,0.6)" }}
            >
              GT Guatemala
            </span>
          </div>
          <a
            href={`${ARTIST_APP_URL}/register/artist`}
            className="inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            ¿Eres artista? Únete a Piums
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Large ghost text — Volvox/Suno style */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-0.1em",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "clamp(140px, 24vw, 360px)",
          fontWeight: 900,
          lineHeight: 1,
          whiteSpace: "nowrap",
          letterSpacing: "-0.03em",
          color: "rgba(255,255,255,0.06)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        PIUMS
      </div>
    </footer>
  );
}
