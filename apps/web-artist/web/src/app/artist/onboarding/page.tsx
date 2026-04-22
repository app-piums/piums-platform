'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from '@/lib/toast';
import { ThemeToggle } from '@/contexts/ThemeContext';

// Disciplinas creativas disponibles
const creativeDisciplines = [
  { id: 'musician',        name: 'Músico',              subtitle: 'Cantante, Compositor, Banda',    icon: '🎵' },
  { id: 'dj',              name: 'DJ / Productor',      subtitle: 'Electrónica, Beat Maker',        icon: '🎧' },
  { id: 'photographer',    name: 'Fotógrafo',           subtitle: 'Eventos, Retratos, Producto',    icon: '📷' },
  { id: 'filmmaker',       name: 'Videógrafo',          subtitle: 'Clips, Eventos, Comerciales',    icon: '🎬' },
  { id: 'graphic-designer',name: 'Diseñador Gráfico',  subtitle: 'Marca, Flyers, Portadas',        icon: '🎨' },
  { id: 'illustrator',     name: 'Ilustrador',          subtitle: 'Arte digital, Portadas',         icon: '✏️' },
  { id: 'dancer',          name: 'Bailarín / Coreógrafo', subtitle: 'Urbano, Clásico, Show',       icon: '💃' },
  { id: 'mc',              name: 'Animador / MC',       subtitle: 'Bodas, Eventos, Conciertos',     icon: '🎤' },
  { id: 'writer',          name: 'Escritor / Letrista', subtitle: 'Letras, Guiones, Contenidos',   icon: '📝' },
  { id: 'tattooist',       name: 'Tatuador',            subtitle: 'Tattoo, Body Art, Piercing',     icon: '🖋️' },
  { id: 'makeup',          name: 'Maquillador',         subtitle: 'Bodas, Cine, FX, Pasarela',     icon: '💄' },
  { id: 'painter',         name: 'Pintor / Artista',    subtitle: 'Lienzo, Mural, Acuarela',        icon: '🖌️' },
  { id: 'sculptor',        name: 'Escultor',            subtitle: 'Cerámica, Madera, Metal',        icon: '🏺' },
  { id: 'magician',        name: 'Mago / Ilusionista',  subtitle: 'Close-up, Shows, Escenario',     icon: '🪄' },
  { id: 'acrobat',         name: 'Acróbata / Circo',    subtitle: 'Malabares, Aéreos, Fuego',       icon: '🎪' },
  { id: 'other',           name: 'Otro',                subtitle: 'Otro talento creativo',          icon: '⚡' },
];

