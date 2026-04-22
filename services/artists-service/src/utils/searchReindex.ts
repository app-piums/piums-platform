import { logger } from "./logger";

const SEARCH_SERVICE_URL =
  process.env.SEARCH_SERVICE_URL || "http://search-service:4009";

/**
 * Fire-and-forget reindex of a single artist in search-service.
 * Uses x-internal-secret for service-to-service auth.
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

/**
 * Fire-and-forget removal of an artist from the search index.
 */
export function triggerArtistUnindex(artistId: string): void {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
  if (!internalSecret) return;
  fetch(`${SEARCH_SERVICE_URL}/api/search/index/artist/${artistId}`, {
    method: "DELETE",
    headers: { "x-internal-secret": internalSecret },
  }).catch((err) =>
    logger.error(
      `Unindex failed for artist ${artistId}: ${err.message}`,
      "SEARCH_REINDEX"
    )
  );
}
