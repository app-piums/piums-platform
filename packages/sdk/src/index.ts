// Types
export interface Artist {
  id: string;
  nombre: string;
  email?: string;
  categoria?: string;
  ciudad?: string;
  rating?: number;
  precioDesde?: number;
  imagenPerfil?: string;
  descripcion?: string;
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
  cityId?: string;
  experienceYears?: number;
  reviewsCount?: number;
  bookingsCount?: number;
  isVerified?: boolean;
  isActive?: boolean;
  isPremium?: boolean;
  createdAt?: string;
  portfolio?: PortfolioItem[];
  certifications?: Certification[];
}

export interface Service {
  id: string;
  artistId: string;
  name: string;
  description: string;
  basePrice: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
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
}

export interface SearchResults {
  artists: Artist[];
  total: number;
  page: number;
  totalPages: number;
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
  categoria?: string;
  ciudad?: string;
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

class PiumsSDK {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
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
      
      return await response.json();
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
      if (params?.categoria) queryParams.append('categoria', params.categoria);
      if (params?.ciudad) queryParams.append('ciudad', params.ciudad);

      const response = await fetch(`${this.baseUrl}/artists?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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
  
  async getArtist(id: string): Promise<ArtistProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/artists/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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

  async getArtistReviews(artistId: string, page: number = 1, limit: number = 10): Promise<{ reviews: Review[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/reviews?artistId=${artistId}&page=${page}&limit=${limit}&sortBy=createdAt&sortOrder=desc`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        reviews: result.data || result.reviews || [],
        total: result.total || 0,
        page: result.page || page,
        totalPages: result.totalPages || 1
      };
    } catch (error) {
      console.error('Error fetching artist reviews:', error);
      return { reviews: [], total: 0, page: 1, totalPages: 0 };
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
      const response = await fetch(`${this.baseUrl}/booking/availability/calendar?artistId=${artistId}&year=${year}&month=${month}`);
      
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
      const response = await fetch(`${this.baseUrl}/booking/availability/time-slots?artistId=${artistId}&date=${date}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching time slots:', error);
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
      const response = await fetch(`${this.baseUrl}/booking/availability/check-reservation?artistId=${artistId}&startAt=${startAt}&endAt=${endAt}`);
      
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
   * Crea una nueva reserva
   * @param payload Datos de la reserva
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    try {
      const response = await fetch(`${this.baseUrl}/booking/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Incluir cookies de autenticación
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
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
      const response = await fetch(`${this.baseUrl}/booking/bookings/${bookingId}`, {
        credentials: 'include', // Incluir cookies de autenticación
      });
      
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
}

export const sdk = new PiumsSDK();
export { PiumsSDK };
