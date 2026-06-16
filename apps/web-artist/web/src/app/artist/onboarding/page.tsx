'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from '@/lib/toast';
import { ThemeToggle } from '@/contexts/ThemeContext';
import { Globe, Music, Camera, Video, Sparkles, Check, Smartphone } from 'lucide-react';

// Disciplinas creativas disponibles
const creativeDisciplines = [
  { id: 'musician',     name: 'Músico',                 subtitle: 'Cantante, Compositor, Banda',    Icon: Music },
  { id: 'photographer', name: 'Fotógrafo',              subtitle: 'Eventos, Retratos, Bodas',       Icon: Camera },
  { id: 'filmmaker',    name: 'Videógrafo',              subtitle: 'Clips, Eventos, Comerciales',    Icon: Video },
  { id: 'animador',     name: 'Animador',                subtitle: 'Payaso, Maestro de Ceremonia',   Icon: Sparkles },
  { id: 'creator',      name: 'Creador de Contenido',   subtitle: 'TikToker, YouTuber, Influencer', Icon: Smartphone },
];

// Especialidades específicas por disciplina
const TALENT_BY_DISCIPLINE: Record<string, { id: string; label: string; keywords: string[] }[]> = {
  musician: [
    { id: 'cantante_solista',  label: 'Cantante / Solista',   keywords: ['cantante', 'solista', 'vocalista'] },
    { id: 'guitarrista',       label: 'Guitarrista',           keywords: ['guitarra', 'guitarrista'] },
    { id: 'pianista',          label: 'Pianista',              keywords: ['piano', 'pianista', 'teclado'] },
    { id: 'baterista',         label: 'Baterista',             keywords: ['batería', 'baterista'] },
    { id: 'bajista',           label: 'Bajista',               keywords: ['bajo', 'bajista', 'bass'] },
    { id: 'violinista',        label: 'Violinista',            keywords: ['violín', 'violin', 'cuerdas'] },
    { id: 'saxofonista',       label: 'Saxofonista',           keywords: ['saxofón', 'saxo'] },
    { id: 'banda_musical',     label: 'Banda Musical',         keywords: ['banda', 'grupo musical'] },
    { id: 'mariachi',          label: 'Mariachi',              keywords: ['mariachi', 'trío', 'ranchero'] },
    { id: 'marimba',           label: 'Marimba',               keywords: ['marimba', 'marimba guatemalteca'] },
    { id: 'grupo_acustico',    label: 'Grupo Acústico',        keywords: ['grupo acústico', 'unplugged'] },
    { id: 'trio_cuarteto',     label: 'Trío / Cuarteto',       keywords: ['trío', 'cuarteto', 'ensemble'] },
    { id: 'productor_musical', label: 'Productor Musical',     keywords: ['productor', 'beatmaker', 'producción'] },
  ],
  photographer: [
    { id: 'fotografo_eventos',  label: 'Fotógrafo de Eventos',  keywords: ['foto eventos', 'fotografía eventos'] },
    { id: 'fotografo_boda',     label: 'Fotógrafo de Bodas',    keywords: ['foto boda', 'wedding photographer'] },
    { id: 'fotografo_retrato',  label: 'Fotógrafo de Retrato',  keywords: ['retrato', 'portrait'] },
    { id: 'fotografo_producto', label: 'Fotografía Comercial',  keywords: ['foto producto', 'ecommerce'] },
    { id: 'drone_foto',         label: 'Drone / Aéreo',         keywords: ['drone', 'dron', 'aéreo'] },
  ],
  filmmaker: [
    { id: 'videografo_eventos',   label: 'Videógrafo de Eventos', keywords: ['videógrafo', 'video eventos'] },
    { id: 'videografo_boda',      label: 'Videógrafo de Bodas',   keywords: ['video boda', 'wedding video'] },
    { id: 'editor_video',         label: 'Editor de Video',       keywords: ['edición', 'editor de video'] },
    { id: 'director_audiovisual', label: 'Director Audiovisual',  keywords: ['director', 'producción audiovisual'] },
    { id: 'drone_video',          label: 'Drone / Aéreo',         keywords: ['drone', 'dron', 'aéreo video'] },
    { id: 'streaming',            label: 'Streaming / En Vivo',   keywords: ['streaming', 'live stream'] },
  ],
  animador: [
    { id: 'payaso',            label: 'Payaso',              keywords: ['payaso', 'show infantil', 'globoflexia', 'magia', 'animación niños'] },
    { id: 'maestro_ceremonia', label: 'Maestro de Ceremonia', keywords: ['mc', 'maestro ceremonias', 'animador eventos', 'presentador'] },
  ],
  creator: [
    { id: 'tiktoker',      label: 'TikToker',                  keywords: ['tiktok', 'tiktoker', 'reels', 'short video'] },
    { id: 'youtuber',      label: 'YouTuber',                  keywords: ['youtube', 'youtuber', 'video youtube', 'canal'] },
    { id: 'influencer',    label: 'Influencer',                keywords: ['influencer', 'instagram', 'brand deal', 'colaboración'] },
    { id: 'podcaster',     label: 'Podcaster',                 keywords: ['podcast', 'podcaster', 'audio', 'entrevista'] },
    { id: 'streamer',      label: 'Streamer',                  keywords: ['streamer', 'twitch', 'live gaming'] },
    { id: 'creador_reels', label: 'Creador de Reels / Shorts', keywords: ['reels', 'shorts', 'contenido corto', 'viral'] },
    { id: 'ugc_creator',   label: 'UGC Creator',               keywords: ['ugc', 'user generated content', 'contenido marcas'] },
  ],
};

