import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, internalAuth, requireActiveSession } from '../middleware/auth.middleware';
import { ticketEventService } from '../services/ticket-event.service';

const router = Router();

// ==================== PUBLIC ====================

router.get('/ticket-events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const result = await ticketEventService.listPublicEvents({ page, limit });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/ticket-events/by-artist/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const artistId = (req as any).user.id;
    const events = await ticketEventService.listArtistEvents(artistId);
    res.json(events);
  } catch (err) { next(err); }
});

router.get('/ticket-events/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await ticketEventService.getEventWithTiers(req.params['id'] as string);
    res.json(event);
  } catch (err) { next(err); }
});

// ==================== AUTHENTICATED ====================

router.post('/ticket-events', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const artistId = (req as any).user.id;
    const event = await ticketEventService.createEvent(artistId, req.body);
    res.status(201).json(event);
  } catch (err) { next(err); }
});

router.put('/ticket-events/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const artistId = (req as any).user.id;
    const event = await ticketEventService.updateEvent(req.params['id'] as string, artistId, req.body);
    res.json(event);
  } catch (err) { next(err); }
});

router.post('/ticket-events/:id/tiers', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const artistId = (req as any).user.id;
    const tier = await ticketEventService.addTier(req.params['id'] as string, artistId, req.body);
    res.status(201).json(tier);
  } catch (err) { next(err); }
});

router.delete('/ticket-events/:id/tiers/:tierId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const artistId = (req as any).user.id;
    await ticketEventService.deleteTier(req.params['id'] as string, req.params['tierId'] as string, artistId);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post('/ticket-events/:id/purchase', authenticateToken, requireActiveSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { tierId, quantity = 1, couponCode, returnUrl } = req.body as {
      tierId: string;
      quantity?: number;
      couponCode?: string;
      returnUrl?: string;
    };
    const result = await ticketEventService.initPurchase({
      eventId: req.params['id'] as string,
      tierId,
      buyerId: user.id,
      buyerEmail: user.email,
      buyerName: user.name || user.email,
      quantity,
      couponCode,
      returnUrl,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.post('/ticket-events/:id/check-in', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const artistId = (req as any).user.id;
    const { code } = req.body as { code: string };
    if (!code) { res.status(400).json({ error: 'code es requerido' }); return; }
    const result = await ticketEventService.checkIn(req.params['id'] as string, code, artistId);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/ticket-events/:id/attendance', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const artistId = (req as any).user.id;
    const result = await ticketEventService.getAttendance(req.params['id'] as string, artistId);
    res.json(result);
  } catch (err) { next(err); }
});

// ==================== PURCHASES ====================

router.get('/ticket-purchases/my', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buyerId = (req as any).user.id;
    const purchases = await ticketEventService.getMyPurchases(buyerId);
    res.json(purchases);
  } catch (err) { next(err); }
});

router.get('/ticket-purchases/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buyerId = (req as any).user.id;
    const purchase = await ticketEventService.getPurchase(req.params['id'] as string, buyerId);
    res.json(purchase);
  } catch (err) { next(err); }
});

// ==================== INTERNAL ====================

router.post('/ticket-purchases/internal/:id/mark-payment', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId } = req.body as { paymentIntentId?: string };
    const purchase = await ticketEventService.markPurchasePaid(
      req.params['id'] as string,
      paymentIntentId || '',
    );
    res.json(purchase);
  } catch (err) { next(err); }
});

export default router;
