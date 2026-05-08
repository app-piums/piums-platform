import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const STEPS = ['service', 'datetime', 'details', 'review', 'checkout', 'confirmed'];

export const trackFunnelEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, step, action, userId, bookingId, artistId, serviceId } = req.body as {
      sessionId: string; step: string; action: string; userId?: string;
      bookingId?: string; artistId?: string; serviceId?: string;
    };
    if (!sessionId || !step || !action) return res.status(400).json({ error: 'sessionId, step y action son requeridos' });

    await (prisma as any).bookingFunnelEvent.create({
      data: { sessionId, step, action, userId: userId || null, bookingId: bookingId || null, artistId: artistId || null, serviceId: serviceId || null },
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

export const getBookingFunnel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt((req.query['days'] as string) || '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await (prisma as any).bookingFunnelEvent.groupBy({
      by: ['step', 'action'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    });

    const byStep: Record<string, { entered: number; completed: number; abandoned: number }> = {};
    for (const step of STEPS) {
      byStep[step] = { entered: 0, completed: 0, abandoned: 0 };
    }

    for (const row of rows) {
      const s = row.step as string;
      const a = row.action as string;
      if (!byStep[s]) byStep[s] = { entered: 0, completed: 0, abandoned: 0 };
      if (a === 'enter') byStep[s].entered += row._count.id;
      else if (a === 'complete') byStep[s].completed += row._count.id;
      else if (a === 'abandon') byStep[s].abandoned += row._count.id;
    }

    const steps = STEPS.map(step => ({
      step,
      entered: byStep[step].entered,
      completed: byStep[step].completed,
      abandoned: Math.max(0, byStep[step].entered - byStep[step].completed),
      conversionRate: byStep[step].entered > 0 ? +(byStep[step].completed / byStep[step].entered).toFixed(3) : 0,
    }));

    const totalSessions = byStep['service']?.entered || 0;
    const totalCompleted = byStep['confirmed']?.completed || 0;

    res.json({
      steps,
      totalSessions,
      totalCompleted,
      overallConversionRate: totalSessions > 0 ? +(totalCompleted / totalSessions).toFixed(3) : 0,
      period: `${days}d`,
    });
  } catch (error) {
    next(error);
  }
};
