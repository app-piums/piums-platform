import { searchClient, type SonidistaCandidate } from '../clients/search.client';
import { checkReservationConflict } from './availability.service';
import { logger } from '../utils/logger';

const MAX_SONIDISTAS = 5;

export async function getSonidistasForBooking(params: {
  city: string;
  scheduledDate: Date;
  durationMinutes: number;
  excludeArtistId?: string;
}): Promise<SonidistaCandidate[]> {
  const { city, scheduledDate, durationMinutes, excludeArtistId } = params;

  let candidates = await searchClient.findSonidistasForBooking({ city, limit: 10 });

  if (excludeArtistId) {
    candidates = candidates.filter(c => c.artistId !== excludeArtistId);
  }

  if (candidates.length === 0) return [];

  const endAt = new Date(scheduledDate.getTime() + durationMinutes * 60_000);

  const checks = await Promise.allSettled(
    candidates.map(async (c) => {
      try {
        const { hasReservation } = await checkReservationConflict(c.artistId, scheduledDate, endAt);
        return hasReservation ? null : c;
      } catch (err: any) {
        logger.warn('Error verificando disponibilidad de sonidista', 'SONIDISTA', { artistId: c.artistId, error: err.message });
        return null;
      }
    })
  );

  return checks
    .filter((r): r is PromiseFulfilledResult<SonidistaCandidate> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value)
    .sort((a, b) => b.artistRating - a.artistRating)
    .slice(0, MAX_SONIDISTAS);
}
