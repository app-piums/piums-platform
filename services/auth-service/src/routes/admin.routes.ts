import { Router } from 'express';
import { isAdmin } from '../middleware/isAdmin';
import {
  getStats,
  getUsers,
  toggleBlockUser,
  deleteUser,
  getArtists,
  getArtistDetail,
  verifyArtist,
  getBookings,
  getBookingDetail,
  getReports,
  resolveReport,
  getUserDetail
} from '../controller/admin.controller';

const router = Router();

// Todos los endpoints requieren rol admin
router.use(isAdmin);

// Stats
router.get('/stats', getStats);

// Users management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id/block', toggleBlockUser);
router.delete('/users/:id', deleteUser);

// Artists management
router.get('/artists', getArtists);
router.get('/artists/:id', getArtistDetail);
router.patch('/artists/:id/verify', verifyArtist);

// Bookings overview
router.get('/bookings', getBookings);
router.get('/bookings/:id', getBookingDetail);

// Reports management
router.get('/reports', getReports);
router.patch('/reports/:id/resolve', resolveReport);

export default router;
