import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class LocationService {
  // ==================== COUNTRIES ====================

  async listCountries(filters?: { isActive?: boolean; isPopular?: boolean }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.isPopular !== undefined) where.isPopular = filters.isPopular;

    return await prisma.country.findMany({
      where,
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    });
  }

  async getCountryByCode(code: string) {
    const country = await prisma.country.findUnique({
      where: { code },
      include: {
        states: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!country) {
      throw new AppError(404, "País no encontrado");
    }

    return country;
  }

  // ==================== STATES ====================

  async listStatesByCountry(countryId: string) {
    return await prisma.state.findMany({
      where: { countryId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async getStateByCode(countryId: string, code: string) {
    const state = await prisma.state.findFirst({
      where: { countryId, code },
      include: {
        country: true,
        cities: {
          where: { isActive: true },
          orderBy: [{ isPopular: "desc" }, { name: "asc" }],
        },
      },
    });

    if (!state) {
      throw new AppError(404, "Estado no encontrado");
    }

    return state;
  }

  // ==================== CITIES ====================

  async listCities(filters?: {
    stateId?: string;
    isActive?: boolean;
    isPopular?: boolean;
    search?: string;
  }) {
    const where: any = {};
    
    if (filters?.stateId) where.stateId = filters.stateId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.isPopular !== undefined) where.isPopular = filters.isPopular;
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { aliases: { has: filters.search } },
      ];
    }

    return await prisma.city.findMany({
      where,
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
      include: {
        state: {
          include: {
            country: true,
          },
        },
      },
    });
  }

  async getCityBySlug(slug: string) {
    const city = await prisma.city.findUnique({
      where: { slug },
      include: {
        state: {
          include: {
            country: true,
          },
        },
      },
    });

    if (!city) {
      throw new AppError(404, "Ciudad no encontrada");
    }

    return city;
  }

  async getCityById(id: string) {
    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        state: {
          include: {
            country: true,
          },
        },
      },
    });

    if (!city) {
      throw new AppError(404, "Ciudad no encontrada");
    }

    return city;
  }

  // ==================== DISTANCE CALCULATION ====================

  /**
   * Calcular distancia entre dos ciudades (en km)
   * Usa la fórmula de Haversine
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  async getCitiesNear(
    cityIdOrSlug: string,
    radiusKm: number = 50
  ) {
    // Obtener ciudad de referencia
    let referenceCity = await prisma.city.findUnique({
      where: { id: cityIdOrSlug },
    });

    if (!referenceCity) {
      referenceCity = await prisma.city.findUnique({
        where: { slug: cityIdOrSlug },
      });
    }

    if (!referenceCity) {
      throw new AppError(404, "Ciudad de referencia no encontrada");
    }

    // Obtener todas las ciudades activas
    const allCities = await prisma.city.findMany({
      where: { isActive: true },
      include: {
        state: {
          include: {
            country: true,
          },
        },
      },
    });

    // Filtrar por distancia
    const nearbyCities = allCities
      .map((city) => ({
        ...city,
        distance: this.calculateDistance(
          referenceCity.latitude,
          referenceCity.longitude,
          city.latitude,
          city.longitude
        ),
      }))
      .filter((city) => city.distance <= radiusKm && city.id !== referenceCity.id)
      .sort((a, b) => a.distance - b.distance);

    return nearbyCities;
  }
}

export const locationService = new LocationService();
