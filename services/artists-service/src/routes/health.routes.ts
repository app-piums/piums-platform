import { Router, Request, Response } from "express";

const router = Router();

const startTime = Date.now();

router.get("/", (req: Request, res: Response) => {
  const uptime = (Date.now() - startTime) / 1000;

  res.json({
    status: "healthy",
    service: "artists-service",
    timestamp: new Date().toISOString(),
    uptime,
    environment: process.env.NODE_ENV || "development",
  });
});

export default router;
