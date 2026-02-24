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

export interface ArtistProfile extends Artist {}

export interface Service {}

export interface Review {}

export interface Booking {}

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
}

export const sdk = new PiumsSDK();
export { PiumsSDK };
