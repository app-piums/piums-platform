import { z } from 'zod';

// Search Artists Schema
export const searchArtistsSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isVerified: z.coerce.boolean().optional(),
  isAvailable: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'rating', 'reviews', 'price_low', 'price_high', 'recent']).optional().default('relevance'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20)
});

export type SearchArtistsInput = z.infer<typeof searchArtistsSchema>;

// Search Services Schema
export const searchServicesSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  artistId: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  isAvailable: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'rating', 'price_low', 'price_high', 'popular', 'recent']).optional().default('relevance'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20)
});

export type SearchServicesInput = z.infer<typeof searchServicesSchema>;

// Autocomplete Schema
export const autocompleteSchema = z.object({
  query: z.string().min(Number(process.env.AUTOCOMPLETE_MIN_CHARS || 2)),
  type: z.enum(['artists', 'services', 'all']).optional().default('all'),
  limit: z.coerce.number().min(1).max(50).optional().default(Number(process.env.AUTOCOMPLETE_MAX_RESULTS || 10))
});

export type AutocompleteInput = z.infer<typeof autocompleteSchema>;

// Index Artist Schema
export const indexArtistSchema = z.object({
  artistId: z.string().uuid()
});

export type IndexArtistInput = z.infer<typeof indexArtistSchema>;

// Index Service Schema
export const indexServiceSchema = z.object({
  serviceId: z.string().uuid()
});

export type IndexServiceInput = z.infer<typeof indexServiceSchema>;

// Bulk Index Schema
export const bulkIndexSchema = z.object({
  type: z.enum(['artists', 'services', 'all']),
  batchSize: z.coerce.number().min(1).max(1000).optional().default(100)
});

export type BulkIndexInput = z.infer<typeof bulkIndexSchema>;

// Smart Search Schema
export const smartSearchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(12),
  city: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minGuests: z.coerce.number().min(1).optional(),
});

export type SmartSearchInput = z.infer<typeof smartSearchSchema>;
