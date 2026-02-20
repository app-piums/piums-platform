import { Router } from 'express';
import { checkReservation, getArtistAvailability } from '../controller/availability.controller';

const router = Router();

// Verificar si hay conflicto de reserva
router.get('/check-reservation', checkReservation);

// Obtener reservas de un artista
router.get('/artist/:artistId', getArtistAvailability);

export default router;
