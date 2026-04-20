import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getMyProfile,
  updateMyProfile,
  getMyBookings,
  acceptBooking,
  declineBooking,
  completeBooking,
  cancelBooking,
  getMyStats,
  getMyAvailability,
  setMyAvailability,
} from "../controller/artist-dashboard.controller";
import {
  getAbsences,
  createAbsence,
  deleteAbsence,
} from "../controller/absence.controller";
import { updateGeoCountry } from "../controller/geo.controller";

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
router.patch("/me/bookings/:id/complete", completeBooking);
router.post("/me/bookings/:id/cancel", cancelBooking);

// Estadísticas
router.get("/me/stats", getMyStats);

// Disponibilidad semanal
router.get("/me/availability", getMyAvailability);
router.post("/me/availability", setMyAvailability);

// Ausencias / Viajes
router.get("/me/absences", getAbsences);
router.post("/me/absences", createAbsence);
router.delete("/me/absences/:id", deleteAbsence);

// Geolocalización en tiempo real
router.patch("/me/geo-country", updateGeoCountry);

export default router;
