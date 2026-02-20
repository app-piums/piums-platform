import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
