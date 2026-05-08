import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// ============================================================================
// Types
// ============================================================================

interface CreateCouponData {
  code?: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  currency?: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  targetType?: 'GLOBAL' | 'ARTIST' | 'CLIENT' | 'SERVICE';
  targetId?: string;
  minimumAmount?: number;
  maxDiscountAmount?: number;
  status?: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  startsAt?: Date;
  expiresAt?: Date;
}

interface GetCouponsFilters {
  status?: string;
  targetType?: string;
  page?: number;
  limit?: number;
}

interface ValidateCouponResult {
  valid: boolean;
  discount: number;
  coupon: any | null;
  error?: string;
}

// ============================================================================
// Service
// ============================================================================

export class CouponService {
  /**
   * Create a new coupon
   */
  async createCoupon(data: CreateCouponData, adminId: string): Promise<any> {
    // Validate discountValue
    if (data.discountType === 'PERCENTAGE' && (data.discountValue < 1 || data.discountValue > 100)) {
      throw new AppError(400, 'El descuento por porcentaje debe estar entre 1 y 100');
    }
    if (data.discountType === 'FIXED_AMOUNT' && data.discountValue <= 0) {
      throw new AppError(400, 'El monto de descuento fijo debe ser mayor a 0');
    }

    // Auto-generate sequential code if not provided
    let code: string;
    if (data.code && data.code.trim()) {
      code = data.code.trim().toUpperCase();
      const existing = await (prisma as any).coupon.findUnique({ where: { code } });
      if (existing) throw new AppError(409, `Ya existe un cupón con el código ${code}`);
    } else {
      const count = await (prisma as any).coupon.count();
      code = `CUP-${String(count + 1).padStart(5, '0')}`;
      // Ensure uniqueness in case of concurrent creates
      let suffix = count + 1;
      while (await (prisma as any).coupon.findUnique({ where: { code } })) {
        suffix++;
        code = `CUP-${String(suffix).padStart(5, '0')}`;
      }
    }

    const coupon = await (prisma as any).coupon.create({
      data: {
        code,
        name: data.name,
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        currency: data.currency || 'USD',
        maxUses: data.maxUses || null,
        maxUsesPerUser: data.maxUsesPerUser ?? 1,
        targetType: data.targetType || 'GLOBAL',
        targetId: data.targetId || null,
        minimumAmount: data.minimumAmount || null,
        maxDiscountAmount: data.maxDiscountAmount || null,
        status: data.status || 'ACTIVE',
        startsAt: data.startsAt || new Date(),
        expiresAt: data.expiresAt || null,
        createdByAdminId: adminId,
      },
    });

    logger.info('Cupón creado', 'COUPON_SERVICE', { couponId: coupon.id, code: coupon.code, adminId });
    return coupon;
  }

  /**
   * List all coupons (admin) with pagination
   */
  async getCoupons(filters: GetCouponsFilters): Promise<{ coupons: any[]; total: number; page: number; totalPages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.targetType) where.targetType = filters.targetType;

