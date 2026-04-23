import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';
import { addDynamicSynonym, hasSynonym } from '../utils/synonyms';
import {
  searchArtistsSchema,
  searchServicesSchema,
  autocompleteSchema,
  indexArtistSchema,
  indexServiceSchema,
  bulkIndexSchema,
  smartSearchSchema,
} from '../schemas/search.schema';

export const searchController = {
  // Search artists
  async searchArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = searchArtistsSchema.parse(req.query);
      const result = await searchService.searchArtists(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Smart search with synonym expansion
  async smartSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page, limit, city, country, minPrice, maxPrice, minGuests, isVerified } = smartSearchSchema.parse(req.query);
      const result = await searchService.smartSearch(q, { page, limit, city, country, minPrice, maxPrice, minGuests, isVerified });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Search services
  async searchServices(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = searchServicesSchema.parse(req.query);
      const result = await searchService.searchServices(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Autocomplete
  async autocomplete(req: Request, res: Response, next: NextFunction) {
    try {
      const input = autocompleteSchema.parse(req.query);
      const result = await searchService.autocomplete(input);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Index single artist
  async indexArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId } = indexArtistSchema.parse(req.body);
      const result = await searchService.indexArtist(artistId);
      res.json({
        message: 'Artista indexado exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Index single service
  async indexService(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceId } = indexServiceSchema.parse(req.body);
      const result = await searchService.indexService(serviceId);
      res.json({
        message: 'Servicio indexado exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk index
  async bulkIndex(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, batchSize } = bulkIndexSchema.parse(req.body);

      // Start indexing asynchronously
      if (type === 'artists' || type === 'all') {
        searchService.bulkIndexArtists(batchSize!).catch(error => {
          console.error('Bulk artist indexing failed:', error);
        });
      }

      if (type === 'services' || type === 'all') {
        searchService.bulkIndexServices(batchSize!).catch(error => {
          console.error('Bulk service indexing failed:', error);
        });
      }

      res.json({
        message: 'Indexación iniciada en segundo plano',
        type,
        batchSize
      });
    } catch (error) {
      next(error);
    }
  },

  // Get index status
  async getIndexStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.query;
      const status = await searchService.getIndexStatus(type as any);
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  // Get popular searches
  async getPopularSearches(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const popular = await searchService.getPopularSearches(limit);
      res.json(popular);
    } catch (error) {
      next(error);
    }
  },

  // Register a dynamic synonym from artist onboarding
  async addSynonym(req: Request, res: Response, next: NextFunction) {
    try {
      const { term, synonyms } = req.body as { term?: string; synonyms?: string[] };
      if (!term || typeof term !== 'string' || term.trim().length < 2) {
        res.status(400).json({ message: 'term debe tener al menos 2 caracteres' });
        return;
      }
      const normalizedTerm = term.toLowerCase().trim();
      const alreadyExists = hasSynonym(normalizedTerm);
      const termSynonyms: string[] = Array.isArray(synonyms) ? synonyms.filter(s => typeof s === 'string') : [];
      // Always include the term itself and a generic 'musica' bridge so it surfaces in music searches
      addDynamicSynonym(normalizedTerm, [normalizedTerm, ...termSynonyms]);
      res.json({ ok: true, term: normalizedTerm, wasNew: !alreadyExists });
    } catch (error) {
      next(error);
    }
  },
};
