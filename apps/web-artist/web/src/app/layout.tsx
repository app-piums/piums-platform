import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { QueryProvider } from "../providers/QueryProvider";
import { PWAInitializer } from "../components/PWAInitializer";
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
  title: "Piums - Plataforma de Servicios de Artistas",
  description: "Conecta con artistas profesionales para tus eventos. Reserva músicos, DJs, fotógrafos y más.",
  keywords: "artistas, eventos, reservas, música, entretenimiento",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Piums",
  },
  openGraph: {
    title: "Piums - Plataforma de Servicios de Artistas",
    description: "Conecta con artistas profesionales para tus eventos",
    type: "website",
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
        <meta name="theme-color" content="#FF6B35" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Piums" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        
        {/* Theme initialization script */}
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
        
        {/* CRITICAL: Unregister Service Workers IMMEDIATELY to prevent port caching */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  console.log('[CRITICAL] Unregistering SW:', registration.scope);
                  registration.unregister();
                }
              });
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <NextStepProvider>
                <NextStepWrapper>
                  {children}
                </NextStepWrapper>
              </NextStepProvider>
              <PWAInitializer />
              <SessionWarningToast />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
