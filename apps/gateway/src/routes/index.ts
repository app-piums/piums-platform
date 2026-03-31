import { Express, Request, Response, NextFunction } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { authMiddleware } from "../middleware/auth";
import { healthRouter } from "./health";
import { logger } from "../utils/logger";
import { authRateLimiter } from "../middleware/rateLimiter";

// Middleware para transformar cookie en header Authorization
const cookieToAuthHeader = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc: any, cookie) => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name && rest.length > 0) {
        // Use rest.join('=') to preserve '=' padding characters in base64/JWT values
        acc[name] = rest.join('=');
      }
      return acc;
    }, {});
    
    const token = cookies['auth_token'] || cookies['token'];
    if (token) {
      req.headers.authorization = `Bearer ${token}`;
    }
  }
  next();
};

export const setupRoutes = (app: Express) => {
  // Aplicar transformación universal para todos los proxies
  app.use(cookieToAuthHeader);

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
    authRateLimiter,
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
      changeOrigin: true,
      pathRewrite: { "^": "/auth" },
      on: { 
        proxyReq: fixRequestBody,
        proxyRes: (proxyRes, req, res) => {
          const path = (req as any).path || req.url;
          
          if (path === '/me' || path === '/auth/me' || path?.endsWith('/me')) {
            logger.info(`[GATEWAY] Intercepting auth response for: ${path}`, "GATEWAY");
            const _write = res.write;
            const _end = res.end;
            let body = Buffer.from([]);

            proxyRes.on('data', (chunk) => {
              body = Buffer.concat([body, chunk]);
            });

            proxyRes.on('end', async () => {
              try {
                const bodyStr = body.toString();
                logger.debug(`[GATEWAY] Auth body received: ${bodyStr.substring(0, 100)}...`, "GATEWAY");
                const data = JSON.parse(bodyStr);
                
                if (data.user && data.user.role === 'artista') {
                  logger.info(`[GATEWAY] Artist detected: ${data.user.email}. Starting translation...`, "GATEWAY");
                  const token = req.headers.authorization?.substring(7);
                  if (token) {
                    const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
                    const profileRes = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (profileRes.ok) {
                      const profileData = await profileRes.json() as any;
                      if (profileData.artist?.id) {
                        data.user.authId = data.user.id;
                        data.user.id = profileData.artist.id;
                        logger.info(`[GATEWAY] IDENTITY TRANSLATED: ${data.user.authId} -> ${data.user.id}`, "GATEWAY");
                      } else {
                        logger.warn(`[GATEWAY] Artist profile ID not found in response`, "GATEWAY");
                      }
                    } else {
                      logger.warn(`[GATEWAY] Failed to fetch artist profile: ${profileRes.status}`, "GATEWAY");
                    }
                  } else {
                    logger.warn(`[GATEWAY] No Authorization header found for artist translation`, "GATEWAY");
                  }
                }
                
                const newBody = JSON.stringify(data);
                res.setHeader('content-length', Buffer.byteLength(newBody));
                res.setHeader('content-type', 'application/json');
                _write.call(res, newBody);
                _end.call(res);
              } catch (e: any) {
                logger.error(`[GATEWAY] Error in auth interception: ${e.message}`, "GATEWAY");
                _write.call(res, body);
                _end.call(res);
              }
            });
            return;
          }

          // Fallback: If not /me, just pipe the response back
          // Required because selfHandleResponse is true
          res.statusCode = proxyRes.statusCode || 200;
          Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]!);
          });
          proxyRes.pipe(res);
        }
      },
      selfHandleResponse: true // Requerido para interceptar el body
    })
  );

  // ============================================================================
  // Document upload (PÚBLICO - llamado durante registro, antes de tener auth)
  // ============================================================================
  app.use(
    "/api/users/documents/upload",
    createProxyMiddleware({
      target: process.env.USERS_SERVICE_URL || "http://localhost:4002",
      changeOrigin: true,
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

  // Availability routes that live under /api/artists/:id/* but belong to
  // booking-service. This MUST be registered BEFORE the general /api/artists proxy.
  app.use(
    createProxyMiddleware({
      pathFilter: (path) =>
        /^\/api\/artists\/[^/]+\/(blocked-slots|config)/.test(path),
      target: process.env.BOOKING_SERVICE_URL || "http://localhost:4008",
      changeOrigin: true,
      on: { proxyReq: fixRequestBody },
    })
  );

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
  // Availability — GET /api/availability/calendar, /time-slots, /check-reservation
  // Routed to booking-service (PUBLIC — no auth required for availability checks)
  // ============================================================================

  app.use(
    "/api/availability",
    createProxyMiddleware({
      target: process.env.BOOKING_SERVICE_URL || "http://localhost:4008",
      changeOrigin: true,
      pathRewrite: { "^": "/api/availability" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Blocked Slots — POST /api/blocked-slots, DELETE /api/blocked-slots/:id
  // Routed to booking-service (requires auth for write operations)
  // ============================================================================

  app.use(
    "/api/blocked-slots",
    authMiddleware,
    createProxyMiddleware({
      target: process.env.BOOKING_SERVICE_URL || "http://localhost:4008",
      changeOrigin: true,
      pathRewrite: { "^": "/api/blocked-slots" },
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
  // Disputes (PROTEGIDO) — booking-service handles /api/disputes/*
  // ============================================================================
  app.use(
    "/api/disputes",
    authMiddleware,
    createProxyMiddleware({
      target: process.env.BOOKING_SERVICE_URL || "http://localhost:4008",
      changeOrigin: true,
      pathRewrite: { "^": "/api/disputes" },
      on: { proxyReq: fixRequestBody },
    })
  );

  // ============================================================================
  // Events (PROTEGIDO) — booking-service handles /api/events/*
  // ============================================================================
  app.use(
    "/api/events",
    authMiddleware,
    createProxyMiddleware({
      target: process.env.BOOKING_SERVICE_URL || "http://localhost:4008",
      changeOrigin: true,
      pathRewrite: { "^": "/api/events" },
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
  
  app.use(
    "/api/chat",
    authMiddleware,
    createProxyMiddleware({
      target: process.env.CHAT_SERVICE_URL || "http://localhost:4010",
      changeOrigin: true,
      pathRewrite: { "^": "/api/chat" },
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