// Opciones de equipo por disciplina
const EQUIPMENT_BY_DISCIPLINE: Record<string, { section: string; items: string[] }[]> = {
  musician: [
    {
      section: 'Audio',
      items: ['Sistema de sonido (PA) propio', 'Micrófono vocal', 'Micrófono inalámbrico', 'Mixer / consola', 'Monitor de escenario', 'In-ear monitors'],
    },
    {
      section: 'Instrumentos',
      items: ['Guitarra eléctrica', 'Guitarra acústica', 'Bajo', 'Teclado / Piano', 'Batería completa', 'Percusión'],
    },
    {
      section: 'Producción',
      items: ['Sistema de iluminación', 'Efectos de escenario', 'Laptop + software', 'Generador eléctrico'],
    },
  ],
  dj: [
    {
      section: 'Equipo DJ',
      items: ['Controlador DJ', 'CDJ / Platos', 'Mixer DJ', 'Laptop + software', 'Auriculares profesionales'],
    },
    {
      section: 'Audio',
      items: ['Sistema de sonido (PA) propio', 'Monitor de escenario', 'Subwoofer'],
    },
    {
      section: 'Iluminación / Efectos',
      items: ['Luces LED / PAR', 'Luz estroboscópica', 'Máquina de humo', 'Proyector / pantalla', 'Laser'],
    },
  ],
  photographer: [
    {
      section: 'Cámara y óptica',
      items: ['Cámara DSLR / Mirrorless', 'Lentes adicionales (teleobjetivo, gran angular)', 'Cámara de respaldo'],
    },
    {
      section: 'Iluminación',
      items: ['Flash externo', 'Iluminación de estudio (softbox)', 'Reflector / difusor'],
    },
    {
      section: 'Accesorios',
      items: ['Trípode', 'Gimbal / estabilizador', 'Fondo portátil', 'Drone'],
    },
  ],
  filmmaker: [
    {
      section: 'Cámara y video',
      items: ['Cámara de video 4K', 'Cámara DSLR / Mirrorless', 'Drone', 'Cámara 360°'],
    },
    {
      section: 'Estabilización',
      items: ['Gimbal / estabilizador', 'Trípode', 'Slider / dolly', 'Monitor de campo'],
    },
    {
      section: 'Audio',
      items: ['Micrófono de cañón', 'Lavalier inalámbrico', 'Grabadora de audio'],
    },
    {
      section: 'Iluminación',
      items: ['LED de entrevista', 'Panel de luz portátil', 'Reflector'],
    },
  ],
  dancer: [
    {
      section: 'Escenario',
      items: ['Vestuario propio', 'Pista portátil de baile', 'Props / accesorios coreográficos'],
    },
    {
      section: 'Audio',
      items: ['Equipo de sonido portátil', 'Bluetooth Speaker', 'Micrófono inalámbrico'],
    },
    {
      section: 'Iluminación',
      items: ['Luces portátiles de escenario'],
    },
  ],
  acrobat: [
    {
      section: 'Equipo de acrobacia',
      items: ['Vestuario propio', 'Props de malabares', 'Equipo de telas aéreas', 'Colchonetas / seguridad', 'Arco de fuego / torches'],
    },
    {
      section: 'Sonido',
      items: ['Sistema de sonido portátil'],
    },
  ],
  mc: [
    {
      section: 'Audio',
      items: ['Micrófono inalámbrico', 'Sistema de sonido propio', 'Micrófonos adicionales para invitados'],
    },
    {
      section: 'Visual',
      items: ['Proyector / pantalla', 'Luces de fiesta', 'Máquina de humo / burbujas'],
    },
  ],
  magician: [
    {
      section: 'Escenario',
      items: ['Vestuario escénico', 'Mesa de magia', 'Props de magia escénica', 'Props de close-up'],
    },
    {
      section: 'Técnica',
      items: ['Sistema de sonido portátil', 'Iluminación de escenario'],
    },
  ],
  makeup: [
    {
      section: 'Equipamiento',
      items: ['Kit de maquillaje profesional', 'Pinceles profesionales', 'Silla / sillón portátil', 'Luces de maquillaje'],
    },
    {
      section: 'Materiales',
      items: ['Maquillaje HD / airbrush', 'Pelucas y postizos', 'Efectos especiales FX'],
    },
  ],
  tattooist: [
    {
      section: 'Equipo de tatuaje',
      items: ['Máquina rotativa', 'Máquina de bobinas', 'Fuente de poder', 'Tintas profesionales', 'Agujas y cartuchos'],
    },
    {
      section: 'Espacio',
      items: ['Camilla portátil', 'Equipo de esterilización / autoclave', 'Luz de trabajo'],
    },
  ],
  painter: [
    {
      section: 'Materiales',
      items: ['Pinturas acrílicas', 'Pinturas al óleo', 'Acuarelas', 'Lienzos', 'Pinceles profesionales'],
    },
    {
      section: 'Equipo',
      items: ['Caballete portátil', 'Proyector para trazos', 'Impresión digital (plotter)'],
    },
  ],
  sculptor: [
    {
      section: 'Materiales',
      items: ['Arcilla / cerámica', 'Madera', 'Metal / soldadura', 'Yeso'],
    },
    {
      section: 'Herramientas',
      items: ['Set de herramientas de escultura', 'Torno portátil', 'Horno de cerámica'],
    },
  ],
  'graphic-designer': [
    {
      section: 'Hardware',
      items: ['Laptop de diseño (MacBook / Surface)', 'Tableta gráfica Wacom / iPad Pro', 'Monitor calibrado'],
    },
    {
      section: 'Software',
      items: ['Adobe Creative Cloud', 'Figma / Sketch', 'Procreate'],
    },
  ],
  illustrator: [
    {
      section: 'Hardware',
      items: ['iPad Pro + Apple Pencil', 'Tableta gráfica Wacom', 'Laptop', 'Scanner profesional'],
    },
    {
      section: 'Materiales',
      items: ['Lápices y marcadores profesionales', 'Gouache / acuarela', 'Tinta china'],
    },
  ],
  writer: [
    {
      section: 'Herramientas',
      items: ['Laptop / computadora', 'Software de escritura (Scrivener, etc.)', 'Grabadora de entrevistas', 'Micrófono de podcast'],
    },
  ],
  other: [
    {
      section: 'General',
      items: ['Equipo propio especializado', 'Materiales incluidos', 'Software / licencias', 'Herramientas profesionales'],
    },
  ],
};

