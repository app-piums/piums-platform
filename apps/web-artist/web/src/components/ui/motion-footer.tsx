"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUp } from "lucide-react";

const STYLES = `
  @keyframes piums-footer-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .piums-footer-marquee { animation: piums-footer-marquee 30s linear infinite; }
  @keyframes piums-aurora {
    0%,100% { opacity:.45; transform:translate(-50%,-50%) scale(1); }
    50%      { opacity:.75; transform:translate(-50%,-50%) scale(1.2); }
  }
  .piums-aurora { animation: piums-aurora 8s ease-in-out infinite; }
  @keyframes piums-heartbeat {
    0%,100% { transform:scale(1); }
    50%      { transform:scale(1.35); }
  }
  .piums-heartbeat { animation: piums-heartbeat 1.8s ease-in-out infinite; display:inline-block; }
`;

const MARQUEE_ITEMS = [
  "Fotografía", "Música en vivo", "Animadores", "Creadores de Contenido",
  "Video", "Economía Naranja", "Guatemala",
  "Fotografía", "Música en vivo", "Animadores", "Creadores de Contenido",
  "Video", "Economía Naranja", "Guatemala",
];

// La web de artista no tiene páginas legales/institucionales propias; se sirven
// desde piums.io (fuente única). Enlaces absolutos para no 404-ear en artist.piums.io.
const NAV_LINKS = [
  { label: "Privacidad",  href: "https://piums.io/privacidad" },
  { label: "Términos",    href: "https://piums.io/terminos" },
  { label: "Contacto",    href: "https://piums.io/contacto" },
  { label: "Nosotros",    href: "https://piums.io/nosotros" },
];

interface Props {
  heading: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  appIosHref?: string;
  appAndroidHref?: string;
  crosslinkHref: string;
  crosslinkLabel: string;
  logoSrc?: string;
}

export function PiumsCinematicFooter({
  heading,
  ctaPrimary,
  ctaSecondary,
  appIosHref = "#",
  appAndroidHref = "#",
  crosslinkHref,
  crosslinkLabel,
  logoSrc = "/logo-color.png",
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapperRef, { once: true, margin: "-5%" });
  const headingInView = useInView(headingRef, { once: true, margin: "-5%" });

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start end", "end end"],
  });

  const giantY       = useTransform(scrollYProgress, [0, 1], ["12vh", "0vh"]);
  const giantOpacity = useTransform(scrollYProgress, [0, 0.55], [0, 1]);
  const giantScale   = useTransform(scrollYProgress, [0, 1], [0.78, 1]);
  const logoParallaxY = useTransform(scrollYProgress, [0, 1], ["8%", "-4%"]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div
      ref={wrapperRef}
      className="relative w-full overflow-hidden"
      style={{ background: "#050505", borderTop: "1px solid rgba(255,255,255,0.04)", minHeight: "100vh" }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Footer background image */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 0, y: logoParallaxY }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/FOOTER.png"
          alt=""
          fill
          style={{ objectFit: "cover", objectPosition: "center bottom", opacity: 0.35 }}
          unoptimized
        />
      </motion.div>

      {/* Aurora glow */}
      <div
        className="piums-aurora pointer-events-none absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: "72vw",
          height: "52vh",
          background:
            "radial-gradient(ellipse, rgba(255,107,53,0.13) 0%, rgba(20,184,166,0.06) 55%, transparent 80%)",
          filter: "blur(70px)",
          zIndex: 0,
        }}
      />

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          zIndex: 0,
        }}
      />

      {/* Giant PIUMS scroll-parallax text */}
      <motion.div
        style={{ y: giantY, opacity: giantOpacity, scale: giantScale }}
        className="pointer-events-none select-none absolute bottom-[6vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0"
      >
        <span
          style={{
            fontSize: "clamp(7rem, 22vw, 20rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,107,53,0.18)",
            lineHeight: 1,
          }}
        >
          PIUMS
        </span>
      </motion.div>

      <div className="relative z-10 flex flex-col" style={{ minHeight: "100vh" }}>
        {/* Marquee strip */}
        <div
          className="overflow-hidden"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "14px 0" }}
        >
          <div className="piums-footer-marquee flex w-max gap-10">
            {MARQUEE_ITEMS.map((item, i) => (
              <span
                key={i}
                className="text-xs font-bold tracking-[0.28em] uppercase flex items-center gap-4"
                style={{ color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}
              >
                {item}
                <span style={{ color: "rgba(255,107,53,0.5)" }}>✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Main center content */}
        <div
          ref={headingRef}
          className="flex flex-1 flex-col items-center justify-center text-center px-6 py-20"
        >
          <motion.h2
            initial={{ y: 48, opacity: 0 }}
            animate={headingInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="font-black tracking-tighter text-white mb-12"
            style={{
              fontSize: "clamp(2.6rem, 7vw, 6rem)",
              lineHeight: 1.05,
              maxWidth: "20ch",
            }}
          >
            {heading}
          </motion.h2>

          {/* Primary CTA pills */}
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={headingInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.85, delay: 0.15, ease: "easeOut" }}
            className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 mb-8"
          >
            <Link
              href={ctaPrimary.href}
              className="inline-flex items-center gap-2.5 rounded-full px-10 py-5 font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: "#FF6B35", boxShadow: "0 0 60px rgba(255,107,53,0.28)" }}
            >
              {ctaPrimary.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ctaSecondary.href}
              className="inline-flex items-center gap-2.5 rounded-full px-10 py-5 font-bold text-sm transition-opacity hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {ctaSecondary.label}
            </Link>
          </motion.div>

          {/* App store links */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={headingInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.28, ease: "easeOut" }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            <a
              href={appIosHref}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.87.67 3.55 1.76-3.13 1.77-2.62 5.92.35 7.14-.65 1.58-1.57 3.1-2.57 4.03zm-3.21-14.7c-.55 1.4-1.89 2.37-3.25 2.28.09-1.5 1.05-2.82 2.38-3.4 1.25-.57 2.66-.41 3.25.04-.15.35-.26.72-.38 1.08z" />
              </svg>
              App Store
            </a>
            <a
              href={appAndroidHref}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.52 15.34c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-11.05 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m11.4-6.02l2-3.46a.42.42 0 00-.15-.57.42.42 0 00-.57.15l-2.02 3.5C15.59 8.24 13.85 7.85 12 7.85c-1.85 0-3.59.39-5.14 1.1L4.84 5.45a.42.42 0 00-.57-.15.42.42 0 00-.15.57l2 3.46C2.69 11.19.34 14.66 0 18.76h24c-.34-4.1-2.69-7.57-6.12-9.44" />
              </svg>
              Google Play
            </a>
          </motion.div>

          {/* Secondary nav pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={headingInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {NAV_LINKS.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-full px-5 py-2 text-xs font-medium transition-colors hover:text-white"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {n.label}
              </Link>
            ))}
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-5 px-6 md:px-12 py-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Logo + copyright */}
          <div className="flex items-center gap-4">
            <Image src={logoSrc} alt="Piums" width={64} height={20} className="h-5 w-auto" />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              © 2026 Piums · Todos los derechos reservados
            </span>
          </div>

          {/* Right actions */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={crosslinkHref}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ border: "1px solid rgba(255,107,53,0.28)", color: "#FF6B35" }}
            >
              {crosslinkLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>

            <button
              onClick={scrollToTop}
              aria-label="Volver arriba"
              className="inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-80 shrink-0"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                width: "36px",
                height: "36px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
