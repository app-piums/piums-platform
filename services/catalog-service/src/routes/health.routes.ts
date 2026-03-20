import { Router, Request, Response } from "express";

const router: Router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get("/", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "catalog-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
