import { Router } from 'express';
import { 
  checkReservation, 
  getArtistAvailability,
  getCalendar,
  getTimeSlots,
} from '../controller/availability.controller';

const router: Router = Router();

// Verificar si hay conflicto de reserva
router.get('/check-reservation', checkReservation);

// Obtener reservas de un artista en un rango
router.get('/artist/:artistId', getArtistAvailability);

// Obtener calendario mensual (días ocupados/bloqueados)
router.get('/calendar', getCalendar);

// Obtener time slots de un día específico
router.get('/time-slots', getTimeSlots);

export default router;
