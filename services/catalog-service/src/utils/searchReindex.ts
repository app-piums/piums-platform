import { logger } from "./logger";

const SEARCH_SERVICE_URL =
  process.env.SEARCH_SERVICE_URL || "http://search-service:4009";

/**
 * Reindex fire-and-forget del artista en search-service tras mutar sus servicios.
 *
 * Por qué existe: ArtistIndex.servicesCount es un filtro DURO de búsqueda y
 * recomendados (servicesCount > 0), y antes catalog no avisaba a search de
 * ningún cambio — crear o borrar un servicio dejaba el índice obsoleto hasta
 * que un evento no relacionado (editar perfil, reiniciar search) reindexara.
 * Un artista podía crear su primer servicio y seguir invisible.
 *
 * El artistId de catalog ES el Artist.id de artists-service (verificado: es lo
 * que indexArtist espera). Mismo patrón que artists-service/utils/searchReindex.
 */
export function triggerArtistReindex(artistId: string): void {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
  if (!internalSecret) {
    logger.warn(
      "INTERNAL_SERVICE_SECRET not set; skipping search reindex",
      "SEARCH_REINDEX"
    );
    return;
  }

  fetch(`${SEARCH_SERVICE_URL}/api/search/index/artist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": internalSecret,
    },
    body: JSON.stringify({ artistId }),
  })
    .then((res) => {
      if (!res.ok) {
        logger.warn(
          `Reindex request failed: ${res.status} for artist ${artistId}`,
          "SEARCH_REINDEX"
        );
      }
    })
    .catch((err) =>
      logger.error(
        `Reindex failed for artist ${artistId}: ${err.message}`,
        "SEARCH_REINDEX"
      )
    );
}
