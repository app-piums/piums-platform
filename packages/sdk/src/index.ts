// Types
export interface Artist {
  id: string;
  nombre: string;
  slug?: string;
  coverPhoto?: string;
  email?: string;
  categoria?: string;
  ciudad?: string;
  city?: string;
  rating?: number;
  precioDesde?: number;
  imagenPerfil?: string;
  descripcion?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  avatar?: string;
  category?: string;
  bio?: string;
  reviewsCount?: number;
  bookingsCount?: number;
  experienceYears?: number;
  cityId?: string;
  coverageRadius?: number;
  mainServicePrice?: number;
  mainServiceName?: string;
  matchedService?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    pricingType: string;
    isExactMatch: boolean;
  };
}

export interface PortfolioItem {
  id: string;
  artistId: string;
  title: string;
  description?: string;
  imageUrl: string;
  order: number;
  createdAt: string;
}

export interface Certification {
  id: string;
  artistId: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
}

export interface ArtistProfile extends Artist {
  userId?: string;
  slug?: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;
  category?: string;
  specialties?: string[];
  cityId?: string;
  experienceYears?: number;
  reviewsCount?: number;
  bookingsCount?: number;
  isVerified?: boolean;
  isActive?: boolean;
  isPremium?: boolean;
  createdAt?: string;
  baseLocationLabel?: string;
  baseLocationLat?: number;
  baseLocationLng?: number;
  coverageRadius?: number;     // km incluidos sin costo de traslado
  hourlyRateMin?: number;      // precio mínimo por hora en centavos
  hourlyRateMax?: number;      // precio máximo por hora en centavos
  requiresDeposit?: boolean;
  depositPercentage?: number;
  portfolio?: PortfolioItem[];
  certifications?: Certification[];
}

export interface ServiceAddon {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  price: number;
  isRequired?: boolean;
  isOptional?: boolean;
  isDefault?: boolean;
  order?: number;
}

