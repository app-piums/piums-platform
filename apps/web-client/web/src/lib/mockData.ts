import type { ArtistProfile, Service, Review, PortfolioItem } from '@piums/sdk';

type ArtistWithRelations = ArtistProfile & {
  services?: Service[];
  reviews?: Review[];
};

const CATEGORIES = ['Fotografía', 'Música', 'DJ', 'Video', 'Catering', 'Decoración', 'Animación', 'Maquillaje', 'Flores', 'Iluminación'];

const CITIES = ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún'];

const BIOS: Record<string, string> = {
  'Fotografía':  'Fotógrafa profesional con más de 8 años de experiencia en bodas, eventos y sesiones creativas. Capturo momentos únicos que cuentan tu historia.',
  'Música':      'Músico versátil especializado en eventos corporativos y sociales. Amplio repertorio que va desde jazz hasta pop contemporáneo.',
  'DJ':          'DJ con residencias en los mejores clubes de la ciudad. Sets personalizados para bodas, fiestas y eventos empresariales de alto nivel.',
  'Video':       'Videógrafo cinematográfico especializado en bodas y eventos. Producción completa con edición profesional y entrega en 4K.',
  'Catering':    'Chef ejecutivo con formación en Europa. Menús personalizados para todo tipo de eventos, desde íntimos hasta corporativos de gran escala.',
  'Decoración':  'Diseñadora de eventos con ojo para el detalle. Transformo espacios ordinarios en ambientes mágicos e inolvidables.',
  'Animación':   'Animador y maestro de ceremonias con energía contagiosa. Especialista en bodas, XV años y eventos familiares.',
  'Maquillaje':  'Maquillista artística certificada en México y España. Especialidad en novias, eventos especiales y producciones fotográficas.',
  'Flores':      'Florista con 10 años de experiencia. Arreglos florales personalizados para bodas, eventos y espacios corporativos.',
  'Iluminación': 'Técnico de iluminación y efectos especiales. Diseño de ambientes lumínicos para todo tipo de evento.',
};

// ─── 20 Mock Artists ─────────────────────────────────────────────────────────
export const MOCK_ARTISTS: ArtistWithRelations[] = Array.from({ length: 20 }, (_, i) => {
  const cat = CATEGORIES[i % CATEGORIES.length];
  const names = [
    'Sarah Jiménez', 'Carlos Mendoza', 'DJ Alex Reyes', 'Ana Rodríguez',
    'Chef Marco Torres', 'Elena Vásquez', 'Bruno Morales', 'Sofía Castro',
    'Floreria Isabel', 'Luz Hernández', 'David Peña', 'Valentina López',
    'Foto Studio MX', 'Ritmo & Son', 'Carlos Beat', 'Cine Events',
    'Banquetes Reyes', 'Deco Dreams', 'Fiesta Total', 'GlamArt Studio',
  ];
  const id = `artist-${i + 1}`;
  const name = names[i];

  const services: Service[] = [
    {
      id: `svc-${id}-1`,
      artistId: id,
      name: cat === 'Fotografía' ? 'Sesión Básica (2 hrs)' : cat === 'Música' ? 'Set Acústico (2 hrs)' : `Servicio Básico - ${cat}`,
      description: `Servicio básico de ${cat.toLowerCase()} para eventos de hasta 50 personas. Incluye equipamiento estándar y edición/preparación profesional.`,
      basePrice: 80 + (i * 15),
      duration: 120,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: `svc-${id}-2`,
      artistId: id,
      name: cat === 'Fotografía' ? 'Sesión Premium (4 hrs)' : cat === 'Música' ? 'Set Completo (4 hrs)' : `Servicio Premium - ${cat}`,
      description: `Servicio premium de ${cat.toLowerCase()} para eventos de hasta 150 personas. Incluye equipo profesional completo, asistente y entrega express.`,
      basePrice: 180 + (i * 20),
      duration: 240,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: `svc-${id}-3`,
      artistId: id,
      name: `Paquete Full Day - ${cat}`,
      description: `Cobertura completa del evento desde preparativos hasta cierre. Ideal para bodas y eventos corporativos de gran escala.`,
      basePrice: 350 + (i * 25),
      duration: 480,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  const portfolio: PortfolioItem[] = Array.from({ length: 6 }, (_, j) => ({
    id: `port-${id}-${j}`,
    artistId: id,
    title: `Proyecto ${j + 1}`,
    description: `Trabajo realizado para evento especial`,
    imageUrl: `https://picsum.photos/seed/${id}-${j}/400/300`,
    category: cat,
    order: j,
    createdAt: '2024-01-01T00:00:00Z',
  }));

  const reviews: Review[] = Array.from({ length: 5 }, (_, j) => ({
    id: `rev-${id}-${j}`,
    userId: `user-${j + 100}`,
    artistId: id,
    rating: 4 + (j % 2 === 0 ? 1 : 0),
    comment: [
      '¡Excelente trabajo! Totalmente recomendado, superó mis expectativas.',
      'Muy profesional y puntual. El resultado fue increíble.',
      'Contratamos para nuestra boda y quedamos encantados. ¡Volvería a contratar!',
      'Gran calidad y atención al cliente. 100% confiable.',
      'Increíble talento y muy fácil de tratar. El evento salió perfecto.',
    ][j],
    createdAt: new Date(Date.now() - (j + 1) * 7 * 24 * 3600 * 1000).toISOString(),
  }));

  return {
    id,
    userId: `user-${id}`,
    nombre: name,
    slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    bio: BIOS[cat],
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    coverPhoto: `https://picsum.photos/seed/${id}-cover/800/400`,
    category: cat,
    cityId: CITIES[i % CITIES.length],
    experienceYears: 2 + (i % 10),
    rating: parseFloat((4.2 + (i % 8) * 0.1).toFixed(1)),
    reviewsCount: 8 + i * 3,
    bookingsCount: 20 + i * 5,
    isVerified: i % 3 !== 0,
    isActive: true,
    isPremium: i % 5 === 0,
    createdAt: '2024-01-01T00:00:00Z',
    portfolio,
    services,
    reviews,
    certifications: [],
  };
});

// ─── Lookup helpers ───────────────────────────────────────────────────────────
export function getMockArtist(idOrSlug: string): ArtistProfile | null {
  return MOCK_ARTISTS.find(a => a.id === idOrSlug || a.slug === idOrSlug) ?? null;
}

export function getMockServices(artistId: string): Service[] {
  const artist = MOCK_ARTISTS.find(a => a.id === artistId || a.slug === artistId);
  return artist?.services ?? [];
}

export function getMockReviews(artistId: string): Review[] {
  const artist = MOCK_ARTISTS.find(a => a.id === artistId || a.slug === artistId);
  return artist?.reviews ?? [];
}

// ─── Availability mock ─────────────────────────────────────────────────────────
export function getMockAvailability(artistId: string) {
  const today = new Date();
  const offset = artistId.length % 7;
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i + 1);
    const dateStr = date.toISOString().split('T')[0];
    const dayIndex = (i + offset) % 7;
    const isAvailable = dayIndex !== 0 && dayIndex !== 6; // evita fines de semana considerando offset
    return {
      date: dateStr,
      slots: isAvailable ? [
        { time: '09:00', available: true },
        { time: '11:00', available: true },
        { time: '14:00', available: i % 3 !== 0 },
        { time: '16:00', available: true },
      ] : [],
    };
  });
}
