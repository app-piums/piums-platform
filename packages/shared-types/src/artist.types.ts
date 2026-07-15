// ============================================================================
// @piums/shared-types — Artist domain types
// ============================================================================

export interface Artist {
  id: string;
  userId: string;
  nombre: string;
  slug: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;
  category?: string;
  cityId?: string;
  city?: string;
  experienceYears?: number;
  coverageRadius?: number | null;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  requiresDeposit?: boolean;
  depositPercentage?: number;
  rating?: number;
  reviewsCount?: number;
  bookingsCount?: number;
  isVerified: boolean;
  isActive: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistProfile extends Artist {
  portfolio?: PortfolioItem[];
  certifications?: Certification[];
  services?: ArtistService[];
  reviews?: import('./review.types').ReviewSummary[];
}

export interface PortfolioItem {
  id: string;
  artistId: string;
  title: string;
  description?: string;
  type?: string; // "image" | "video" | "audio"
  url?: string;
  /** @deprecated El servidor devuelve `url`. Se mantiene por compatibilidad. */
  imageUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  // Video subido. Regla única para todos los clientes:
  //   type === 'video' && videoSource === 'cloudinary' ⇒ MP4 propio (reproductor nativo)
  //   type === 'video' && videoSource !== 'cloudinary' ⇒ enlace de YouTube (cubre NULL legacy)
  videoSource?: 'youtube' | 'cloudinary' | null;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
  order: number;
  createdAt: string;
}

export interface CreatePortfolioItemRequest {
  title: string;
  description?: string;
  type?: string;
  url?: string;
  thumbnailUrl?: string;
  category?: string;
  order?: number;
}

export interface Certification {
  id: string;
  artistId: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  createdAt: string;
}

export interface CreateCertificationRequest {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string;
}

export interface ArtistService {
  id: string;
  artistId: string;
  name: string;
  slug?: string;
  description: string;
  categoryId?: string;
  pricingType?: 'FIXED' | 'HOURLY' | 'QUOTE';
  basePrice: number;
  currency: string;
  durationMin?: number;
  durationMax?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface AvailabilitySlot {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isAvailable: boolean;
}

export interface ArtistAvailability {
  artistId: string;
  slots: AvailabilitySlot[];
  updatedAt: string;
}

export interface ArtistStats {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  reviewsCount: number;
  avgRating: number;
  repeatClientsCount: number;
}

export interface CreateArtistRequest {
  nombre: string;
  bio?: string;
  category?: string;
  cityId?: string;
  experienceYears?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  requiresDeposit?: boolean;
  depositPercentage?: number;
}

export type UpdateArtistRequest = Partial<CreateArtistRequest>;

export interface ArtistSearchResult {
  id: string;
  nombre: string;
  slug: string;
  avatar?: string;
  category?: string;
  city?: string;
  rating?: number;
  reviewsCount?: number;
  hourlyRateMin?: number;
  isVerified: boolean;
  isPremium: boolean;
}
