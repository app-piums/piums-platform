import { Request, Response, NextFunction } from "express";
import { payoutService } from "../services/payout.service";
import { PayoutStatus, PayoutType } from "@prisma/client";

export class PayoutController {
  // ==================== CREATE PAYOUT ====================

  async createPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        artistId,
        bookingId,
        paymentId,
        amount,
        currency,
        payoutType,
        description,
        scheduledFor,
        metadata,
      } = req.body;

      // Validaciones básicas
      if (!artistId) {
        return res.status(400).json({ error: "artistId es requerido" });
      }
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "amount debe ser mayor a 0" });
      }

      const payout = await payoutService.createPayout({
        artistId,
        bookingId,
        paymentId,
        amount,
        currency,
        payoutType: payoutType as PayoutType,
        description,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        metadata,
      });

      res.status(201).json(payout);
      return;
    } catch (error) {
      return next(error);
    }
  }

  // ==================== PROCESS PAYOUT ====================

  async processPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params['id'] as string;

      const payout = await payoutService.processPayout(id);

      res.json({
        message: "Payout procesado exitosamente",
        payout,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== GET PAYOUT ====================

  async getPayoutById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params['id'] as string;

      const payout = await payoutService.getPayoutById(id);

      res.json(payout);
    } catch (error) {
      next(error);
    }
  }

  // ==================== LIST PAYOUTS ====================

  async listPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        artistId,
        bookingId,
        status,
        payoutType,
        fromDate,
        toDate,
        page,
        limit,
      } = req.query;

      const result = await payoutService.listPayouts({
        artistId: artistId as string,
        bookingId: bookingId as string,
        status: status as PayoutStatus,
        payoutType: payoutType as PayoutType,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== GET ARTIST PAYOUTS ====================

  async getArtistPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params['artistId'] as string;
      const { status, fromDate, toDate } = req.query;

      const result = await payoutService.getArtistPayouts(artistId, {
        status: status as PayoutStatus,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== CANCEL PAYOUT ====================

  async cancelPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params['id'] as string;
      const { reason } = req.body;

      const payout = await payoutService.cancelPayout(id, reason);

      res.json({
        message: "Payout cancelado",
        payout,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== CALCULATE PAYOUT ====================

  async calculatePayout(req: Request, res: Response, next: NextFunction) {
    try {
      const { originalAmount, payoutType } = req.body;

      if (!originalAmount || originalAmount <= 0) {
        return res.status(400).json({
          error: "originalAmount debe ser mayor a 0",
        });
      }

      const calculation = payoutService.calculatePayoutAmount(
        originalAmount,
        payoutType as PayoutType
      );

      res.json(calculation);
      return;
    } catch (error) {
      return next(error);
    }
  }

  // ==================== ARTIST STATS ====================

  async getArtistPayoutStats(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params['artistId'] as string;

      const stats = await payoutService.getArtistPayoutStats(artistId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // ==================== SYNC STATUS ====================

  async syncPayoutStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params['id'] as string;

      const payout = await payoutService.syncPayoutStatus(id);

      res.json({
        message: "Estado sincronizado",
        payout,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const payoutController = new PayoutController();
