import { PrismaClient } from '@prisma/client';
import { artistsClient, type ArtistData } from '../clients/artists.client';
import { catalogClient, type ServiceData } from '../clients/catalog.client';
import { reviewsClient } from '../clients/reviews.client';
import { bookingClient } from '../clients/booking.client';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { expandQuery } from '../utils/synonyms';
import type {
  SearchArtistsInput,
  SearchServicesInput,
  AutocompleteInput
} from '../schemas/search.schema';

const prisma = new PrismaClient();

export class SearchService {
  // ============================================================================
  // ARTIST SEARCH
  // ============================================================================

  async searchArtists(filters: SearchArtistsInput) {
    const {
      query,
      city,
      state,
      country,
      specialties,
      minRating,
      minPrice,
      maxPrice,
      isVerified,
      isAvailable,
      sortBy,
      page,
      limit
    } = filters;

    const skip = (page! - 1) * limit!;

    // Build where clause
    const where: any = {
      isActive: true,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(state && { state: { contains: state, mode: 'insensitive' } }),
      ...(country && {country}),
      ...(minRating && { averageRating: { gte: minRating } }),
      ...(minPrice && { hourlyRateMin: { gte: minPrice } }),
      ...(maxPrice && { hourlyRateMax: { lte: maxPrice } }),
      ...(isVerified !== undefined && { isVerified }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(specialties && specialties.length > 0 && {
        specialties: {
          hasSome: specialties
        }
      })
    };

    // Filter artists by absence visibility rules:
    // - VACATION: hidden in all countries (not visible anywhere)
    // - WORKING_ABROAD: only visible in their destination country
    if (country) {
      where.AND = [
        {
          OR: [
            { activeAbsenceType: null },
            {
              activeAbsenceType: 'WORKING_ABROAD',
              activeAbsenceDest: country,
            },
          ],
        },
      ];
    } else {
      // No country filter: hide VACATION and WORKING_ABROAD artists globally
      where.activeAbsenceType = null;
    }

    // Add text search if query provided
    if (query) {
      // Simple approach: search in name, bio, specialties, serviceTitles
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
        { specialties: { hasSome: [query] } },
        { serviceTitles: { hasSome: [query] } }
      ];
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'reviews':
        orderBy = { totalReviews: 'desc' };
        break;
      case 'price_low':
        orderBy = { hourlyRateMin: 'asc' };
        break;
      case 'price_high':
        orderBy = { hourlyRateMax: 'desc' };
        break;
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      default: // relevance
        // For relevance, we'll order by rating and reviews
        orderBy = [
          { averageRating: 'desc' },
          { totalReviews: 'desc' }
        ];
    }

    try {
      const [artists, total] = await Promise.all([
        prisma.artistIndex.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        prisma.artistIndex.count({ where })
      ]);

      // Log search query for analytics
      await this.logSearchQuery({
        query: query || '',
        queryType: 'ARTIST',
        filters,
        resultsCount: total
      });

      return {
        artists,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit!)
        }
      };
    } catch (error: any) {
      logger.error('Error searching artists', error);
      throw new AppError('Error al buscar artistas', 500);
    }
  }

  // ============================================================================
  // SERVICE SEARCH
  // ============================================================================

  async searchServices(filters: SearchServicesInput) {
    const {
      query,
      category,
      tags,
      artistId,
      city,
      state,
      country,
      minPrice,
      maxPrice,
      minRating,
      isAvailable,
      sortBy,
      page,
      limit
    } = filters;

    const skip = (page! - 1) * limit!;

    // Build where clause
    const where: any = {
      isActive: true,
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(artistId && { artistId }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(state && { state: { contains: state, mode: 'insensitive' } }),
      ...(country && { country }),
      ...(minPrice && { price: { gte: minPrice } }),
      ...(maxPrice && { price: { lte: maxPrice } }),
      ...(minRating && { artistRating: { gte: minRating } }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(tags && tags.length > 0 && {
        tags: {
          hasSome: tags
        }
      })
    };

    // Add text search if query provided
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { artistName: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
        { category: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'rating':
        orderBy = { artistRating: 'desc' };
        break;
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { totalBookings: 'desc' };
        break;
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      default: // relevance
        orderBy = [
          { artistRating: 'desc' },
          { totalBookings: 'desc' }
        ];
    }

    try {
      const [services, total] = await Promise.all([
        prisma.serviceIndex.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        prisma.serviceIndex.count({ where })
      ]);

      // Log search query for analytics
      await this.logSearchQuery({
        query: query || '',
        queryType: 'SERVICE',
        filters,
        resultsCount: total
      });

      return {
        services,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit!)
        }
      };
    } catch (error: any) {
      logger.error('Error searching services', error);
      throw new AppError('Error al buscar servicios', 500);
    }
  }

  // ============================================================================
  // AUTOCOMPLETE
  // ============================================================================

  async autocomplete(input: AutocompleteInput) {
    const { query, type, limit } = input;

    const results: any = {
      artists: [],
      services: [],
      suggestions: []
    };

    try {
      if (type === 'artists' || type === 'all') {
        results.artists = await prisma.artistIndex.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { specialties: { hasSome: [query] } }
            ]
          },
          select: {
            id: true,
            name: true,
            city: true,
            averageRating: true,
            totalReviews: true
          },
          take: type === 'all' ? Math.floor(limit! / 2) : limit,
          orderBy: [
            { averageRating: 'desc' },
            { totalReviews: 'desc' }
          ]
        });
      }

      if (type === 'services' || type === 'all') {
        results.services = await prisma.serviceIndex.findMany({
          where: {
            isActive: true,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } }
            ]
          },
          select: {
            id: true,
            title: true,
            artistName: true,
            category: true,
            price: true,
            city: true,
            artistRating: true
          },
          take: type === 'all' ? Math.floor(limit! / 2) : limit,
          orderBy: [
            { artistRating: 'desc' },
            { totalBookings: 'desc' }
          ]
        });
      }

      // Log autocomplete query
      await this.logSearchQuery({
        query,
        queryType: 'AUTOCOMPLETE',
        filters: { type },
        resultsCount: results.artists.length + results.services.length
      });

      return results;
    } catch (error: any) {
      logger.error('Error in autocomplete', error);
      throw new AppError('Error en autocompletado', 500);
    }
  }

  // ============================================================================
  // INDEXING
  // ============================================================================

  async indexArtist(artistId: string) {
    try {
      // Fetch artist data from artists-service
      const artist = await artistsClient.getArtist(artistId);
      if (!artist) {
        throw new AppError('Artista no encontrado', 404);
      }

      // Fetch artist rating from reviews-service
      const rating = await reviewsClient.getArtistRating(artistId);

      // Fetch artist services from catalog-service
      const services = await catalogClient.getServicesByArtist(artistId);

        // Fetch artist stats from booking-service
        const stats = await bookingClient.getArtistStats(artistId);

        // Build index data
        const indexData = {
          id: artist.id,
          name: artist.name,
          email: artist.email,
          bio: artist.bio,
          specialties: artist.specialties || [],
          city: artist.city,
          state: artist.state,
          country: artist.country,
          averageRating: rating?.averageRating || 0,
          totalReviews: rating?.totalReviews || 0,
          totalBookings: stats?.total || 0,
        responseRate: rating?.responseRate || 0,
        hourlyRateMin: artist.minHourlyRate,
        hourlyRateMax: artist.maxHourlyRate,
        isVerified: artist.isVerified,
        isActive: artist.isActive,
        isAvailable: artist.isAvailable,
        servicesCount: services.length,
        serviceIds: services.map(s => s.id),
        serviceTitles: services.map(s => s.title),
        mainServicePrice: (() => {
          const main = services.find((s: ServiceData) => s.isMainService) || services[0] || null;
          return main ? main.price : null;
        })(),
        mainServiceName: (() => {
          const main = services.find((s: ServiceData) => s.isMainService) || services[0] || null;
          return main ? main.title : null;
        })(),
        lastSyncedAt: new Date(),
        // Absence tracking: manual blackout takes priority; fall back to GPS-detected country
        ...((() => {
          const now = new Date();
          // 1. Check for active manual blackout
          const manualAbsence = (artist.blackouts ?? []).find((b: any) =>
            new Date(b.startAt) <= now && new Date(b.endAt) >= now
          );
          if (manualAbsence) {
            return {
              activeAbsenceType: manualAbsence.type ?? null,
              activeAbsenceUntil: new Date(manualAbsence.endAt),
              activeAbsenceDest: manualAbsence.destinationCountry ?? null,
            };
          }
          // 2. GPS-detected absence: artist is in a different country than their home
          if (artist.geoCountry && artist.geoCountry !== artist.country) {
            return {
              activeAbsenceType: 'WORKING_ABROAD',
              activeAbsenceUntil: null, // No fixed end date for geo-detected absence
              activeAbsenceDest: artist.geoCountry,
            };
          }
          // 3. No active absence
          return {
            activeAbsenceType: null,
            activeAbsenceUntil: null,
            activeAbsenceDest: null,
          };
        })())
      };

      // Upsert to index
      await prisma.artistIndex.upsert({
        where: { id: artistId },
        create: indexData,
        update: indexData
      });

      logger.info(`Artist indexed: ${artistId}`);
      return indexData;
    } catch (error: any) {
      logger.error(`Error indexing artist ${artistId}`, error);
      throw error;
    }
  }

  async indexService(serviceId: string) {
    try {
      // Fetch service data from catalog-service
      const service = await catalogClient.getService(serviceId);
      if (!service) {
        throw new AppError('Servicio no encontrado', 404);
      }

      // Fetch artist data
      const artist = await artistsClient.getArtist(service.artistId);
      if (!artist) {
        throw new AppError('Artista del servicio no encontrado', 404);
      }

      // Fetch artist rating
      const rating = await reviewsClient.getArtistRating(service.artistId);

        // Fetch artist stats from booking-service
        const stats = await bookingClient.getArtistStats(service.artistId);

        // Build index data
        const indexData = {
          id: service.id,
          artistId: service.artistId,
          artistName: artist.name,
          title: service.title,
          description: service.description,
          category: (typeof service.category === 'object' && service.category !== null)
            ? ((service.category as any).name ?? String(service.category))
            : (service.category as unknown as string) || '',
          tags: service.tags || [],
          price: service.price,
          currency: service.currency,
          pricingType: service.pricingType,
          duration: service.duration,
          capacity: service.capacity,
          city: service.location?.city || artist.city,
          state: service.location?.state || artist.state,
          country: service.location?.country || artist.country,
          artistRating: rating?.averageRating || 0,
          artistReviews: rating?.totalReviews || 0,
          artistBookings: stats?.total || 0,
          isActive: service.isActive,
          isAvailable: service.isAvailable,
          isMainService: service.isMainService || false,
          totalBookings: stats?.completed || 0,
        lastSyncedAt: new Date()
      };

      // Upsert to index
      await prisma.serviceIndex.upsert({
        where: { id: serviceId },
        create: indexData,
        update: indexData
      });

      logger.info(`Service indexed: ${serviceId}`);
      return indexData;
    } catch (error: any) {
      logger.error(`Error indexing service ${serviceId}`, error);
      throw error;
    }
  }

  async bulkIndexArtists(batchSize: number = 100) {
    try {
      await prisma.indexStatus.upsert({
        where: { indexType: 'ARTISTS' },
        create: {
          indexType: 'ARTISTS',
          status: 'INDEXING',
          totalRecords: 0,
          progress: 0
        },
        update: {
          status: 'INDEXING',
          progress: 0
        }
      });

      let page = 1;
      let hasMore = true;
      let totalIndexed = 0;

      while (hasMore) {
        const { artists, pagination } = await artistsClient.getAllArtists(page, batchSize);

        for (const artist of artists) {
          try {
            await this.indexArtist(artist.id);
            totalIndexed++;
          } catch (error: any) {
            logger.error(`Failed to index artist ${artist.id}`, error);
          }
        }

        hasMore = page < pagination.totalPages;
        page++;

        // Update progress
        const progress = (totalIndexed / pagination.total) * 100;
        await prisma.indexStatus.update({
          where: { indexType: 'ARTISTS' },
          data: {
            totalRecords: totalIndexed,
            progress,
            lastIndexedAt: new Date()
          }
        });
      }

      await prisma.indexStatus.update({
        where: { indexType: 'ARTISTS' },
        data: {
          status: 'COMPLETED',
          progress: 100,
          lastFullIndexAt: new Date()
        }
      });

      logger.info(`Bulk artist indexing completed: ${totalIndexed} artists`);
      return { totalIndexed };
    } catch (error: any) {
      await prisma.indexStatus.update({
        where: { indexType: 'ARTISTS' },
        data: {
          status: 'FAILED',
          lastError: error.message,
          errorCount: { increment: 1 }
        }
      });
      throw error;
    }
  }

  async bulkIndexServices(batchSize: number = 100) {
    try {
      await prisma.indexStatus.upsert({
        where: { indexType: 'SERVICES' },
        create: {
          indexType: 'SERVICES',
          status: 'INDEXING',
          totalRecords: 0,
          progress: 0
        },
        update: {
          status: 'INDEXING',
          progress: 0
        }
      });

      let page = 1;
      let hasMore = true;
      let totalIndexed = 0;

      while (hasMore) {
        const { services, pagination } = await catalogClient.getAllServices(page, batchSize);

        for (const service of services) {
          try {
            await this.indexService(service.id);
            totalIndexed++;
          } catch (error: any) {
            logger.error(`Failed to index service ${service.id}`, error);
          }
        }

        hasMore = page < pagination.totalPages;
        page++;

        // Update progress
        const progress = (totalIndexed / pagination.total) * 100;
        await prisma.indexStatus.update({
          where: { indexType: 'SERVICES' },
          data: {
            totalRecords: totalIndexed,
            progress,
            lastIndexedAt: new Date()
          }
        });
      }

      await prisma.indexStatus.update({
        where: { indexType: 'SERVICES' },
        data: {
          status: 'COMPLETED',
          progress: 100,
          lastFullIndexAt: new Date()
        }
      });

      logger.info(`Bulk service indexing completed: ${totalIndexed} services`);
      return { totalIndexed };
    } catch (error: any) {
      await prisma.indexStatus.update({
        where: { indexType: 'SERVICES' },
        data: {
          status: 'FAILED',
          lastError: error.message,
          errorCount: { increment: 1 }
        }
      });
      throw error;
    }
  }

  async getIndexStatus(type?: 'ARTISTS' | 'SERVICES') {
    try {
      if (type) {
        return await prisma.indexStatus.findUnique({
          where: { indexType: type }
        });
      } else {
        return await prisma.indexStatus.findMany();
      }
    } catch (error: any) {
      logger.error('Error getting index status', error);
      throw new AppError('Error al obtener estado de indexación', 500);
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  private async logSearchQuery(data: {
    query: string;
    queryType: 'ARTIST' | 'SERVICE' | 'AUTOCOMPLETE' | 'MIXED';
    filters: any;
    resultsCount: number;
  }) {
    try {
      await prisma.searchQuery.create({
        data: {
          query: data.query,
          queryType: data.queryType,
          filters: data.filters,
          resultsCount: data.resultsCount
        }
      });
    } catch (error) {
      // Don't throw, just log
      logger.warn('Failed to log search query', error);
    }
  }

  async getPopularSearches(limit: number = 10) {
    try {
      return await prisma.searchQuery.groupBy({
        by: ['query', 'queryType'],
        _count: {
          query: true
        },
        orderBy: {
          _count: {
            query: 'desc'
          }
        },
        take: limit,
        where: {
          query: {
            not: ''
          }
        }
      });
    } catch (error: any) {
      logger.error('Error getting popular searches', error);
      throw new AppError('Error al obtener búsquedas populares', 500);
    }
  }

  /**
   * Búsqueda inteligente: expande la query con sinónimos y busca en ServiceIndex.
   * Retorna un artista por cada resultado, con el servicio que mejor matchea.
   *
   * Lógica de scoring:
   *   exactMatch (title/description ILIKE term) → +3
   *   categoryMatch (category ILIKE term)       → +2
   *   artistRating × 0.3
   *   log(artistBookings + 1) × 0.2
   */
  async smartSearch(query: string, options: {
    page?: number;
    limit?: number;
    city?: string;
    country?: string;
    minPrice?: number;
    maxPrice?: number;
    minGuests?: number;
  } = {}) {
    const { page = 1, limit = 12, city, country, minPrice, maxPrice, minGuests } = options;

    const expandedTerms = expandQuery(query);
    logger.info(`smartSearch: "${query}" → [${expandedTerms.slice(0, 6).join(', ')}...]`);

    // Search in ServiceIndex: find services matching any expanded term
    const whereConditions: any[] = expandedTerms.flatMap(term => [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { category: { contains: term, mode: 'insensitive' } },
      { tags: { hasSome: [term] } },
    ]);

    const whereClause: any = {
      isActive: true,
      isAvailable: true,
      OR: whereConditions,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(country && { country }),
      ...(minPrice != null && { price: { gte: minPrice } }),
      ...(maxPrice != null && { price: { lte: maxPrice } }),
      ...(minGuests != null && { capacity: { gte: minGuests } }),
    };

    try {
      const services = await prisma.serviceIndex.findMany({
        where: whereClause,
        orderBy: [
          { artistRating: 'desc' },
          { totalBookings: 'desc' },
        ],
        take: limit * 5, // fetch more to deduplicate by artist
      });

      // Deduplicate: best-scored service per artist
      const artistBestMatch = new Map<string, {
        service: typeof services[0];
        score: number;
        isExactMatch: boolean;
      }>();

      const queryLower = query.toLowerCase();
      const exactTerms = expandedTerms.map(t => t.toLowerCase());

      for (const svc of services) {
        const titleLower = svc.title.toLowerCase();
        const descLower = svc.description.toLowerCase();
        const catLower = svc.category.toLowerCase();

        const isExactTitle = exactTerms.some(t => titleLower.includes(t));
        const isExactDesc = exactTerms.some(t => descLower.includes(t));
        const isCatMatch = exactTerms.some(t => catLower.includes(t));

        const score =
          (isExactTitle ? 3 : 0) +
          (isExactDesc ? 1 : 0) +
          (isCatMatch ? 2 : 0) +
          svc.artistRating * 0.3 +
          Math.log((svc.artistBookings || 0) + 1) * 0.2;

        const isExactMatch = isExactTitle || isExactDesc;

        const existing = artistBestMatch.get(svc.artistId);
        if (!existing || score > existing.score) {
          artistBestMatch.set(svc.artistId, { service: svc, score, isExactMatch });
        }
      }

      // Fetch artist index data for the matched artists
      const artistIds = Array.from(artistBestMatch.keys());
      const artists = await prisma.artistIndex.findMany({
        where: { id: { in: artistIds }, isActive: true },
      });

      // Build SmartResult array, sorted by score
      const sorted = Array.from(artistBestMatch.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice((page - 1) * limit, page * limit);

      const results = sorted.map(([artistId, { service, score, isExactMatch }]) => {
        const artist = artists.find(a => a.id === artistId);
        return {
          ...artist,
          matchedService: {
            id: service.id,
            name: service.title,
            price: service.price,
            currency: service.currency,
            pricingType: service.pricingType,
            isExactMatch,
          },
          score,
        };
      }).filter(r => r.id); // filter out if artist no longer in index

      await this.logSearchQuery({
        query,
        queryType: 'MIXED',
        filters: options as any,
        resultsCount: artistBestMatch.size,
      });

      return {
        artists: results,
        expandedTerms: expandedTerms.slice(0, 8),
        pagination: {
          page,
          limit,
          total: artistBestMatch.size,
          totalPages: Math.ceil(artistBestMatch.size / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error in smartSearch', error);
      throw new AppError('Error en búsqueda inteligente', 500);
    }
  }
}

export const searchService = new SearchService();
