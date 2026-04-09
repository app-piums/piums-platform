import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { headers } from "next/headers";

const DISCIPLINES = [
  "Músico", "Fotógrafo", "DJ", "Diseñador gráfico",
  "Videógrafo", "Maquillador", "Tatuador", "Performer",
];

const STEPS = [
  {
    num: "01",
    title: "Crea tu perfil",
    desc: "Publica tus servicios, precios y disponibilidad en minutos. Sin costo de entrada.",
  },
  {
    num: "02",
    title: "Recibe reservas",
    desc: "Los clientes te descubren, eligen fecha y pagan directamente en la plataforma.",
  },
  {
    num: "03",
    title: "Cobra en Quetzales",
    desc: "El pago llega a tu cuenta al completar el servicio. Seguro, sin comisiones ocultas.",
  },
];

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3001';
  const hostname = host.split(':')[0];
  const CLIENT_APP_URL = process.env.NEXT_PUBLIC_CLIENT_URL || `http://${hostname}:3000`;

  return (
    <>
      <div className="flex min-h-screen flex-col bg-zinc-950">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
          <Image
            src="/logo.png"
            alt="Piums for Artists"
            width={36}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register/artist"
              className="rounded-full bg-[#FF6A00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e05e00] transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center px-6 pt-20 pb-12 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF6A00]/40 bg-[#FF6A00]/10 px-4 py-1.5 text-xs font-medium text-[#FF6A00]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
            </svg>
            La plataforma para artistas de Guatemala
          </span>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-zinc-50 leading-tight">
            Tu talento merece<br />
            <span className="text-[#FF6A00]">clientes que te valoren</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg text-zinc-400 leading-relaxed">
            Gestiona reservas, agenda y cobros en Quetzales desde un solo lugar.
            Para músicos, fotógrafos, diseñadores, DJs y más.
          </p>

          {/* Discipline pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl">
            {DISCIPLINES.map((d) => (
              <span key={d} className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
                {d}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/register/artist"
              className="rounded-full bg-[#FF6A00] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#e05e00] transition-colors shadow-lg shadow-[#FF6A00]/30"
            >
              Crear mi perfil — es gratis
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>

          {/* Feature cards */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl text-left w-full">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6A00]/10">
                <svg className="h-5 w-5 text-[#FF6A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-50 mb-1">Gestiona tu agenda</h3>
              <p className="text-sm text-zinc-500">Acepta o rechaza reservas. Controla tu disponibilidad con un calendario propio.</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6A00]/10">
                <svg className="h-5 w-5 text-[#FF6A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-50 mb-1">Llega a más clientes</h3>
              <p className="text-sm text-zinc-500">Tu perfil aparece en búsquedas de clientes que buscan artistas como tú.</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6A00]/10">
                <svg className="h-5 w-5 text-[#FF6A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-50 mb-1">Cobra en Quetzales</h3>
              <p className="text-sm text-zinc-500">Pagos seguros y directos en GTQ. Sin efectivo, sin riesgos, sin intermediarios.</p>
            </div>
          </div>

          {/* Cómo funciona */}
          <div className="mt-24 w-full max-w-3xl">
            <h2 className="text-2xl font-bold text-zinc-50 mb-2">¿Cómo funciona?</h2>
            <p className="text-sm text-zinc-500 mb-10">Empieza a generar ingresos con tu talento en 3 pasos</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
              {STEPS.map((s) => (
                <div key={s.num} className="flex flex-col gap-3">
                  <span className="font-mono text-3xl font-bold text-[#FF6A00] opacity-50">{s.num}</span>
                  <h3 className="font-semibold text-zinc-50">{s.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-10 flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-zinc-50">¿Listo para crecer?</h2>
            <p className="max-w-sm text-center text-sm text-zinc-500">
              Únete a los artistas guatemaltecos que ya gestionan su negocio con PIUMS.
            </p>
            <Link
              href="/register/artist"
              className="rounded-full bg-[#FF6A00] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#e05e00] transition-colors shadow-lg shadow-[#FF6A00]/30"
            >
              Unirme a la comunidad
            </Link>
          </div>
        </main>

        {/* Footer para clientes */}
        <div className="border-t border-zinc-800 bg-zinc-900 px-8 py-6">
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
            <span>¿Buscas artistas para tu próximo evento?</span>
            <a
              href={CLIENT_APP_URL}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-5 py-2 font-medium text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explorar artistas en Piums
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

