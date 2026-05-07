import { Router } from 'express';
import { isAdmin } from '../middleware/isAdmin';
import {
  getStats,
  getUsers,
  exportUsers,
  toggleBlockUser,
  deleteUser,
  getArtists,
  getArtistDetail,
  verifyArtist,
  getBookings,
  getBookingDetail,
  getReports,
  resolveReport,
  getUserDetail,
  getPendingVerifications,
  verifyUser,
  shadowBanArtist,
  listCommissionRules,
  createCommissionRule,
  listPayouts,
  completePayout,
} from '../controller/admin.controller';

const router = Router();

// Todos los endpoints requieren rol admin
router.use(isAdmin);

// Stats
router.get('/stats', getStats);

// Users management
router.get('/users', getUsers);
router.get('/users/export', exportUsers);
router.get('/users/pending-verification', getPendingVerifications);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id/block', toggleBlockUser);
router.patch('/users/:id/verify', verifyUser);
router.delete('/users/:id', deleteUser);

// Artists management
router.get('/artists', getArtists);
router.get('/artists/:id', getArtistDetail);
router.patch('/artists/:id/verify', verifyArtist);
router.patch('/artists/:id/shadow-ban', shadowBanArtist);

// Commission rules
router.get('/commission-rules', listCommissionRules);
router.post('/commission-rules', createCommissionRule);

// Payouts
router.get('/payouts', listPayouts);
router.patch('/payouts/:id/complete', completePayout);

// Bookings overview
router.get('/bookings', getBookings);
router.get('/bookings/:id', getBookingDetail);

// Reports management
router.get('/reports', getReports);
router.patch('/reports/:id/resolve', resolveReport);

export default router;
