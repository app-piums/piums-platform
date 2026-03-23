import { Express, Request, Response } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { authMiddleware } from "../middleware/auth";
import { healthRouter } from "./health";
import { logger } from "../utils/logger";

export const setupRoutes = (app: Express) => {
  // ============================================================================
  // Health Check Routes (no proxy, handled locally)
  // ============================================================================
  
  app.use("/api/health", healthRouter);
  
  // Root endpoint
  app.get("/", (req: Request, res: Response) => {
    res.json({
      name: "Piums API Gateway",
      version: "1.0.0",
      status: "operational",
      timestamp: new Date().toISOString(),
      endpoints: {
        health: "/api/health",
        auth: "/api/auth/*",
        users: "/api/users/*",
        artists: "/api/artists/*",
        catalog: "/api/catalog/*",
        bookings: "/api/bookings/*",
        payments: "/api/payments/*",
        reviews: "/api/reviews/*",
        notifications: "/api/notifications/*",
        search: "/api/search/*",
      },
    });
  });

  // ============================================================================
  // Authentication Service (PUBLIC - sin auth middleware)
  // ============================================================================
  
  app.use(
    "/api/auth",
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
      changeOrigin: true,
      pathRewrite: { "^": "/auth" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Users Service (PROTEGIDO)
  // ============================================================================
  
  app.use(
    "/api/users",
    authMiddleware,
    createProxyMiddleware({
      target: process.env.USERS_SERVICE_URL || "http://localhost:4002",
      changeOrigin: true,
      pathRewrite: { "^": "/api/users" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Artists Service (MIXTO - algunos endpoints públicos)
  // ============================================================================
  
  app.use(
    "/api/artists",
    createProxyMiddleware({
      target: process.env.ARTISTS_SERVICE_URL || "http://localhost:4003",
      changeOrigin: true,
      pathRewrite: { "^": "/artists" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Catalog Service (PÚBLICO en su mayoría)
  // ============================================================================
  
  app.use(
    "/api/catalog",
    createProxyMiddleware({
      target: process.env.CATALOG_SERVICE_URL || "http://localhost:4004",
      changeOrigin: true,
      pathRewrite: { "^": "/api" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Booking Service (PROTEGIDO)
  // ============================================================================
  
  app.use(
    "/api/bookings",
    authMiddleware,
    createProxyMiddleware({
      target: process.env.BOOKING_SERVICE_URL || "http://localhost:4008",
      changeOrigin: true,
      pathRewrite: { "^": "/api/bookings" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Payments Service (PROTEGIDO)
  // ============================================================================
  
  app.use(
    "/api/payments",
    authMiddleware,
    createProxyMiddleware({
      target: process.env.PAYMENTS_SERVICE_URL || "http://localhost:4005",
      changeOrigin: true,
      pathRewrite: { "^": "/api/payments" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Reviews Service (MIXTO)
  // ============================================================================
  
  app.use(
    "/api/reviews",
    createProxyMiddleware({
      target: process.env.REVIEWS_SERVICE_URL || "http://localhost:4006",
      changeOrigin: true,
      pathRewrite: { "^": "/api/reviews" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Notifications Service (PROTEGIDO)
  // ============================================================================
  
  app.use(
    "/api/notifications",
    authMiddleware,
    createProxyMiddleware({
      target: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:4007",
      changeOrigin: true,
      pathRewrite: { "^": "/api/notifications" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Search Service (PÚBLICO)
  // ============================================================================
  
  app.use(
    "/api/search",
    createProxyMiddleware({
      target: process.env.SEARCH_SERVICE_URL || "http://localhost:4009",
      changeOrigin: true,
      pathRewrite: { "^": "/api/search" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Admin Service (PROTEGIDO — proxied to auth-service /admin/*)
  // ============================================================================

  app.use(
    "/api/admin",
    authMiddleware,
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
      changeOrigin: true,
      pathRewrite: { "^": "/admin" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // 404 Handler
  // ============================================================================
  
  app.use("*", (req: Request, res: Response) => {
    res.status(404).json({
      error: "Not Found",
      message: `Route ${req.originalUrl} not found`,
      availableEndpoints: {
        health: "/api/health",
        auth: "/api/auth/*",
        users: "/api/users/*",
        artists: "/api/artists/*",
        catalog: "/api/catalog/*",
        bookings: "/api/bookings/*",
        payments: "/api/payments/*",
        reviews: "/api/reviews/*",
        notifications: "/api/notifications/*",
        search: "/api/search/*",
        admin: "/api/admin/*",
      },
    });
  });
};
