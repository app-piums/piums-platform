import prisma from '../lib/prisma';
import { artistsClient, type ArtistData } from '../clients/artists.client';
import { catalogClient, type ServiceData } from '../clients/catalog.client';
import { reviewsClient } from '../clients/reviews.client';
import { bookingClient } from '../clients/booking.client';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { expandQuery } from '../utils/synonyms';
import { effectivePrice, priceTierRank, priceTierCompare } from '../utils/priceTier';
import type {
  SearchArtistsInput,
  SearchServicesInput,
  AutocompleteInput
} from '../schemas/search.schema';

// Builds a safe tsquery string from an array of terms.
// Each term is split on spaces, sanitized, and added with :* (prefix match).
// Terms are joined with | (OR), so any word match is enough.
function buildPrefixTsQuery(terms: string[]): string {
  const parts = terms
    .flatMap(t => t.toLowerCase().split(/\s+/))
    .map(w => w.replace(/[^\wáéíóúüñ]/g, '').trim())
    .filter(w => w.length > 1)
    .map(w => `${w}:*`);
  const unique = [...new Set(parts)];
  return unique.join(' | ');
}

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
      ...(specialties ?? []).filter(s => s !== 'OTRO'),
      ...(category && category !== 'OTRO' ? [category] : []),
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
      // minPrice/maxPrice ya no filtran: son señal de ordenamiento (ver priceTier)
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

    // Full-text search using tsvector + GIN index (accent-insensitive via spanish_unaccent config).
    // Falls back to ILIKE only if tsvector fails (e.g. migration not yet applied).
    if (query) {
      const expandedQuery = expandQuery(query);
      const tsqueryStr = buildPrefixTsQuery(expandedQuery);
      if (tsqueryStr) {
        try {
          const matchedIds = await prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "ArtistIndex"
            WHERE "isActive" = true
              AND "searchVector" @@ to_tsquery('spanish_unaccent', ${tsqueryStr})
          `;
          andConditions.push({ id: { in: matchedIds.map((r: { id: string }) => r.id) } });
        } catch (err: any) {
          logger.warn(`tsvector artist search failed, falling back to ILIKE: ${err.message}`);
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

    // Con rango de precio activo y sin sort explícito, ordenar por cercanía al
    // presupuesto (tier sort) en memoria: dentro del rango primero (más cercano
    // al máximo), luego fuera del rango por distancia, sin precio al final.
    const useTierSort =
      (minPrice != null || maxPrice != null) &&
      (!sortBy || sortBy === 'relevance');

    try {
      let artists: any[];
      let total: number;

      if (useTierSort) {
        const all = await prisma.artistIndex.findMany({
          where,
          orderBy: [{ averageRating: 'desc' }, { totalReviews: 'desc' }],
          take: 2000
        });
        total = all.length;
        artists = all
          .map((a: any) => ({ a, rank: priceTierRank(effectivePrice(a), minPrice, maxPrice) }))
          .sort((x: any, y: any) => priceTierCompare(x.rank, y.rank))
          .slice(skip, skip + limit!)
          .map((x: any) => x.a);
      } else {
        [artists, total] = await Promise.all([
          prisma.artistIndex.findMany({
            where,
            orderBy,
            skip,
            take: limit
          }),
          prisma.artistIndex.count({ where })
        ]);
      }

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

    // Full-text search via tsvector. Falls back to ILIKE if migration not yet applied.
    if (query) {
      const tsqueryStr = buildPrefixTsQuery([query]);
      if (tsqueryStr) {
        try {
          const textMatchIds = await prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "ServiceIndex"
            WHERE "searchVector" @@ to_tsquery('spanish_unaccent', ${tsqueryStr})
          `;
          where.id = { in: textMatchIds.map((r: { id: string }) => r.id) };
        } catch (err: any) {
          logger.warn(`tsvector service search failed, falling back to ILIKE: ${err.message}`);
          where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { artistName: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
            { category: { contains: query, mode: 'insensitive' } }
          ];
        }
      }
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
      const tsqueryStr = buildPrefixTsQuery([query]);

      if (type === 'artists' || type === 'all') {
        const artistLimit = type === 'all' ? Math.floor(limit! / 2) : limit!;
        try {
          if (tsqueryStr) {
            results.artists = await prisma.$queryRaw<any[]>`
              SELECT id, name, city, "averageRating", "totalReviews"
              FROM "ArtistIndex"
              WHERE "isActive" = true
                AND "searchVector" @@ to_tsquery('spanish_unaccent', ${tsqueryStr})
              ORDER BY ts_rank_cd("searchVector", to_tsquery('spanish_unaccent', ${tsqueryStr})) DESC,
                       "averageRating" DESC
              LIMIT ${artistLimit}
            `;
          }
        } catch (err: any) {
          logger.warn(`tsvector autocomplete artists failed, falling back to ILIKE: ${err.message}`);
          results.artists = await prisma.artistIndex.findMany({
            where: {
              isActive: true,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { specialties: { hasSome: [query] } }
              ]
            },
            select: { id: true, name: true, city: true, averageRating: true, totalReviews: true },
            take: artistLimit,
            orderBy: [{ averageRating: 'desc' }, { totalReviews: 'desc' }]
          });
        }
      }

      if (type === 'services' || type === 'all') {
        const serviceLimit = type === 'all' ? Math.floor(limit! / 2) : limit!;
        try {
          if (tsqueryStr) {
            results.services = await prisma.$queryRaw<any[]>`
              SELECT id, title, "artistName", category, price, city, "artistRating"
              FROM "ServiceIndex"
              WHERE "isActive" = true
                AND "searchVector" @@ to_tsquery('spanish_unaccent', ${tsqueryStr})
              ORDER BY ts_rank_cd("searchVector", to_tsquery('spanish_unaccent', ${tsqueryStr})) DESC,
                       "artistRating" DESC
              LIMIT ${serviceLimit}
            `;
          }
        } catch (err: any) {
          logger.warn(`tsvector autocomplete services failed, falling back to ILIKE: ${err.message}`);
          results.services = await prisma.serviceIndex.findMany({
            where: {
              isActive: true,
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } },
                { tags: { hasSome: [query] } }
              ]
            },
            select: { id: true, title: true, artistName: true, category: true, price: true, city: true, artistRating: true },
            take: serviceLimit,
            orderBy: [{ artistRating: 'desc' }, { totalBookings: 'desc' }]
          });
        }
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
          // Prepend the ArtistCategory enum value (e.g. "MUSICO") so that
          // category-based search filters (hasSome: ["MUSICO"]) work correctly.
          specialties: [
            ...new Set([
              ...(artist.category && artist.category !== 'OTRO' ? [artist.category] : []),
              ...(artist.specialties || []).filter((s: string) => s !== 'OTRO'),
            ]),
          ],
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
        avatar: artist.avatar ?? null,
        coverPhoto: artist.coverPhoto ?? null,
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
          isOnSale: (service as any).isOnSale || false,
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

    const tsSmart = buildPrefixTsQuery(expandedTerms);

    // Build service filter: tsvector for text match + structural filters via ORM
    const serviceWhereClause: any = {
      isActive: true,
      isAvailable: true,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(country && { country }),
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
      // Fetch service IDs via tsvector, then load full records with structural filters
      const serviceIdRows = tsSmart
        ? await prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "ServiceIndex"
            WHERE "isActive" = true AND "isAvailable" = true
              AND "searchVector" @@ to_tsquery('spanish_unaccent', ${tsSmart})
            ORDER BY ts_rank_cd("searchVector", to_tsquery('spanish_unaccent', ${tsSmart})) DESC
            LIMIT ${limit * 10}
          `.catch((err: any) => {
            logger.warn(`tsvector smartSearch services failed: ${err.message}`);
            return [] as Array<{ id: string }>;
          })
        : [];

      const [services, directArtistRows] = await Promise.all([
        serviceIdRows.length > 0
          ? prisma.serviceIndex.findMany({
              where: { ...serviceWhereClause, id: { in: serviceIdRows.map(r => r.id) } },
              orderBy: [{ artistRating: 'desc' }, { totalBookings: 'desc' }],
              take: limit * 5,
            })
          : Promise.resolve([] as any[]),
        tsSmart
          ? prisma.$queryRaw<Array<{ id: string }>>`
              SELECT id FROM "ArtistIndex"
              WHERE "isActive" = true
                AND "searchVector" @@ to_tsquery('spanish_unaccent', ${tsSmart})
              LIMIT ${limit * 5}
            `.catch((err: any) => {
              logger.error(`tsvector smartSearch artists failed: ${err.message}`);
              return [] as Array<{ id: string }>;
            })
          : Promise.resolve([] as Array<{ id: string }>),
      ]);

      const directArtistIds = directArtistRows.map((r: { id: string }) => r.id);
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
        const specialtiesLower = (a.specialties || []).map((s: string) => s.toLowerCase());

        const isNameMatch = exactTerms.some(t => nameLower.includes(t));
        const isBioMatch = exactTerms.some(t => bioLower.includes(t));
        const isSpecMatch = exactTerms.some(t => specialtiesLower.some((s: string) => s.includes(t)));

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

      // Build SmartResult array, sorted by score. Con rango de precio activo,
      // ordenar primero por cercanía al presupuesto (tier) y usar el score como
      // desempate dentro de cada tier.
      const priceRangeActive = minPrice != null || maxPrice != null;
      const artistById = new Map<string, any>(
        artists.map((a: any) => [a.id as string, a])
      );
      const smartEffectivePrice = (
        artistId: string,
        service: { price: number } | null
      ): number | null => {
        if (service?.price != null) return service.price;
        const a = artistById.get(artistId);
        return a ? effectivePrice(a) : null;
      };

      const sorted = Array.from(artistBestMatch.entries())
        .sort((a, b) => {
          if (priceRangeActive) {
            const cmp = priceTierCompare(
              priceTierRank(smartEffectivePrice(a[0], a[1].service), minPrice, maxPrice),
              priceTierRank(smartEffectivePrice(b[0], b[1].service), minPrice, maxPrice)
            );
            if (cmp !== 0) return cmp;
          }
          return b[1].score - a[1].score;
        })
        .slice((page - 1) * limit, page * limit);

      const results = sorted.map(([artistId, { service, score, isExactMatch }]) => {
        const artist = artists.find((a: { id: string }) => a.id === artistId);
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
  // ============================================================================
  // SONIDISTA SEARCH — encuentra artistas con especialidad "Sonidista"
  // ============================================================================

  async findSonidistas(params: { city?: string; limit?: number }) {
    const { city, limit = 10 } = params;

    const artists = await prisma.artistIndex.findMany({
      where: {
        isActive: true,
        isAvailable: true,
        specialties: { hasSome: ['Sonidista'] },
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
      },
      orderBy: { averageRating: 'desc' },
      take: limit * 3, // margen para cruzar con ServiceIndex
    });

    if (artists.length === 0) return [];

    const artistIds = artists.map(a => a.id);
    const mainServices = await prisma.serviceIndex.findMany({
      where: {
        artistId: { in: artistIds },
        isActive: true,
        OR: [{ isMainService: true }, { artistId: { in: artistIds } }],
      },
      orderBy: { isMainService: 'desc' },
    });

    // Por artista toma el primer servicio (main service o el primero disponible)
    const serviceByArtist = new Map<string, typeof mainServices[0]>();
    for (const svc of mainServices) {
      if (!serviceByArtist.has(svc.artistId)) {
        serviceByArtist.set(svc.artistId, svc);
      }
    }

    const candidates = artists
      .filter(a => serviceByArtist.has(a.id))
      .map(a => {
        const svc = serviceByArtist.get(a.id)!;
        return {
          serviceId: svc.id,
          artistId: a.id,
          artistName: a.name,
          artistRating: a.averageRating,
          price: svc.price,
          city: a.city ?? null,
          avatar: a.avatar ?? null,
        };
      })
      .slice(0, limit);

    return candidates;
  }
}

export const searchService = new SearchService();
