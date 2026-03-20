import { Request, Response, NextFunction } from "express";
import { disputeService } from "../services/dispute.service";
import { DisputeType, DisputeStatus, DisputeResolution } from "@prisma/client";

export class DisputeController {
  // ==================== CREATE DISPUTE ====================

  async createDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const {
        bookingId,
        reportedAgainst,
        disputeType,
        subject,
        description,
        evidence,
        priority,
      } = req.body;

      // Validaciones básicas
      if (!bookingId || !disputeType || !subject || !description) {
        return res.status(400).json({
          error: "bookingId, disputeType, subject y description son requeridos",
        });
      }

      const dispute = await disputeService.createDispute({
        bookingId,
        reportedBy: userId,
        reportedAgainst,
        disputeType: disputeType as DisputeType,
        subject,
        description,
        evidence,
        priority,
      });

      res.status(201).json(dispute);
    } catch (error) {
      next(error);
    }
  }

  // ==================== GET DISPUTE ====================

  async getDisputeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const dispute = await disputeService.getDisputeById(id as string);

      // Verificar permisos - solo las partes involucradas o staff pueden ver
      const isInvolved =
        dispute.reportedBy === userId ||
        dispute.reportedAgainst === userId ||
        req.user!.role === "admin" ||
        req.user!.role === "staff";

      if (!isInvolved) {
        return res.status(403).json({
          error: "No tienes permiso para ver esta disputa",
        });
      }

      res.json(dispute);
    } catch (error) {
      next(error);
    }
  }

  // ==================== LIST DISPUTES ====================

  async listDisputes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      const {
        bookingId,
        reportedBy,
        reportedAgainst,
        disputeType,
        status,
        priority,
        fromDate,
        toDate,
        page,
        limit,
      } = req.query;

      // Si no es staff/admin, solo puede ver sus propias disputas
      let filters: any = {
        bookingId: bookingId as string,
        disputeType: disputeType as DisputeType,
        status: status as DisputeStatus,
        priority: priority ? parseInt(priority as string) : undefined,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      if (role === "admin" || role === "staff") {
        // Staff puede ver todas y filtrar por reportedBy/reportedAgainst
        filters.reportedBy = reportedBy as string;
        filters.reportedAgainst = reportedAgainst as string;
      } else {
        // Usuario normal solo ve las suyas
        filters.reportedBy = userId;
      }

      const result = await disputeService.listDisputes(filters);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== UPDATE STATUS ====================

  async updateDisputeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const staffId = req.user!.id;
      const role = req.user!.role;

      // Solo staff/admin pueden actualizar estados
      if (role !== "admin" && role !== "staff") {
        return res.status(403).json({
          error: "Solo staff puede actualizar el estado de disputas",
        });
      }

      if (!status) {
        return res.status(400).json({ error: "status es requerido" });
      }

      const dispute = await disputeService.updateDisputeStatus(
        id as string,
        status as DisputeStatus,
        staffId,
        notes
      );

      res.json({
        message: "Estado actualizado",
        dispute,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== RESOLVE DISPUTE ====================

  async resolveDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { resolution, resolutionNotes, refundAmount } = req.body;
      const staffId = req.user!.id;
      const role = req.user!.role;

      // Solo staff/admin pueden resolver
      if (role !== "admin" && role !== "staff") {
        return res.status(403).json({
          error: "Solo staff puede resolver disputas",
        });
      }

      if (!resolution || !resolutionNotes) {
        return res.status(400).json({
          error: "resolution y resolutionNotes son requeridos",
        });
      }

      const dispute = await disputeService.resolveDispute({
        disputeId: id as string,
        resolution: resolution as DisputeResolution,
        resolutionNotes,
        resolvedBy: staffId,
        refundAmount: refundAmount ? parseInt(refundAmount) : undefined,
      });

      res.json({
        message: "Disputa resuelta",
        dispute,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ADD MESSAGE ====================

  async addMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { message, attachments } = req.body;
      const userId = req.user!.id;
      const role = req.user!.role;

      if (!message) {
        return res.status(400).json({ error: "message es requerido" });
      }

      // Verificar que el usuario está involucrado en la disputa
      const dispute = await disputeService.getDisputeById(id as string);
      const isInvolved =
        dispute.reportedBy === userId ||
        dispute.reportedAgainst === userId ||
        role === "admin" ||
        role === "staff";

      if (!isInvolved) {
        return res.status(403).json({
          error: "No tienes permiso para enviar mensajes en esta disputa",
        });
      }

      let senderType: "client" | "artist" | "staff" = "client";
      if (role === "admin" || role === "staff") {
        senderType = "staff";
      } else if (dispute.reportedAgainst === userId) {
        // El reportado podría ser artista
        senderType = "artist"; // Simplificado, en producción deberías verificar
      }

      const disputeMessage = await disputeService.addMessage({
        disputeId: id as string,
        senderId: userId,
        senderType,
        message,
        attachments,
      });

      res.status(201).json(disputeMessage);
    } catch (error) {
      next(error);
    }
  }

  // ==================== ESCALATE DISPUTE ====================

  async escalateDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const staffId = req.user!.id;
      const role = req.user!.role;

      if (role !== "admin" && role !== "staff") {
        return res.status(403).json({
          error: "Solo staff puede escalar disputas",
        });
      }

      if (!reason) {
        return res.status(400).json({ error: "reason es requerido" });
      }

      const dispute = await disputeService.escalateDispute(id as string, staffId, reason);

      res.json({
        message: "Disputa escalada",
        dispute,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== CLOSE DISPUTE ====================

  async closeDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const staffId = req.user!.id;
      const role = req.user!.role;

      if (role !== "admin" && role !== "staff") {
        return res.status(403).json({
          error: "Solo staff puede cerrar disputas",
        });
      }

      if (!reason) {
        return res.status(400).json({ error: "reason es requerido" });
      }

      const dispute = await disputeService.closeDispute(id as string, staffId, reason);

      res.json({
        message: "Disputa cerrada",
        dispute,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== STATS ====================

  async getDisputeStats(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.user!.role;

      if (role !== "admin" && role !== "staff") {
        return res.status(403).json({
          error: "Solo staff puede ver estadísticas",
        });
      }

      const { reportedBy, reportedAgainst, fromDate, toDate } = req.query;

      const stats = await disputeService.getDisputeStats({
        reportedBy: reportedBy as string,
        reportedAgainst: reportedAgainst as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      });

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // ==================== USER DISPUTES ====================

  async getUserDisputes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const disputes = await disputeService.getUserDisputes(userId);

      res.json(disputes);
    } catch (error) {
      next(error);
    }
  }
}

export const disputeController = new DisputeController();
