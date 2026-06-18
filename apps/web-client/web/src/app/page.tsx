import Image from "next/image";
import Link from "next/link";
import { RevealObserver } from "@/components/RevealObserver";
import { HeroPiums } from "@/components/ui/shape-landing-hero";
import { PiumsCinematicFooter } from "@/components/ui/motion-footer";
import {
  Camera, Music, Mic2, Monitor, Video, Sparkles,
  ShieldCheck, DollarSign, Clock, ArrowRight, Check, TrendingUp, MapPin,
} from "lucide-react";

const ARTIST_APP_URL = process.env.NEXT_PUBLIC_ARTIST_URL || "http://127.0.0.1:3001";

const TALENT_CHART = [
  { rank: 1, name: "Fotografía",     count: 42, pct: 92, color: "#14B8A6" },
  { rank: 2, name: "Música en vivo", count: 38, pct: 82, color: "#A855F7" },
  { rank: 3, name: "Videografía",    count: 26, pct: 60, color: "#F59E0B" },
  { rank: 4, name: "Animadores",     count: 21, pct: 50, color: "#EC4899" },
  { rank: 5, name: "Creadores",      count: 18, pct: 42, color: "#3B82F6" },
  { rank: 6, name: "Performance",    count: 12, pct: 28, color: "#FF6B35" },
];

const FEATURED_ARTISTS = [
  {
    initials: "CM",
    name: "Carlos Martínez",
    quote: "Cada foto, una historia guatemalteca",
    discipline: "Fotografía",
    location: "Ciudad de Guatemala",
    rating: "4.9",
    reviews: 47,
    from: "$150",
    tags: ["Bodas", "Retratos", "Eventos"],
    cover: "linear-gradient(135deg, #134E4A 0%, #0F766E 100%)",
    accent: "#14B8A6",
  },
  {
    initials: "RC",
    name: "Roberto Castro",
    quote: "El mejor soundtrack para tus mejores momentos",
    discipline: "Animador · MC",
    location: "Mixco, Guatemala",
    rating: "4.8",
    reviews: 23,
    from: "$250",
    tags: ["Fiestas", "Corporativo", "Bodas"],
    cover: "linear-gradient(135deg, #831843 0%, #BE185D 100%)",
    accent: "#EC4899",
  },
  {
    initials: "AL",
    name: "Ana López",
    quote: "Música que se siente, no solo se escucha",
    discipline: "Música en vivo",
    location: "Antigua Guatemala",
    rating: "5.0",
    reviews: 18,
    from: "$200",
    tags: ["Bodas", "Acústico", "Covers"],
    cover: "linear-gradient(135deg, #581C87 0%, #7C3AED 100%)",
    accent: "#A855F7",
  },
];

const CATEGORIES = [
  { Icon: Camera,   name: "Fotografía",            desc: "Bodas, eventos, retratos, drone",     href: "/login", color: "#14B8A6", count: 42 },
  { Icon: Music,    name: "Música",                desc: "Cantantes, bandas, mariachi, marimba", href: "/login", color: "#A855F7", count: 38 },
  { Icon: Video,    name: "Video",                 desc: "Bodas, eventos, streaming en vivo",    href: "/login", color: "#F59E0B", count: 26 },
  { Icon: Mic2,     name: "Animadores",            desc: "Maestros de ceremonia, payasos",       href: "/login", color: "#EC4899", count: 21 },
  { Icon: Monitor,  name: "Creadores de contenido",desc: "TikTokers, YouTubers, influencers",    href: "/login", color: "#3B82F6", count: 18 },
  { Icon: Sparkles, name: "Arte & Performance",    desc: "Performers, artistas escénicas",       href: "/login", color: "#FF6B35", count: 12 },
];

