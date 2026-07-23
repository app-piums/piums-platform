import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import { CurrencyProvider } from "../contexts/CurrencyContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { QueryProvider } from "../providers/QueryProvider";
import { PWAInitializer } from "../components/PWAInitializer";
import { I18nProvider } from "../providers/I18nProvider";
import { NextStepProvider } from "nextstepjs";
import { NextStepWrapper } from "../components/NextStepWrapper";
import { SessionWarningToast } from "../components/SessionWarningToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://piums.io"),
  title: "Piums | Reserva fotógrafos, músicos y artistas en Guatemala",
  description:
    "Conecta con fotógrafos, músicos, videógrafos y animadores en Guatemala. Explora perfiles verificados, cotiza y reserva servicios para tus eventos con Piums.",
  keywords:
    "artistas Guatemala, fotógrafos para bodas, músicos para eventos, videógrafos, animadores, reservar artistas, servicios para eventos Guatemala",
  applicationName: "Piums",
  manifest: "/manifest.json",
  robots: { index: true, follow: true },
  other: {
    'tiktok-developers-site-verification': 'N0gsVgRuu2gFzosWOzjbgTcl7vtYOPGP',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Piums",
  },
  openGraph: {
    type: "website",
    siteName: "Piums",
    locale: "es_GT",
    title: "Piums | Reserva fotógrafos, músicos y artistas en Guatemala",
    description:
      "Conecta con fotógrafos, músicos, videógrafos y animadores en Guatemala. Explora perfiles verificados, cotiza y reserva servicios para tus eventos.",
    images: [{ url: "/FOOTER.png", width: 1747, height: 900, alt: "Piums — artistas y profesionales creativos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Piums | Reserva fotógrafos, músicos y artistas en Guatemala",
    description:
      "Conecta con fotógrafos, músicos, videógrafos y animadores en Guatemala. Reserva servicios para tus eventos.",
    images: ["/FOOTER.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* TikTok domain verification */}
        <meta name="tiktok-developers-site-verification" content="N0gsVgRuu2gFzosWOzjbgTcl7vtYOPGP" />
        <meta name="theme-color" content="#FF6B35" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Piums" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            })()
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <span style={{ display: 'none' }}>tiktok-developers-site-verification=N0gsVgRuu2gFzosWOzjbgTcl7vtYOPGP</span>
        <ThemeProvider>
          <I18nProvider>
            <QueryProvider>
              <CurrencyProvider>
              <AuthProvider>
                <FavoritesProvider>
                  <NextStepProvider>
                    <NextStepWrapper>
                      {children}
                    </NextStepWrapper>
                  </NextStepProvider>
                  <PWAInitializer />
                </FavoritesProvider>
                <SessionWarningToast />
              </AuthProvider>
              </CurrencyProvider>
            </QueryProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
