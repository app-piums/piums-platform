import { PrismaClient } from '@prisma/client';
import { artistsClient, type ArtistData } from '../clients/artists.client';
import { catalogClient, type ServiceData } from '../clients/catalog.client';
import { reviewsClient } from '../clients/reviews.client';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
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
        totalBookings: 0, // TODO: Add booking stats
        responseRate: rating?.responseRate || 0,
        hourlyRateMin: artist.minHourlyRate,
        hourlyRateMax: artist.maxHourlyRate,
        isVerified: artist.isVerified,
        isActive: artist.isActive,
        isAvailable: artist.isAvailable,
        servicesCount: services.length,
        serviceIds: services.map(s => s.id),
        serviceTitles: services.map(s => s.title),
        lastSyncedAt: new Date()
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

      // Build index data
      const indexData = {
        id: service.id,
        artistId: service.artistId,
        artistName: artist.name,
        title: service.title,
        description: service.description,
        category: service.category,
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
        artistBookings: 0, // TODO: Add booking stats
        isActive: service.isActive,
        isAvailable: service.isAvailable,
        totalBookings: 0, // TODO: Add service booking stats
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
}

export const searchService = new SearchService();