// Opciones de categorías para servicios
const serviceCategories = [
  'Música en vivo',
  'DJ para eventos',
  'Fotografía de eventos',
  'Fotografía de retrato',
  'Videografía y edición',
  'Contenido para redes sociales',
  'Diseño gráfico y branding',
  'Ilustración digital',
  'Escritura y guiones',
  'Baile y coreografía',
  'Animación de eventos',
  'Otro',
];

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2: Creative Superpower
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 3: Equipment (NEW)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Step 4: Portfolio & Profile (was step 4)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [shortBio, setShortBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [extraLinks, setExtraLinks] = useState<string[]>([]);

  // Step 5 or 6: Service Setup (was step 5)
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [availabilityType, setAvailabilityType] = useState<'immediate' | 'quote'>('immediate');

  // Step 7: Tarifa Base
  const [hourlyRateMin, setHourlyRateMin] = useState<number>(0);
  const [hourlyRateMax, setHourlyRateMax] = useState<number>(0);
  const [currency] = useState<'USD'>('USD');
  const [requiresDeposit, setRequiresDeposit] = useState(true);
  const depositPercentage = 50;

  // Step 8: Disponibilidad Semanal
  const [weeklyAvailability, setWeeklyAvailability] = useState([
    { day: 'Lunes',     active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Martes',    active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Miércoles', active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Jueves',    active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Viernes',   active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Sábado',    active: false, startTime: '10:00', endTime: '16:00' },
    { day: 'Domingo',   active: false, startTime: '10:00', endTime: '16:00' },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Identity verification (OAuth only — still step 4 for OAuth, between equipment and portfolio)
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [docFrontPreview, setDocFrontPreview] = useState<string | null>(null);
  const [docBackPreview, setDocBackPreview] = useState<string | null>(null);
  const [docSelfiePreview, setDocSelfiePreview] = useState<string | null>(null);

  // Step numbers:
  // 1 = Welcome
  // 2 = Discipline
  // 3 = Equipment
  // 4 = (deprecated — identity moved to end)
  // 5 = Portfolio & Profile
  // 6 = Service Setup
  // 7 = Rate
  // 8 = Availability
  // 9 = Identity verification (final step, skippable, for ALL users)
  const totalSteps = 8;

  useEffect(() => {
    const provider = sessionStorage.getItem('auth_provider');
    setIsOAuthUser(['google', 'facebook', 'tiktok'].includes(provider ?? ''));

    fetch('/api/artist/profile-check', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=strict';
          router.replace('/artist/dashboard');
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = async () => {
    try {
      await fetch('/api/artist/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category: 'OTRO', specialties: ['OTRO'], equipment: [] }),
      });
    } catch { /* ignore */ }
    document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=strict';
    router.push('/artist/dashboard');
  };

  // Map current step to a "display" step number (skipping the deprecated step 4)
  const displayStep = currentStep <= 3 ? currentStep : currentStep === 9 ? 8 : currentStep - 1;
  const progressPercentage = (displayStep / totalSteps) * 100;

  const filteredDisciplines = creativeDisciplines.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const equipmentSections = EQUIPMENT_BY_DISCIPLINE[selectedDiscipline ?? 'other'] ?? EQUIPMENT_BY_DISCIPLINE['other'];

  const toggleEquipmentItem = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddExtraLink = () => setExtraLinks([...extraLinks, '']);

  const handleDocFileChange = (field: 'front' | 'back' | 'selfie') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (field === 'front') setDocFrontPreview(dataUrl);
      else if (field === 'back') setDocBackPreview(dataUrl);
      else setDocSelfiePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleExtraLinkChange = (index: number, value: string) => {
    const newLinks = [...extraLinks];
    newLinks[index] = value;
    setExtraLinks(newLinks);
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      if (docFrontPreview || docSelfiePreview || docType || docNumber) {
        await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            documentType: docType || undefined,
            documentNumber: docNumber || undefined,
            documentFrontUrl: docFrontPreview || undefined,
            documentBackUrl: docBackPreview || undefined,
            documentSelfieUrl: docSelfiePreview || undefined,
          }),
        }).catch(() => { toast.warning('No se pudieron guardar los documentos. Podrás subirlos más tarde.'); });
      }

      const disciplineCategoryMap: Record<string, string> = {
        musician:          'MUSICO',
        dj:                'DJ',
        photographer:      'FOTOGRAFO',
        filmmaker:         'VIDEOGRAFO',
        'graphic-designer':'DISENADOR',
        illustrator:       'PINTOR',
        dancer:            'BAILARIN',
        mc:                'ANIMADOR',
        writer:            'ESCRITOR',
        tattooist:         'TATUADOR',
        makeup:            'MAQUILLADOR',
        painter:           'PINTOR',
        sculptor:          'ESCULTOR',
        magician:          'MAGO',
        acrobat:           'ACROBATA',
        other:             'OTRO',
      };
      const category = disciplineCategoryMap[selectedDiscipline || ''] || 'OTRO';

      const res = await fetch('/api/artist/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category,
          specialties: [category],
          equipment: selectedEquipment,
          bio: shortBio || undefined,
          instagram: instagramHandle || undefined,
          website: portfolioUrl || undefined,
          hourlyRateMin: hourlyRateMin > 0 ? hourlyRateMin : undefined,
          hourlyRateMax: hourlyRateMax > 0 ? hourlyRateMax : undefined,
          currency,
          requiresDeposit,
          depositPercentage: requiresDeposit ? depositPercentage : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status !== 409) throw new Error(data.message || 'Error al crear perfil');
      }

      // Save availability if any days were selected
      const activeDays = weeklyAvailability.filter(d => d.active);
      if (activeDays.length > 0) {
        await fetch('/api/artist/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            availability: activeDays.map(d => ({
              dayOfWeek: d.day,
              startTime: d.startTime,
              endTime: d.endTime,
            })),
          }),
        }).catch(() => {
          toast.warning('No se pudo guardar la disponibilidad. Podrás configurarla desde tu perfil.');
        });
      }

      // Upload avatar if selected
      if (profilePhotoFile) {
        const fd = new FormData();
        fd.append('avatar', profilePhotoFile);
        await fetch('/api/users/avatar', { method: 'POST', body: fd, credentials: 'include' }).catch(() => {});
      }

      document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=strict';
      router.push('/artist/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Hubo un error. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const canContinueStep2 = selectedDiscipline !== null;
  const canContinueStep5 = shortBio.trim().length > 0;
  const canContinueStep6 = serviceName.trim().length > 0 && serviceCategory && serviceDescription.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-[#0F172A] dark:via-[#1E293B]/30 dark:to-[#0F172A]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.png" alt="PIUMS" width={96} height={96} className="h-10 w-auto" unoptimized priority />
          </div>
          {currentStep < 9 && (
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium transition-colors"
              >
                Omitir
              </button>
              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm font-medium">
                Centro de Ayuda
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Progress bar */}
        {currentStep > 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {currentStep === 2 && `Paso 2 de ${totalSteps}: Tu rol creativo`}
                {currentStep === 3 && `Paso 3 de ${totalSteps}: Tu equipo`}
                {currentStep === 5 && `Paso 4 de ${totalSteps}: Portafolio y perfil`}
                {currentStep === 6 && `Paso 5 de ${totalSteps}: Tu primer servicio`}
                {currentStep === 7 && `Paso 6 de ${totalSteps}: Tu tarifa base`}
                {currentStep === 8 && `Paso 7 de ${totalSteps}: Tu disponibilidad`}
                {currentStep === 9 && `Paso ${totalSteps} de ${totalSteps}: Verificación de identidad`}
              </span>
              <span className="text-sm font-semibold text-orange-600">
                {Math.round(progressPercentage)}% Completado
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Welcome ───────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="grid md:grid-cols-2 gap-12 items-center piums-fade-in">
            <div>
              <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full mb-6">
                BIENVENIDA AL ECOSISTEMA
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Lleva tu{' '}
                <span className="text-orange-600">Carrera Creativa</span>
                <br />
                al Siguiente Nivel
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Bienvenido a PIUMS, el ecosistema de la Economía Naranja. Monetiza tu talento único,
                protege tu propiedad intelectual y conectáte con una red global de oportunidades que te esperan.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2"
                >
                  Crear Mi Perfil
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button className="px-6 py-3.5 text-gray-700 font-medium hover:text-gray-900 transition-colors">
                  Saber más primero
                </button>
              </div>
              <div className="mt-12 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <span className="font-medium text-gray-900">Bienvenida</span>
                </div>
                <span className="text-sm text-gray-400">Paso 1 de {totalSteps}</span>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-orange-400 via-red-400 to-purple-500 rounded-2xl h-64 overflow-hidden shadow-xl">
                    <div className="p-4 text-white">
                      <p className="text-sm font-semibold">Artes Visuales</p>
                      <p className="text-xs opacity-90">Monetiza Obras Originales</p>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-2xl h-48 overflow-hidden shadow-xl relative">
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-sm font-semibold text-white">Producción Musical</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl h-48 overflow-hidden shadow-xl"></div>
                  <div className="bg-gray-100 rounded-2xl h-56 overflow-hidden shadow-xl p-6">
                    <div className="bg-white rounded-xl p-4 mb-3">
                      <p className="text-sm font-semibold text-gray-900">Moda & Diseño</p>
                      <p className="text-xs text-gray-600">Acceso a talento único</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Creative Superpower ───────────────────────── */}
        {currentStep === 2 && (
          <div className="max-w-3xl mx-auto piums-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              ¿Cuál es tu <span className="text-orange-600">superpoder creativo</span>?
            </h2>
            <p className="text-gray-600 mb-8">
              Selecciona la disciplina que mejor describe tu enfoque profesional principal.
            </p>
            <div className="mb-8">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar roles (ej: Diseñador UI, Baterista, Guionista)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {filteredDisciplines.map((discipline) => (
                <button
                  key={discipline.id}
                  onClick={() => {
                    setSelectedDiscipline(discipline.id);
                    setSelectedEquipment([]); // reset when discipline changes
                  }}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                    selectedDiscipline === discipline.id
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {selectedDiscipline === discipline.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="text-3xl mb-3">{discipline.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{discipline.name}</h3>
                  {discipline.subtitle && <p className="text-xs text-gray-500">{discipline.subtitle}</p>}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
              <button
                onClick={() => canContinueStep2 && setCurrentStep(3)}
                disabled={!canContinueStep2}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continuar
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Equipment (NEW) ────────────────────────────── */}
        {currentStep === 3 && (
          <div className="max-w-3xl mx-auto piums-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">¿Con qué equipo cuentas?</h2>
                <p className="text-sm text-orange-600 font-medium">Esto aparecerá en tus servicios para que los clientes sepan qué incluyes</p>
              </div>
            </div>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              Selecciona el equipo y los recursos que tienes disponibles. Los clientes pueden ver qué traes tú
              y qué necesitan proveer ellos. Puedes actualizar esto cuando quieras desde tu perfil.
            </p>

            {selectedEquipment.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {selectedEquipment.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1.5 bg-orange-500 text-white text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                    <button onClick={() => toggleEquipmentItem(item)} className="ml-1 hover:opacity-70">×</button>
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-6">
              {equipmentSections.map((section) => (
                <div key={section.section}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{section.section}</h3>
                  <div className="flex flex-wrap gap-2">
                    {section.items.map((item) => {
                      const selected = selectedEquipment.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleEquipmentItem(item)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                            selected
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/50'
                          }`}
                        >
                          {selected && (
                            <span className="mr-1.5">✓</span>
                          )}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
              <button onClick={() => setCurrentStep(2)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2"
                >
                  {selectedEquipment.length > 0 ? `Continuar (${selectedEquipment.length} seleccionados)` : 'Continuar'}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Saltar por ahora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Portfolio & Profile ───────────────────────── */}
        {currentStep === 5 && (
          <div className="max-w-2xl mx-auto piums-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Muestra tu mejor trabajo</h2>
            <p className="text-gray-600 mb-8">
              Conecta tus perfiles profesionales y súbe una foto para que los clientes sepan quién eres.
            </p>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">Foto de Perfil</label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative">
                      {profilePhotoPreview ? (
                        <Image src={profilePhotoPreview} alt="Profile" fill className="object-cover" sizes="96px" unoptimized />
                      ) : (
                        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <label htmlFor="profile-photo" className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </label>
                    <input id="profile-photo" type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="profile-photo" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-blue-500 font-semibold">Haz clic para subir</span>
                      <span className="text-gray-500">o arrastra y suelta</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">SVG, PNG, JPG o GIF (máx. 800x400px)</p>
                  </div>
                </div>
              </div>

              {/* Short Bio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-900">Bio Breve</label>
                  <span className="text-xs text-gray-500">{shortBio.length}/300</span>
                </div>
                <textarea
                  id="bio"
                  rows={4}
                  maxLength={300}
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  placeholder="Cuéntanos sobre tu trayectoria creativa, habilidades clave y qué hace único tu trabajo..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
              </div>

              {/* Social & Portfolio Links */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">Redes Sociales y Portafolio</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </div>
                  <input type="text" placeholder="URL de LinkedIn" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none" />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <input type="text" placeholder="Usuario de Instagram" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none" />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <input type="text" placeholder="Link de Portafolio (Behance, Dribbble, etc.)" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none" />
                </div>
                {extraLinks.map((link, index) => (
                  <input key={index} type="text" placeholder="Enlace adicional (Spotify, SoundCloud, etc.)" value={link} onChange={(e) => handleExtraLinkChange(index, e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none" />
                ))}
                <button onClick={handleAddExtraLink} className="text-blue-500 text-sm font-semibold hover:text-blue-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar otro enlace
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6">
              <button onClick={() => setCurrentStep(3)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
              <button
                onClick={() => canContinueStep5 && setCurrentStep(6)}
                disabled={!canContinueStep5}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continuar al Último Paso
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 6: Service Setup ──────────────────────────────── */}
        {currentStep === 6 && (
          <div className="grid md:grid-cols-2 gap-12 piums-fade-in">
            {/* Left side */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Configura tu
                <br />
                <span className="text-orange-600">primer servicio</span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Define tu oferta principal para que los clientes puedan reservarte de inmediato.
              </p>
              {selectedEquipment.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold text-orange-800 mb-2">Tu equipo ({selectedEquipment.length} ítems)</p>
                  <p className="text-xs text-orange-700">Se añadirá automáticamente a tu servicio como "¿Qué incluye?"</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedEquipment.slice(0, 4).map((item) => (
                      <span key={item} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{item}</span>
                    ))}
                    {selectedEquipment.length > 4 && (
                      <span className="text-xs text-orange-500">+{selectedEquipment.length - 4} más</span>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-orange-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-1">Consejo Pro</h3>
                    <p className="text-sm text-orange-800 leading-relaxed">
                      Empieza con un servicio simple y popular. Siempre podrás agregar paquetes complejos desde tu dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="serviceName" className="block text-sm font-semibold text-gray-900 mb-2">Nombre del Servicio</label>
                    <input
                      id="serviceName"
                      type="text"
                      placeholder="ej: Sesión de fotos 1 hora"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">Categoría</label>
                    <select
                      id="category"
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500 outline-none bg-white"
                    >
                      <option value="">Seleccionar categoría</option>
                      {serviceCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-900">Descripción</label>
                    <span className="text-xs text-gray-500">{serviceDescription.length}/500</span>
                  </div>
                  <textarea
                    id="description"
                    rows={4}
                    maxLength={500}
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Describe qué incluye este servicio..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Precio y Disponibilidad</label>
                  <div className="mb-4">
                    <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-2">Precio Base</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        id="basePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="w-full pl-8 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USD</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        type: 'immediate' as const,
                        label: 'Disponible para reserva inmediata',
                        desc: 'Los clientes pueden reservar directamente según tu calendario.',
                        icon: (
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        ),
                      },
                      {
                        type: 'quote' as const,
                        label: 'Cotización requerida',
                        desc: 'Revisas las solicitudes y envías una propuesta de precio.',
                        icon: (
                          <>
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </>
                        ),
                      },
                    ].map(({ type, label, desc, icon }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAvailabilityType(type)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          availabilityType === type ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${availabilityType === type ? 'border-orange-500' : 'border-gray-300'}`}>
                            {availabilityType === type && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className={`w-5 h-5 ${type === 'immediate' ? 'text-orange-600' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">{icon}</svg>
                              <span className="font-semibold text-gray-900">{label}</span>
                            </div>
                            <p className="text-sm text-gray-600">{desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-stretch mt-8 pt-6 border-t border-gray-200 gap-3">
                <div className="flex items-center justify-between">
                  <button onClick={() => setCurrentStep(5)} className="text-gray-600 hover:text-gray-900 font-medium">Atrás</button>
                  <button
                    onClick={() => canContinueStep6 && setCurrentStep(7)}
                    disabled={!canContinueStep6}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Continuar
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
                <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">
                  Omitir configuración de servicio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 7: Tu Tarifa Base ─────────────────────────────── */}
        {currentStep === 7 && (
          <div className="max-w-2xl mx-auto piums-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tu Tarifa Base</h2>
                <p className="text-sm text-orange-600 font-medium">Define el rango de precios que manejas</p>
              </div>
            </div>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              Establece tu rango de tarifas para que los clientes sepan qué esperar. Podrás ajustar los precios por servicio desde tu dashboard.
            </p>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
              {/* Currency (locked to USD) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Moneda</label>
                <div className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700">
                  🇺🇸 USD
                  <span className="text-[10px] font-medium text-orange-500/80">(moneda global)</span>
                </div>
              </div>

              {/* Min / Max rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Tarifa mínima (por hora)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{currency}</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={hourlyRateMin || ''}
                      onChange={e => setHourlyRateMin(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Tarifa máxima (por hora)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{currency}</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={hourlyRateMax || ''}
                      onChange={e => setHourlyRateMax(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Deposit toggle */}
              <div className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Requerir anticipo</p>
                    <p className="text-xs text-gray-500 mt-0.5">Solicita un porcentaje del total al reservar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresDeposit(v => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${requiresDeposit ? 'bg-orange-500' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${requiresDeposit ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                {requiresDeposit && (
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      Porcentaje de anticipo: <span className="text-orange-600 font-bold">50%</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      El anticipo está fijado al 50% del total para todos los artistas.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6">
              <button onClick={() => setCurrentStep(6)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={() => setCurrentStep(8)}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2"
                >
                  Continuar
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button onClick={() => setCurrentStep(8)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  Configurar después
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 8: Disponibilidad Semanal ────────────────────── */}
        {currentStep === 8 && (
          <div className="max-w-2xl mx-auto piums-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tu Disponibilidad Semanal</h2>
                <p className="text-sm text-orange-600 font-medium">¿Qué días y horarios estás disponible?</p>
              </div>
            </div>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              Activa los días en que generalmente estás disponible. Los clientes verán tu disponibilidad al reservarte.
              Podrás ajustar excepciones y días bloqueados desde tu dashboard.
            </p>

            <div className="space-y-3 mb-8">
              {weeklyAvailability.map((item, idx) => (
                <div
                  key={item.day}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    item.active ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-white'
                  }`}
                >
                  {/* Day toggle */}
                  <button
                    type="button"
                    onClick={() => setWeeklyAvailability(prev => prev.map((d, i) => i === idx ? { ...d, active: !d.active } : d))}
                    className="flex items-center gap-3 min-w-[110px]"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${item.active ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                      {item.active && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${item.active ? 'text-orange-800' : 'text-gray-500'}`}>{item.day}</span>
                  </button>

                  {/* Time selects */}
                  {item.active ? (
                    <div className="flex items-center gap-2 flex-1">
                      <select
                        value={item.startTime}
                        onChange={e => setWeeklyAvailability(prev => prev.map((d, i) => i === idx ? { ...d, startTime: e.target.value } : d))}
                        className="flex-1 px-2 py-1.5 text-sm border border-orange-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                      >
                        {['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="text-gray-400 text-xs">a</span>
                      <select
                        value={item.endTime}
                        onChange={e => setWeeklyAvailability(prev => prev.map((d, i) => i === idx ? { ...d, endTime: e.target.value } : d))}
                        className="flex-1 px-2 py-1.5 text-sm border border-orange-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                      >
                        {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 flex-1">No disponible</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button onClick={() => setCurrentStep(7)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={() => setCurrentStep(9)}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Continuar
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button onClick={() => setCurrentStep(9)} disabled={isLoading} className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
                  Configurar disponibilidad después
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 9: Identity Verification (final, skippable) ──── */}
        {currentStep === 9 && (
          <div className="max-w-2xl mx-auto piums-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Verificación de identidad</h2>
                <p className="text-sm text-orange-600 font-medium">Último paso — obtén tu insignia verificada</p>
              </div>
            </div>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Para proteger a artistas y clientes, confirmamos tu identidad antes de mostrar tu perfil públicamente.
              Esta información es revisada por nuestro equipo y nunca se comparte.
            </p>

            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 mb-6">
              <svg className="h-5 w-5 shrink-0 text-[#FF6A00] mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-orange-800 leading-relaxed">
                <strong>Si omites este paso, tu perfil no aparecerá en las búsquedas.</strong>{' '}
                Podrás completar tu verificación más tarde desde <em>Configuración &gt; Verificación</em>.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo de documento</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500 outline-none bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="DPI">DPI</option>
                    <option value="PASSPORT">Pasaporte</option>
                    <option value="RESIDENCE_CARD">Carné de residencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Número de documento</label>
                  <input
                    type="text"
                    placeholder="ej: 1098234567"
                    value={docNumber}
                    onChange={e => setDocNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500 outline-none"
                  />
                </div>
              </div>

              {[
                { field: 'front' as const, label: 'Frente del documento', hint: 'Foto clara donde se vea tu nombre, número y fecha', preview: docFrontPreview, required: true },
                { field: 'back' as const,  label: 'Reverso del documento', hint: 'Opcional pero recomendado', preview: docBackPreview, required: false },
                { field: 'selfie' as const, label: 'Selfie con documento', hint: 'Sostén el documento junto a tu rostro', preview: docSelfiePreview, required: true },
              ].map(({ field, label, hint, preview, required }) => (
                <div key={field}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-sm font-semibold text-gray-900">{label}</label>
                    {required
                      ? <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Requerido</span>
                      : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Opcional</span>
                    }
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{hint}</p>
                  <label htmlFor={`doc9-${field}`} className="block cursor-pointer">
                    {preview ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-orange-400">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt={label} className="w-full h-44 object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1.5 rounded-full">Cambiar foto</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-orange-400 hover:bg-orange-50/40 transition-colors">
                        <svg className="h-10 w-10 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-sm font-medium text-gray-500">Toca para subir</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG — máx. 10 MB</p>
                      </div>
                    )}
                    <input id={`doc9-${field}`} type="file" accept="image/*" capture="environment" onChange={handleDocFileChange(field)} className="hidden" />
                  </label>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
              <button onClick={() => setCurrentStep(8)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-[#FF6A00] to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>Completar verificación e ir al Dashboard</>
                  )}
                </button>
                <button onClick={handleFinish} disabled={isLoading} className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
                  Omitir por ahora (mi perfil quedará oculto en búsquedas)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

