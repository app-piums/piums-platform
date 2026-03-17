import { Router, Request, Response } from "express";
import axios from "axios";
import { logger } from "../utils/logger";

const router = Router();

interface ServiceHealth {
  name: string;
  url: string;
  status: "up" | "down";
  latency?: number;
  error?: string;
}

const SERVICES = [
  { name: "auth", url: process.env.AUTH_SERVICE_URL || "http://localhost:4001" },
  { name: "users", url: process.env.USERS_SERVICE_URL || "http://localhost:4002" },
  { name: "artists", url: process.env.ARTISTS_SERVICE_URL || "http://localhost:4003" },
  { name: "catalog", url: process.env.CATALOG_SERVICE_URL || "http://localhost:4004" },
  { name: "payments", url: process.env.PAYMENTS_SERVICE_URL || "http://localhost:4005" },
  { name: "reviews", url: process.env.REVIEWS_SERVICE_URL || "http://localhost:4006" },
  { name: "notifications", url: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:4007" },
  { name: "booking", url: process.env.BOOKING_SERVICE_URL || "http://localhost:4008" },
  { name: "search", url: process.env.SEARCH_SERVICE_URL || "http://localhost:4009" },
];

async function checkServiceHealth(service: { name: string; url: string }): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    await axios.get(`${service.url}/health`, { timeout: 5000 });
    const latency = Date.now() - startTime;
    
    return {
      name: service.name,
      url: service.url,
      status: "up",
      latency,
    };
  } catch (error: any) {
    return {
      name: service.name,
      url: service.url,
      status: "down",
      error: error.message,
    };
  }
}

// Health check del gateway + todos los servicios
router.get("/", async (req: Request, res: Response) => {
  try {
    // Gateway está arriba si llegó aquí
    const gatewayHealth = {
      status: "up",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // Verificar health de todos los servicios
    const servicesHealthPromises = SERVICES.map(checkServiceHealth);
    const servicesHealth = await Promise.all(servicesHealthPromises);

    // Calcular status general
    const allServicesUp = servicesHealth.every(s => s.status === "up");
    const overallStatus = allServicesUp ? "healthy" : "degraded";

    const response = {
      gateway: gatewayHealth,
      status: overallStatus,
      services: servicesHealth.reduce((acc, service) => {
        acc[service.name] = {
          status: service.status,
          latency: service.latency ? `${service.latency}ms` : undefined,
          error: service.error,
        };
        return acc;
      }, {} as Record<string, any>),
    };

    const statusCode = allServicesUp ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error: any) {
    logger.error(`Health check error: ${error.message}`, "HEALTH");
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message,
    });
  }
});

// Health check rápido (solo gateway, sin verificar servicios)
router.get("/ping", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export const healthRouter: Router = router;