const MARQUEE_TAGS = [
  { tag: "Fotógrafo de bodas",     color: "#14B8A6" },
  { tag: "Cantante solista",        color: "#A855F7" },
  { tag: "Maestro de ceremonia",    color: "#EC4899" },
  { tag: "TikToker",                color: "#3B82F6" },
  { tag: "Videógrafo de eventos",   color: "#F59E0B" },
  { tag: "Fotógrafo de retratos",   color: "#14B8A6" },
  { tag: "Mariachi",                color: "#A855F7" },
  { tag: "Influencer",              color: "#3B82F6" },
  { tag: "Marimba",                 color: "#A855F7" },
  { tag: "Streaming en vivo",       color: "#F59E0B" },
  { tag: "Banda musical",           color: "#A855F7" },
  { tag: "Fotógrafo de bodas",     color: "#14B8A6" },
  { tag: "Cantante solista",        color: "#A855F7" },
  { tag: "Maestro de ceremonia",    color: "#EC4899" },
  { tag: "TikToker",                color: "#3B82F6" },
  { tag: "Videógrafo de eventos",   color: "#F59E0B" },
  { tag: "Fotógrafo de retratos",   color: "#14B8A6" },
  { tag: "Mariachi",                color: "#A855F7" },
  { tag: "Influencer",              color: "#3B82F6" },
  { tag: "Marimba",                 color: "#A855F7" },
  { tag: "Streaming en vivo",       color: "#F59E0B" },
  { tag: "Banda musical",           color: "#A855F7" },
];

const STATS = [
  { value: "500+",   label: "Artistas guatemaltecos" },
  { value: "2,400+", label: "Reservas completadas"   },
  { value: "4.8★",   label: "Calificación promedio"  },
];

const USE_CASES = [
  {
    tag: "Para tu boda",
    tagColor: "#14B8A6",
    headline: "Cada momento merece ser eterno",
    desc: "Fotógrafos y músicos para bodas en Antigua, el Lago de Atitlán o donde tú elijas. Portfolios reales, artistas verificados, pagos protegidos.",
    cta: "Explorar para bodas",
    initials: "CM",
    artistName: "Carlos Martínez",
    discipline: "Fotógrafo · Bodas",
    cover: "linear-gradient(135deg, #134E4A 0%, #0F766E 100%)",
    accent: "#14B8A6",
    rating: "4.9",
    flip: false,
  },
  {
    tag: "Para tu empresa",
    tagColor: "#3B82F6",
    headline: "Contenido que conecta con tu audiencia",
    desc: "Videógrafos y creadores de contenido listos para dar voz visual a tu marca. Videos de eventos, reels y streaming profesional para empresas en Guatemala.",
    cta: "Explorar para empresas",
    initials: "JR",
    artistName: "Jorge Rodríguez",
    discipline: "Videógrafo · Eventos",
    cover: "linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 100%)",
    accent: "#3B82F6",
    rating: "4.8",
    flip: true,
  },
  {
    tag: "Para tu proyecto",
    tagColor: "#A855F7",
    headline: "Tu historia, contada por artistas",
    desc: "Músicos, performers e ilustradores para lanzamientos de marca, proyectos creativos o cualquier momento que merezca ser vivido con arte.",
    cta: "Explorar artistas",
    initials: "AL",
    artistName: "Ana López",
    discipline: "Música en vivo · Acústico",
    cover: "linear-gradient(135deg, #581C87 0%, #7C3AED 100%)",
    accent: "#A855F7",
    rating: "5.0",
    flip: false,
  },
];

const STEPS = [
  { num: "1", title: "Explora artistas",      desc: "Filtra por categoría, ciudad y precio. Ve portafolios reales antes de decidir." },
  { num: "2", title: "Reserva con un clic",   desc: "Elige fecha y servicio. Pagas el 50% de depósito — protegido hasta confirmar." },
  { num: "3", title: "Disfruta el resultado", desc: "El artista se presenta, entrega su trabajo y libera el pago restante. Luego dejas tu reseña." },
];

const TRUST = [
  { Icon: ShieldCheck, title: "Artistas verificados" },
  { Icon: DollarSign,  title: "Pagos en USD protegidos" },
  { Icon: Clock,       title: "Reserva en minutos" },
];

const PERKS = [
  "Apoya la Economía Naranja",
  "Artistas verificados, Guatemala",
  "Pago directo al creador",
  "50% de depósito al reservar",
];

