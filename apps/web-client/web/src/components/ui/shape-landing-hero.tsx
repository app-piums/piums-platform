"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: "easeOut",
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute pointer-events-none", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.08]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.04)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

function FadeUp({
  delay,
  children,
  className,
}: {
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ animation: `fade-up 0.9s ease-out ${delay}s both` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function HeroPiums({
  badge,
  headline,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  perks = [],
  logoSrc = "/logo-color.png",
}: {
  badge: string;
  headline: React.ReactNode;
  subtitle: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  perks?: string[];
  logoSrc?: string;
}) {
  return (
    <section
      className="relative w-full pt-16 pb-24 flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: "82vh" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% -10%, rgba(255,107,53,0.09) 0%, transparent 60%)",
        }}
      />

      {/* Floating shapes — Piums discipline colors */}
      <ElegantShape delay={0.2} width={580} height={130} rotate={12} gradient="from-[#FF6B35]/[0.11]" className="left-[-8%] top-[18%]" />
      <ElegantShape delay={0.45} width={460} height={108} rotate={-15} gradient="from-[#14B8A6]/[0.11]" className="right-[-4%] top-[58%]" />
      <ElegantShape delay={0.3} width={270} height={68} rotate={-8} gradient="from-[#A855F7]/[0.11]" className="left-[4%] bottom-[12%]" />
      <ElegantShape delay={0.55} width={190} height={52} rotate={22} gradient="from-[#F59E0B]/[0.11]" className="right-[16%] top-[10%]" />
      <ElegantShape delay={0.65} width={130} height={36} rotate={-28} gradient="from-[#3B82F6]/[0.11]" className="left-[20%] top-[6%]" />
      <ElegantShape delay={0.5} width={160} height={44} rotate={18} gradient="from-[#EC4899]/[0.09]" className="right-[8%] bottom-[20%]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto px-6">
        {/* Badge */}
        <FadeUp delay={0.35}>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium mb-5"
            style={{ borderColor: "rgba(255,107,53,0.3)", background: "rgba(255,107,53,0.07)", color: "#FF6B35" }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#FF6B35" }} />
            {badge}
          </div>
        </FadeUp>

        <div
          className="inline-block mb-3 hero-logo-float"
          style={{ animation: `fade-up 0.9s ease-out 0.49s both, hero-logo-float 5s ease-in-out 1.5s infinite` } as CSSProperties}
        >
          <Image
            src={logoSrc}
            alt="Piums"
            width={320}
            height={320}
            className="h-64 sm:h-80 w-auto"
            priority
          />
        </div>

        {/* Headline */}
        <FadeUp delay={0.63}>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] mb-5"
            style={{ letterSpacing: "-0.025em" }}
          >
            {headline}
          </h1>
        </FadeUp>

        {/* Subtitle */}
        <FadeUp delay={0.77}>
          <p
            className="text-base md:text-lg leading-relaxed mb-9 max-w-md"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            {subtitle}
          </p>
        </FadeUp>

        {/* CTAs */}
        <FadeUp delay={0.91}>
          <div className="flex flex-col sm:flex-row gap-3 items-center mb-8">
            <Link
              href={ctaPrimary.href}
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#FF6B35", boxShadow: "0 0 48px rgba(255,107,53,0.32)" }}
            >
              {ctaPrimary.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ctaSecondary.href}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >
              {ctaSecondary.label}
            </Link>
          </div>
        </FadeUp>

        {/* Perks */}
        {perks.length > 0 && (
          <FadeUp delay={1.05}>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {perks.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <Check className="h-3 w-3 shrink-0" style={{ color: "#FF6B35" }} />
                  {p}
                </span>
              ))}
            </div>
          </FadeUp>
        )}
      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{ background: "linear-gradient(to top, #080808, transparent)" }}
      />
    </section>
  );
}

export { HeroPiums, ElegantShape };
