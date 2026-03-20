import { Router } from 'express';
import {
  sendBookingCreatedNotification,
  sendBookingConfirmedNotification,
  sendBookingReminder24h,
  sendBookingReminder2h,
} from '../controller/booking.controller';

const router: Router = Router();

// Enviar notificaciones cuando se crea una reserva
router.post('/created', sendBookingCreatedNotification);

// Enviar notificación cuando se confirma una reserva
router.post('/confirmed', sendBookingConfirmedNotification);

// Enviar recordatorio 24 horas antes
router.post('/reminder-24h', sendBookingReminder24h);

// Enviar recordatorio 2 horas antes
router.post('/reminder-2h', sendBookingReminder2h);

export default router;
