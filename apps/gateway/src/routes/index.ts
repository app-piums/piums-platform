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
      onProxyReq: (proxyReq, req) => {
        logger.debug(`Proxying to auth-service: ${req.method} ${req.url}`, "PROXY");
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error to auth-service: ${err.message}`, "PROXY");
        res.status(503).json({
          error: "Service Unavailable",
          message: "Authentication service is currently unavailable",
        });
      },
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
      onProxyReq: (proxyReq, req: any) => {
        // Pasar información del usuario autenticado
        if (req.user) {
          proxyReq.setHeader("X-User-Id", req.user.id);
          proxyReq.setHeader("X-User-Email", req.user.email);
        }
        logger.debug(`Proxying to users-service: ${req.method} ${req.url}`, "PROXY");
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error to users-service: ${err.message}`, "PROXY");
        res.status(503).json({
          error: "Service Unavailable",
          message: "Users service is currently unavailable",
        });
      },
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
      onProxyReq: (proxyReq, req: any) => {
        if (req.user) {
          proxyReq.setHeader("X-User-Id", req.user.id);
          proxyReq.setHeader("X-User-Email", req.user.email);
        }
        logger.debug(`Proxying to artists-service: ${req.method} ${req.url}`, "PROXY");
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error to artists-service: ${err.message}`, "PROXY");
        res.status(503).json({
          error: "Service Unavailable",
          message: "Artists service is currently unavailable",
        });
      },
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
      onProxyReq: (proxyReq, req: any) => {
        if (req.user) {
          proxyReq.setHeader("X-User-Id", req.user.id);
        }
        logger.debug(`Proxying to catalog-service: ${req.method} ${req.url}`, "PROXY");
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error to catalog-service: ${err.message}`, "PROXY");
        res.status(503).json({
          error: "Service Unavailable",
          message: "Catalog service is currently unavailable",
        });
      },
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
      onProxyReq: (proxyReq, req: any) => {
        if (req.user) {
          proxyReq.setHeader("X-User-Id", req.user.id);
          proxyReq.setHeader("X-User-Email", req.user.email);
        }
        logger.debug(`Proxying to booking-service: ${req.method} ${req.url}`, "PROXY");
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error to booking-service: ${err.message}`, "PROXY");
        res.status(503).json({
          error: "Service Unavailable",
          message: "Booking service is currently unavailable",
        });
      },
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
      onProxyReq: (proxyReq, req: any) => {
        if (req.user) {
          proxyReq.setHeader("X-User-Id", req.user.id);
          proxyReq.setHeader("X-User-Email", req.user.email);
        }
        logger.debug(`Proxying to payments-service: ${req.method} ${req.url}`, "PROXY");
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error to payments-service: ${err.message}`, "PROXY");
        res.status(503).json({
          error: "Service Unavailable",
          message: "Payments service is currently unavailable",
        });
      },
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
      onProxyReq: (proxyReq, req: any) => {
        if (req.user) {
          proxyReq.setHeader("X-User-Id", req.user.id);
          proxyReq.setHeader("X-User-Email", req.user.email);
        }
        logger.debug(`Proxying to reviews-service: ${req.method} ${req.url}`, "PROXY");
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error to reviews-service: ${err.message}`, "PROXY");
        res.status(503).json({
          error: "Service Unavailable",
          message: "Reviews service is currently unavailable",
        });
      },
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
      onProxyReq: (proxyReq, req: any) => {
        if (req.user) {
          proxyReq.setHeader("X-User-Id", req.user.id);
          proxyReq.setHeader("X-User-Email", req.user.email);
        }
        logger.debug(`Proxying to notifications-service: ${req.method} ${req.url}`, "PROXY");
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error to notifications-service: ${err.message}`, "PROXY");
        res.status(503).json({
          error: "Service Unavailable",
          message: "Notifications service is currently unavailable",
        });
      },
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
      onProxyReq: (proxyReq, req: any) => {
        if (req.user) {
          proxyReq.setHeader("X-User-Id", req.user.id);
        }
        logger.debug(`Proxying to search-service: ${req.method} ${req.url}`, "PROXY");
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error to search-service: ${err.message}`, "PROXY");
        res.status(503).json({
          error: "Service Unavailable",
          message: "Search service is currently unavailable",
        });
      },
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
      },
    });
  });
};