// Sugerencias de nombre/categoría/descripción de servicio por talent ID
const SERVICE_SUGGESTIONS: Record<string, { name: string; category: string; description: string }> = {
  cantante_solista:     { name: 'Presentación en Vivo - Cantante Solista', category: 'Música en vivo',        description: 'Show de canto en vivo para eventos, bodas y celebraciones. Repertorio amplio adaptable al tipo de evento.' },
  guitarrista:          { name: 'Guitarra en Vivo para Eventos',           category: 'Música en vivo',        description: 'Actuación de guitarra en vivo para bodas, eventos corporativos y celebraciones.' },
  pianista:             { name: 'Piano en Vivo para Eventos',              category: 'Música en vivo',        description: 'Música de piano en vivo para crear una atmósfera elegante en tu evento.' },
  baterista:            { name: 'Batería en Vivo para Eventos',            category: 'Música en vivo',        description: 'Show de batería en vivo y servicios de sesión para conciertos y grabaciones.' },
  bajista:              { name: 'Bajo en Vivo para Eventos',               category: 'Música en vivo',        description: 'Actuación de bajo eléctrico o acústico en vivo para bandas, eventos y sesiones de grabación.' },
  violinista:           { name: 'Violín en Vivo para Eventos',             category: 'Música en vivo',        description: 'Actuación de violín en vivo para bodas, eventos y celebraciones especiales.' },
  saxofonista:          { name: 'Saxofón en Vivo para Eventos',            category: 'Música en vivo',        description: 'Show de saxofón en vivo para brindar un toque de elegancia y estilo a tu evento.' },
  banda_musical:        { name: 'Banda Musical para Eventos',              category: 'Música en vivo',        description: 'Show completo de banda musical en vivo para bodas, fiestas y eventos corporativos.' },
  mariachi:             { name: 'Mariachi para Eventos y Serenatas',       category: 'Música en vivo',        description: 'Mariachi en vivo para serenatas, bodas, fiestas y celebraciones especiales.' },
  marimba:              { name: 'Marimba Guatemalteca para Eventos',       category: 'Música en vivo',        description: 'Marimba en vivo para bodas, eventos sociales y corporativos.' },
  grupo_acustico:       { name: 'Grupo Acústico para Eventos',             category: 'Música en vivo',        description: 'Grupo acústico en vivo para eventos íntimos, bodas y celebraciones al aire libre.' },
  trio_cuarteto:        { name: 'Trío / Cuarteto Musical',                 category: 'Música en vivo',        description: 'Ensemble de cámara para bodas, recepciones y eventos de gala.' },
  productor_musical:    { name: 'Producción Musical Profesional',          category: 'Música en vivo',        description: 'Producción de beats y composición musical para artistas y proyectos creativos.' },
  fotografo_eventos:    { name: 'Fotografía de Eventos',                   category: 'Fotografía de eventos', description: 'Fotografía profesional de eventos: bodas, fiestas, graduaciones y celebraciones.' },
  fotografo_boda:       { name: 'Fotografía de Bodas',                     category: 'Fotografía de eventos', description: 'Fotografía artística y documental para tu boda. Capturamos cada momento especial.' },
  fotografo_retrato:    { name: 'Sesión de Retrato Profesional',           category: 'Fotografía de retrato', description: 'Sesión fotográfica de retrato: headshots, lifestyle y editorial.' },
  fotografo_producto:   { name: 'Fotografía Comercial de Producto',        category: 'Fotografía de retrato', description: 'Fotografía de producto para e-commerce, redes sociales y campañas publicitarias.' },
  drone_foto:           { name: 'Fotografía Aérea con Drone',              category: 'Fotografía de eventos', description: 'Imágenes aéreas con drone para eventos, inmuebles y producciones.' },
  videografo_eventos:   { name: 'Videografía de Eventos',                  category: 'Videografía y edición', description: 'Cobertura en video de bodas, eventos y celebraciones con edición profesional.' },
  videografo_boda:      { name: 'Video de Bodas Cinemático',               category: 'Videografía y edición', description: 'Video de boda estilo cinemático: highlights, same-day edit y película completa.' },
  editor_video:         { name: 'Edición de Video Profesional',            category: 'Videografía y edición', description: 'Edición y post-producción de video para redes sociales, YouTube y producciones.' },
  director_audiovisual: { name: 'Producción Audiovisual',                  category: 'Videografía y edición', description: 'Dirección y producción audiovisual para comerciales, videoclips y documentales.' },
  drone_video:          { name: 'Video Aéreo con Drone',                   category: 'Videografía y edición', description: 'Video aéreo con drone para eventos, inmuebles y producciones audiovisuales.' },
  streaming:            { name: 'Streaming en Vivo de Eventos',            category: 'Videografía y edición', description: 'Transmisión profesional en vivo de eventos, conferencias y ceremonias.' },
  payaso:               { name: 'Show de Payaso para Eventos',             category: 'Entretenimiento',         description: 'Show completo de payaso para fiestas infantiles y eventos: globos, juegos, magia y diversión.' },
  maestro_ceremonia:    { name: 'Maestro de Ceremonia para Eventos',       category: 'Animación de eventos',    description: 'Conducción profesional de bodas, quinceañeras, graduaciones y eventos especiales.' },
  tiktoker:             { name: 'Creación de Contenido para TikTok',       category: 'Creación de contenido',   description: 'Producción de videos cortos virales para TikTok: guion, grabación y edición.' },
  youtuber:             { name: 'Producción de Videos para YouTube',       category: 'Creación de contenido',   description: 'Creación de contenido para YouTube: guion, filmación, edición y optimización SEO.' },
  influencer:           { name: 'Colaboración con Influencer',             category: 'Creación de contenido',   description: 'Promoción de marca o producto en redes sociales con audiencia segmentada.' },
  podcaster:            { name: 'Producción de Podcast',                   category: 'Creación de contenido',   description: 'Grabación, edición y publicación de episodios de podcast. Disponible para entrevistas.' },
  streamer:             { name: 'Streaming en Vivo',                       category: 'Creación de contenido',   description: 'Transmisión en vivo para eventos, lanzamientos de productos y entretenimiento.' },
  creador_reels:        { name: 'Creación de Reels y Shorts',              category: 'Creación de contenido',   description: 'Videos cortos creativos para Instagram Reels, TikTok y YouTube Shorts.' },
  ugc_creator:          { name: 'Creación de Contenido UGC para Marcas',   category: 'Creación de contenido',   description: 'Contenido auténtico estilo usuario para campañas de marketing y publicidad digital.' },
};

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
  animador: [
    {
      section: 'Props y vestuario',
      items: ['Traje de payaso', 'Nariz roja', 'Peluca de colores', 'Maquillaje artístico', 'Kit de globoflexia', 'Set de malabares', 'Trucos de magia'],
    },
    {
      section: 'Audio y producción',
      items: ['Micrófono inalámbrico', 'Micrófono de solapa', 'Altavoz portátil', 'Bocina portátil', 'Laptop + presentaciones'],
    },
  ],
  creator: [
    {
      section: 'Grabación',
      items: ['Smartphone de alta gama', 'Cámara mirrorless / DSLR', 'Trípode / soporte', 'Aro de luz (ring light)', 'Estabilizador / gimbal'],
    },
    {
      section: 'Audio',
      items: ['Micrófono de solapa', 'Micrófono de condensador', 'Interfaz de audio', 'Auriculares de monitoreo'],
    },
    {
      section: 'Edición y producción',
      items: ['Laptop + software de edición', 'Adobe Premiere / CapCut / DaVinci', 'Librería de música y efectos', 'Fondos y props para grabación'],
    },
  ],
};

