import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { notificationsClient } from '../clients/notifications.client';
import { artistsClient } from '../clients/artists.client';
import { chatClient } from '../clients/chat.client';

const MAX_ACTIVE_APPLICATIONS = 10;
const POSTING_EXPIRY_DAYS = 30;
const MAX_MATCH_NOTIFICATIONS = 50;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class PostingService {
  // ==================== POSTINGS ====================

  async createPosting(artistId: string, data: {
    title: string;
    description: string;
    role: string;
    category?: string;
    eventDate?: string;
    cityId?: string;
    budgetMin?: number;
    budgetMax?: number;
    currency?: string;
  }) {
    const posting = await prisma.artistPosting.create({
      data: {
        artistId,
        title: data.title,
        description: data.description,
        role: data.role,
        category: data.category ?? null,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        cityId: data.cityId ?? null,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        currency: data.currency ?? 'GTQ',
        status: 'OPEN',
      },
    });
    logger.info(`Posting created: ${posting.id} by artist ${artistId}`, 'POSTING');

    // Fire background matching — does not block the response
    this.notifyMatchingArtists(posting, artistId).catch(err =>
      logger.error('Error en matching de postulación', 'POSTING', { err: err?.message, postingId: posting.id })
    );

    return posting;
  }

  private async notifyMatchingArtists(posting: any, creatorAuthId: string): Promise<void> {
    if (!posting.category) return; // mínimo requerido para matching

    // Resolve city coordinates if cityId provided
    let cityLat: number | undefined;
    let cityLng: number | undefined;
    let cityName = '';
    if (posting.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: posting.cityId },
        select: { latitude: true, longitude: true, name: true },
      });
      if (city) {
        cityLat = city.latitude;
        cityLng = city.longitude;
        cityName = city.name;
      }
    }

    // Search artists matching category and within coverageRadius of the event
    const candidates = await artistsClient.searchArtists({
      category: posting.category,
      lat: cityLat,
      lng: cityLng,
      limit: MAX_MATCH_NOTIFICATIONS * 3, // fetch extra to account for filtering
    });

    // Exclude the creator of the posting
    const filtered = candidates.filter((a: any) => a.authId !== creatorAuthId && a.id !== creatorAuthId);

    // If eventDate provided, check availability (fail-open per artist)
    let available = filtered;
    if (posting.eventDate) {
      const isoDate = posting.eventDate.toISOString().slice(0, 10);
      const checks = await Promise.all(
        filtered.map(async (a: any) => {
          const isAvailable = await artistsClient.checkAvailabilityDate(a.authId ?? a.id, isoDate);
          return { artist: a, isAvailable };
        })
      );
      available = checks.filter(c => c.isAvailable).map(c => c.artist);
    }

    const targets = available.slice(0, MAX_MATCH_NOTIFICATIONS);
    if (targets.length === 0) return;

    // Build notification message
    const parts: string[] = [];
    parts.push(`${posting.role || posting.category}`);
    if (cityName) parts.push(`en ${cityName}`);
    if (posting.budgetMin || posting.budgetMax) {
      const cur = posting.currency ?? 'GTQ';
      const range = posting.budgetMin && posting.budgetMax
        ? `${(posting.budgetMin / 100).toFixed(0)}–${(posting.budgetMax / 100).toFixed(0)} ${cur}`
        : posting.budgetMax
          ? `hasta ${(posting.budgetMax / 100).toFixed(0)} ${cur}`
          : `desde ${(posting.budgetMin! / 100).toFixed(0)} ${cur}`;
      parts.push(range);
    }
    if (posting.eventDate) {
      const dateStr = posting.eventDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
      parts.push(dateStr);
    }
    const message = parts.join(' · ');

    const userIds = targets.map((a: any) => a.authId ?? a.id).filter(Boolean);
    await notificationsClient.batchNotify(userIds, {
      type: 'SYSTEM_NOTIFICATION',
      title: 'Hay una oportunidad para ti',
      message,
      data: {
        postingId: posting.id,
        category: posting.category,
        cityId: posting.cityId ?? null,
        eventDate: posting.eventDate?.toISOString() ?? null,
        budgetMin: posting.budgetMin ?? null,
        budgetMax: posting.budgetMax ?? null,
      },
      priority: 'normal',
    });

    logger.info(`Notificados ${userIds.length} artistas para posting ${posting.id}`, 'POSTING');
  }

  async getPostings(params: {
    status?: string;
    role?: string;
    category?: string;
    cityId?: string;
    artistId?: string;
    forArtistId?: string; // authId — personaliza relevancia y enriquece distancia
    page?: number;
    limit?: number;
  }) {
    const { status = 'OPEN', role, category, cityId, artistId, forArtistId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (role) where.role = { contains: role, mode: 'insensitive' };
    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (cityId) where.cityId = cityId;
    if (artistId) where.artistId = artistId;

    const [rawPostings, total] = await Promise.all([
      prisma.artistPosting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { applications: { select: { id: true, status: true } } },
      }),
      prisma.artistPosting.count({ where }),
    ]);

    // Batch-fetch cities for postings that have cityId
    const cityIds = [...new Set(rawPostings.map((p: any) => p.cityId).filter(Boolean))] as string[];
    const cityMap = new Map<string, { latitude: number; longitude: number; name: string }>();
    if (cityIds.length > 0) {
      const cities = await prisma.city.findMany({
        where: { id: { in: cityIds } },
        select: { id: true, latitude: true, longitude: true, name: true },
      });
      cities.forEach((c: any) => cityMap.set(c.id, c));
    }

    // Resolve artist profile for relevance enrichment
    let artistProfile: any = null;
    if (forArtistId) {
      artistProfile = await artistsClient.getArtist(forArtistId).catch(() => null);
    }

    const postings = await Promise.all(
      rawPostings.map(async (p: any) => {
        const base = { ...p, applicationCount: p.applications.length };
        if (!artistProfile) return base;

        const city = p.cityId ? cityMap.get(p.cityId) : null;
        const artistLat = artistProfile.baseLocationLat ?? artistProfile.lat ?? null;
        const artistLng = artistProfile.baseLocationLng ?? artistProfile.lng ?? null;

        let distanceKm: number | null = null;
        if (city && artistLat != null && artistLng != null) {
          distanceKm = Math.round(haversineKm(artistLat, artistLng, city.latitude, city.longitude) * 10) / 10;
        }

        let isAvailable: boolean | null = null;
        if (p.eventDate) {
          const isoDate = (p.eventDate as Date).toISOString().slice(0, 10);
          isAvailable = await artistsClient.checkAvailabilityDate(forArtistId!, isoDate);
        }

        return { ...base, distanceKm, isAvailable, cityName: city?.name ?? null };
      })
    );

    // Sort by relevance when forArtistId: available first, then by distance asc
    if (forArtistId) {
      postings.sort((a: any, b: any) => {
        const aAvail = a.isAvailable === null ? 1 : a.isAvailable ? 0 : 2;
        const bAvail = b.isAvailable === null ? 1 : b.isAvailable ? 0 : 2;
        if (aAvail !== bAvail) return aAvail - bAvail;
        const aDist = a.distanceKm ?? 9999;
        const bDist = b.distanceKm ?? 9999;
        return aDist - bDist;
      });
    }

    return { postings, total, page, limit };
  }

  async getPostingById(id: string, requesterId?: string) {
    const posting = await prisma.artistPosting.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
        applications: requesterId
          ? { where: { artistId: requesterId }, select: { id: true, status: true } }
          : false,
      },
    });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    const { _count, ...rest } = posting as any;
    return { ...rest, applicationCount: _count.applications };
  }

  async getMyPostings(artistId: string) {
    const postings = await prisma.artistPosting.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
      include: {
        applications: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, artistId: true, status: true, message: true, createdAt: true },
        },
      },
    });

    // Collect all unique applicant artist IDs across all postings
    const allArtistIds: string[] = [...new Set<string>(
      (postings as any[]).flatMap((p: any) => (p.applications as any[]).map((a: any) => a.artistId as string))
    )];

    // Batch-resolve artist profiles (one request per unique artist, in parallel)
    const profileMap = new Map<string, any>();
    await Promise.all(
      allArtistIds.map(async (id: string) => {
        const info = await artistsClient.getArtist(id).catch(() => null);
        if (info) profileMap.set(id, info);
      })
    );

    return (postings as any[]).map((p: any) => ({
      ...p,
      applicationCount: p.applications.length,
      applications: (p.applications as any[]).map((a: any) => {
        const info = profileMap.get(a.artistId);
        return {
          ...a,
          artistName: info?.displayName ?? info?.nombre ?? a.artistId,
          artistAvatar: info?.profileImageUrl ?? info?.imagenPerfil ?? null,
          artistCategory: info?.categoria ?? null,
        };
      }),
    }));
  }

  async updatePosting(id: string, artistId: string, data: {
    title?: string;
    description?: string;
    role?: string;
    category?: string;
    eventDate?: string;
    cityId?: string;
    budgetMin?: number;
    budgetMax?: number;
    currency?: string;
    status?: string;
  }) {
    const posting = await prisma.artistPosting.findUnique({ where: { id } });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    if (posting.artistId !== artistId) throw new AppError(403, 'Sin permiso para editar esta postulación');

    const isClosing = (data.status === 'CLOSED' || data.status === 'CANCELLED') && posting.status === 'OPEN';

    const updated = await prisma.artistPosting.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.role && { role: data.role }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.eventDate !== undefined && { eventDate: data.eventDate ? new Date(data.eventDate) : null }),
        ...(data.cityId !== undefined && { cityId: data.cityId }),
        ...(data.budgetMin !== undefined && { budgetMin: data.budgetMin }),
        ...(data.budgetMax !== undefined && { budgetMax: data.budgetMax }),
        ...(data.currency && { currency: data.currency }),
        ...(data.status && { status: data.status as any }),
        ...(data.status === 'CLOSED' || data.status === 'FILLED' || data.status === 'CANCELLED'
          ? { closedAt: new Date() }
          : {}),
      },
    });

    // Notify pending applicants when the posting is closed/cancelled
    if (isClosing) {
      const pendingApps = await prisma.postingApplication.findMany({
        where: { postingId: id, status: { in: ['PENDING', 'REVIEWED'] } },
        select: { artistId: true },
      });
      for (const app of pendingApps) {
        notificationsClient.sendNotification({
          userId: app.artistId,
          type: 'APPLICATION_REJECTED',
          channel: 'IN_APP',
          title: 'Vacante cerrada',
          message: `La vacante "${posting.title}" fue cerrada por el artista.`,
          data: { postingId: id },
          priority: 'normal',
        }).catch(() => {});
      }
    }

    return updated;
  }

  async deletePosting(id: string, artistId: string) {
    const posting = await prisma.artistPosting.findUnique({ where: { id } });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    if (posting.artistId !== artistId) throw new AppError(403, 'Sin permiso para eliminar esta postulación');

    await prisma.artistPosting.delete({ where: { id } });
    return { success: true };
  }

  // ==================== APPLICATIONS ====================

  async applyToPosting(postingId: string, artistId: string, data: {
    message: string;
    portfolioLinks?: string[];
  }) {
    const posting = await prisma.artistPosting.findUnique({ where: { id: postingId } });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    if (posting.status !== 'OPEN') throw new AppError(400, 'Esta postulación ya no acepta aplicaciones');
    if (posting.artistId === artistId) throw new AppError(400, 'No puedes aplicar a tu propia postulación');

    const applicantArtist = await artistsClient.getArtist(artistId).catch(() => null);
    if (!applicantArtist || (applicantArtist as any).verificationStatus !== 'VERIFIED') {
      throw new AppError(403, 'Debes estar verificado para aplicar a vacantes');
    }

    const existing = await prisma.postingApplication.findUnique({
      where: { postingId_artistId: { postingId, artistId } },
    });
    if (existing && existing.status !== 'WITHDRAWN') {
      throw new AppError(409, 'Ya has aplicado a esta postulación');
    }

    // Limit active applications per artist
    const activeCount = await prisma.postingApplication.count({
      where: { artistId, status: { in: ['PENDING', 'REVIEWED'] } },
    });
    if (activeCount >= MAX_ACTIVE_APPLICATIONS) {
      throw new AppError(400, `Límite de ${MAX_ACTIVE_APPLICATIONS} aplicaciones activas alcanzado. Retira algunas antes de aplicar a nuevas.`);
    }

    const application = existing
      ? await prisma.postingApplication.update({
          where: { id: existing.id },
          data: {
            message: data.message,
            portfolioLinks: data.portfolioLinks ?? [],
            status: 'PENDING',
            respondedAt: null,
          },
        })
      : await prisma.postingApplication.create({
          data: {
            postingId,
            artistId,
            message: data.message,
            portfolioLinks: data.portfolioLinks ?? [],
            status: 'PENDING',
          },
        });

    // Notify posting artist (in-app + email), enriched with distance
    const [applicantInfo, posterInfo] = await Promise.all([
      artistsClient.getArtist(artistId).catch(() => null),
      artistsClient.getArtist(posting.artistId).catch(() => null),
    ]);
    const applicantName = (applicantInfo as any)?.displayName ?? (applicantInfo as any)?.nombre ?? 'Un artista';
    const posterEmail = (posterInfo as any)?.email ?? null;

    // Calculate distance between applicant and event city
    let distanceKm: number | null = null;
    let isWithinCoverage: boolean | null = null;
    const applicantLat = (applicantInfo as any)?.baseLocationLat ?? (applicantInfo as any)?.lat ?? null;
    const applicantLng = (applicantInfo as any)?.baseLocationLng ?? (applicantInfo as any)?.lng ?? null;
    if (applicantLat != null && applicantLng != null && posting.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: posting.cityId },
        select: { latitude: true, longitude: true },
      });
      if (city) {
        distanceKm = Math.round(haversineKm(applicantLat, applicantLng, city.latitude, city.longitude) * 10) / 10;
        const radius = (applicantInfo as any)?.coverageRadius ?? null;
        isWithinCoverage = radius === null ? true : distanceKm <= radius;
      }
    }

    const distancePart = distanceKm != null ? ` — está a ${distanceKm} km del evento` : '';
    const notifMessage = `${applicantName} aplicó a tu postulación "${posting.title}"${distancePart}.`;

    await notificationsClient.sendBoth(
      {
        userId: posting.artistId,
        type: 'APPLICATION_RECEIVED',
        channel: 'IN_APP',
        title: 'Nueva postulación recibida',
        message: notifMessage,
        data: { postingId, applicationId: application.id, applicantId: artistId, distanceKm, isWithinCoverage },
        priority: 'normal',
      },
      posterEmail ? {
        userId: posting.artistId,
        type: 'APPLICATION_RECEIVED',
        title: 'Nueva postulación recibida',
        message: `${notifMessage} Revisa su perfil y responde.`,
        emailTo: posterEmail,
        emailSubject: `Nueva postulación: ${posting.title}`,
        data: { postingId, applicationId: application.id, distanceKm, isWithinCoverage },
        priority: 'normal',
      } : undefined
    ).catch(err => logger.error('Error notificando aplicación', 'POSTING', err));

    logger.info(`Application ${application.id} created for posting ${postingId}`, 'POSTING');
    return application;
  }

  async getApplicationsForPosting(postingId: string, artistId: string) {
    const posting = await prisma.artistPosting.findUnique({ where: { id: postingId } });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    if (posting.artistId !== artistId) throw new AppError(403, 'Solo el artista que publicó puede ver las aplicaciones');

    const applications = await prisma.postingApplication.findMany({
      where: { postingId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with artist info
    const enriched = await Promise.all(
      applications.map(async (app: any) => {
        const info = await artistsClient.getArtist(app.artistId).catch(() => null);
        return {
          ...app,
          artistName: (info as any)?.displayName ?? (info as any)?.nombre ?? app.artistId,
          artistAvatar: (info as any)?.profileImageUrl ?? (info as any)?.imagenPerfil ?? null,
          artistCategory: (info as any)?.categoria ?? null,
        };
      })
    );

    return enriched;
  }

  async respondToApplication(applicationId: string, postingArtistId: string, accept: boolean) {
    const application = await prisma.postingApplication.findUnique({
      where: { id: applicationId },
      include: { posting: true },
    });
    if (!application) throw new AppError(404, 'Aplicación no encontrada');
    if (application.posting.artistId !== postingArtistId) throw new AppError(403, 'Sin permiso');
    if (application.status !== 'PENDING' && application.status !== 'REVIEWED') {
      throw new AppError(400, 'Esta aplicación ya fue respondida');
    }

    const newStatus = accept ? 'ACCEPTED' : 'REJECTED';
    const updated = await prisma.postingApplication.update({
      where: { id: applicationId },
      data: { status: newStatus, respondedAt: new Date() },
    });

    let chatGroupId: string | null = null;

    if (accept) {
      // Close the posting as FILLED
      await prisma.artistPosting.update({
        where: { id: application.postingId },
        data: { status: 'FILLED', closedAt: new Date() },
      }).catch(() => {});

      // Create a coordination group chat between the two artists
      // We use applicationId as bookingId to get idempotent group creation
      const groupResult = await chatClient.createOrGetGroupConversation({
        bookingId: applicationId,
        createdBy: postingArtistId,
        participantIds: [postingArtistId, application.artistId],
        name: `Coordinación: ${application.posting.title}`,
      }).catch(err => { logger.error('Error creando chat para postulación', 'POSTING', err); return null; });
      chatGroupId = groupResult?.group?.id ?? null;
    }

    // Notify applicant (in-app + email)
    const applicantInfo = await artistsClient.getArtist(application.artistId).catch(() => null);
    const applicantEmail = (applicantInfo as any)?.email ?? null;

    const acceptMsg = chatGroupId
      ? `Tu aplicación para "${application.posting.title}" fue aceptada. Ya tienes acceso al chat de coordinación.`
      : `Tu aplicación para "${application.posting.title}" fue aceptada. Pronto te contactará el artista.`;

    await notificationsClient.sendBoth(
      {
        userId: application.artistId,
        type: accept ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
        channel: 'IN_APP',
        title: accept ? 'Postulación aceptada' : 'Postulación no seleccionada',
        message: accept ? acceptMsg : `Tu aplicación para "${application.posting.title}" no fue seleccionada esta vez.`,
        data: { postingId: application.postingId, applicationId, accepted: accept, chatGroupId },
        priority: 'normal',
      },
      applicantEmail ? {
        userId: application.artistId,
        type: accept ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
        title: accept ? 'Postulación aceptada' : 'Postulación no seleccionada',
        message: accept ? acceptMsg : `Tu aplicación para "${application.posting.title}" no fue seleccionada esta vez.`,
        emailTo: applicantEmail,
        emailSubject: accept ? `Aceptado: ${application.posting.title}` : `Postulación: ${application.posting.title}`,
        data: { postingId: application.postingId, applicationId, accepted: accept },
        priority: 'normal',
      } : undefined
    ).catch(err => logger.error('Error notificando respuesta a aplicación', 'POSTING', err));

    return { ...updated, chatGroupId };
  }

  async markApplicationReviewed(applicationId: string, postingArtistId: string) {
    const application = await prisma.postingApplication.findUnique({
      where: { id: applicationId },
      include: { posting: true },
    });
    if (!application) throw new AppError(404, 'Aplicación no encontrada');
    if (application.posting.artistId !== postingArtistId) throw new AppError(403, 'Sin permiso');
    if (application.status !== 'PENDING') return application; // already in a further state

    return prisma.postingApplication.update({
      where: { id: applicationId },
      data: { status: 'REVIEWED' },
    });
  }

  async withdrawApplication(applicationId: string, artistId: string) {
    const application = await prisma.postingApplication.findUnique({ where: { id: applicationId } });
    if (!application) throw new AppError(404, 'Aplicación no encontrada');
    if (application.artistId !== artistId) throw new AppError(403, 'Sin permiso');
    if (application.status === 'ACCEPTED') throw new AppError(400, 'No puedes retirar una aplicación aceptada');

    const updated = await prisma.postingApplication.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN', respondedAt: new Date() },
    });

    return updated;
  }

  async getMyApplications(artistId: string) {
    const applications = await prisma.postingApplication.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
      include: {
        posting: {
          select: {
            id: true,
            title: true,
            role: true,
            eventDate: true,
            status: true,
            budgetMin: true,
            budgetMax: true,
            currency: true,
          },
        },
      },
    });

    // For accepted applications, look up the group chat created with applicationId as bookingId
    const enriched = await Promise.all(
      applications.map(async (app: any) => {
        if (app.status !== 'ACCEPTED') return app;
        const group = await chatClient.getGroupByBookingId(app.id).catch(() => null);
        return { ...app, chatGroupId: group?.id ?? null };
      })
    );

    return enriched;
  }
}

export const postingService = new PostingService();
