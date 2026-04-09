'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { ThemeToggle } from '@/contexts/ThemeContext';

/* ─── Categorías de interés ─────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'live-music',      label: 'Música en Vivo',       subtitle: 'Bandas, solistas, acústico',           icon: MicIcon      },
  { id: 'dj',              label: 'DJs & Electrónica',    subtitle: 'Fiestas, clubs, bodas',                icon: SoundwaveIcon},
  { id: 'photography',     label: 'Fotografía',            subtitle: 'Eventos, retratos, bodas',             icon: CameraIcon   },
  { id: 'video',           label: 'Video & Contenido',    subtitle: 'Clips, documentales, redes',           icon: VideoIcon    },
  { id: 'graphic-design',  label: 'Diseño & Branding',    subtitle: 'Flyers, logos, portadas',              icon: PenIcon      },
  { id: 'music-production',label: 'Producción Musical',   subtitle: 'Beats, mezcla, grabación',             icon: MusicIcon    },
  { id: 'dance',           label: 'Danza & Performance',  subtitle: 'Urbano, clásico, shows',               icon: MicIcon      },
  { id: 'tattoo',          label: 'Tatuaje & Body Art',   subtitle: 'Tattoo, piercing, body paint',         icon: PenIcon      },
  { id: 'magic',           label: 'Magia & Entretenimiento', subtitle: 'Ilusionistas, malabaristas, circo',  icon: SoundwaveIcon},
  { id: 'visual-art',      label: 'Arte Visual',          subtitle: 'Pintura, ilustración, escultura',     icon: PenIcon      },
  { id: 'writing',         label: 'Escritura & Letras',   subtitle: 'Letristas, guionistas, contenidos',   icon: MusicIcon    },
  { id: 'makeup',          label: 'Maquillaje & Estilismo', subtitle: 'Bodas, cine, teatro, pasarela',     icon: CameraIcon   },
];

/* ─── Sub-etiquetas por categoría ────────────────────────────────────────── */
const SUBCATEGORIES: Record<string, { sectionLabel: string; tags: string[] }> = {
  'live-music':       { sectionLabel: 'Estilo Musical',           tags: ['Banda de Rock', 'Jazz & Blues', 'Pop Acústico', 'Cantautor', 'Clásica', 'Folklore & Regional'] },
  'dj':               { sectionLabel: 'Géneros & Ocasiones',      tags: ['House & Tech', 'Reggaeton & Urban', 'Pop & Comercial', 'Hip-Hop & Trap', 'DJ para Bodas', 'Festival & Club'] },
  'photography':      { sectionLabel: 'Estilos de Fotografía',    tags: ['Eventos', 'Retratos', 'Editorial', 'Bodas', 'Producto', 'Urbana & Street'] },
  'video':            { sectionLabel: 'Tipos de Video',           tags: ['Clips Musicales', 'Bodas & Celebraciones', 'Redes Sociales', 'Documental', 'Comercial', 'Cortometraje'] },
  'graphic-design':   { sectionLabel: 'Servicios de Diseño',      tags: ['Logo & Identidad', 'Flyers & Carteles', 'Portadas de Álbum', 'Redes Sociales', 'Merch & Textil', 'Cartelería de Evento'] },
  'music-production': { sectionLabel: 'Servicios de Estudio',     tags: ['Beat Making', 'Mezcla & Mastering', 'Grabación en Estudio', 'Composición', 'Arreglos', 'Jingle & Publicidad'] },
  'dance':            { sectionLabel: 'Estilos de Danza',         tags: ['Urbano & Hip-Hop', 'Ballet Clásico', 'Contemporáneo', 'Latino & Salsa', 'Folklore', 'Show & Entretenimiento'] },
  'tattoo':           { sectionLabel: 'Tipos de Tattoo & Art',    tags: ['Realismo', 'Geométrico', 'Minimalista', 'Neo-Tradicional', 'Line Art', 'Color & Acuarela'] },
  'magic':            { sectionLabel: 'Tipos de Show',            tags: ['Magia de Cerca', 'Gran Ilusionismo', 'Malabares', 'Acrobacia', 'Circo', 'Fuego & Pirotecnia'] },
  'visual-art':       { sectionLabel: 'Tipo de Arte',             tags: ['Pintura al Óleo', 'Acuarela', 'Ilustración Digital', 'Mural', 'Escultura', 'Arte Urbano'] },
  'writing':          { sectionLabel: 'Tipo de Escritura',        tags: ['Letras de Canción', 'Guiones', 'Copywriting', 'Poesía', 'Contenidos Web', 'Libros & Narrativa'] },
  'makeup':           { sectionLabel: 'Especialidad',             tags: ['Maquillaje de Bodas', 'Cine & Teatro', 'Efectos Especiales FX', 'Pasarela & Moda', 'Caracterización', 'Nail Art'] },
};

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function ClientOnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Record<string, Set<string>>>({});

  /* ── helpers ── */
  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTag = (catId: string, tag: string) => {
    setSelectedTags(prev => {
      const catSet = new Set(prev[catId] ?? []);
      if (catSet.has(tag)) {
        catSet.delete(tag);
      } else {
        catSet.add(tag);
      }
      return { ...prev, [catId]: catSet };
    });
  };

  const handleFinish = () => {
    // Guardar preferencias en localStorage para uso futuro
    localStorage.setItem('piums_onboarding_done', '1');
    localStorage.setItem('piums_interests', JSON.stringify({
      categories: [...selectedCategories],
      tags: Object.fromEntries(
        Object.entries(selectedTags).map(([k, v]) => [k, [...v]])
      ),
    }));
    // Marcar onboarding como completado en cookie para el middleware
    document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=strict';
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {step === 1 && <StepWelcome onStart={() => setStep(2)} />}
      {step === 2 && (
        <StepInterests
          selected={selectedCategories}
          onToggle={toggleCategory}
          onContinue={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepRefine
          categories={[...selectedCategories]}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onFinish={handleFinish}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STEP 1 — Welcome
   ════════════════════════════════════════════════════════════════════════════ */
function StepWelcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-[#0F172A] dark:via-[#1E293B]/40 dark:to-[#0F172A] piums-fade-in">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 pt-8">
        <PiumsLogo />
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <div className="max-w-5xl w-full flex gap-16 items-center">
          {/* Left */}
          <div className="flex-1 max-w-lg">
            <span className="text-xs font-semibold tracking-widest text-[#FF6A00] uppercase mb-4 block">
              Bienvenida · Paso 1
            </span>
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Bienvenido a{' '}
              <span className="text-[#FF6A00]">PIUMS</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-10">
              El ecosistema donde el talento creativo encuentra oportunidades.
              Conecta con músicos, diseñadores y visionarios de clase mundial.
            </p>

            <div className="flex items-center gap-4 mb-12">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 bg-[#FF6A00] hover:bg-[#e55e00] text-white font-semibold px-7 py-3.5 rounded-full transition-colors shadow-lg shadow-orange-200"
              >
                Comenzar
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=strict';
                  window.location.href = '/dashboard';
                }}
                className="text-gray-500 hover:text-gray-800 font-medium transition-colors"
              >
                Omitir
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['from-rose-400 to-pink-600', 'from-violet-400 to-purple-600', 'from-amber-400 to-orange-500'].map((g, i) => (
                  <div
                    key={i}
                    className={`h-9 w-9 rounded-full bg-gradient-to-br ${g} border-2 border-white dark:border-[#1E293B] flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {['A', 'B', 'C'][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400">
                Más de <span className="font-semibold text-gray-700">10,000</span> creativos ya crecen con nosotros
              </p>
            </div>
          </div>

          {/* Right — floating cards */}
          <div className="hidden lg:flex flex-1 relative justify-center items-center h-96">
            {/* Main artist card */}
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-56 z-10">
              <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Subtle guitar silhouette */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/20 text-7xl">🎸</div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900 text-sm">Carlos M.</p>
                <p className="text-xs text-gray-400">Live Music · Medellín</p>
                <div className="flex items-center gap-1 mt-1">
                  <StarFilledIcon className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-gray-700">4.9</span>
                </div>
              </div>
            </div>

            {/* Secondary card — audio wave */}
            <div className="absolute -top-4 right-4 bg-[#FF6A00] rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg shadow-orange-300/50 z-20">
              <SoundwaveIcon className="h-8 w-8 text-white" />
            </div>

            {/* Floating profile badge */}
            <div className="absolute -bottom-4 right-8 bg-white rounded-xl shadow-xl px-4 py-2.5 flex items-center gap-2.5 z-20">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Red Profesional</p>
                <p className="text-[10px] text-gray-400">+12k artistas verificados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 pb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`rounded-full transition-all ${i === 1 ? 'w-6 h-2 bg-[#FF6A00]' : 'w-2 h-2 bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STEP 2 — Tell us what you're into
   ════════════════════════════════════════════════════════════════════════════ */
function StepInterests({
  selected,
  onToggle,
  onContinue,
  onBack,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col px-6 py-8 max-w-2xl mx-auto w-full piums-fade-in">
      {/* Top */}
      <div className="flex items-center justify-between mb-8">
        <PiumsLogo />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-medium">{'Paso 2 de 3'}</span>
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full mb-10 overflow-hidden">
        <div className="h-full bg-[#FF6A00] rounded-full" style={{ width: '66%' }} />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">{'Cuéntanos qué te apasiona'}</h2>
      <p className="text-gray-400 mb-8 leading-relaxed">
        {'Selecciona las áreas creativas que te interesan explorar. Esto nos ayuda a personalizar tu feed.'}
      </p>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {CATEGORIES.map(({ id, label, subtitle, icon: Icon }) => {
          const active = selected.has(id);
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={`relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all ${
                active
                  ? 'border-[#FF6A00] bg-[#FF6A00]/5'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
              }`}
            >
              {active && (
                <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-[#FF6A00] flex items-center justify-center">
                  <CheckIcon className="h-3 w-3 text-white" />
                </span>
              )}
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${active ? 'bg-[#FF6A00]' : 'bg-white border border-gray-200'}`}>
                <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <span className="text-sm font-semibold text-gray-900">{label}</span>
              <span className="text-xs text-gray-400 leading-tight mt-0.5">{subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <button
        onClick={onContinue}
        disabled={selected.size === 0}
        className="w-full py-3.5 rounded-full font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#FF6A00] hover:bg-[#e55e00] text-white shadow-lg shadow-orange-200/50"
      >
        Continuar →
      </button>
      <button
        onClick={() => {
          document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=strict';
          window.location.href = '/dashboard';
        }}
        className="mt-3 text-sm text-gray-400 hover:text-gray-600 text-center w-full transition-colors"
      >
        Omitir por ahora
      </button>

      {/* Step dots */}
      <div className="flex justify-center gap-2 mt-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`rounded-full transition-all ${i === 2 ? 'w-6 h-2 bg-[#FF6A00]' : 'w-2 h-2 bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STEP 3 — Refine your taste
   ════════════════════════════════════════════════════════════════════════════ */
function StepRefine({
  categories,
  selectedTags,
  onToggleTag,
  onFinish,
  onBack,
}: {
  categories: string[];
  selectedTags: Record<string, Set<string>>;
  onToggleTag: (catId: string, tag: string) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  // Si no seleccionó categorías, mostrar todas
  const toShow = categories.length > 0 ? categories : CATEGORIES.map(c => c.id);

  return (
    <div className="flex-1 flex flex-col px-6 py-8 max-w-2xl mx-auto w-full piums-fade-in">
      {/* Top */}
      <div className="flex items-center justify-between mb-8">
        <PiumsLogo />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-medium">{'Paso 3 de 3'}</span>
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full mb-10 overflow-hidden">
        <div className="h-full bg-[#FF6A00] rounded-full w-full" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">{'Afina tus gustos.'}</h2>
      <p className="text-gray-400 mb-8 leading-relaxed">
        {'Ayúdanos a personalizar tu feed eligiendo géneros y estilos específicos que más te inspiran.'}
      </p>

      {/* Sections */}
      <div className="space-y-4 mb-10 overflow-y-auto max-h-[440px] pr-1">
        {toShow.map(catId => {
          const sub = SUBCATEGORIES[catId];
          if (!sub) return null;
          const catInfo = CATEGORIES.find(c => c.id === catId);
          const Icon = catInfo?.icon ?? MusicIcon;
          const activeTags = selectedTags[catId] ?? new Set();
          const activeCount = activeTags.size;
          return (
            <div key={catId} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              {/* Category header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 leading-none mb-0.5">{catInfo?.label}</p>
                    <p className="text-sm font-semibold text-gray-800 leading-none">{sub.sectionLabel}</p>
                  </div>
                </div>
                {activeCount > 0 && (
                  <span className="text-xs font-semibold bg-[#FF6A00] text-white rounded-full px-2 py-0.5">
                    {activeCount}
                  </span>
                )}
              </div>
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {sub.tags.map(tag => {
                  const active = activeTags.has(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => onToggleTag(catId, tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active
                          ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-sm shadow-orange-200/60'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-[#FF6A00] hover:text-[#FF6A00]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={onFinish}
        className="w-full py-3.5 rounded-full font-semibold text-sm bg-[#FF6A00] hover:bg-[#e55e00] text-white shadow-lg shadow-orange-200/50 transition-colors"
      >
        Ir a mi Dashboard →
      </button>
      <button
        onClick={() => {
          document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=strict';
          window.location.href = '/dashboard';
        }}
        className="mt-3 text-sm text-gray-400 hover:text-gray-600 text-center w-full transition-colors"
      >
        Omitir por ahora
      </button>
      <p className="mt-3 text-xs text-center text-gray-400">
        Puedes cambiar estas preferencias en cualquier momento desde Configuración.
      </p>

      {/* Step dots */}
      <div className="flex justify-center gap-2 mt-6">
        {[1, 2, 3].map(i => (
          <div key={i} className={`rounded-full transition-all ${i === 3 ? 'w-6 h-2 bg-[#FF6A00]' : 'w-2 h-2 bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Shared UI
   ════════════════════════════════════════════════════════════════════════════ */
function PiumsLogo() {
  return <Image src="/logo.png" alt="PIUMS" width={32} height={32} className="h-8 w-auto" />;
}

/* ─── Icons (inline SVG para no depender de librerías) ───────────────────── */
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
    </svg>
  );
}
function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}
function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}
function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}
function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  );
}
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
function SoundwaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6M12 5v14M6 10v4M3 12h.01M15 8v8M18 10v4M21 12h.01" />
    </svg>
  );
}
