import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
  createRefundSchema,
  searchPaymentsSchema,
} from "../schemas/payment.schema";

export class PaymentController {
  // ==================== PAYMENT INTENTS ====================

  async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validated = createPaymentIntentSchema.parse(req.body);

      const paymentIntent = await paymentService.createPaymentIntent({
        userId,
        ...validated,
      });

      res.status(201).json(paymentIntent);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = req.params['id'] as string;

      const paymentIntent = await paymentService.getPaymentIntent(id, userId);

      res.json(paymentIntent);
    } catch (error) {
      next(error);
    }
  }

  async confirmPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validated = confirmPaymentSchema.parse(req.body);

      const paymentIntent = await paymentService.confirmPaymentIntent(
        validated.paymentIntentId,
        userId
      );

      res.json(paymentIntent);
    } catch (error) {
      next(error);
    }
  }

  // ==================== INIT CHECKOUT (Tilopay / Stripe) ====================

  async initCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { bookingId, amount, currency, countryCode, description, returnUrl } = req.body as {
        bookingId: string;
        amount: number;
        currency?: string;
        countryCode?: string;
        description?: string;
        returnUrl?: string;
      };

      if (!bookingId) return res.status(400).json({ error: 'bookingId es requerido' });
      if (!amount || amount <= 0) return res.status(400).json({ error: 'amount debe ser mayor a 0' });

      const result = await paymentService.initCheckout({
        bookingId,
        userId,
        userEmail: req.user!.email,
        amount,
        currency: currency || 'USD',
        countryCode,
        description,
        returnUrl,
      });

      res.status(201).json(result);
      return;
    } catch (error) {
      return next(error);
    }
  }

  async cancelPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const paymentIntentId = req.params['paymentIntentId'] as string;

      const paymentIntent = await paymentService.cancelPaymentIntent(
        paymentIntentId,
        userId
      );

      res.json(paymentIntent);
    } catch (error) {
      next(error);
    }
  }

  // ==================== PAYMENTS ====================

  async searchPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validated = searchPaymentsSchema.parse(req.query);

      const result = await paymentService.searchPayments({
        ...validated,
        userId, // Forzar que solo vea sus propios pagos
        startDate: validated.startDate ? new Date(validated.startDate) : undefined,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = req.params['id'] as string;

      const payment = await paymentService.getPaymentById(id, userId);

      res.json(payment);
    } catch (error) {
      next(error);
    }
  }

  // ==================== REFUNDS ====================

  async createRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validated = createRefundSchema.parse(req.body);

      const refund = await paymentService.createRefund({
        ...validated,
        requestedBy: userId,
      });

      res.status(201).json(refund);
    } catch (error) {
      next(error);
    }
  }

  async getRefundById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params['id'] as string;
      const userId = req.user!.id;

      const refund = await paymentService.getRefundById(id, userId);

      return res.json(refund);
    } catch (error) {
      next(error);
    }
  }

  // ==================== TILOPAY REDIRECT CONFIRM ====================

  async confirmTilopayRedirect(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId, responseCode, orderNumber, auth, amount, currency, orderHash, external_orden_id, cardHash, cardBrand, cardLast4 } = req.body as {
        bookingId: string;
        responseCode: string;
        orderNumber: string;
        auth?: string;
        amount: string;
        currency?: string;
        orderHash?: string;
        external_orden_id?: string;
        cardHash?: string;
        cardBrand?: string;
        cardLast4?: string;
      };

      if (!bookingId || !responseCode || !orderNumber) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }

      const result = await paymentService.confirmTilopayRedirect({
        bookingId,
        responseCode,
        orderNumber,
        auth,
        amount,
        currency: currency || 'USD',
        orderHash,
        external_orden_id,
        cardHash,
        cardBrand,
        cardLast4,
        userId: req.user!.id,
      });

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== STATISTICS ====================

  async getPaymentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { startDate, endDate } = req.query;

      const stats = await paymentService.getPaymentStats({
        userId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