// Opciones de categorías para servicios
const serviceCategories = [
  'Música en vivo',
  'Fotografía de eventos',
  'Fotografía de retrato',
  'Videografía y edición',
  'Entretenimiento',
  'Animación de eventos',
  'Creación de contenido',
];

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2: Creative Superpower
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedTalentIds, setSelectedTalentIds] = useState<Record<string, string[]>>({});
  const [customRole, setCustomRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Step 3: Equipment
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState('');

  // Step 4: Portfolio & Profile
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [shortBio, setShortBio] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
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
  const [coverageRadius, setCoverageRadius] = useState<number | null>(30);
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

  // Step 2.5: Sub-step de banda (solo cuando selecciona banda_musical)
  const [bandSubStep, setBandSubStep] = useState<null | 'ask' | 'create' | 'search'>(null);
  const [bandName, setBandName] = useState('');
  const [bandSearchQuery, setBandSearchQuery] = useState('');
  const [bandSearchResults, setBandSearchResults] = useState<Array<{ id: string; name: string; city: string; country: string }>>([]);
  const [bandSearchLoading, setBandSearchLoading] = useState(false);
  const [pendingBandId, setPendingBandId] = useState<string | null>(null);

  // Identity verification (OAuth only — still step 4 for OAuth, between equipment and portfolio)
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [docFrontPreview, setDocFrontPreview] = useState<string | null>(null);
  const [docBackPreview, setDocBackPreview] = useState<string | null>(null);
  const [docSelfiePreview, setDocSelfiePreview] = useState<string | null>(null);
  const [docFrontUrl, setDocFrontUrl] = useState<string | null>(null);
  const [docBackUrl, setDocBackUrl] = useState<string | null>(null);
  const [docSelfieUrl, setDocSelfieUrl] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState<{ front: boolean; back: boolean; selfie: boolean }>({ front: false, back: false, selfie: false });

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

    // If the cookie explicitly says onboarding is not done (set by login route),
    // the user just logged in and is starting onboarding — don't redirect.
    const cookieMap = Object.fromEntries(
      document.cookie.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
    );
    if (cookieMap['onboarding_completed'] === 'false') return;

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
    } catch (e) { console.warn('[onboarding] skip profile creation failed:', e); }
    document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=strict';
    await fetch('/api/auth/refresh-token', { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.replace('/artist/dashboard');
  };

  // Map current step to a "display" step number (skipping the deprecated step 4)
  const displayStep = currentStep <= 3 ? currentStep : currentStep === 9 ? 8 : currentStep - 1;
  const progressPercentage = (displayStep / totalSteps) * 100;

  const filteredDisciplines = creativeDisciplines.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const equipmentSections = (() => {
    const merged: { section: string; items: string[] }[] = [];
    for (const disc of selectedDisciplines) {
      for (const section of (EQUIPMENT_BY_DISCIPLINE[disc] ?? [])) {
        const existing = merged.find(s => s.section === section.section);
        if (existing) {
          const newItems = section.items.filter(i => !existing.items.includes(i));
          existing.items = [...existing.items, ...newItems];
        } else {
          merged.push({ section: section.section, items: [...section.items] });
        }
      }
    }
    return merged;
  })();

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

  const handleDocFileChange = (field: 'front' | 'back' | 'selfie') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (field === 'front') setDocFrontPreview(dataUrl);
      else if (field === 'back') setDocBackPreview(dataUrl);
      else setDocSelfiePreview(dataUrl);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary via backend
    setDocUploading(prev => ({ ...prev, [field]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/users/documents/upload?folder=${field}`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        toast.error(data.message || 'No se pudo subir el documento');
        return;
      }
      if (field === 'front') setDocFrontUrl(data.url);
      else if (field === 'back') setDocBackUrl(data.url);
      else setDocSelfieUrl(data.url);
    } catch {
      toast.error('No se pudo subir el documento');
    } finally {
      setDocUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleExtraLinkChange = (index: number, value: string) => {
    const newLinks = [...extraLinks];
    newLinks[index] = value;
    setExtraLinks(newLinks);
  };

  // Pre-fill Step 6 fields when talent or discipline changes
  useEffect(() => {
    const firstTalentId = Object.values(selectedTalentIds).flat()[0] ?? null;
    const suggestion = firstTalentId ? SERVICE_SUGGESTIONS[firstTalentId] : null;
    if (suggestion) {
      setServiceName((prev) => prev || suggestion.name);
      setServiceCategory((prev) => prev || suggestion.category);
      setServiceDescription((prev) => prev || suggestion.description);
    }
  }, [selectedTalentIds]);

  const handleFinish = async () => {
    if (hourlyRateMin > 0 && hourlyRateMax > 0 && hourlyRateMin > hourlyRateMax) {
      toast.error('La tarifa mínima no puede ser mayor que la máxima');
      return;
    }
    setIsLoading(true);
    try {
      if (docFrontUrl || docSelfieUrl || docType || docNumber) {
        await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            documentType: docType || undefined,
            documentNumber: docNumber || undefined,
            documentFrontUrl: docFrontUrl || undefined,
            documentBackUrl: docBackUrl || undefined,
            documentSelfieUrl: docSelfieUrl || undefined,
          }),
        }).catch(() => { toast.warning('No se pudieron guardar los documentos. Podrás subirlos más tarde.'); });
      }

      const disciplineCategoryMap: Record<string, string> = {
        musician:    'MUSICO',
        photographer: 'FOTOGRAFO',
        filmmaker:   'VIDEOGRAFO',
        animador:    'ANIMADOR',
        creator:     'CREADOR_CONTENIDO',
      };
      const primaryDiscipline = selectedDisciplines[0] || '';
      const category = disciplineCategoryMap[primaryDiscipline] || 'OTRO';

      // Build specialties from all selected disciplines and their talents
      const specialties: string[] = [];
      if (category === 'OTRO' && customRole.trim()) {
        specialties.push(customRole.trim());
      } else {
        specialties.push(category);
        for (const disc of selectedDisciplines) {
          const talentList = TALENT_BY_DISCIPLINE[disc] ?? [];
          const ids = selectedTalentIds[disc] ?? [];
          for (const id of ids) {
            const entry = talentList.find(t => t.id === id);
            if (entry) specialties.push(entry.label);
          }
        }
        if (customRole.trim()) specialties.push(customRole.trim());
      }

      // Register custom role in smartsearch if it's new
      if (customRole.trim().length >= 2) {
        fetch('/api/search/suggest-synonym', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ term: customRole.trim(), synonyms: [category.toLowerCase(), primaryDiscipline] }),
        }).catch(() => {});
      }

      const allEquipment = customEquipment.trim()
        ? [...selectedEquipment, customEquipment.trim()]
        : selectedEquipment;

      const res = await fetch('/api/artist/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category,
          specialties,
          equipment: allEquipment,
          bio: shortBio || undefined,
          instagram: instagramHandle || undefined,
          website: portfolioUrl || undefined,
          spotify: spotifyUrl || undefined,
          youtube: youtubeUrl || undefined,
          extraLinks: extraLinks.length > 0 ? extraLinks : undefined,
          hourlyRateMin: hourlyRateMin > 0 ? hourlyRateMin : undefined,
          hourlyRateMax: hourlyRateMax > 0 ? hourlyRateMax : undefined,
          currency,
          coverageRadius,
          requiresDeposit,
          depositPercentage: requiresDeposit ? depositPercentage : undefined,
        }),
      });

      const profileData = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status !== 409) throw new Error((profileData as any).message || 'Error al crear perfil');
      }

      // Create first service if user filled step 6
      const artistId = (profileData as any)?.id ?? (profileData as any)?.artist?.id;
      if (artistId && serviceName.trim()) {
        // Fetch categories from backend and match by name to get a real ID
        let categoryId: string | undefined;
        try {
          const catRes = await fetch('/api/catalog/categories', { credentials: 'include' });
          if (catRes.ok) {
            const cats: Array<{ id: string; name: string; slug?: string }> = await catRes.json().catch(() => []);
            const matched = cats.find(c =>
              c.name.toLowerCase().includes(serviceCategory.toLowerCase()) ||
              serviceCategory.toLowerCase().includes(c.name.toLowerCase()) ||
              c.slug?.toLowerCase().replace(/-/g, ' ').includes(serviceCategory.toLowerCase())
            ) ?? cats[0];
            categoryId = matched?.id;
          }
        } catch {
          // silencioso — continuamos sin categoryId y el backend usará un default
        }
        const slug = `${serviceName.trim().toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;
        const description = serviceDescription.trim() || `Servicio profesional de ${serviceName.trim()}.`;
        try {
          const svcRes = await fetch('/api/catalog/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              artistId,
              name: serviceName.trim(),
              slug,
              description,
              categoryId,
              pricingType: 'FIXED',
              basePrice: Math.round(parseFloat(basePrice) || 0),
              currency: 'USD',
            }),
          });
          if (!svcRes.ok) {
            const svcErr = await svcRes.json().catch(() => ({}));
            console.error('Service creation failed:', svcErr);
            toast.warning('Perfil creado. El servicio no se publicó — créalo desde tu dashboard.');
          }
        } catch {
          toast.warning('Perfil creado. El servicio no se publicó — créalo desde tu dashboard.');
        }
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

      // Create or join band if artist selected banda_musical in onboarding
      if (bandName.trim()) {
        fetch('/api/bands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: bandName.trim(), country: 'GT', city: 'Guatemala' }),
        }).catch(() => { toast.warning('Tu perfil fue creado. Puedes configurar tu banda desde el dashboard.'); });
      } else if (pendingBandId) {
        fetch(`/api/bands/${pendingBandId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ join: true }),
        }).catch(() => {});
      }

      // Upload avatar if selected
      if (profilePhotoFile) {
        const fd = new FormData();
        fd.append('avatar', profilePhotoFile);
        await fetch('/api/users/avatar', { method: 'POST', body: fd, credentials: 'include' }).catch(() => {});
      }

      document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=strict';

      // Refresh token so user_role cookie reflects any role upgrade (cliente→ambos)
      await fetch('/api/auth/refresh-token', { method: 'POST', credentials: 'include' }).catch(() => {});

      // Full reload so the middleware reads updated cookies server-side.
      window.location.replace('/artist/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Hubo un error. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const canContinueStep2 = selectedDisciplines.length > 0;
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
        {currentStep === 2 && bandSubStep === null && (
          <div className="max-w-3xl mx-auto piums-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              ¿Cuál es tu <span className="text-orange-600">superpoder creativo</span>?
            </h2>
            <p className="text-gray-600 mb-8">
              Selecciona todas las disciplinas que aplican a tu perfil. Puedes elegir más de una.
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
              {filteredDisciplines.map((discipline) => {
                const isSelected = selectedDisciplines.includes(discipline.id);
                return (
                  <button
                    key={discipline.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDisciplines(prev => prev.filter(d => d !== discipline.id));
                        setSelectedTalentIds(prev => {
                          const next = { ...prev };
                          delete next[discipline.id];
                          return next;
                        });
                      } else {
                        setSelectedDisciplines(prev => [...prev, discipline.id]);
                      }
                    }}
                    className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="mb-3 flex justify-center"><discipline.Icon size={28} /></div>
                    <h3 className="font-semibold text-gray-900 mb-1">{discipline.name}</h3>
                    {discipline.subtitle && <p className="text-xs text-gray-500">{discipline.subtitle}</p>}
                  </button>
                );
              })}
            </div>
            {/* Especialidades por disciplina — múltiple selección */}
            {selectedDisciplines.filter(disc => disc !== 'other' && (TALENT_BY_DISCIPLINE[disc]?.length ?? 0) > 0).map(disc => {
              const discInfo = creativeDisciplines.find(d => d.id === disc);
              return (
                <div key={disc} className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Especialidades — {discInfo?.name} <span className="font-normal text-gray-500">(opcional, múltiple)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TALENT_BY_DISCIPLINE[disc].map((talent) => {
                      const isSelected = (selectedTalentIds[disc] ?? []).includes(talent.id);
                      return (
                        <button
                          key={talent.id}
                          type="button"
                          onClick={() => setSelectedTalentIds(prev => {
                            const ids = prev[disc] ?? [];
                            return {
                              ...prev,
                              [disc]: isSelected ? ids.filter(id => id !== talent.id) : [...ids, talent.id],
                            };
                          })}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                            isSelected
                              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:text-orange-600'
                          }`}
                        >
                          {talent.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Rol personalizado */}
            {selectedDisciplines.length > 0 && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿No encuentras tu especialidad? Escríbela
                  <span className="font-normal text-gray-500 ml-1">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="ej: Bajista de sesión, Trombonista de jazz, Beatboxer..."
                  maxLength={60}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none transition-all"
                />
                {customRole.trim().length >= 2 && (
                  <p className="text-xs text-orange-600 mt-1.5">Se añadirá a nuestro buscador para que clientes te encuentren.</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
              <button
                onClick={() => {
                  if (!canContinueStep2) return;
                  const hasBanda = (selectedTalentIds['musician'] ?? []).includes('banda_musical');
                  if (hasBanda && bandSubStep === null) {
                    setBandSubStep('ask');
                  } else {
                    setBandSubStep(null);
                    setCurrentStep(3);
                  }
                }}
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

        {/* ── Step 2.5: Sub-step banda ────────────────────────────── */}
        {currentStep === 2 && bandSubStep !== null && (
          <div className="max-w-lg mx-auto piums-fade-in">
            {/* Ask */}
            {bandSubStep === 'ask' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Las bandas en Piums son diferentes!</h2>
                  <p className="text-gray-600">
                    Tu banda puede tener su propio perfil, miembros y recibir bookings directamente. ¿Ya tienes una banda formada?
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setBandSubStep('create')}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 transition-all text-left group"
                  >
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Crear perfil de banda nueva</p>
                      <p className="text-sm text-gray-500">Fundas la banda aquí en Piums e invitas a tus músicos</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setBandSubStep('search')}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Unirme a una banda existente</p>
                      <p className="text-sm text-gray-500">Busca tu banda y solicita unirte</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setBandSubStep(null); setCurrentStep(3); }}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Continuar como músico individual</p>
                      <p className="text-sm text-gray-500">Puedes crear o unirte a una banda más adelante</p>
                    </div>
                  </button>
                </div>

                <button onClick={() => setBandSubStep(null)} className="mt-6 flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mx-auto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver a disciplinas
                </button>
              </>
            )}

            {/* Create band */}
            {bandSubStep === 'create' && (
              <>
                <button onClick={() => setBandSubStep('ask')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Atrás
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Cómo se llama tu banda?</h2>
                <p className="text-gray-600 mb-6">Podrás editarlo después. Elige un nombre que te represente.</p>
                <input
                  type="text"
                  value={bandName}
                  onChange={(e) => setBandName(e.target.value)}
                  placeholder="ej: Los Terrícolas, Marimba Chapina, The Groove..."
                  maxLength={80}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none transition-all text-lg mb-6"
                />
                <button
                  onClick={() => { setBandSubStep(null); setCurrentStep(3); }}
                  disabled={bandName.trim().length < 2}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear banda y continuar
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">La banda se crea cuando completes tu registro</p>
              </>
            )}

            {/* Search band */}
            {bandSubStep === 'search' && (
              <>
                <button onClick={() => setBandSubStep('ask')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Atrás
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Busca tu banda</h2>
                <p className="text-gray-600 mb-6">Encuentra tu banda en Piums y envía una solicitud para unirte.</p>
                <input
                  type="text"
                  value={bandSearchQuery}
                  onChange={async (e) => {
                    setBandSearchQuery(e.target.value);
                    if (e.target.value.trim().length < 2) { setBandSearchResults([]); return; }
                    setBandSearchLoading(true);
                    try {
                      const res = await fetch(`/api/bands?q=${encodeURIComponent(e.target.value)}`);
                      if (res.ok) setBandSearchResults(await res.json());
                    } finally { setBandSearchLoading(false); }
                  }}
                  placeholder="Nombre de la banda..."
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none transition-all mb-4"
                />
                {bandSearchLoading && <p className="text-sm text-gray-500 mb-3">Buscando...</p>}
                {bandSearchResults.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {bandSearchResults.map((band) => (
                      <button
                        key={band.id}
                        onClick={() => { setPendingBandId(band.id); setBandSubStep(null); setCurrentStep(3); }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                          pendingBandId === band.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{band.name}</p>
                          <p className="text-sm text-gray-500">{band.city}, {band.country}</p>
                        </div>
                        {pendingBandId === band.id && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">Seleccionada</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {bandSearchResults.length === 0 && bandSearchQuery.length >= 2 && !bandSearchLoading && (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No encontramos esa banda.</p>
                    <button onClick={() => setBandSubStep('create')} className="mt-2 text-sm text-orange-600 font-medium hover:underline">
                      ¿Quieres crearla?
                    </button>
                  </div>
                )}
                <button
                  onClick={() => { setBandSubStep(null); setCurrentStep(3); }}
                  disabled={!pendingBandId}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Solicitar unirme y continuar
                </button>
              </>
            )}
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
                          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                            selected
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/50'
                          }`}
                        >
                          {selected && (
                            <Check size={14} className="mr-1 shrink-0" />
                          )}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom equipment free-text */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Otro equipo</h3>
              <input
                type="text"
                placeholder="ej: Micrófono vintage, Mesa de mezclas profesional..."
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">Escribe equipo adicional que no esté en la lista</p>
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
                  {(selectedEquipment.length > 0 || customEquipment.trim()) ? `Continuar (${selectedEquipment.length + (customEquipment.trim() ? 1 : 0)} seleccionados)` : 'Continuar'}
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
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </div>
                  <input type="text" placeholder="URL de Spotify (perfil de artista)" value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none" />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <input type="text" placeholder="URL de YouTube (canal)" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 outline-none" />
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1 text-sm">Comisión de plataforma</h3>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      PIUMS cobra <strong>18% de comisión</strong> por cada reserva completada. El precio que ingresas es lo que paga el cliente. Tú recibes el <strong>82%</strong>.
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
                    {basePrice && parseFloat(basePrice) > 0 && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-700">Precio para el cliente</span>
                          <span className="text-sm font-semibold text-green-800">${parseFloat(basePrice).toFixed(2)} USD</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-green-700">Comisión PIUMS (18%)</span>
                          <span className="text-sm font-medium text-red-500">- ${(parseFloat(basePrice) * 0.18).toFixed(2)} USD</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-green-200">
                          <span className="text-xs font-semibold text-green-800">Tú recibes</span>
                          <span className="text-sm font-bold text-green-700">${(parseFloat(basePrice) * 0.82).toFixed(2)} USD</span>
                        </div>
                      </div>
                    )}
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
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-800">Sin servicio no aparecerás en búsquedas</p>
                      <p className="text-xs text-amber-700 mt-0.5">Los clientes no podrán encontrarte hasta que publiques al menos un servicio.</p>
                    </div>
                    <button onClick={handleSkip} className="shrink-0 text-xs text-amber-600 underline hover:text-amber-800 transition-colors whitespace-nowrap">
                      Omitir de todas formas
                    </button>
                  </div>
                </div>
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
                  USD
                  <span className="text-[10px] font-medium text-orange-500/80">(moneda global)</span>
                </div>
              </div>

              {/* Min / Max rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">¿Cuánto cobras por tus servicios?</label>
                <p className="text-xs text-gray-500 mb-3">Este rango aparece en tu perfil público para que los clientes sepan qué esperar antes de contactarte.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Precio mínimo</label>
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
                    <label className="block text-xs font-medium text-gray-600 mb-2">Precio máximo</label>
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

                {hourlyRateMin > 0 && hourlyRateMax > 0 && hourlyRateMin > hourlyRateMax && (
                  <p className="text-xs text-red-500 mt-2">El precio mínimo no puede ser mayor que el máximo</p>
                )}

                {/* Live preview */}
                {(hourlyRateMin > 0 || hourlyRateMax > 0) && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Así aparece en tu perfil</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                        {(selectedDisciplines[0] ?? 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Tu nombre de artista</p>
                        <p className="text-xs text-gray-500">
                          {hourlyRateMin > 0 && hourlyRateMax > 0
                            ? `Desde $${hourlyRateMin} – $${hourlyRateMax} USD`
                            : hourlyRateMin > 0
                            ? `Desde $${hourlyRateMin} USD`
                            : `Hasta $${hourlyRateMax} USD`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Coverage radius */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Distancia máxima a cubrir</label>
                <p className="text-xs text-gray-500 mb-3">¿Hasta qué distancia estás dispuesto a viajar para un evento?</p>
                <div className="flex flex-wrap gap-2">
                  {[10, 20, 30, 50, 100, 200].map(km => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => setCoverageRadius(km)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        coverageRadius === km
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                      }`}
                    >
                      {km} km
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCoverageRadius(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all flex items-center gap-1 ${
                      coverageRadius === null
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                    }`}
                  >
                    <Globe size={14} />
                    Nacional
                  </button>
                </div>
                {coverageRadius === null && (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-3">
                    Sin restricción geográfica — trabajas en cualquier ciudad del país. No se cobran viáticos ni traslado al cliente.
                  </p>
                )}
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
                      <div className="flex-1">
                        <p className="text-[10px] text-orange-500 font-medium mb-0.5">Desde</p>
                        <select
                          value={item.startTime}
                          onChange={e => { const v = e.target.value; setWeeklyAvailability(prev => prev.map((d, i) => i === idx ? { ...d, startTime: v } : d)); }}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 border border-orange-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                        >
                          {Array.from({ length: 48 }, (_, i) => {
                            const h = Math.floor(i / 2).toString().padStart(2, '0');
                            const m = i % 2 === 0 ? '00' : '30';
                            return `${h}:${m}`;
                          }).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-gray-300 text-lg mt-4">—</span>
                      <div className="flex-1">
                        <p className="text-[10px] text-orange-500 font-medium mb-0.5">Hasta</p>
                        <select
                          value={item.endTime}
                          onChange={e => { const v = e.target.value; setWeeklyAvailability(prev => prev.map((d, i) => i === idx ? { ...d, endTime: v } : d)); }}
                          className="w-full px-2 py-1.5 text-sm text-gray-900 border border-orange-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                        >
                          {Array.from({ length: 48 }, (_, i) => {
                            const h = Math.floor(i / 2).toString().padStart(2, '0');
                            const m = i % 2 === 0 ? '00' : '30';
                            return `${h}:${m}`;
                          }).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
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
              <svg className="h-5 w-5 shrink-0 text-[#FF6B35] mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
                        {docUploading[field] && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1.5 rounded-full">Subiendo…</span>
                          </div>
                        )}
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
                  className="px-8 py-3 bg-gradient-to-r from-[#FF6B35] to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center gap-2"
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