    const [coupons, total] = await Promise.all([
      (prisma as any).coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { uses: true } } },
      }),
      (prisma as any).coupon.count({ where }),
    ]);

    return { coupons, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get a single coupon by ID
   */
  async getCouponById(id: string): Promise<any> {
    const coupon = await (prisma as any).coupon.findFirst({
      where: { id, deletedAt: null },
      include: { uses: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!coupon) throw new AppError(404, 'Cupón no encontrado');
    return coupon;
  }

  /**
   * Update coupon fields
   */
  async updateCoupon(id: string, data: Partial<CreateCouponData>): Promise<any> {
    await this.getCouponById(id); // throws 404 if not found

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = data.maxUsesPerUser;
    if (data.targetType !== undefined) updateData.targetType = data.targetType;
    if (data.targetId !== undefined) updateData.targetId = data.targetId;
    if (data.minimumAmount !== undefined) updateData.minimumAmount = data.minimumAmount;
    if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;

    const updated = await (prisma as any).coupon.update({
      where: { id },
      data: updateData,
    });

    logger.info('Cupón actualizado', 'COUPON_SERVICE', { couponId: id });
    return updated;
  }

  /**
   * Soft delete a coupon
   */
  async deleteCoupon(id: string): Promise<void> {
    await this.getCouponById(id); // throws 404 if not found
    await (prisma as any).coupon.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'EXPIRED' },
    });
    logger.info('Cupón eliminado (soft)', 'COUPON_SERVICE', { couponId: id });
  }

  /**
   * Validate a coupon for a specific booking context.
   * Returns { valid, discount, coupon, error? }
   */
  async validateCoupon(
    code: string,
    userId: string,
    _bookingId: string,
    bookingTotal: number,
    artistId?: string,
    serviceId?: string
  ): Promise<ValidateCouponResult> {
    const coupon = await (prisma as any).coupon.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
    });

    if (!coupon) {
      return { valid: false, discount: 0, coupon: null, error: 'Cupón no encontrado' };
    }

    // Status check
    if (coupon.status !== 'ACTIVE') {
      return { valid: false, discount: 0, coupon, error: 'Este cupón no está activo' };
    }

    // Date checks
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return { valid: false, discount: 0, coupon, error: 'Este cupón aún no está vigente' };
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return { valid: false, discount: 0, coupon, error: 'Este cupón ha expirado' };
    }

    // Max uses check
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return { valid: false, discount: 0, coupon, error: 'Este cupón ha alcanzado su límite de usos' };
    }

    // Per-user uses check
    const userUses = await (prisma as any).couponUse.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUses >= coupon.maxUsesPerUser) {
      return { valid: false, discount: 0, coupon, error: 'Ya has utilizado este cupón el máximo de veces permitido' };
    }

    // Minimum amount check
    if (coupon.minimumAmount !== null && bookingTotal < coupon.minimumAmount) {
      return {
        valid: false,
        discount: 0,
        coupon,
        error: `El total mínimo para este cupón es ${(coupon.minimumAmount / 100).toFixed(2)} ${coupon.currency}`,
      };
    }

    // Target type check
    if (coupon.targetType === 'ARTIST') {
      if (!artistId || artistId !== coupon.targetId) {
        return { valid: false, discount: 0, coupon, error: 'Este cupón no es válido para este artista' };
      }
    } else if (coupon.targetType === 'CLIENT') {
      if (userId !== coupon.targetId) {
        return { valid: false, discount: 0, coupon, error: 'Este cupón no está disponible para tu cuenta' };
      }
    } else if (coupon.targetType === 'SERVICE') {
      if (!serviceId || serviceId !== coupon.targetId) {
        return { valid: false, discount: 0, coupon, error: 'Este cupón no es válido para este servicio' };
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.floor(bookingTotal * coupon.discountValue / 100);
      // Apply maxDiscountAmount cap if set
      if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount > 0) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      // FIXED_AMOUNT — cap at bookingTotal
      discount = Math.min(coupon.discountValue, bookingTotal);
    }

    // Track validation (fire-and-forget)
    (prisma as any).coupon.update({
      where: { id: coupon.id },
      data: { validationCount: { increment: 1 } },
    }).catch(() => {});

    return { valid: true, discount, coupon };
  }

  /**
   * Redeem a coupon atomically: re-check per-user limit inside a transaction,
   * then create CouponUse + increment currentUses in a single DB transaction.
   * This prevents double-redemption from concurrent requests.
   */
  async redeemCoupon(
    couponId: string,
    userId: string,
    bookingId: string,
    discountApplied: number
  ): Promise<any> {
    const couponUse = await (prisma as any).$transaction(async (tx: any) => {
      const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) throw new AppError(404, 'Cupón no encontrado');

      const userUses = await tx.couponUse.count({ where: { couponId, userId } });
      if (userUses >= coupon.maxUsesPerUser) {
        throw new AppError(409, 'Ya has utilizado este cupón el máximo de veces permitido');
      }

      const use = await tx.couponUse.create({
        data: { couponId, userId, bookingId, discountApplied },
      });

      await tx.coupon.update({
        where: { id: couponId },
        data: { currentUses: { increment: 1 } },
      });

      return use;
    });

    logger.info('Cupón redimido', 'COUPON_SERVICE', { couponId, userId, bookingId, discountApplied });
    return couponUse;
  }

  /**
   * Get coupons available for a specific user (GLOBAL + CLIENT-specific)
   */
  async getCouponsForUser(userId: string): Promise<any[]> {
    const now = new Date();
    return (prisma as any).coupon.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        AND: [
          {
            OR: [
              { targetType: 'GLOBAL' },
              { targetType: 'CLIENT', targetId: userId },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Bulk generate unique single-use coupons from a template
   */
  async bulkGenerateCoupons(
    template: Omit<CreateCouponData, 'code'>,
    count: number,
    prefix: string,
    adminId: string
  ): Promise<any[]> {
    if (count < 1 || count > 500) {
      throw new AppError(400, 'El número de cupones debe estar entre 1 y 500');
    }

    // Generate sequential codes: PREFIX-00001, PREFIX-00002, ...
    const existingCount = await (prisma as any).coupon.count();
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(`${prefix.toUpperCase()}-${String(existingCount + i + 1).padStart(5, '0')}`);
    }

    const couponsData = codes.map((code) => ({
      code,
      name: template.name,
      description: template.description || null,
      discountType: template.discountType,
      discountValue: template.discountValue,
      currency: template.currency || 'USD',
      maxUses: 1,
      maxUsesPerUser: 1,
      targetType: template.targetType || 'GLOBAL',
      targetId: template.targetId || null,
      minimumAmount: template.minimumAmount || null,
      maxDiscountAmount: template.maxDiscountAmount || null,
      status: template.status || 'ACTIVE',
      startsAt: template.startsAt || new Date(),
      expiresAt: template.expiresAt || null,
      createdByAdminId: adminId,
    }));

    await (prisma as any).coupon.createMany({ data: couponsData, skipDuplicates: true });
    logger.info(`${couponsData.length} cupones generados en masa`, 'COUPON_SERVICE', { prefix, adminId });
    return couponsData.map((d) => ({ code: d.code, name: d.name }));
  }

  /**
   * Get coupons available for a specific artist (ARTIST-specific coupons)
   */
  async getCouponsForArtist(artistId: string): Promise<any[]> {
    const now = new Date();
    return (prisma as any).coupon.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        targetType: 'ARTIST',
        targetId: artistId,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const couponService = new CouponService();