export default function Home() {
  return (
    <>
      <div
        className="flex min-h-[100dvh] flex-col"
        style={{ background: "#080808", color: "#fafafa", fontFamily: "var(--font-geist-sans)" }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div style={{
            position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
            width: "120%", height: "60%",
            background: "radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.10) 0%, transparent 65%)",
          }} />
          <div style={{
            position: "absolute", bottom: "5%", right: "-10%", width: "50%", height: "50%",
            background: "radial-gradient(ellipse, rgba(168,85,247,0.04) 0%, transparent 60%)",
          }} />
        </div>

        {/* Navbar */}
        <nav
          className="relative z-20 flex items-center justify-between px-6 md:px-12 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Image src="/logo-white.png" alt="Piums" width={100} height={30} className="h-7 w-auto" priority unoptimized />
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: "#FF6B35" }}
            >
              Registrarse gratis
            </Link>
          </div>
        </nav>

        <main className="relative z-10 flex flex-1 flex-col items-center overflow-hidden">
          <RevealObserver />

          {/* ── Hero ──────────────────────────────────────────────── */}
          <HeroPiums
            badge="Economía Naranja · Guatemala"
            headline={
              <>
                Conecta con el talento
                <br />
                <span style={{
                  background: "linear-gradient(90deg, #FF6B35 0%, #F59E0B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  creativo de Guatemala
                </span>
              </>
            }
            subtitle="Fotógrafos, músicos, animadores y creadores verificados. Reserva en minutos, paga en USD."
            ctaPrimary={{ label: "Explorar artistas", href: "/login" }}
            ctaSecondary={{ label: "Crear cuenta gratis", href: "/register" }}
            perks={PERKS}
          />

          {/* ── Talent chart ──────────────────────────────────────── */}
          <div className="w-full max-w-sm mx-auto px-6 md:px-12 mt-10 mb-12" style={{ animation: "fade-up 0.9s ease-out 1.2s both" }}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-medium uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
                    Talento verificado en Guatemala
                  </p>
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: "rgba(255,107,53,0.55)" }} />
                </div>
                {TALENT_CHART.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 py-2.5 px-1">
                    <span className="text-[11px] font-mono w-4 text-right shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {item.rank}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-sm flex-1 font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-14 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color, opacity: 0.65 }} />
                      </div>
                      <span className="text-[11px] font-mono w-6 text-right" style={{ color: "rgba(255,255,255,0.28)" }}>
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Link href="/login" className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#FF6B35" }}>
                  Ver todos los artistas
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Marquee ───────────────────────────────────────────── */}
          <div
            className="w-full overflow-hidden py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="animate-marquee gap-3">
              {MARQUEE_TAGS.map(({ tag, color }, i) => (
                <span
                  key={i}
                  className="shrink-0 rounded-full px-4 py-1.5 text-xs font-medium mr-3"
                  style={{ border: `1px solid ${color}30`, color, background: `${color}0a` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ── Stats ─────────────────────────────────────────────── */}
          <div className="w-full max-w-3xl mx-auto px-6 md:px-12 mt-24 reveal">
            <div className="grid grid-cols-3 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center py-9 px-4 text-center"
                  style={{ background: "#0f0f0f", borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
                >
                  <span className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "#FF6B35" }}>{s.value}</span>
                  <span className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
              Activos en 20+ ciudades de Guatemala
            </p>
          </div>

          {/* ── Manifiesto ────────────────────────────────────────── */}
          <div className="w-full max-w-2xl mx-auto px-6 md:px-12 mt-32 text-center reveal">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5"
              style={{ letterSpacing: "-0.03em" }}
            >
              El talento guatemalteco
              <br />
              merece su escenario.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
              Fotógrafos en Antigua, músicos en Zona 10, DJs en Xela.
              <br />
              Ahora en un solo lugar.
            </p>
          </div>

          {/* ── Artistas destacados ───────────────────────────────── */}
          <div className="w-full max-w-5xl mx-auto px-6 md:px-12 mt-24">
            <div className="flex items-end justify-between mb-12 reveal">
              <div>
                <p className="text-xs font-medium uppercase mb-3" style={{ color: "#FF6B35", letterSpacing: "0.08em" }}>
                  Talento verificado
                </p>
                <h2 className="text-2xl md:text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
                  Conoce a los artistas
                </h2>
                <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Perfiles reales, portafolios reales, resultados garantizados
                </p>
              </div>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                Ver todos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {FEATURED_ARTISTS.map((artist, i) => (
                <Link
                  key={artist.name}
                  href="/login"
                  className={`group flex flex-col rounded-2xl overflow-hidden transition-all reveal reveal-d${i + 1}`}
                  style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="relative h-28" style={{ background: artist.cover }}>
                    <div
                      className="absolute -bottom-5 left-5 flex items-center justify-center rounded-full text-sm font-bold"
                      style={{ width: 44, height: 44, background: "#0f0f0f", border: `2px solid ${artist.accent}`, color: artist.accent }}
                    >
                      {artist.initials}
                    </div>
                  </div>
                  <div className="px-5 pt-8 pb-5 flex flex-col gap-3 flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{artist.name}</p>
                          <p className="text-xs mt-0.5 italic" style={{ color: "rgba(255,255,255,0.32)" }}>"{artist.quote}"</p>
                        </div>
                        <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>
                          ★ {artist.rating}
                          <span className="ml-1" style={{ color: "rgba(255,255,255,0.25)" }}>({artist.reviews})</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-xs rounded-full px-2 py-0.5 font-medium"
                          style={{ background: `${artist.accent}18`, color: artist.accent }}
                        >
                          {artist.discipline}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          {artist.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {artist.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs rounded-full px-2.5 py-0.5"
                          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.38)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div
                      className="mt-auto pt-3 flex items-center justify-between"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-sm">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.32)" }}>Desde </span>
                        <span className="font-semibold">{artist.from}</span>
                      </span>
                      <span className="text-xs font-medium flex items-center gap-1" style={{ color: "#FF6B35" }}>
                        Ver perfil
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Categorías ────────────────────────────────────────── */}
          <div className="w-full max-w-5xl mx-auto px-6 md:px-12 mt-32">
            <div className="flex items-end justify-between mb-10 reveal">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
                  Explora por categoría
                </h2>
                <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Encuentra el artista perfecto para cada ocasión
                </p>
              </div>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                Ver todos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(({ Icon, name, desc, href, color, count }, i) => (
                <Link
                  key={name}
                  href={href}
                  className={`group flex flex-col gap-4 rounded-2xl p-5 transition-all reveal reveal-d${Math.min(i + 1, 5)}`}
                  style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.32)" }}>{desc}</p>
                    <p className="text-[11px] mt-1.5 font-medium" style={{ color: `${color}90` }}>{count} artistas</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Casos de uso — Squarespace-style alternating ──────── */}
          <div className="w-full max-w-5xl mx-auto px-6 md:px-12 mt-32">
            <div className="text-center mb-16 reveal">
              <p className="text-xs font-medium uppercase mb-3" style={{ color: "#FF6B35", letterSpacing: "0.08em" }}>
                Cómo se usa Piums
              </p>
              <h2 className="text-2xl md:text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
                Para cada momento de tu vida
              </h2>
            </div>

            <div className="flex flex-col gap-20">
              {USE_CASES.map((uc) => (
                <div
                  key={uc.tag}
                  className={`flex flex-col ${uc.flip ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 lg:gap-16 lg:items-center reveal`}
                >
                  <div className="flex-1 flex flex-col">
                    <span
                      className="self-start text-xs font-semibold rounded-full px-3 py-1 mb-6"
                      style={{ background: `${uc.tagColor}18`, color: uc.tagColor, border: `1px solid ${uc.tagColor}30` }}
                    >
                      {uc.tag}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ letterSpacing: "-0.02em" }}>
                      {uc.headline}
                    </h3>
                    <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {uc.desc}
                    </p>
                    <Link
                      href="/login"
                      className="self-start inline-flex items-center gap-2 text-sm font-medium"
                      style={{ color: uc.tagColor }}
                    >
                      {uc.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="lg:w-[260px] shrink-0">
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ background: "#0f0f0f", border: `1px solid ${uc.accent}25` }}
                    >
                      <div className="h-20 relative" style={{ background: uc.cover }}>
                        <div
                          className="absolute -bottom-4 left-4 flex items-center justify-center rounded-full text-xs font-bold"
                          style={{ width: 36, height: 36, background: "#0f0f0f", border: `2px solid ${uc.accent}`, color: uc.accent }}
                        >
                          {uc.initials}
                        </div>
                      </div>
                      <div className="px-4 pt-6 pb-4">
                        <p className="font-semibold text-sm">{uc.artistName}</p>
                        <div className="flex items-center gap-2 mt-1.5 mb-3">
                          <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: `${uc.accent}18`, color: uc.accent }}>
                            {uc.discipline}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <span style={{ color: "#F59E0B" }}>★</span>
                          {uc.rating} · Verificado
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cómo funciona — vertical timeline ─────────────────── */}
          <div className="w-full max-w-2xl mx-auto px-6 md:px-12 mt-32">
            <div className="text-center mb-16 reveal">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
                De la idea al resultado
                <br />
                en 3 pasos
              </h2>
            </div>
            <div className="relative">
              <div
                className="hidden sm:block absolute"
                style={{
                  left: 19, top: 44,
                  width: 1, height: "calc(100% - 88px)",
                  background: "linear-gradient(to bottom, rgba(255,107,53,0.35), rgba(255,107,53,0.03))",
                }}
              />
              <div className="flex flex-col gap-11">
                {STEPS.map((s, i) => (
                  <div key={s.num} className={`flex gap-6 items-start reveal reveal-d${i + 1}`}>
                    <div
                      className="flex items-center justify-center rounded-full shrink-0 font-bold text-sm z-10"
                      style={{
                        width: 40, height: 40,
                        background: i === 0 ? "#FF6B35" : "#111",
                        border: `1px solid ${i === 0 ? "transparent" : "rgba(255,107,53,0.25)"}`,
                        color: i === 0 ? "white" : "#FF6B35",
                      }}
                    >
                      {s.num}
                    </div>
                    <div className="pt-2.5">
                      <h3 className="font-semibold text-base mb-1.5">{s.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Trust — banda horizontal ───────────────────────────── */}
          <div className="w-full max-w-5xl mx-auto px-6 md:px-12 mt-32 reveal">
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 py-12"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {TRUST.map(({ Icon, title }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background: "rgba(255,107,53,0.1)" }}>
                    <Icon className="h-4 w-4" style={{ color: "#FF6B35" }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ───────────────────────────────────────────────── */}
          <div className="w-full max-w-4xl mx-auto px-6 md:px-12 mt-24 mb-20 reveal">
            <div
              className="rounded-3xl p-14 md:p-20 flex flex-col items-center text-center relative overflow-hidden"
              style={{ background: "#0f0f0f", border: "1px solid rgba(255,107,53,0.15)" }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(255,107,53,0.12) 0%, transparent 60%)" }}
              />
              <h2 className="relative text-2xl md:text-4xl font-bold mb-4" style={{ letterSpacing: "-0.02em" }}>
                ¿Listo para tu próximo proyecto?
              </h2>
              <p className="relative text-sm mb-9 max-w-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Crea tu cuenta y reserva tu primer artista hoy. Sin costo de entrada.
              </p>
              <Link
                href="/register"
                className="relative inline-flex items-center gap-2 rounded-full px-9 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#FF6B35", boxShadow: "0 0 48px rgba(255,107,53,0.35)" }}
              >
                Empezar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>

      </div>
      <PiumsCinematicFooter
        heading="¿Listo para encontrar tu artista?"
        ctaPrimary={{ label: "Explorar artistas", href: "/login" }}
        ctaSecondary={{ label: "¿Eres artista? Únete gratis", href: `${ARTIST_APP_URL}/register/artist` }}
        appIosHref={process.env.NEXT_PUBLIC_CLIENT_APP_IOS || "#"}
        appAndroidHref={process.env.NEXT_PUBLIC_CLIENT_APP_ANDROID || "#"}
        crosslinkHref={`${ARTIST_APP_URL}/register/artist`}
        crosslinkLabel="¿Eres artista? Únete a Piums"
      />
    </>
  );
}