export interface Service {
  id: string;
  artistId: string;
  name: string;
  slug?: string;
  description: string;
  categoryId?: string;
  pricingType?: string;
  basePrice: number;
  currency?: string;
  duration?: number;       // legacy
  durationMin?: number;
  durationMax?: number;
  isActive?: boolean;      // legacy
  status?: string;         // ACTIVE | INACTIVE | ARCHIVED
  isAvailable?: boolean;
  thumbnail?: string;
  images?: string[];
  addons?: ServiceAddon[];
  whatIsIncluded?: string[];
  requiresDeposit?: boolean;
  depositAmount?: number;
  depositPercentage?: number;
  tags?: string[];
  viewCount?: number;
  minGuests?: number;
  maxGuests?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateServicePayload {
  artistId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  pricingType: 'FIXED' | 'HOURLY' | 'PER_SESSION' | 'CUSTOM';
  basePrice: number;
  currency?: string;
  durationMin?: number;
  durationMax?: number;
  whatIsIncluded?: string[];
  minGuests?: number;
  maxGuests?: number;
}

export interface UpdateServicePayload {
  artistId: string;
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  pricingType?: 'FIXED' | 'HOURLY' | 'PER_SESSION' | 'CUSTOM';
  basePrice?: number;
  currency?: string;
  durationMin?: number;
  durationMax?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  whatIsIncluded?: string[];
  minGuests?: number;
  maxGuests?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Review {
  id: string;
  userId: string;
  artistId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  code?: string;
  clientId: string;
  artistId: string;
  serviceId: string;
  scheduledDate: string; // ISO string
  startAt?: string;      // extended field from backend response
  endAt?: string;
  durationMinutes: number;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  status: string;
  servicePrice: number;
  addonsPrice: number;
  totalPrice: number;
  currency: string;
  depositRequired: boolean;
  depositAmount?: number;
  depositPaidAt?: string;
  paymentStatus: string;
  selectedAddons?: string[];
  clientNotes?: string;
  artistNotes?: string;
  cancellationReason?: string;
  cancelReason?: string;
  reviewId?: string | null;
  serviceName?: string;   // name of the booked service
  artistName?: string;    // name of the artist
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  clientId: string;
  artistId: string;
  serviceId: string;
  scheduledDate: string; // ISO string
  durationMinutes: number;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  selectedAddons?: string[];
  clientNotes?: string;
  eventId?: string;
}

export interface PriceItem {
  type: 'BASE' | 'ADDON' | 'TRAVEL' | 'DISCOUNT';
  name: string;
  qty: number;
  unitPriceCents: number;
  totalPriceCents: number;
  metadata?: Record<string, any>;
}

export interface PriceQuote {
  serviceId: string;
  currency: string;
  items: PriceItem[];
  subtotalCents: number;
  totalCents: number;
  depositRequiredCents?: number;
  breakdown: {
    baseCents: number;
    addonsCents: number;
    travelCents: number;
    discountsCents: number;
  };
}

export interface CalculateServicePricePayload {
  serviceId: string;
  durationMinutes?: number;
  selectedAddonIds?: string[];
  distanceKm?: number;
  locationLat?: number;
  locationLng?: number;
  discountCode?: string;
}

export interface SearchResults {
  artists: Artist[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SmartSearchParams {
  q: string;
  page?: number;
  limit?: number;
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  minGuests?: number;
}

export interface SmartSearchResults {
  artists: Artist[];
  expandedTerms: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchParams {
  query?: string;
  categoria?: string;
  ciudad?: string;
  precioMin?: number;
  precioMax?: number;
  rating?: number;
  page?: number;
  limit?: number;
}

export interface GetArtistsParams {
  page?: number;
  limit?: number;
  category?: string;
  city?: string;
  q?: string;
  minGuests?: number;
}

export interface CalendarData {
  artistId: string;
  year: number;
  month: number;
  occupiedDates: string[]; // Array de fechas YYYY-MM-DD
  blockedDates: string[];  // Array de fechas YYYY-MM-DD
}

export interface TimeSlot {
  time: string;       // HH:mm format (24h)
  available: boolean;
  startTime: string;  // ISO string
  endTime: string;    // ISO string
}

export interface TimeSlotsData {
  artistId: string;
  date: string;       // YYYY-MM-DD
  slots: TimeSlot[];
}

export interface AvailabilityCheckResult {
  hasReservation: boolean;
  bookingId?: string;
}

export interface BlockedSlot {
  id: string;
  artistId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  reason?: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface ArtistAvailabilityConfig {
  id: string;
  artistId: string;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  bufferMinutes: number;
  autoConfirm: boolean;
  requiresDeposit: boolean;
  cancellationHours: number;
  cancellationFee: number;
  workingHours?: Record<string, { start: string; end: string; enabled: boolean }>;
}

export interface BlockSlotPayload {
  artistId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  reason?: string;
  isRecurring?: boolean;
}

export interface TravelAbsence {
  id: string;
  artistId: string;
  startAt: string;   // ISO string
  endAt: string;     // ISO string
  type: 'VACATION' | 'WORKING_ABROAD';
  destinationCountry?: string | null; // ISO country code, e.g. 'MX'
  reason?: string | null;
  createdAt: string;
}

export interface CreateAbsencePayload {
  startAt: string;   // ISO string
  endAt: string;     // ISO string
  type: 'VACATION' | 'WORKING_ABROAD';
  destinationCountry?: string; // Required when type = WORKING_ABROAD
  reason?: string;
}

// ==================== PAYMENT TYPES ====================

export interface PaymentIntent {
  id: string;
  stripePaymentIntentId: string;
  userId: string;
  bookingId?: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
  paymentMethods: string[];
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentIntentId: string;
  stripePaymentId: string;
  userId: string;
  bookingId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  stripeRefundId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreatePaymentIntentPayload {
  bookingId?: string;
  amount: number;
  currency?: string;
  description?: string;
  paymentMethods?: string[];
  metadata?: Record<string, any>;
}

export interface ConfirmPaymentPayload {
  paymentIntentId: string;
}

export interface CreateRefundPayload {
  paymentId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

// ==================== REVIEW TYPES ====================

export interface ReviewPhoto {
  id: string;
  reviewId: string;
  url: string;
  caption?: string;
  order: number;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  artistId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDetailed {
  id: string;
  bookingId: string;
  clientId: string;
  artistId: string;
  serviceId: string;
  rating: number;
  comment?: string;
  status: string;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  photos?: ReviewPhoto[];
  response?: ReviewResponse;
}

export interface CreateReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
  photos?: Array<{ url: string; caption?: string }>;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}

export interface MarkHelpfulPayload {
  isHelpful: boolean;
}

export interface ReportReviewPayload {
  reason: string;
  description?: string;
}

export interface RespondReviewPayload {
  message: string;
}

export interface FilterReviewsParams {
  artistId?: string;
  clientId?: string;
  serviceId?: string;
  rating?: number;
  status?: string;
  hasComment?: boolean;
  hasPhotos?: boolean;
  sortBy?: 'recent' | 'rating_high' | 'rating_low' | 'helpful';
  page?: number;
  limit?: number;
}

export interface ArtistRating {
  artistId: string;
  totalReviews: number;
  averageRating: number;
  rating1: number;
  rating2: number;
  rating3: number;
  rating4: number;
  rating5: number;
  lastUpdated: string;
}

// ==================== CHAT TYPES ====================

export interface Conversation {
  id: string;
  userId: string;
  artistId: string;
  bookingId?: string;
  lastMessageAt: string;
  messages?: Message[];
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string; // user, artist
  content: string;
  type: string; // text, image, file
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface CreateConversationPayload {
  artistId: string;
  bookingId?: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: string;
}

// ==================== ADMIN TYPES ====================

export interface AdminStats {
  totalUsers: number;
  totalArtists: number;
  totalBookings: number;
  totalRevenue: number;
  recentUsers: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
  pendingReports: number;
  bookingsByMonth: Array<{ month: string; count: number }>;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  isBlocked: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  bookingsCount?: number;
  reviewsCount?: number;
  reportsCount?: number;
}

export interface AdminArtist extends AdminUser {
  category?: string;
  rating?: number;
  reviewsCount?: number;
  bookingsCount?: number;
}

export interface AdminBooking {
  id: string;
  userId: string;
  artistId: string;
  userName: string;
  artistName: string;
  service: string;
  date: string;
  status: string;
  amount: number;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  type: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetType: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  content?: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminArtistsResponse {
  artists: AdminArtist[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminBookingsResponse {
  bookings: AdminBooking[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminReportsResponse {
  reports: AdminReport[];
  total: number;
  page: number;
  limit: number;
}

class PiumsSDK {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '/api') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private getAuthToken(): string | null {
    if (this.authToken) {
      return this.authToken;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = window.localStorage.getItem('token');
      if (stored) {
        this.authToken = stored;
        return stored;
      }
    } catch (error) {
      console.warn('Unable to access localStorage for auth token:', error);
    }

    if (typeof document !== 'undefined') {
      const match = document.cookie?.match(/(?:^|;\s*)(auth_token|token)=([^;]+)/);
      if (match) {
        const cookieToken = decodeURIComponent(match[2]);
        this.authToken = cookieToken;
        return cookieToken;
      }
    }

    return null;
  }

  private withAuth(options?: RequestInit): RequestInit {
    const token = this.getAuthToken();
    if (!token) {
      return {
        ...(options || {}),
        credentials: 'include'
      };
    }

    const headers = new Headers(options?.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return {
      ...options,
      headers,
      credentials: 'include',
    };
  }

  async searchArtists(params?: SearchParams): Promise<SearchResults> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.query) queryParams.append('q', params.query);
      if (params?.categoria) queryParams.append('categoria', params.categoria);
      if (params?.ciudad) queryParams.append('ciudad', params.ciudad);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseUrl}/artists/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.pagination) {
        return {
          artists: data.artists ?? [],
          total: data.pagination.total ?? 0,
          page: data.pagination.page ?? 1,
          totalPages: data.pagination.totalPages ?? 1,
        };
      }
      return data;
    } catch (error) {
      console.error('Error searching artists:', error);
      return {
        artists: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }
  
  async getArtists(params?: GetArtistsParams): Promise<SearchResults> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);
      if (params?.city) queryParams.append('city', params.city);
      if (params?.q) queryParams.append('query', params.q);

      const response = await fetch(`${this.baseUrl}/search/artists?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Search service returns { artists: ArtistIndex[], pagination: {...} }
      // Map search index fields to Artist shape
      const artists = (data.artists ?? []).map((a: any) => ({
        ...a,
        nombre: a.nombre ?? a.name,
        rating: a.rating ?? a.averageRating,
        reviewsCount: a.reviewsCount ?? a.totalReviews,
        bookingsCount: a.bookingsCount ?? a.totalBookings,
        cityId: a.cityId ?? a.city,
      }));
      if (data.pagination) {
        return {
          artists,
          total: data.pagination.total ?? 0,
          page: data.pagination.page ?? 1,
          totalPages: data.pagination.totalPages ?? 1,
        };
      }
      return { ...data, artists };
    } catch (error) {
      console.error('Error fetching artists:', error);
      return {
        artists: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }
  
  async smartSearch(params: SmartSearchParams): Promise<SmartSearchResults> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', params.q);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.city) queryParams.append('city', params.city);
      if (params.country) queryParams.append('country', params.country);
      if (params.minPrice != null) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice != null) queryParams.append('maxPrice', params.maxPrice.toString());

      const response = await fetch(`${this.baseUrl}/search/smart?${queryParams.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const artists = (data.artists ?? []).map((a: any) => ({
        ...a,
        nombre: a.nombre ?? a.name,
        rating: a.rating ?? a.averageRating,
        reviewsCount: a.reviewsCount ?? a.totalReviews,
        bookingsCount: a.bookingsCount ?? a.totalBookings,
        cityId: a.cityId ?? a.city,
      }));
      return {
        artists,
        expandedTerms: data.expandedTerms ?? [],
        pagination: data.pagination ?? { page: 1, limit: 12, total: 0, totalPages: 0 },
      };
    } catch (error) {
      console.error('Error in smartSearch:', error);
      return { artists: [], expandedTerms: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } };
    }
  }

  async getArtist(id: string): Promise<ArtistProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/artists/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result && typeof result === 'object' && 'artist' in result) {
        return (result as { artist: ArtistProfile }).artist;
      }
      return result;
    } catch (error) {
      console.error('Error fetching artist:', error);
      return null;
    }
  }

  async getArtistServices(artistId: string): Promise<Service[]> {
    try {
      const response = await fetch(`${this.baseUrl}/catalog/services?artistId=${artistId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result.services || [];
    } catch (error) {
      console.error('Error fetching artist services:', error);
      return [];
    }
  }

  async getService(id: string): Promise<Service | null> {
    try {
      const response = await fetch(`${this.baseUrl}/catalog/services/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/catalog/categories`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.data || result.categories || result || [];
    } catch (error) {
      console.error('Error fetching service categories:', error);
      return [];
    }
  }

  async createService(payload: CreateServicePayload): Promise<Service> {
    const response = await fetch(
      `${this.baseUrl}/catalog/services`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
    );
    if (!response.ok) {
      let errMsg = `HTTP error! status: ${response.status}`;
      try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
      throw new Error(errMsg);
    }
    return response.json();
  }

  async updateService(id: string, payload: UpdateServicePayload): Promise<Service> {
    const response = await fetch(
      `${this.baseUrl}/catalog/services/${id}`,
      this.withAuth({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
    );
    if (!response.ok) {
      let errMsg = `HTTP error! status: ${response.status}`;
      try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
      throw new Error(errMsg);
    }
    return response.json();
  }

  async deleteService(id: string, artistId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/catalog/services/${id}?artistId=${encodeURIComponent(artistId)}`,
      this.withAuth({
        method: 'DELETE',
        credentials: 'include',
      })
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  }

  async toggleServiceStatus(id: string, artistId: string): Promise<Service> {
    const response = await fetch(
      `${this.baseUrl}/catalog/services/${id}/toggle-status`,
      this.withAuth({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ artistId }),
      })
    );
    if (!response.ok) {
      let errMsg = `HTTP error! status: ${response.status}`;
      try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
      throw new Error(errMsg);
    }
    return response.json();
  }

  async getArtistReviews(artistId: string, page: number = 1, limit: number = 10): Promise<{ reviews: Review[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/reviews?artistId=${artistId}&page=${page}&limit=${limit}&sortBy=recent`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const pagination = result.pagination || {};
      return {
        reviews: result.data || result.reviews || [],
        total: pagination.total ?? result.total ?? 0,
        page: pagination.page ?? result.page ?? page,
        totalPages: pagination.totalPages ?? result.totalPages ?? 1
      };
    } catch (error) {
      console.error('Error fetching artist reviews:', error);
      return { reviews: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  async calculateServicePrice(payload: CalculateServicePricePayload): Promise<PriceQuote | null> {
    try {
      const response = await fetch(`${this.baseUrl}/catalog/pricing/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (_error) {
      return null;
    }
  }

  /**
   * Obtiene el calendario de disponibilidad de un artista para un mes específico
   * @param artistId ID del artista
   * @param year Año (ej: 2026)
   * @param month Mes (1-12)
   */
  async getCalendar(artistId: string, year: number, month: number): Promise<CalendarData> {
    try {
      const response = await fetch(`${this.baseUrl}/availability/calendar?artistId=${artistId}&year=${year}&month=${month}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching calendar:', error);
      return {
        artistId,
        year,
        month,
        occupiedDates: [],
        blockedDates: [],
      };
    }
  }

  /**
   * Obtiene los slots de tiempo disponibles para una fecha específica
   * @param artistId ID del artista
   * @param date Fecha en formato YYYY-MM-DD
   */
  async getTimeSlots(artistId: string, date: string): Promise<TimeSlotsData> {
    try {
      const response = await fetch(`${this.baseUrl}/availability/time-slots?artistId=${artistId}&date=${date}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { artistId, date, slots: [] };
        }

        if (process.env.NODE_ENV !== 'production') {
          console.info('Time slots API returned non-OK status, using fallback.', {
            status: response.status,
          });
        }
        return { artistId, date, slots: [] };
      }
      
      return await response.json();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('Error fetching time slots, using fallback.', error);
      }
      return {
        artistId,
        date,
        slots: [],
      };
    }
  }

  /**
   * Verifica si hay un conflicto de reserva en el rango de tiempo solicitado
   * @param artistId ID del artista
   * @param startAt Fecha/hora de inicio (ISO string)
   * @param endAt Fecha/hora de fin (ISO string)
   */
  async checkAvailability(artistId: string, startAt: string, endAt: string): Promise<AvailabilityCheckResult> {
    try {
      const response = await fetch(`${this.baseUrl}/availability/check-reservation?artistId=${artistId}&startAt=${startAt}&endAt=${endAt}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        hasReservation: false,
      };
    }
  }

  /**
   * Devuelve los IDs de artistas con reservas PENDIENTES o CONFIRMADAS en una fecha (YYYY-MM-DD)
   */
  async getArtistsBusyOnDate(date: string): Promise<{ busyArtistIds: string[]; date: string }> {
    const response = await fetch(`${this.baseUrl}/availability/busy-artists?date=${encodeURIComponent(date)}`);
    if (!response.ok) throw new Error(`Error al consultar disponibilidad: ${response.status}`);
    return response.json();
  }

  /**
   * Bloquea un slot de tiempo en el calendario del artista
   */
  async blockSlot(payload: BlockSlotPayload): Promise<BlockedSlot> {
    const response = await fetch(
      `${this.baseUrl}/blocked-slots`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Obtiene los slots bloqueados de un artista
   */
  async getBlockedSlots(
    artistId: string,
    startDate?: string,
    endDate?: string
  ): Promise<BlockedSlot[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(
        `${this.baseUrl}/artists/${artistId}/blocked-slots${qs}`,
        this.withAuth({ credentials: 'include' })
      );
      if (!response.ok) return [];
      return response.json();
    } catch {
      return [];
    }
  }

  /**
   * Desbloquea un slot previamente bloqueado
   */
  async unblockSlot(slotId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/blocked-slots/${slotId}`,
      this.withAuth({ method: 'DELETE', credentials: 'include' })
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || `HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Obtiene la configuración de disponibilidad del artista
   */
  async getArtistAvailabilityConfig(artistId: string): Promise<ArtistAvailabilityConfig> {
    const response = await fetch(
      `${this.baseUrl}/artists/${artistId}/config`,
      this.withAuth({ credentials: 'include' })
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Actualiza la configuración de disponibilidad del artista
   */
  async updateArtistAvailabilityConfig(
    artistId: string,
    data: Partial<Omit<ArtistAvailabilityConfig, 'id' | 'artistId'>>
  ): Promise<ArtistAvailabilityConfig> {
    const response = await fetch(
      `${this.baseUrl}/artists/${artistId}/config`,
      this.withAuth({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ artistId, ...data }),
      })
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Obtiene las ausencias/viajes del artista autenticado
   */
  async getAbsences(): Promise<TravelAbsence[]> {
    const response = await fetch(
      `${this.baseUrl}/artists/dashboard/me/absences`,
      this.withAuth({ credentials: 'include' })
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.absences;
  }

  /**
   * Registra una nueva ausencia / viaje
   */
  async createAbsence(payload: CreateAbsencePayload): Promise<TravelAbsence> {
    const response = await fetch(
      `${this.baseUrl}/artists/dashboard/me/absences`,
      this.withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.absence;
  }

  /**
   * Elimina una ausencia por ID
   */
  async deleteAbsence(absenceId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/artists/dashboard/me/absences/${absenceId}`,
      this.withAuth({ method: 'DELETE', credentials: 'include' })
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || `HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Actualiza el país detectado por GPS del artista.
   * Pasar null cuando el artista está de vuelta en su país de origen.
   */
  async updateGeoCountry(country: string | null): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/artists/dashboard/me/geo-country`,
      this.withAuth({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ country }),
      })
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || `HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Crea una nueva reserva
   * @param payload Datos de la reserva
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    try {
      const response = await fetch(
        `${this.baseUrl}/bookings`,
        this.withAuth({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Incluir cookies y token de autenticación
          body: JSON.stringify(payload),
        })
      );
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Obtiene una reserva por ID
   * @param bookingId ID de la reserva
   */
  async getBooking(bookingId: string): Promise<Booking | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/bookings/${bookingId}`,
        this.withAuth({
          credentials: 'include',
        })
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching booking:', error);
      return null;
    }
  }

  /**
   * Lista todas las reservas del usuario autenticado
   * @param filters Filtros opcionales
   */
  async listBookings(filters?: {
    status?: string;
    artistId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ bookings: Booking[]; total: number; page: number; totalPages: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.artistId) params.append('artistId', filters.artistId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = `${this.baseUrl}/bookings${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(
        url,
        this.withAuth({
          credentials: 'include',
        })
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error listing bookings:', error);
      throw error;
    }
  }

  /**
   * Cancela una reserva
   * @param bookingId ID de la reserva
   * @param reason Razón de cancelación (opcional)
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    try {
      const response = await fetch(
        `${this.baseUrl}/bookings/${bookingId}/cancel`,
        this.withAuth({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ reason }),
        })
      );
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Actualiza la fecha de una reserva
   * @param bookingId ID de la reserva
   * @param scheduledDate Nueva fecha
   */
  async updateBookingDate(
    bookingId: string,
    scheduledDate: string
  ): Promise<Booking> {
    try {
      const response = await fetch(
        `${this.baseUrl}/bookings/${bookingId}`,
        this.withAuth({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ scheduledDate }),
        })
      );
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating booking date:', error);
      throw error;
    }
  }

  // ==================== PAYMENT METHODS ====================

  /**
   * Crea un Payment Intent para procesar un pago
   * @param payload Datos del pago
   */
  async createPaymentIntent(payload: CreatePaymentIntentPayload): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/payment-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirma un Payment Intent
   * @param paymentIntentId ID del payment intent
   */
  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/payment-intents/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ paymentIntentId }),
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Obtiene un pago por ID
   * @param paymentId ID del pago
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/payments/${paymentId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching payment:', error);
      return null;
    }
  }

  /**
   * Crea un reembolso para un pago
   * @param payload Datos del reembolso
   */
  async refundPayment(payload: CreateRefundPayload): Promise<Refund> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Obtiene un reembolso por ID
   * @param refundId ID del reembolso
   */
  async getRefundById(refundId: string): Promise<Refund | null> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/refunds/${refundId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching refund:', error);
      return null;
    }
  }

  // ==================== REVIEW METHODS ====================

  /**
   * Crea una nueva reseña para un booking completado
   * @param payload Datos de la reseña
   */
  async createReview(payload: CreateReviewPayload): Promise<ReviewDetailed> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/reviews`, this.withAuth({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }));
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const error = await response.json();
          // Prefer field-level Zod error messages over the generic message
          if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
            errorMessage = error.errors[0].message || error.message || errorMessage;
          } else {
            errorMessage = error.message || errorMessage;
          }
        } catch {
          const text = await response.text().catch(() => '');
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  /**
   * Lista reseñas con filtros
   * @param filters Filtros para la búsqueda
   */
  async listReviews(filters?: FilterReviewsParams): Promise<{ reviews: ReviewDetailed[]; total: number; page: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.artistId) queryParams.append('artistId', filters.artistId);
      if (filters?.clientId) queryParams.append('clientId', filters.clientId);
      if (filters?.serviceId) queryParams.append('serviceId', filters.serviceId);
      if (filters?.rating) queryParams.append('rating', filters.rating.toString());
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.hasComment !== undefined) queryParams.append('hasComment', filters.hasComment.toString());
      if (filters?.hasPhotos !== undefined) queryParams.append('hasPhotos', filters.hasPhotos.toString());
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseUrl}/reviews/reviews?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error listing reviews:', error);
      return { reviews: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Obtiene una reseña por ID
   * @param reviewId ID de la reseña
   */
  async getReviewById(reviewId: string): Promise<ReviewDetailed | null> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/reviews/${reviewId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching review:', error);
      return null;
    }
  }

