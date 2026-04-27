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
      q,
      query: queryParam,
      category,
      city,
      state,
      country,
      specialties,
      minRating,
      minPrice,
      maxPrice,
      minGuests,
      isVerified,
      isAvailable,
      sortBy,
      page,
      limit
    } = filters;

    const skip = (page! - 1) * limit!;
    const query = q || queryParam;

    // Merge explicit category into specialties filter (ArtistIndex stores the
    // category value inside the specialties array, e.g. ['MUSICO', 'Guitarrista'])
    const allSpecialties = [
      ...(specialties ?? []),
      ...(category ? [category] : []),
    ];

    // Build where clause
    // By default (unless explicitly set to false) only verified artists are
    // shown in search results — an unverified profile is hidden.
    const verifiedFilter = isVerified === false ? undefined : true;
    const where: any = {
      isActive: true,
      servicesCount: { gt: 0 },
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(state && { state: { contains: state, mode: 'insensitive' } }),
      ...(country && {country}),
      ...(minRating && { averageRating: { gte: minRating } }),
      ...(minPrice && { hourlyRateMin: { gte: minPrice } }),
      ...(maxPrice && { hourlyRateMax: { lte: maxPrice } }),
      ...(verifiedFilter !== undefined && { isVerified: verifiedFilter }),
      ...(isAvailable !== undefined && { isAvailable }),
      // category is merged into allSpecialties above; minGuests has no ArtistIndex-level capacity field
      ...(allSpecialties.length > 0 && {
        specialties: {
          hasSome: allSpecialties
        }
      })
    };

    // Build AND conditions array to combine absence rules + text search
    const andConditions: any[] = [];

    // Filter artists by absence visibility rules:
    // - VACATION: hidden in all countries (not visible anywhere)
    // - WORKING_ABROAD: only visible in their destination country
    if (country) {
      andConditions.push({
        OR: [
          { activeAbsenceType: null },
          {
            activeAbsenceType: 'WORKING_ABROAD',
            activeAbsenceDest: country,
          },
        ],
      });
    } else {
      // No country filter: hide VACATION and WORKING_ABROAD artists globally
      where.activeAbsenceType = null;
    }

    // Add text search if query provided — uses unaccent for accent-insensitive
    // matching (e.g. "sofia" ↔ "Sofía", "fotografo" ↔ "fotógrafo").
    if (query) {
      const expandedQuery = expandQuery(query);
      const likePatterns = expandedQuery.map(t => `%${t.toLowerCase()}%`);
      try {
        const matchedIds = await prisma.$queryRaw<Array<{ id: string }>>`
          WITH patterns AS (
            SELECT unaccent(p) AS p FROM unnest(${likePatterns}::text[]) AS p
          )
          SELECT DISTINCT id
          FROM "ArtistIndex"
          WHERE "isActive" = true
            AND (
              unaccent(lower(name)) LIKE ANY(ARRAY(SELECT p FROM patterns))
              OR unaccent(lower(coalesce(bio, ''))) LIKE ANY(ARRAY(SELECT p FROM patterns))
              OR EXISTS (
                SELECT 1 FROM unnest(specialties) AS s
                WHERE unaccent(lower(s)) LIKE ANY(ARRAY(SELECT p FROM patterns))
              )
              OR EXISTS (
                SELECT 1 FROM unnest("serviceTitles") AS st
                WHERE unaccent(lower(st)) LIKE ANY(ARRAY(SELECT p FROM patterns))
              )
            )
        `;
        andConditions.push({ id: { in: matchedIds.map(r => r.id) } });
      } catch (err: any) {
        logger.warn(`Unaccent search failed, falling back to ILIKE: ${err.message}`);
        const fieldConditions: any[] = [];
        for (const term of expandedQuery) {
          fieldConditions.push({ name: { contains: term, mode: 'insensitive' } });
          fieldConditions.push({ bio: { contains: term, mode: 'insensitive' } });
          fieldConditions.push({ specialties: { hasSome: [term] } });
          fieldConditions.push({ serviceTitles: { hasSome: [term] } });
        }
        andConditions.push({ OR: fieldConditions });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
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
        // Derive boolean from the authoritative verificationStatus enum on
        // artists-service. The previous `artist.isVerified` field never
        // existed, so every artist was flagged as unverified.
        isVerified: (artist as any).verificationStatus === 'VERIFIED',
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
    isVerified?: boolean;
  } = {}) {
    const { page = 1, limit = 12, city, country, minPrice, maxPrice, minGuests, isVerified } = options;
    // Default: only verified artists. Pass isVerified=false explicitly to include unverified.
    const verifiedFilter = isVerified === false ? undefined : true;

    const expandedTerms = expandQuery(query);
    logger.info(`smartSearch: "${query}" → [${expandedTerms.slice(0, 6).join(', ')}...]`);

    // Search in ServiceIndex: find services matching any expanded term
    const whereConditions: any[] = expandedTerms.flatMap(term => [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { category: { contains: term, mode: 'insensitive' } },
      { tags: { hasSome: [term] } },
    ]);

    const serviceWhereClause: any = {
      isActive: true,
      isAvailable: true,
      OR: whereConditions,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(country && { country }),
      ...(minPrice != null && { price: { gte: minPrice } }),
      ...(maxPrice != null && { price: { lte: maxPrice } }),
      ...(minGuests != null && { capacity: { gte: minGuests } }),
    };

    // Also match artists directly by name / bio / specialties / service titles.
    // This lets queries like "cristofer", "Alejandro", "DJ Alex" resolve even
    // when the artist has no services indexed yet.
    // Uses `unaccent` so "sofia" matches "Sofía" and vice versa.
    const artistWhereClause: any = {
      isActive: true,
      ...(verifiedFilter !== undefined && { isVerified: verifiedFilter }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(country && { country }),
    };

    try {
      // Use raw SQL with unaccent for accent-insensitive artist matching.
      // We compute term LIKE patterns on the DB side.
      const likePatterns = expandedTerms.map(t => `%${t.toLowerCase()}%`);

      const [services, directArtistRows] = await Promise.all([
        prisma.serviceIndex.findMany({
          where: serviceWhereClause,
          orderBy: [
            { artistRating: 'desc' },
            { totalBookings: 'desc' },
          ],
          take: limit * 5,
        }),
        prisma.$queryRaw<Array<{ id: string }>>`
          WITH patterns AS (
            SELECT unaccent(p) AS p FROM unnest(${likePatterns}::text[]) AS p
          )
          SELECT DISTINCT id
          FROM "ArtistIndex"
          WHERE "isActive" = true
            AND (
              unaccent(lower(name)) LIKE ANY(ARRAY(SELECT p FROM patterns))
              OR unaccent(lower(coalesce(bio, ''))) LIKE ANY(ARRAY(SELECT p FROM patterns))
              OR EXISTS (
                SELECT 1 FROM unnest(specialties) AS s
                WHERE unaccent(lower(s)) LIKE ANY(ARRAY(SELECT p FROM patterns))
              )
              OR EXISTS (
                SELECT 1 FROM unnest("serviceTitles") AS st
                WHERE unaccent(lower(st)) LIKE ANY(ARRAY(SELECT p FROM patterns))
              )
            )
          LIMIT ${limit * 5}
        `.catch((err: any) => {
          logger.error(`Raw artist search failed: ${err.message}`);
          return [] as Array<{ id: string }>;
        }),
      ]);

      const directArtistIds = directArtistRows.map(r => r.id);
      const directArtistMatches = directArtistIds.length
        ? await prisma.artistIndex.findMany({
            where: { id: { in: directArtistIds }, ...artistWhereClause },
          })
        : [];

      // Deduplicate: best-scored service per artist (from ServiceIndex hits)
      const artistBestMatch = new Map<string, {
        service: typeof services[0] | null;
        score: number;
        isExactMatch: boolean;
      }>();

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

      // Merge direct artist matches (by name/bio/specialties). If an artist is
      // already matched via a service, keep the richer entry; otherwise add a
      // name-based match with a modest score.
      for (const a of directArtistMatches) {
        const nameLower = (a.name || '').toLowerCase();
        const bioLower = (a.bio || '').toLowerCase();
        const specialtiesLower = (a.specialties || []).map(s => s.toLowerCase());

        const isNameMatch = exactTerms.some(t => nameLower.includes(t));
        const isBioMatch = exactTerms.some(t => bioLower.includes(t));
        const isSpecMatch = exactTerms.some(t => specialtiesLower.some(s => s.includes(t)));

        const directScore =
          (isNameMatch ? 4 : 0) +
          (isSpecMatch ? 2 : 0) +
          (isBioMatch ? 1 : 0) +
          (a.averageRating || 0) * 0.3 +
          Math.log((a.totalBookings || 0) + 1) * 0.2;

        const existing = artistBestMatch.get(a.id);
        if (!existing) {
          artistBestMatch.set(a.id, {
            service: null,
            score: directScore,
            isExactMatch: isNameMatch,
          });
        } else if (directScore > existing.score) {
          artistBestMatch.set(a.id, {
            ...existing,
            score: directScore,
            isExactMatch: existing.isExactMatch || isNameMatch,
          });
        }
      }

      // Fetch artist index data for all matched artists
      const artistIds = Array.from(artistBestMatch.keys());
      const artists = artistIds.length
        ? await prisma.artistIndex.findMany({
            where: { id: { in: artistIds }, isActive: true, ...(verifiedFilter !== undefined && { isVerified: verifiedFilter }) },
          })
        : [];

      // Build SmartResult array, sorted by score
      const sorted = Array.from(artistBestMatch.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice((page - 1) * limit, page * limit);

      const results = sorted.map(([artistId, { service, score, isExactMatch }]) => {
        const artist = artists.find(a => a.id === artistId);
        if (!artist) return null;
        return {
          ...artist,
          matchedService: service
            ? {
                id: service.id,
                name: service.title,
                price: service.price,
                currency: service.currency,
                pricingType: service.pricingType,
                isExactMatch,
              }
            : null,
          score,
        };
      }).filter((r): r is NonNullable<typeof r> => r !== null);

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
