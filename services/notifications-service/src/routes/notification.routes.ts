import { Router } from 'express';
import { notificationController } from '../controller/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { pushProvider } from '../providers/push.provider';
import {
  sendRateLimiter,
  batchSendRateLimiter,
  preferencesRateLimiter,
} from '../middleware/rateLimiter';

const router: Router = Router();

// ============================================================================
// Push Token Registration — llamado por las apps iOS al iniciar sesión
// POST /api/notifications/push-token  { token, platform }
// ============================================================================
router.post('/push-token', authenticate, async (req: any, res) => {
  const { token, platform } = req.body;
  if (!token) return res.status(400).json({ error: 'token es requerido' });

  const authUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';
  const rawToken = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

  try {
    const r = await fetch(`${authUrl}/auth/fcm-token`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rawToken}`,
      },
      body: JSON.stringify({ fcmToken: token }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(r.status).json(err);
    }
    return res.json({ ok: true, platform });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// Send Notifications
// ============================================================================

/**
 * POST /api/notifications/send-template-email
 * Send email from template (internal use only — requires x-internal-secret header)
 */
router.post(
  '/send-template-email',
  (req, res, next) => {
    const secret = process.env.INTERNAL_SERVICE_SECRET;
    if (!secret || req.headers['x-internal-secret'] !== secret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  },
  notificationController.sendTemplateEmail.bind(notificationController)
);

/**
 * POST /api/notifications/send
 * Send a single notification
 * Auth: Required
 */
router.post(
  '/send',
  authenticate,
  sendRateLimiter,
  notificationController.sendNotification.bind(notificationController)
);

/**
 * POST /api/notifications/batch
 * Send notifications to multiple users
 * Auth: Required (admin only in production)
 */
router.post(
  '/batch',
  authenticate,
  batchSendRateLimiter,
  notificationController.batchSend.bind(notificationController)
);

/**
 * POST /api/notifications/template
 * Send notification from template
 * Auth: Required
 */
router.post(
  '/template',
  authenticate,
  sendRateLimiter,
  notificationController.sendFromTemplate.bind(notificationController)
);

// ============================================================================
// Notification Queries — rutas específicas ANTES de /:id para evitar shadowing
// ============================================================================

/**
 * GET /api/notifications
 * Search notifications with filters
 * Auth: Required
 */
router.get(
  '/',
  authenticate,
  notificationController.searchNotifications.bind(notificationController)
);

/**
 * POST /api/notifications/read
 * Mark notifications as read
 * Auth: Required
 */
router.post(
  '/read',
  authenticate,
  notificationController.markAsRead.bind(notificationController)
);

// ============================================================================
// Templates
// ============================================================================

/**
 * POST /api/notifications/templates
 * Create notification template
 * Auth: Required (admin only in production)
 */
router.post(
  '/templates',
  authenticate,
  notificationController.createTemplate.bind(notificationController)
);

/**
 * GET /api/notifications/templates
 * List all templates
 * Auth: Required
 */
router.get(
  '/templates',
  authenticate,
  notificationController.listTemplates.bind(notificationController)
);

/**
 * GET /api/notifications/templates/:key
 * Get template by key
 * Auth: Required
 */
router.get(
  '/templates/:key',
  authenticate,
  notificationController.getTemplateByKey.bind(notificationController)
);

/**
 * PUT /api/notifications/templates/:key
 * Update template
 * Auth: Required (admin only in production)
 */
router.put(
  '/templates/:key',
  authenticate,
  notificationController.updateTemplate.bind(notificationController)
);

/**
 * DELETE /api/notifications/templates/:key
 * Delete template
 * Auth: Required (admin only in production)
 */
router.delete(
  '/templates/:key',
  authenticate,
  notificationController.deleteTemplate.bind(notificationController)
);

// ============================================================================
// User Preferences
// ============================================================================

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 * Auth: Required
 */
router.get(
  '/preferences',
  authenticate,
  notificationController.getUserPreferences.bind(notificationController)
);

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 * Auth: Required
 */
router.put(
  '/preferences',
  authenticate,
  preferencesRateLimiter,
  notificationController.updateUserPreferences.bind(notificationController)
);

// ============================================================================
// Stats
// ============================================================================

/**
 * GET /api/notifications/stats
 * Get notification statistics
 * Auth: Required
 */
router.get(
  '/stats',
  authenticate,
  notificationController.getStats.bind(notificationController)
);

// ============================================================================
// Dynamic :id routes — SIEMPRE al final para no capturar rutas específicas
// ============================================================================

/**
 * GET /api/notifications/:id
 * Get notification by ID
 * Auth: Required
 */
router.get(
  '/:id',
  authenticate,
  notificationController.getNotificationById.bind(notificationController)
);

/**
 * DELETE /api/notifications/:id
 * Delete notification
 * Auth: Required
 */
router.delete(
  '/:id',
  authenticate,
  notificationController.deleteNotification.bind(notificationController)
);

/**
 * POST /api/notifications/internal/push
 * Envía push directamente con fcmToken — solo inter-servicios (x-internal-secret)
 */
router.post('/internal/push', async (req, res) => {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret || req.headers['x-internal-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { fcmToken, title, body, data } = req.body;
  if (!fcmToken || !title || !body) {
    return res.status(400).json({ error: 'fcmToken, title y body son requeridos' });
  }
  const result = await pushProvider.sendPush({ fcmToken, title, body, data });
  return res.json(result);
});

export default router;
