import { Router } from 'express';
import { notificationController } from '../controller/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  sendRateLimiter,
  batchSendRateLimiter,
  preferencesRateLimiter,
} from '../middleware/rateLimiter';

const router: Router = Router();

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
// Notification Queries
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

export default router;
