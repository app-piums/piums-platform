import { PrismaClient } from '@prisma/client';
import { generateTicketEventCode, generateTicketPurchaseCode } from './ticket-code.service';
import { paymentsClient } from '../clients/payments.client';

const prisma = new PrismaClient();

export const ticketEventService = {
  async createEvent(artistId: string, payload: {
    name: string;
    description?: string;
    venue: string;
    address: string;
    locationLat?: number;
    locationLng?: number;
    eventDate: string;
    doorsOpen?: string;
    imageUrl?: string;
    maxCapacity: number;
  }) {
    if (new Date(payload.eventDate) <= new Date()) {
      throw Object.assign(new Error('La fecha del evento debe ser futura'), { statusCode: 400 });
    }
    const code = await generateTicketEventCode();
    return (prisma as any).ticketEvent.create({
      data: {
        code,
        artistId,
        name: payload.name,
        description: payload.description,
        venue: payload.venue,
        address: payload.address,
        locationLat: payload.locationLat,
        locationLng: payload.locationLng,
        eventDate: new Date(payload.eventDate),
        doorsOpen: payload.doorsOpen ? new Date(payload.doorsOpen) : undefined,
        imageUrl: payload.imageUrl,
        maxCapacity: payload.maxCapacity,
        status: 'BORRADOR',
      },
      include: { tiers: true },
    });
  },

  async updateEvent(id: string, artistId: string, payload: Partial<{
    name: string;
    description: string;
    venue: string;
    address: string;
    locationLat: number;
    locationLng: number;
    eventDate: string;
    doorsOpen: string;
    imageUrl: string;
    maxCapacity: number;
    status: string;
  }>) {
    const event = await (prisma as any).ticketEvent.findUnique({ where: { id }, include: { tiers: true } });
    if (!event) throw Object.assign(new Error('Evento no encontrado'), { statusCode: 404 });
    if (event.artistId !== artistId) throw Object.assign(new Error('Sin permiso'), { statusCode: 403 });

    if (payload.status === 'PUBLICADO') {
      const activeTiers = event.tiers.filter((t: any) => t.totalQty > 0);
      if (activeTiers.length === 0) {
        throw Object.assign(new Error('Debes agregar al menos un tier con capacidad para publicar'), { statusCode: 400 });
      }
    }

    const data: any = { ...payload };
    if (payload.eventDate) data.eventDate = new Date(payload.eventDate);
    if (payload.doorsOpen) data.doorsOpen = new Date(payload.doorsOpen);

    return (prisma as any).ticketEvent.update({
      where: { id },
      data,
      include: { tiers: true },
    });
  },

  async listPublicEvents(params: { page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 50);
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      (prisma as any).ticketEvent.findMany({
        where: { status: 'PUBLICADO', eventDate: { gte: new Date() } },
        include: { tiers: { select: { id: true, name: true, priceCents: true, currency: true, totalQty: true, soldQty: true } } },
        orderBy: { eventDate: 'asc' },
        skip,
        take: limit,
      }),
      (prisma as any).ticketEvent.count({
        where: { status: 'PUBLICADO', eventDate: { gte: new Date() } },
      }),
    ]);

    return { events, total, page, limit };
  },

  async getEventWithTiers(id: string) {
    const event = await (prisma as any).ticketEvent.findUnique({
      where: { id },
      include: {
        tiers: {
          orderBy: { priceCents: 'asc' },
          select: { id: true, name: true, description: true, priceCents: true, currency: true, totalQty: true, soldQty: true, createdAt: true },
        },
      },
    });
    if (!event) throw Object.assign(new Error('Evento no encontrado'), { statusCode: 404 });
    return event;
  },

  async listArtistEvents(artistId: string) {
    return (prisma as any).ticketEvent.findMany({
      where: { artistId },
      include: { tiers: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async addTier(eventId: string, artistId: string, payload: {
    name: string;
    description?: string;
    priceCents: number;
    currency?: string;
    totalQty: number;
    maxPerOrder?: number;
  }) {
    const event = await (prisma as any).ticketEvent.findUnique({ where: { id: eventId } });
    if (!event) throw Object.assign(new Error('Evento no encontrado'), { statusCode: 404 });
    if (event.artistId !== artistId) throw Object.assign(new Error('Sin permiso'), { statusCode: 403 });

    const maxPerOrder = Math.max(1, Math.min(payload.maxPerOrder ?? 10, 100));
    return (prisma as any).ticketTier.create({
      data: {
        ticketEventId: eventId,
        name: payload.name,
        description: payload.description,
        priceCents: payload.priceCents,
        currency: payload.currency || 'USD',
        totalQty: payload.totalQty,
        maxPerOrder,
      },
    });
  },

  async deleteTier(eventId: string, tierId: string, artistId: string) {
    const event = await (prisma as any).ticketEvent.findUnique({ where: { id: eventId } });
    if (!event) throw Object.assign(new Error('Evento no encontrado'), { statusCode: 404 });
    if (event.artistId !== artistId) throw Object.assign(new Error('Sin permiso'), { statusCode: 403 });

    const tier = await (prisma as any).ticketTier.findUnique({ where: { id: tierId } });
    if (!tier) throw Object.assign(new Error('Tier no encontrado'), { statusCode: 404 });
    if (tier.soldQty > 0) throw Object.assign(new Error('No se puede eliminar un tier con ventas'), { statusCode: 409 });

    return (prisma as any).ticketTier.delete({ where: { id: tierId } });
  },

  async initPurchase(data: {
    eventId: string;
    tierId: string;
    buyerId: string;
    buyerEmail: string;
    buyerName: string;
    quantity: number;
    couponCode?: string;
    returnUrl?: string;
  }) {
    const tier = await (prisma as any).ticketTier.findUnique({
      where: { id: data.tierId },
      include: { ticketEvent: true },
    });
    if (!tier) throw Object.assign(new Error('Tier no encontrado'), { statusCode: 404 });
    if (tier.ticketEventId !== data.eventId) throw Object.assign(new Error('Tier no pertenece al evento'), { statusCode: 400 });
    if (tier.ticketEvent.status !== 'PUBLICADO') throw Object.assign(new Error('El evento no esta disponible'), { statusCode: 400 });
    if (data.quantity < 1) throw Object.assign(new Error('La cantidad debe ser al menos 1'), { statusCode: 400 });
    if (data.quantity > tier.maxPerOrder) throw Object.assign(new Error(`Solo se pueden comprar hasta ${tier.maxPerOrder} boletos por orden`), { statusCode: 400 });

    const subtotalCents = tier.priceCents * data.quantity;
    let discountCents = 0;
    let couponId: string | undefined;

    // Atomic: reserve seats + create purchase
    let purchase = await (prisma as any).$transaction(async (tx: any) => {
      const fresh = await tx.ticketTier.findUnique({ where: { id: data.tierId } });
      if (data.quantity > fresh.maxPerOrder) {
        throw Object.assign(new Error(`Solo se pueden comprar hasta ${fresh.maxPerOrder} boletos por orden`), { statusCode: 400 });
      }
      if (fresh.soldQty + data.quantity > fresh.totalQty) {
        throw Object.assign(new Error('No hay suficientes boletos disponibles'), { statusCode: 409 });
      }
      await tx.ticketTier.update({
        where: { id: data.tierId },
        data: { soldQty: { increment: data.quantity } },
      });
      const code = await generateTicketPurchaseCode();
      return tx.ticketPurchase.create({
        data: {
          code,
          ticketEventId: data.eventId,
          tierId: data.tierId,
          buyerId: data.buyerId,
          buyerEmail: data.buyerEmail,
          buyerName: data.buyerName,
          quantity: data.quantity,
          subtotalCents,
          discountCents: 0,
          totalCents: subtotalCents,
          currency: tier.currency,
          status: 'PENDIENTE',
        },
      });
    });

    // Validate coupon if provided
    if (data.couponCode) {
      const couponResult = await paymentsClient.validateCoupon({
        code: data.couponCode,
        userId: data.buyerId,
        bookingId: purchase.id,
        bookingTotal: subtotalCents,
      });
      if (couponResult?.valid) {
        discountCents = couponResult.discount;
        couponId = couponResult.couponId;
        const totalCents = Math.max(0, subtotalCents - discountCents);
        purchase = await (prisma as any).ticketPurchase.update({
          where: { id: purchase.id },
          data: { discountCents, totalCents, couponCode: data.couponCode, couponId },
        });
      }
    }

    const totalCents = purchase.totalCents;

    // Free ticket — mark paid immediately
    if (totalCents === 0) {
      purchase = await (prisma as any).ticketPurchase.update({
        where: { id: purchase.id },
        data: { status: 'PAGADO', paidAt: new Date() },
      });
      if (couponId) {
        await paymentsClient.redeemCoupon({ couponId, userId: data.buyerId, bookingId: purchase.id, discountApplied: discountCents });
      }
      return { purchase, redirectUrl: null };
    }

    // Paid ticket — initiate Tilopay checkout
    const checkoutResult = await paymentsClient.initTicketCheckout({
      purchaseId: purchase.id,
      userId: data.buyerId,
      userEmail: data.buyerEmail,
      amount: totalCents,
      currency: tier.currency,
      returnUrl: data.returnUrl,
    });

    if (checkoutResult?.providerRef) {
      purchase = await (prisma as any).ticketPurchase.update({
        where: { id: purchase.id },
        data: { orderNumber: checkoutResult.providerRef, providerRef: checkoutResult.providerRef },
      });
    }

    return { purchase, redirectUrl: checkoutResult?.redirectUrl ?? null };
  },

  async markPurchasePaid(purchaseId: string, providerRef: string) {
    const purchase = await (prisma as any).ticketPurchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) throw Object.assign(new Error('Compra no encontrada'), { statusCode: 404 });
    if (purchase.status === 'PAGADO') return purchase; // idempotent

    const updated = await (prisma as any).ticketPurchase.update({
      where: { id: purchaseId },
      data: { status: 'PAGADO', paidAt: new Date(), providerRef },
    });

    if (purchase.couponId) {
      await paymentsClient.redeemCoupon({
        couponId: purchase.couponId,
        userId: purchase.buyerId,
        bookingId: purchaseId,
        discountApplied: purchase.discountCents,
      });
    }

    return updated;
  },

  async checkIn(eventId: string, code: string, artistId: string) {
    const event = await (prisma as any).ticketEvent.findUnique({ where: { id: eventId } });
    if (!event) throw Object.assign(new Error('Evento no encontrado'), { statusCode: 404 });
    if (event.artistId !== artistId) throw Object.assign(new Error('Sin permiso'), { statusCode: 403 });

    const purchase = await (prisma as any).ticketPurchase.findFirst({
      where: { code, ticketEventId: eventId },
    });
    if (!purchase) throw Object.assign(new Error('Boleto no encontrado'), { statusCode: 404 });
    if (purchase.status === 'USADO') throw Object.assign(new Error('Boleto ya utilizado'), { statusCode: 409 });
    if (purchase.status !== 'PAGADO') throw Object.assign(new Error('Boleto no pagado'), { statusCode: 400 });

    return (prisma as any).ticketPurchase.update({
      where: { id: purchase.id },
      data: { status: 'USADO', checkedInAt: new Date(), checkedInBy: artistId },
      include: { tier: true, ticketEvent: { select: { name: true } } },
    });
  },

  async getAttendance(eventId: string, artistId: string) {
    const event = await (prisma as any).ticketEvent.findUnique({ where: { id: eventId } });
    if (!event) throw Object.assign(new Error('Evento no encontrado'), { statusCode: 404 });
    if (event.artistId !== artistId) throw Object.assign(new Error('Sin permiso'), { statusCode: 403 });

    const [paid, checkedIn, attendees] = await Promise.all([
      (prisma as any).ticketPurchase.count({ where: { ticketEventId: eventId, status: { in: ['PAGADO', 'USADO'] } } }),
      (prisma as any).ticketPurchase.count({ where: { ticketEventId: eventId, status: 'USADO' } }),
      (prisma as any).ticketPurchase.findMany({
        where: { ticketEventId: eventId, status: { in: ['PAGADO', 'USADO'] } },
        include: { tier: { select: { name: true } } },
        orderBy: { checkedInAt: 'desc' },
        take: 100,
      }),
    ]);

    return { paid, checkedIn, attendees };
  },

  async getMyPurchases(buyerId: string) {
    return (prisma as any).ticketPurchase.findMany({
      where: { buyerId, deletedAt: null },
      include: {
        ticketEvent: { select: { id: true, name: true, venue: true, eventDate: true, imageUrl: true } },
        tier: { select: { name: true, priceCents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getPurchase(id: string, buyerId: string) {
    const purchase = await (prisma as any).ticketPurchase.findUnique({
      where: { id },
      include: {
        ticketEvent: true,
        tier: true,
      },
    });
    if (!purchase) throw Object.assign(new Error('Compra no encontrada'), { statusCode: 404 });
    if (purchase.buyerId !== buyerId) throw Object.assign(new Error('Sin permiso'), { statusCode: 403 });
    return purchase;
  },
};
