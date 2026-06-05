import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  checkContent,
  createBlacklistWord,
  updateBlacklistWord,
  deactivateBlacklistWord,
  listBlacklistWords,
  getModerationLogs,
  getManualReviewQueue,
  resolveManualReview,
  getUserStrikes,
  resolveStrike,
  testContent,
} from "../services/moderation.service";
import {
  checkContentSchema,
  createWordSchema,
  updateWordSchema,
  listWordsSchema,
  listLogsSchema,
  resolveReviewSchema,
  resolveStrikeSchema,
  testContentSchema,
} from "../schemas/moderation.schema";

export class ModerationController {
  // ============================================================
  // MODERACIÓN DE CONTENIDO (uso interno por otros servicios)
  // ============================================================

  async check(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = checkContentSchema.parse(req.body);
      const result = await checkContent(data);
      res.json({ status: "ok", ...result });
    } catch (error) {
      next(error);
    }
  }

  async testCheck(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { content } = testContentSchema.parse(req.body);
      const result = await testContent(content);
      res.json({ status: "ok", ...result });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // GESTIÓN DEL BLACKLIST (admin)
  // ============================================================

  async listWords(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listWordsSchema.parse(req.query);
      const result = await listBlacklistWords(filters);
      res.json({ status: "ok", ...result });
    } catch (error) {
      next(error);
    }
  }

  async createWord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createWordSchema.parse(req.body);
      const adminId = req.user.id || req.user.userId || "unknown";
      const word = await createBlacklistWord({ ...data, adminId: adminId as string });
      res.status(201).json({ status: "ok", word });
    } catch (error) {
      next(error);
    }
  }

  async updateWord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const data = updateWordSchema.parse(req.body);
      const adminId = req.user.id || req.user.userId || "unknown";
      const word = await updateBlacklistWord(id, data, adminId as string);
      res.json({ status: "ok", word });
    } catch (error) {
      next(error);
    }
  }

  async deactivateWord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const adminId = req.user.id || req.user.userId || "unknown";
      const word = await deactivateBlacklistWord(id, adminId as string);
      res.json({ status: "ok", word });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // LOGS DE AUDITORÍA (admin)
  // ============================================================

  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listLogsSchema.parse(req.query);
      const result = await getModerationLogs(filters);
      res.json({ status: "ok", ...result });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // COLA DE REVISIÓN MANUAL (admin)
  // ============================================================

  async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string || "1", 10);
      const limit = parseInt(req.query.limit as string || "20", 10);
      const result = await getManualReviewQueue(page, limit);
      res.json({ status: "ok", ...result });
    } catch (error) {
      next(error);
    }
  }

  async resolveQueue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const logId = req.params.logId;
      const { note } = resolveReviewSchema.parse(req.body);
      const adminId = req.user.id || req.user.userId || "unknown";
      const log = await resolveManualReview(logId, adminId as string, note);
      res.json({ status: "ok", log });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // STRIKES (admin)
  // ============================================================

  async getStrikes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
      const result = await getUserStrikes(userId);
      res.json({ status: "ok", ...result });
    } catch (error) {
      next(error);
    }
  }

  async resolveStrikeHandler(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const strikeId = req.params.strikeId;
      const { note } = resolveStrikeSchema.parse(req.body);
      const adminId = req.user.id || req.user.userId || "unknown";
      const strike = await resolveStrike(strikeId, adminId as string, note);
      res.json({ status: "ok", strike });
    } catch (error) {
      next(error);
    }
  }
}
