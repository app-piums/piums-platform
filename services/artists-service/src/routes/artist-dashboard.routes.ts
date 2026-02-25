import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getMyProfile,
  updateMyProfile,
  getMyBookings,
  acceptBooking,
  declineBooking,
  getMyStats,
} from "../controller/artist-dashboard.controller";
import { getAvailability, setAvailability } from "../controller/artists.controller";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Perfil del artista
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);

// Reservas
router.get("/me/bookings", getMyBookings);
router.patch("/me/bookings/:id/accept", acceptBooking);
router.patch("/me/bookings/:id/decline", declineBooking);

// Estadísticas
router.get("/me/stats", getMyStats);

// Disponibilidad (reutilizando del controller existente)
router.get("/me/availability", getAvailability);
router.post("/me/availability", setAvailability);

export default router;
