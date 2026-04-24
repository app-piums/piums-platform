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

// Remove an artist from the index by its id (artists-service id, same as ArtistIndex.id)
router.delete('/index/artist/:id', requireAuth, async (req, res, next) => {
  try {
    const { PrismaClient } = await import('../generated/prisma');
    const prisma = new PrismaClient();
    const { id } = req.params;
    await prisma.artistIndex.deleteMany({ where: { id } });
    await prisma.serviceIndex.deleteMany({ where: { artistId: id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Analytics endpoints
router.get('/popular', searchController.getPopularSearches);

// Dynamic synonym registration — called from artist onboarding for custom roles
router.post('/synonyms', requireAuth, searchController.addSynonym);

export default router;
