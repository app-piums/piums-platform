import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { internalAuth } from '../middleware/auth.middleware';
import { createPaymentLimiter } from '../middleware/rateLimiter';
import * as couponController from '../controller/coupon.controller';

const router = Router();
const auth = authenticateToken as any;

// Admin routes
router.get('/coupons', auth, couponController.adminListCoupons as any);
router.post('/coupons', auth, createPaymentLimiter, couponController.adminCreateCoupon as any);
router.post('/coupons/bulk-generate', auth, createPaymentLimiter, couponController.adminBulkGenerate as any);

// User-facing routes (must be before /:id to avoid route conflicts)
router.get('/coupons/my', auth, couponController.getMyCoupons as any);
router.get('/coupons/artist', auth, couponController.getArtistCoupons as any);
// validate: accepts both user JWT (frontend) and internal secret (booking-service)
router.post('/coupons/validate', couponController.validateCoupon as any);

// Internal routes (service-to-service)
router.post('/coupons/redeem', internalAuth as any, couponController.redeemCouponInternal as any);

// Admin CRUD by ID
router.get('/coupons/:id', auth, couponController.adminGetCoupon as any);
router.patch('/coupons/:id', auth, couponController.adminUpdateCoupon as any);
router.delete('/coupons/:id', auth, couponController.adminDeleteCoupon as any);
router.post('/coupons/:id/send-email', auth, createPaymentLimiter, couponController.adminSendCouponEmail as any);

export default router;
