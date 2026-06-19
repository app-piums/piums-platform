import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
const router: Router = Router();

// Verify service belongs to the given artistId
async function resolveOwnership(serviceId: string, artistId: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { artistId: true } });
  if (!service) throw new AppError(404, 'Servicio no encontrado');
  if (service.artistId !== artistId) throw new AppError(403, 'Sin permiso para este servicio');
  return service;
}

// ==================== PUBLIC ====================

// GET /api/services/:serviceId/day-offers/public — sin auth, para mostrar en calendario
router.get('/services/:serviceId/day-offers/public', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params as { serviceId: string };
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    const offers = await (prisma as any).serviceDayOffer.findMany({
      where: {
        serviceId,
        isActive: true,
        offerDate: { gte: now },
      },
      select: {
        id: true,
        offerDate: true,
        discountType: true,
        discountValue: true,
        maxDiscountCents: true,
        label: true,
      },
      orderBy: { offerDate: 'asc' },
    });

    res.json(offers);
  } catch (err) { next(err); }
});

// ==================== AUTHENTICATED ====================

// GET /api/services/:serviceId/day-offers — artist sees their own offers
router.get('/services/:serviceId/day-offers', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params as { serviceId: string };
    const artistId: string = req.body.artistId || (req.query['artistId'] as string);
    if (!artistId) { res.status(400).json({ error: 'artistId requerido' }); return; }

    await resolveOwnership(serviceId, artistId);

    const offers = await (prisma as any).serviceDayOffer.findMany({
      where: { serviceId },
      orderBy: { offerDate: 'asc' },
    });
    res.json(offers);
  } catch (err) { next(err); }
});

// POST /api/services/:serviceId/day-offers — create offer
router.post('/services/:serviceId/day-offers', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params as { serviceId: string };
    const { artistId, offerDate, discountType, discountValue, maxDiscountCents, label } = req.body as {
      artistId: string;
      offerDate: string;
      discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
      discountValue: number;
      maxDiscountCents?: number;
      label?: string;
    };

    if (!artistId) { res.status(400).json({ error: 'artistId requerido' }); return; }
    if (!offerDate) { res.status(400).json({ error: 'offerDate requerido (YYYY-MM-DD)' }); return; }
    if (!discountType || !['PERCENTAGE', 'FIXED_AMOUNT'].includes(discountType)) {
      res.status(400).json({ error: 'discountType debe ser PERCENTAGE o FIXED_AMOUNT' }); return;
    }
    if (!discountValue || discountValue <= 0) { res.status(400).json({ error: 'discountValue debe ser mayor a 0' }); return; }
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      res.status(400).json({ error: 'discountValue para porcentaje debe ser 1-100' }); return;
    }

    const parsedDate = new Date(offerDate);
    parsedDate.setUTCHours(0, 0, 0, 0);
    if (parsedDate <= new Date()) { res.status(400).json({ error: 'offerDate debe ser una fecha futura' }); return; }

    await resolveOwnership(serviceId, artistId);

    const offer = await (prisma as any).serviceDayOffer.create({
      data: {
        serviceId,
        offerDate: parsedDate,
        discountType,
        discountValue: Math.round(discountValue),
        maxDiscountCents: maxDiscountCents ? Math.round(maxDiscountCents) : undefined,
        label: label?.trim() || undefined,
      },
    });
    res.status(201).json(offer);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe una oferta para ese dia en este servicio' }); return;
    }
    next(err);
  }
});

// PATCH /api/services/:serviceId/day-offers/:id — toggle isActive
router.patch('/services/:serviceId/day-offers/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceId, id } = req.params as { serviceId: string; id: string };
    const { artistId, isActive } = req.body as { artistId: string; isActive: boolean };

    if (!artistId) { res.status(400).json({ error: 'artistId requerido' }); return; }
    await resolveOwnership(serviceId, artistId);

    const offer = await (prisma as any).serviceDayOffer.update({
      where: { id },
      data: { isActive: Boolean(isActive), updatedAt: new Date() },
    });
    res.json(offer);
  } catch (err) { next(err); }
});

// DELETE /api/services/:serviceId/day-offers/:id
router.delete('/services/:serviceId/day-offers/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceId, id } = req.params as { serviceId: string; id: string };
    const artistId: string = req.body.artistId || (req.query['artistId'] as string);

    if (!artistId) { res.status(400).json({ error: 'artistId requerido' }); return; }
    await resolveOwnership(serviceId, artistId);

    await (prisma as any).serviceDayOffer.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
