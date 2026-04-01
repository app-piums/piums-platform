import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

// Algunos clientes siguen enviando campos legacy en español.
// Normalizamos esos payloads para que Prisma reciba los nombres correctos.
const normalizeArtistPayload = (data: any) => {
  if (!data || typeof data !== "object") {
    return data;
  }

  const normalized = { ...data };
  const legacyMappings: Array<[string, string]> = [
    ["ciudad", "city"],
    ["pais", "country"],
    ["experienceYears", "yearsExperience"],
  ];

  for (const [legacyKey, prismaKey] of legacyMappings) {
    if (Object.prototype.hasOwnProperty.call(normalized, legacyKey)) {
      normalized[prismaKey] = normalized[legacyKey];
      delete normalized[legacyKey];
    }
  }

  return normalized;
};

export class ArtistsService {
  /**
   * Crear perfil de artista
   */
  async createArtist(data: any) {
    try {
      // Verificar que no exista
      const existing = await prisma.artist.findUnique({
        where: { authId: data.authId },
      });

      if (existing) {
        throw new AppError(409, "Ya existe un perfil de artista con este usuario");
      }

      // Validar pricing
      if (data.hourlyRateMin && data.hourlyRateMax && data.hourlyRateMin > data.hourlyRateMax) {
        throw new AppError(400, "El precio mínimo no puede ser mayor al máximo");
      }

      const normalizedData = normalizeArtistPayload(data);

      const artist = await prisma.artist.create({
        data: {
          ...normalizedData,
          verificationStatus: "PENDING", // Siempre inicia en PENDING
        },
        include: {
          portfolio: true,
          certifications: true,
          availabilityRules: true,
          blackouts: true,
        },
      });

      logger.info("Artista creado", "ARTISTS_SERVICE", { artistId: artist.id, email: artist.email });
      return artist;
    } catch (error) {
      logger.error("Error creando artista", "ARTISTS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Obtener artista por ID
   */
  async getArtistById(id: string, includeInactive = false) {
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        portfolio: {
          orderBy: { order: "asc" },
        },
        certifications: {
          orderBy: { issuedAt: "desc" },
        },
        availabilityRules: {
          orderBy: { dayOfWeek: "asc" },
        },
        blackouts: true,
      },
    });

    if (!artist || artist.deletedAt || (!includeInactive && !artist.isActive)) {
      throw new AppError(404, "Artista no encontrado");
    }

    return artist;
  }

  /**
   * Obtener artista por authId
   */
  async getArtistByAuthId(authId: string) {
    const artist = await prisma.artist.findUnique({
      where: { authId },
      include: {
        portfolio: true,
        certifications: true,
        availabilityRules: true,
        blackouts: true,
      },
    });

    if (!artist || artist.deletedAt) {
      throw new AppError(404, "Artista no encontrado");
    }

    return artist;
  }

