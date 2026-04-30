import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";

const ARTIST_APP_URL = process.env.NEXT_PUBLIC_ARTIST_URL || "http://127.0.0.1:3001";

const CATEGORIES = [
  {
    name: "Fotografía",
    desc: "Bodas, eventos, retratos y más",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Música",
    desc: "Bandas, cantantes, tríos",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  {
    name: "DJ",
    desc: "Fiestas, bodas, eventos corporativos",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  {
    name: "Diseño Gráfico",
    desc: "Branding, ilustración, identidad visual",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Video",
    desc: "Bodas, publicidad, documentales",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Arte & Performance",
    desc: "Pintores, performers, artistas escénicos",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    num: "01",
    title: "Busca tu artista",
    desc: "Explora perfiles, portafolios y precios. Filtra por categoría, ciudad y disponibilidad.",
  },
  {
    num: "02",
    title: "Reserva con un clic",
    desc: "Elige fecha, hora y servicio. El pago en Quetzales queda protegido hasta que confirmen.",
  },
  {
    num: "03",
    title: "Disfruta el resultado",
    desc: "El artista se presenta, entrega su trabajo y tú dejas una reseña. Simple y seguro.",
  },
];

export default function Home() {
  return (
    <>
      <div className="flex min-h-screen flex-col bg-white dark:bg-black">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-100 dark:border-zinc-900">
          <Image
            src="/logo.png"
            alt="Piums"
            width={36}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[#FF6A00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e05e00] transition-colors"
            >
              Registrarse gratis
            </Link>
          </div>
        </nav>

        <main className="flex flex-1 flex-col items-center px-6 pt-20 pb-16">

          {/* Hero */}
          <div className="flex flex-col items-center text-center max-w-3xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/5 px-4 py-1.5 text-xs font-medium text-[#FF6A00]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
              </svg>
              Economía Naranja — Guatemala
            </span>

            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              El talento creativo de Guatemala,<br />
              <span className="text-[#FF6A00]">a tu alcance</span>
            </h1>

            <p className="mt-6 max-w-md text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Contrata artistas verificados para tu boda, evento, empresa o proyecto personal.
              Todo en Quetzales, todo con garantía.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/artists"
                className="rounded-full bg-[#FF6A00] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#e05e00] transition-colors shadow-lg shadow-[#FF6A00]/25"
              >
                Explorar artistas
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-zinc-200 bg-white px-8 py-3.5 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Crear cuenta gratis
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Artistas verificados
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pagos seguros en USD
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reserva en minutos
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="mt-24 w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 text-center mb-2">Explora por categoría</h2>
            <p className="text-sm text-zinc-500 text-center mb-10">Encuentra el artista perfecto para cada ocasión</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/artists?category=${cat.name.toUpperCase().replace(/\s/g, '_')}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 hover:border-[#FF6A00]/40 hover:bg-[#FF6A00]/5 transition-all"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#FF6A00] group-hover:bg-[#FF6A00]/10 transition-colors">
                    {cat.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">{cat.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{cat.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Cómo funciona */}
          <div className="mt-24 w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 text-center mb-2">¿Cómo funciona?</h2>
            <p className="text-sm text-zinc-500 text-center mb-12">De la idea al resultado en 3 pasos</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {STEPS.map((s) => (
                <div key={s.num} className="flex flex-col gap-3">
                  <span className="font-mono text-3xl font-bold text-[#FF6A00] opacity-40">{s.num}</span>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA final */}
          <div className="mt-20 w-full max-w-4xl rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">¿Listo para tu primer proyecto?</h2>
              <p className="mt-1 text-sm text-zinc-500">Crea tu cuenta y reserva tu primer artista hoy.</p>
            </div>
            <Link
              href="/register"
              className="shrink-0 rounded-full bg-[#FF6A00] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#e05e00] transition-colors shadow-lg shadow-[#FF6A00]/25"
            >
              Empezar ahora
            </Link>
          </div>
        </main>

        {/* Footer for artists */}
        <div className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 px-8 py-6">
          <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
            <span>¿Eres artista? Ofrece tus servicios en PIUMS</span>
            <a
              href={`${ARTIST_APP_URL}/register/artist`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2 font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <svg className="h-4 w-4 text-[#FF6A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
              Ir a Piums for Artists
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