  /**
   * Actualiza una reseña existente (solo autor, 24hrs después de creado)
   * @param reviewId ID de la reseña
   * @param payload Nuevos datos
   */
  async updateReview(reviewId: string, payload: UpdateReviewPayload): Promise<ReviewDetailed> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  /**
   * Elimina una reseña (soft delete)
   * @param reviewId ID de la reseña
   */
  async deleteReview(reviewId: string): Promise<{ message: string; review: ReviewDetailed }> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  /**
   * Marca una reseña como útil o no útil
   * @param reviewId ID de la reseña
   * @param isHelpful Si es útil o no
   */
  async markHelpful(reviewId: string, isHelpful: boolean): Promise<{ success: boolean; helpfulCount: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isHelpful }),
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      throw error;
    }
  }

  /**
   * Reporta una reseña como inapropiada
   * @param reviewId ID de la reseña
   * @param payload Datos del reporte
   */
  async reportReview(reviewId: string, payload: ReportReviewPayload): Promise<{ message: string; reportId: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }

  /**
   * Responde a una reseña (solo artistas)
   * @param reviewId ID de la reseña
   * @param message Mensaje de respuesta
   */
  async respondToReview(reviewId: string, message: string): Promise<ReviewResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error responding to review:', error);
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas de rating de un artista
   * @param artistId ID del artista
   */
  async getArtistRating(artistId: string): Promise<ArtistRating | null> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/artists/${artistId}/rating`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching artist rating:', error);
      return null;
    }
  }

  // ==================== ARTIST DASHBOARD METHODS ====================

  /**
   * Obtiene el perfil del artista autenticado (para dashboard)
   */
  async getArtistProfile(): Promise<ArtistProfile> {
    try {
      const response = await fetch(
        `${this.baseUrl}/artists/dashboard/me`,
        this.withAuth({
          credentials: 'include',
        })
      );
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      const result = await response.json();
      return result.artist;
    } catch (error) {
      console.error('Error fetching artist profile:', error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil del artista autenticado
   * @param data Datos a actualizar
   */
  async updateArtistProfile(data: Partial<ArtistProfile>): Promise<ArtistProfile> {
    try {
      const response = await fetch(
        `${this.baseUrl}/artists/dashboard/me`,
        this.withAuth({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        })
      );
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      const result = await response.json();
      return result.artist;
    } catch (error) {
      console.error('Error updating artist profile:', error);
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas del dashboard del artista
   */
  async getArtistStats(): Promise<{
    artistId: string;
    bookings: { total: number; thisMonth: number; pending: number; confirmed: number; completed: number };
    revenue: { total: number; thisMonth: number; currency: string };
    rating: { average: number; totalReviews: number };
    upcomingBookings: Booking[];
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/artists/dashboard/me/stats`,
        this.withAuth({
          credentials: 'include',
        })
      );
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      const result = await response.json();
      return result.stats;
    } catch (error) {
      console.error('Error fetching artist stats:', error);
      throw error;
    }
  }

  /**
   * Obtiene las reservas recibidas por el artista
   * @param filters Filtros de búsqueda
   */
  async getArtistBookings(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ bookings: Booking[]; total: number; page: number; totalPages: number; artistId: string }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = `${this.baseUrl}/artists/dashboard/me/bookings${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, this.withAuth({ credentials: 'include' }));
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching artist bookings:', error);
      throw error;
    }
  }

  /**
   * Acepta una reserva (solo artistas)
   * @param bookingId ID de la reserva
   */
  async acceptBooking(bookingId: string): Promise<{ message: string; bookingId: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/artists/dashboard/me/bookings/${bookingId}/accept`,
        this.withAuth({
          method: 'PATCH',
          credentials: 'include',
        })
      );
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error accepting booking:', error);
      throw error;
    }
  }

  /**
   * Rechaza una reserva (solo artistas)
   * @param bookingId ID de la reserva
   * @param reason Razón del rechazo (opcional)
   */
  async declineBooking(bookingId: string, reason?: string): Promise<{ message: string; bookingId: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/artists/dashboard/me/bookings/${bookingId}/decline`,
        this.withAuth({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ reason }),
        })
      );
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error declining booking:', error);
      throw error;
    }
  }

  /**
   * Marca una reserva como completada (solo artistas)
   * @param bookingId ID de la reserva
   */
  async completeBooking(bookingId: string): Promise<{ message: string; bookingId: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/artists/dashboard/me/bookings/${bookingId}/complete`,
        this.withAuth({
          method: 'PATCH',
          credentials: 'include',
        })
      );

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    }
  }

  async artistCancelBooking(bookingId: string, reason: string): Promise<{ message: string; bookingId: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/artists/dashboard/me/bookings/${bookingId}/cancel`,
        this.withAuth({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason }),
        })
      );

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // ==================== CHAT METHODS ====================

  /**
   * Lista las conversaciones del usuario
   * @param page Página actual
   * @param limit Cantidad por página
   */
  async getConversations(page: number = 1, limit: number = 20): Promise<{
    conversations: Conversation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`${this.baseUrl}/chat/conversations?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Obtiene una conversación específica con sus mensajes
   * @param conversationId ID de la conversación
   */
  async getConversation(conversationId: string): Promise<{ conversation: Conversation }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/conversations/${conversationId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva conversación
   * @param payload Datos de la conversación
   */
  async createConversation(payload: CreateConversationPayload): Promise<{ conversation: Conversation }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Obtiene los mensajes de una conversación
   * @param conversationId ID de la conversación
   * @param page Página actual
   * @param limit Cantidad por página
   */
  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<{
    messages: Message[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`${this.baseUrl}/chat/messages/${conversationId}?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Envía un mensaje (REST API - también disponible via WebSocket)
   * @param payload Datos del mensaje
   */
  async sendMessage(payload: SendMessagePayload): Promise<{ message: Message }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Marca un mensaje como leído
   * @param messageId ID del mensaje
   */
  async markMessageAsRead(messageId: string): Promise<{ message: Message }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/messages/${messageId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Marca una conversación completa como leída
   * @param conversationId ID de la conversación
   */
  async markConversationAsRead(conversationId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/conversations/${conversationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  /**
   * Obtiene el contador de mensajes no leídos
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/messages/unread-count`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION METHODS ====================

  /**
   * Obtiene las notificaciones del usuario autenticado
   */
  async getNotifications(filters?: { status?: string; page?: number; limit?: number }): Promise<{ notifications: any[]; total: number; page: number; totalPages: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));
      const qs = params.toString();
      const response = await fetch(
        `${this.baseUrl}/notifications${qs ? `?${qs}` : ''}`,
        this.withAuth({ credentials: 'include' })
      );
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Marca las notificaciones indicadas como leídas
   */
  async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/notifications/read`,
        this.withAuth({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notificationIds }),
        })
      );
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Obtiene estadísticas generales del admin
   * (Solo admins)
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/stats`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  /**
   * Obtiene lista de usuarios
   * (Solo admins)
   */
  async getAdminUsers(params?: { page?: number; limit?: number; search?: string; role?: string }): Promise<AdminUsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.role) queryParams.append('role', params.role);

      const response = await fetch(`${this.baseUrl}/admin/users?${queryParams.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw error;
    }
  }

  /**
   * Obtiene detalle de un usuario
   * (Solo admins)
   */
  async getAdminUserDetail(userId: string): Promise<AdminUser> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user detail:', error);
      throw error;
    }
  }

  /**
   * Bloquea o desbloquea un usuario
   * (Solo admins)
   */
  async toggleBlockUser(userId: string, isBlocked: boolean, reason?: string): Promise<{ message: string; user: AdminUser }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isBlocked, reason })
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error toggling user block:', error);
      throw error;
    }
  }

  /**
   * Obtiene lista de artistas
   * (Solo admins)
   */
  async getAdminArtists(params?: { page?: number; limit?: number; search?: string; verified?: string }): Promise<AdminArtistsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.verified !== undefined) queryParams.append('verified', params.verified);

      const response = await fetch(`${this.baseUrl}/admin/artists?${queryParams.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching admin artists:', error);
      throw error;
    }
  }

  /**
   * Verifica o desverifica un artista
   * (Solo admins)
   */
  async verifyArtist(artistId: string, isVerified: boolean): Promise<{ message: string; artist: AdminArtist }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/artists/${artistId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isVerified })
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error verifying artist:', error);
      throw error;
    }
  }

  /**
   * Obtiene lista de todas las reservas
   * (Solo admins)
   */
  async getAdminBookings(params?: { page?: number; limit?: number; status?: string }): Promise<AdminBookingsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`${this.baseUrl}/admin/bookings?${queryParams.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching admin bookings:', error);
      throw error;
    }
  }

  // ─── Disputes ────────────────────────────────────────────────────────────────

  async createDispute(payload: {
    bookingId: string;
    disputeType: string;
    subject: string;
    description: string;
    reportedAgainst?: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/disputes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async getMyDisputes(): Promise<{ asReporter: any[]; asReported: any[]; total: number }> {
    const response = await fetch(`${this.baseUrl}/disputes/me`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async getDisputeById(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/disputes/${id}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async addDisputeMessage(disputeId: string, message: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/disputes/${disputeId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  /**
   * Obtiene lista de reportes
   * (Solo admins)
   */
  async getAdminReports(params?: { page?: number; limit?: number; status?: string }): Promise<AdminReportsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`${this.baseUrl}/admin/reports?${queryParams.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching admin reports:', error);
      throw error;
    }
  }

  /**
   * Resuelve un reporte
   * (Solo admins)
   */
  async resolveReport(reportId: string, action: 'approve' | 'reject' | 'delete_content', reason?: string): Promise<{ message: string; reportId: string; action: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, reason })
      });
      
      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try { const e = await response.json(); errMsg = (e as any).message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error resolving report:', error);
      throw error;
    }
  }

  // ============================================================================
  // Events
  // ============================================================================

  async createEvent(payload: { name: string; description?: string; location?: string; locationLat?: number; locationLng?: number; notes?: string; eventDate?: string }) {
    const response = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  }

  async getClientEvents(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/events`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  }

  async getEvent(eventId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  }

  async updateEvent(eventId: string, payload: { name?: string; description?: string; location?: string; notes?: string; eventDate?: string }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  }

  async cancelEvent(eventId: string, cancelBookings: boolean): Promise<any> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ cancelBookings }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  }

  async addBookingToEvent(eventId: string, bookingId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bookingId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  }

  async removeBookingFromEvent(eventId: string, bookingId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/bookings/${bookingId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
  }

  async getEventBreakdown(eventId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/breakdown`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  }
}

export const sdk = new PiumsSDK();
export { PiumsSDK };
