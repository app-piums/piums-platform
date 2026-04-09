import { Router } from 'express';
import { searchController } from '../controller/search.controller';
import { searchLimiter, autocompleteLimiter, indexLimiter } from '../middleware/rateLimiter';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';

const router: Router = Router();

// Public search endpoints
router.get('/artists', optionalAuth, searchLimiter, searchController.searchArtists);
router.get('/smart', searchLimiter, searchController.smartSearch);
router.get('/services', optionalAuth, searchLimiter, searchController.searchServices);
router.get('/autocomplete', optionalAuth, autocompleteLimiter, searchController.autocomplete);

// Index management endpoints (could be protected with admin auth in production)
router.post('/index/artist', requireAuth, indexLimiter, searchController.indexArtist);
router.post('/index/service', requireAuth, indexLimiter, searchController.indexService);
router.post('/index/bulk', requireAuth, indexLimiter, searchController.bulkIndex);
router.get('/index/status', requireAuth, searchController.getIndexStatus);

// Analytics endpoints
router.get('/popular', searchController.getPopularSearches);

export default router;
