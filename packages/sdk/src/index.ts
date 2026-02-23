import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Artist,
  ArtistProfile,
  Service,
  Booking,
  CreateBookingRequest,
  Review,
  SearchParams,
  SearchResults,
  PaginationParams,
  City,
  Category,
} from './types';

export class PiumsSDK {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000/api/v1') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor para agregar token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor para manejar errores
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired o inválido
          this.token = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('piums_token');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('piums_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('piums_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('piums_token');
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getMe(): Promise<any> {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  // ============================================================================
  // Artists
  // ============================================================================

  async getArtists(params?: PaginationParams & { category?: string; cityId?: string }): Promise<SearchResults<Artist>> {
    const response = await this.client.get<SearchResults<Artist>>('/artists', { params });
    return response.data;
  }

  async getArtistById(id: string): Promise<ArtistProfile> {
    const response = await this.client.get<ArtistProfile>(`/artists/${id}`);
    return response.data;
  }

  async getArtistBySlug(slug: string): Promise<ArtistProfile> {
    const response = await this.client.get<ArtistProfile>(`/artists/slug/${slug}`);
    return response.data;
  }

  async searchArtists(params: SearchParams): Promise<SearchResults<Artist>> {
    const response = await this.client.get<SearchResults<Artist>>('/search/artists', { params });
    return response.data;
  }

  // ============================================================================
  // Services
  // ============================================================================

  async getServicesByArtist(artistId: string): Promise<Service[]> {
    const response = await this.client.get<Service[]>(`/artists/${artistId}/services`);
    return response.data;
  }

  async getServiceById(id: string): Promise<Service> {
    const response = await this.client.get<Service>(`/catalog/services/${id}`);
    return response.data;
  }

  // ============================================================================
  // Bookings
  // ============================================================================

  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    const response = await this.client.post<Booking>('/booking', data);
    return response.data;
  }

  async getBookings(params?: PaginationParams): Promise<SearchResults<Booking>> {
    const response = await this.client.get<SearchResults<Booking>>('/booking', { params });
    return response.data;
  }

  async getBookingById(id: string): Promise<Booking> {
    const response = await this.client.get<Booking>(`/booking/${id}`);
    return response.data;
  }

  async getBookingByCode(code: string): Promise<Booking> {
    const response = await this.client.get<Booking>(`/booking/code/${code}`);
    return response.data;
  }

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const response = await this.client.post<Booking>(`/booking/${id}/cancel`, { reason });
    return response.data;
  }

  // ============================================================================
  // Reviews
  // ============================================================================

  async getReviewsByArtist(artistId: string, params?: PaginationParams): Promise<SearchResults<Review>> {
    const response = await this.client.get<SearchResults<Review>>(`/reviews/artist/${artistId}`, { params });
    return response.data;
  }

  async createReview(data: { artistId: string; bookingId?: string; rating: number; comment?: string }): Promise<Review> {
    const response = await this.client.post<Review>('/reviews', data);
    return response.data;
  }

  // ============================================================================
  // Cities & Categories
  // ============================================================================

  async getCities(params?: { countryCode?: string; popular?: boolean }): Promise<City[]> {
    const response = await this.client.get<City[]>('/catalog/locations/cities', { params });
    return response.data;
  }

  async getCategories(params?: { featured?: boolean }): Promise<Category[]> {
    const response = await this.client.get<Category[]>('/catalog/categories', { params });
    return response.data;
  }

  // ============================================================================
  // Search
  // ============================================================================

  async search(query: string, params?: SearchParams): Promise<{
    artists: SearchResults<Artist>;
    services: SearchResults<Service>;
  }> {
    const response = await this.client.get('/search', { params: { query, ...params } });
    return response.data;
  }
}

// Export singleton instance
export const sdk = new PiumsSDK();

// Export types
export * from './types';