  /**
   * Actualizar perfil de artista
   */
  async updateArtist(id: string, data: any) {
    try {
      const existing = await prisma.artist.findUnique({ where: { id } });
      if (!existing || existing.deletedAt) {
        throw new AppError(404, "Artista no encontrado");
      }

      const normalizedData = normalizeArtistPayload(data);

      // Validar pricing si se actualiza
      if (normalizedData.hourlyRateMin !== undefined && normalizedData.hourlyRateMax !== undefined) {
        const min = normalizedData.hourlyRateMin ?? existing.hourlyRateMin;
        const max = normalizedData.hourlyRateMax ?? existing.hourlyRateMax;
        if (min && max && min > max) {
          throw new AppError(400, "El precio mínimo no puede ser mayor al máximo");
        }
      }

      const artist = await prisma.artist.update({
        where: { id },
        data: {
          ...normalizedData,
          updatedAt: new Date(),
        },
        include: {
          portfolio: true,
          certifications: true,
          availabilityRules: true,
          blackouts: true,
        },
      });

      logger.info("Artista actualizado", "ARTISTS_SERVICE", { artistId: id });
      return artist;
    } catch (error) {
      logger.error("Error actualizando artista", "ARTISTS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Eliminar perfil (soft delete)
   */
  async deleteArtist(id: string) {
    try {
      await prisma.artist.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      logger.info("Artista eliminado (soft delete)", "ARTISTS_SERVICE", { artistId: id });
      return { message: "Perfil de artista eliminado exitosamente" };
    } catch (error) {
      logger.error("Error eliminando artista", "ARTISTS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Buscar artistas con filtros
   */
  async searchArtists(filters: any) {
    const {
      q,
      category,
      city,
      country,
      lat,
      lng,
      radius,
      minRating,
      verificationStatus,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (q) {
      // Normalize the query (strip accents) to handle "musica" matching "música"
      const normalizedQ = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      where.OR = [
        { nombre:     { contains: normalizedQ, mode: 'insensitive' } },
        { artistName: { contains: normalizedQ, mode: 'insensitive' } },
        { bio:        { contains: normalizedQ, mode: 'insensitive' } },
        { city:       { contains: normalizedQ, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (minRating) where.rating = { gte: minRating };
    if (verificationStatus) where.verificationStatus = verificationStatus;

    // TODO: Implementar búsqueda por geolocalización con Prisma Raw Query
    // Por ahora, solo filtramos por ciudad/país

    const skip = (page - 1) * limit;

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { rating: "desc" },
          { reviewCount: "desc" },
        ],
        include: {
          portfolio: {
            where: { isFeatured: true },
            take: 3,
          },
        },
      }),
      prisma.artist.count({ where }),
    ]);

    return {
      artists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Agregar item al portfolio
   */
  async addPortfolioItem(artistId: string, data: any) {
    try {
      // Verificar que el artista existe
      const artist = await prisma.artist.findUnique({ where: { id: artistId } });
      if (!artist || artist.deletedAt) {
        throw new AppError(404, "Artista no encontrado");
      }

      const item = await prisma.portfolioItem.create({
        data: {
          ...data,
          artistId,
        },
      });

      logger.info("Item agregado al portfolio", "ARTISTS_SERVICE", { artistId, itemId: item.id });
      return item;
    } catch (error) {
      logger.error("Error agregando item al portfolio", "ARTISTS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Actualizar item del portfolio
   */
  async updatePortfolioItem(itemId: string, artistId: string, data: any) {
    try {
      const existing = await prisma.portfolioItem.findFirst({
        where: { id: itemId, artistId },
      });

      if (!existing) {
        throw new AppError(404, "Item de portfolio no encontrado");
      }

      const item = await prisma.portfolioItem.update({
        where: { id: itemId },
        data,
      });

      return item;
    } catch (error) {
      logger.error("Error actualizando item del portfolio", "ARTISTS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Eliminar item del portfolio
   */
  async deletePortfolioItem(itemId: string, artistId: string) {
    try {
      const existing = await prisma.portfolioItem.findFirst({
        where: { id: itemId, artistId },
      });

      if (!existing) {
        throw new AppError(404, "Item de portfolio no encontrado");
      }

      await prisma.portfolioItem.delete({
        where: { id: itemId },
      });

      logger.info("Item eliminado del portfolio", "ARTISTS_SERVICE", { itemId });
      return { message: "Item eliminado del portfolio" };
    } catch (error) {
      logger.error("Error eliminando item del portfolio", "ARTISTS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Agregar certificación
   */
  async addCertification(artistId: string, data: any) {
    try {
      const artist = await prisma.artist.findUnique({ where: { id: artistId } });
      if (!artist || artist.deletedAt) {
        throw new AppError(404, "Artista no encontrado");
      }

      const cert = await prisma.certification.create({
        data: {
          ...data,
          artistId,
          issuedAt: new Date(data.issuedAt),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });

      logger.info("Certificación agregada", "ARTISTS_SERVICE", { artistId, certId: cert.id });
      return cert;
    } catch (error) {
      logger.error("Error agregando certificación", "ARTISTS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Eliminar certificación
   */
  async deleteCertification(certId: string, artistId: string) {
    try {
      const existing = await prisma.certification.findFirst({
        where: { id: certId, artistId },
      });

      if (!existing) {
        throw new AppError(404, "Certificación no encontrada");
      }

      await prisma.certification.delete({
        where: { id: certId },
      });

      return { message: "Certificación eliminada" };
    } catch (error) {
      logger.error("Error eliminando certificación", "ARTISTS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Configurar disponibilidad
   */
  async setAvailability(artistId: string, availabilityData: any[]) {
    try {
      const artist = await prisma.artist.findUnique({ where: { id: artistId } });
      if (!artist || artist.deletedAt) {
        throw new AppError(404, "Artista no encontrado");
      }

      // Eliminar disponibilidad anterior
      await prisma.artistAvailabilityRule.deleteMany({
        where: { artistId },
      });

      // Crear nueva disponibilidad
      const availability = await prisma.artistAvailabilityRule.createMany({
        data: availabilityData.map((item) => ({
          ...item,
          artistId,
        })),
      });

      logger.info("Disponibilidad configurada", "ARTISTS_SERVICE", { artistId });
      
      // Retornar la disponibilidad creada
      const created = await prisma.artistAvailabilityRule.findMany({
        where: { artistId },
        orderBy: { dayOfWeek: "asc" },
      });

      return created;
    } catch (error) {
      logger.error("Error configurando disponibilidad", "ARTISTS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Obtener disponibilidad
   */
  async getAvailability(artistId: string) {
    const availability = await prisma.artistAvailabilityRule.findMany({
      where: { artistId },
      orderBy: { dayOfWeek: "asc" },
    });

    return availability;
  }
}
