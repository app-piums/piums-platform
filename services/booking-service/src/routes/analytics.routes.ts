import { Router } from 'express';
import { trackFunnelEvent, getBookingFunnel } from '../controller/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/analytics/funnel — fire-and-forget tracking (requires auth to attach userId)
router.post('/funnel', authenticateToken, trackFunnelEvent);

// GET /api/analytics/funnel — admin reads aggregated funnel data
router.get('/funnel', authenticateToken, getBookingFunnel);

export default router;
