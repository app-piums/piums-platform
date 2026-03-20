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

      const refund = await paymentService.getRefundById(id);

      res.json(refund);
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
