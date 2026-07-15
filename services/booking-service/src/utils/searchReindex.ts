import prisma from "../lib/prisma";
import { logger } from "./logger";

const SEARCH_SERVICE_URL =
  process.env.SEARCH_SERVICE_URL || "http://search-service:4009";

/**
 * Reindex fire-and-forget del artista en search-service al COMPLETAR una reserva.
 *
 * Por qué: ArtistIndex.totalBookings alimenta el 35% del término de calidad del
 * feed de recomendados y el orden "popular", y antes booking-service no avisaba
 * a search de nada — el contador solo se refrescaba si un evento no relacionado
 * reindexaba al artista.
 *
 * Recibe el bookingId (los sitios de escritura de COMPLETED no siempre tienen el
 * artistId a mano, p. ej. la resolución de disputas) y resuelve el artista con
 * un select mínimo. Nunca lanza: completar la reserva no puede fallar por esto.
 */
export function triggerArtistReindexForBooking(bookingId: string): void {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
  if (!internalSecret) {
    logger.warn(
      "INTERNAL_SERVICE_SECRET not set; skipping search reindex",
      "SEARCH_REINDEX"
    );
    return;
  }

  (async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { artistId: true },
    });
    if (!booking?.artistId) return;

    const res = await fetch(`${SEARCH_SERVICE_URL}/api/search/index/artist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({ artistId: booking.artistId }),
    });
    if (!res.ok) {
      logger.warn(
        `Reindex request failed: ${res.status} for booking ${bookingId}`,
        "SEARCH_REINDEX"
      );
    }
  })().catch((err) =>
    logger.error(
      `Reindex failed for booking ${bookingId}: ${err.message}`,
      "SEARCH_REINDEX"
    )
  );
}
