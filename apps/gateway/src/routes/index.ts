import { Express, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
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
      pathRewrite: { "^/api/auth": "/auth" },
      // logger.debug(`Proxying to auth-service: ${req.method} ${req.url}`, "PROXY");
      // onError eliminado por incompatibilidad de tipo
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
      pathRewrite: { "^/api/users": "/users" },
      // logger.debug(`Proxying to users-service: ${req.method} ${req.url}`, "PROXY");
      // onError eliminado por incompatibilidad de tipo
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
      pathRewrite: { "^/api/artists": "/artists" },
      // logger.debug(`Proxying to artists-service: ${req.method} ${req.url}`, "PROXY");
      // onError eliminado por incompatibilidad de tipo
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
      pathRewrite: { "^/api/catalog": "/catalog" },
      // logger.debug(`Proxying to catalog-service: ${req.method} ${req.url}`, "PROXY");
      // onError eliminado por incompatibilidad de tipo
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
      pathRewrite: { "^/api/bookings": "/bookings" },
      // logger.debug(`Proxying to booking-service: ${req.method} ${req.url}`, "PROXY");
      // onError eliminado por incompatibilidad de tipo
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
      pathRewrite: { "^/api/payments": "/payments" },
      // logger.debug(`Proxying to payments-service: ${req.method} ${req.url}`, "PROXY");
      // onError eliminado por incompatibilidad de tipo
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
      pathRewrite: { "^/api/reviews": "/reviews" },
      // logger.debug(`Proxying to reviews-service: ${req.method} ${req.url}`, "PROXY");
      // onError eliminado por incompatibilidad de tipo
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
      pathRewrite: { "^/api/notifications": "/notifications" },
      // logger.debug(`Proxying to notifications-service: ${req.method} ${req.url}`, "PROXY");
      // onError eliminado por incompatibilidad de tipo
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
      pathRewrite: { "^/api/search": "/search" },
      // logger.debug(`Proxying to search-service: ${req.method} ${req.url}`, "PROXY");
      // onError eliminado por incompatibilidad de tipo
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
      pathRewrite: { "^/api/admin": "/admin" },
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
