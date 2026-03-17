import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { useTranslation } from "next-i18next";

const ARTIST_APP_URL = process.env.NEXT_PUBLIC_ARTIST_APP_URL || "http://127.0.0.1:3001";

export default function Home() {
  const { t } = useTranslation('home');
  return (
    <>
      <div className="flex min-h-screen flex-col bg-white dark:bg-black">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-100 dark:border-zinc-900">
          <Image
            src="/logo.jpg"
            alt="Piums"
            width={120}
            height={40}
            className="h-9 w-auto"
            priority
          />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
            >
              {t('login', 'Iniciar sesión')}
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {t('register', 'Registrarse gratis')}
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/5 px-4 py-1.5 text-xs font-medium text-[#FF6A00]">
            🎵 {t('hero')}
          </span>

          <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            {t('title')}
          </h1>

          <p className="mt-6 max-w-md text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t('description')}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="rounded-full bg-[#FF6A00] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#e05e00] transition-colors shadow-lg shadow-[#FF6A00]/25"
            >
              {t('startFree')}
            </Link>
            <Link
              href="/artists"
              className="rounded-full border border-zinc-200 bg-white px-8 py-3.5 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {t('exploreArtists')}
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t('securePayment')}
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('verifiedArtists')}
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('bookInMinutes')}
            </div>
          </div>
        </main>

        {/* Footer para artistas - estilo Spotify for Artists */}
        <div className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 px-8 py-6">
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
            <span>{t('artistFooter')}</span>
            <a
              href={`${ARTIST_APP_URL}/register`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2 font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              Ir a Piums for Artists
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

