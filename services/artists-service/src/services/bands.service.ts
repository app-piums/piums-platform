import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { notificationsClient } from "../clients/notifications.client";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 1;
  while (await prisma.band.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export const createBand = async (
  leadArtistId: string,
  data: {
    name: string;
    bio?: string;
    genre?: string[];
    specialties?: string[];
    country: string;
    city: string;
  }
) => {
  const slug = await uniqueSlug(generateSlug(data.name));

  const band = await prisma.band.create({
    data: {
      ...data,
      slug,
      leadArtistId,
      genre: data.genre ?? [],
      specialties: data.specialties ?? [],
      members: {
        create: {
          artistId: leadArtistId,
          status: "ACTIVE",
          isAdmin: true,
        },
      },
    },
    include: { members: true },
  });

  return band;
};

export const getMyBands = async (artistId: string) => {
  const memberships = await prisma.bandMember.findMany({
    where: { artistId, status: { in: ["ACTIVE", "PENDING"] } },
    include: {
      band: {
        include: {
          members: { where: { status: { in: ["ACTIVE", "PENDING"] } } },
          openings: { where: { isOpen: true }, include: { _count: { select: { applications: true } } } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships
    .filter((m: any) => m.band.isActive && !m.band.deletedAt)
    .map((m: any) => ({ ...m.band, myRole: m.role, myStatus: m.status, isMyBandAdmin: m.isAdmin, isMyBandLead: m.band.leadArtistId === m.artistId, myArtistId: m.artistId }));
};

export const getMyBand = async (artistId: string) => {
  const membership = await prisma.bandMember.findFirst({
    where: { artistId, status: { in: ["ACTIVE", "PENDING"] } },
    include: {
      band: {
        include: {
          members: true,
          openings: {
            where: { isOpen: true },
            include: { applications: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return membership?.band ?? null;
};

export const getBandById = async (id: string) => {
  const band = await prisma.band.findFirst({
    where: { id, isActive: true, deletedAt: null },
    include: {
      members: { where: { status: "ACTIVE" } },
      openings: { where: { isOpen: true } },
    },
  });
  if (!band) throw new AppError(404, "Banda no encontrada");
  return band;
};

export const searchBands = async (q: string, city?: string) => {
  const textConditions = q ? [
    { name: { contains: q, mode: 'insensitive' as const } },
    { bio: { contains: q, mode: 'insensitive' as const } },
    { genre: { hasSome: [q] } },
    { specialties: { hasSome: [q] } },
  ] : [];

  return prisma.band.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      verificationStatus: 'VERIFIED',
      ...(textConditions.length > 0 && { OR: textConditions }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      avatar: true,
      city: true,
      country: true,
      genre: true,
      specialties: true,
      rating: true,
      reviewCount: true,
      isBookable: true,
    },
    take: 10,
    orderBy: { rating: 'desc' },
  });
};

export const updateBand = async (
  bandId: string,
  adminId: string,
  data: Partial<{ name: string; bio: string; genre: string[]; specialties: string[]; avatar: string; coverPhoto: string; isBookable: boolean }>
) => {
  await requireBandAdmin(bandId, adminId);
  return prisma.band.update({ where: { id: bandId }, data });
};

export const deleteBand = async (bandId: string, artistId: string) => {
  const band = await prisma.band.findFirst({ where: { id: bandId, isActive: true, deletedAt: null } });
  if (!band) throw new AppError(404, "Banda no encontrada");
  if (band.leadArtistId !== artistId) throw new AppError(403, "Solo el fundador puede eliminar la banda");

  await prisma.band.update({
    where: { id: bandId },
    data: { isActive: false, deletedAt: new Date() },
  });
};

export const inviteMember = async (bandId: string, adminId: string, artistId: string, role?: string, inviteMessage?: string) => {
  await requireBandAdmin(bandId, adminId);

  const existing = await prisma.bandMember.findUnique({ where: { bandId_artistId: { bandId, artistId } } });
  if (existing) {
    if (existing.status === "ACTIVE") throw new AppError(409, "El artista ya es miembro de la banda");
    if (existing.status === "PENDING") throw new AppError(409, "El artista ya tiene una invitación pendiente");
    return await prisma.bandMember.update({ where: { id: existing.id }, data: { status: "PENDING", role, inviteMessage } });
  }

  const member = await prisma.bandMember.create({ data: { bandId, artistId, role, status: "PENDING", inviteMessage } });

  const band = await prisma.band.findUnique({ where: { id: bandId }, select: { name: true } });
  notificationsClient.send({
    userId: artistId,
    type: "BAND_INVITATION",
    channel: "IN_APP",
    title: "Te invitaron a una banda",
    message: inviteMessage
      ? `${band?.name ?? "Una banda"} te invitó${role ? ` como ${role}` : ""}: "${inviteMessage}"`
      : `Has sido invitado a unirte a ${band?.name ?? "una banda"}${role ? ` como ${role}` : ""}.`,
    data: { bandId, role, inviteMessage },
  });

  // Email de invitación — fire-and-forget
  prisma.artist.findUnique({ where: { id: artistId }, select: { email: true, nombre: true, artistName: true } })
    .then((invited: { email: string | null; nombre: string; artistName: string | null } | null) => {
      if (!invited?.email) return;
      return prisma.artist.findUnique({ where: { id: adminId }, select: { nombre: true, artistName: true } })
        .then((inviter: { nombre: string; artistName: string | null } | null) => notificationsClient.sendBandInvitationEmail({
          invitedArtistEmail: invited.email!,
          invitedArtistName: invited.artistName || invited.nombre,
          bandName: band?.name ?? 'una banda',
          inviterName: inviter?.artistName || inviter?.nombre || 'Un músico',
          role,
          inviteMessage,
        }));
    })
    .catch(() => {});

  return member;
};

export const requestToJoin = async (bandId: string, artistId: string) => {
  const band = await prisma.band.findFirst({ where: { id: bandId, isActive: true, deletedAt: null } });
  if (!band) throw new AppError(404, "Banda no encontrada");

  const existing = await prisma.bandMember.findUnique({ where: { bandId_artistId: { bandId, artistId } } });
  if (existing?.status === "ACTIVE") throw new AppError(409, "Ya eres miembro de esta banda");
  if (existing?.status === "PENDING") throw new AppError(409, "Ya tienes una solicitud pendiente");

  const member = await prisma.bandMember.create({ data: { bandId, artistId, status: "PENDING" } });

  notificationsClient.send({
    userId: band.leadArtistId,
    type: "BAND_JOIN_REQUEST",
    channel: "IN_APP",
    title: "Solicitud para unirse a tu banda",
    message: `Un músico quiere unirse a ${band.name}. Revisa las solicitudes pendientes.`,
    data: { bandId, artistId },
  });

  return member;
};

export const respondToInvite = async (bandId: string, artistId: string, accept: boolean) => {
  const member = await prisma.bandMember.findUnique({
    where: { bandId_artistId: { bandId, artistId } },
  });
  if (!member || member.status !== "PENDING") throw new AppError(404, "Invitación no encontrada");

  const updated = await prisma.bandMember.update({
    where: { id: member.id },
    data: { status: accept ? "ACTIVE" : "INACTIVE" },
  });

  if (accept) {
    const band = await prisma.band.findUnique({ where: { id: bandId }, select: { name: true, leadArtistId: true } });
    notificationsClient.send({
      userId: band!.leadArtistId,
      type: "BAND_INVITE_ACCEPTED",
      channel: "IN_APP",
      title: "Alguien aceptó tu invitación",
      message: `Un músico aceptó unirse a ${band?.name ?? "tu banda"}.`,
      data: { bandId, artistId },
    });
  }

  return updated;
};

export const removeMember = async (bandId: string, adminId: string, artistId: string) => {
  await requireBandAdmin(bandId, adminId);
  const band = await prisma.band.findUnique({ where: { id: bandId } });
  if (band?.leadArtistId === artistId) throw new AppError(400, "No puedes remover al fundador de la banda");

  await prisma.bandMember.updateMany({
    where: { bandId, artistId },
    data: { status: "INACTIVE" },
  });
};

export const listMembers = async (bandId: string) => {
  return prisma.bandMember.findMany({
    where: { bandId, status: { in: ["ACTIVE", "PENDING"] } },
    orderBy: [{ isAdmin: "desc" }, { joinedAt: "asc" }],
  });
};

// ── Postulaciones ─────────────────────────────────────────────────────────────

export const createOpening = async (bandId: string, adminId: string, data: { role: string; description?: string; slots?: number }) => {
  await requireBandAdmin(bandId, adminId);
  return prisma.bandOpening.create({ data: { bandId, ...data } });
};

export const listOpenings = async (bandId: string) => {
  return prisma.bandOpening.findMany({
    where: { bandId, isOpen: true },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const closeOpening = async (openingId: string, adminId: string) => {
  const opening = await prisma.bandOpening.findUnique({ where: { id: openingId } });
  if (!opening) throw new AppError(404, "Posición no encontrada");
  await requireBandAdmin(opening.bandId, adminId);
  return prisma.bandOpening.update({ where: { id: openingId }, data: { isOpen: false, closedAt: new Date() } });
};

export const applyToOpening = async (openingId: string, artistId: string, message?: string) => {
  const opening = await prisma.bandOpening.findUnique({ where: { id: openingId } });
  if (!opening || !opening.isOpen) throw new AppError(404, "Posición no disponible");

  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { verificationStatus: true } });
  if (!artist || artist.verificationStatus !== 'VERIFIED') {
    throw new AppError(403, "Debes estar verificado para postularte a posiciones de banda");
  }

  const existing = await prisma.bandApplication.findUnique({ where: { openingId_artistId: { openingId, artistId } } });
  if (existing) throw new AppError(409, "Ya te postulaste para esta posición");

  const isMember = await prisma.bandMember.findUnique({
    where: { bandId_artistId: { bandId: opening.bandId, artistId } },
  });
  if (isMember?.status === "ACTIVE") throw new AppError(409, "Ya eres miembro de esta banda");

  return prisma.bandApplication.create({ data: { openingId, artistId, message } });
};

export const listApplications = async (openingId: string, adminId: string) => {
  const opening = await prisma.bandOpening.findUnique({ where: { id: openingId } });
  if (!opening) throw new AppError(404, "Posición no encontrada");
  await requireBandAdmin(opening.bandId, adminId);

  return prisma.bandApplication.findMany({
    where: { openingId },
    orderBy: { createdAt: "desc" },
  });
};

export const respondToApplication = async (applicationId: string, adminId: string, accept: boolean) => {
  const application = await prisma.bandApplication.findUnique({
    where: { id: applicationId },
    include: { opening: true },
  });
  if (!application) throw new AppError(404, "Postulación no encontrada");
  await requireBandAdmin(application.opening.bandId, adminId);

  const updated = await prisma.bandApplication.update({
    where: { id: applicationId },
    data: { status: accept ? "ACCEPTED" : "REJECTED" },
  });

  if (accept) {
    await inviteMember(application.opening.bandId, adminId, application.artistId);
  } else {
    notificationsClient.send({
      userId: application.artistId,
      type: "BAND_APPLICATION_REJECTED",
      channel: "IN_APP",
      title: "Postulación no seleccionada",
      message: `Tu postulación para ${application.opening.role} no fue seleccionada esta vez.`,
      data: { openingId: application.openingId },
    });
  }

  return updated;
};

export const getAllOpenings = async (q?: string) => {
  return prisma.bandOpening.findMany({
    where: {
      isOpen: true,
      band: { isActive: true, deletedAt: null },
      ...(q ? { role: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      band: { select: { id: true, name: true, slug: true, avatar: true, city: true, country: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
};

export const getMyInvitations = async (artistId: string) => {
  return prisma.bandMember.findMany({
    where: { artistId, status: "PENDING" },
    include: {
      band: { select: { id: true, name: true, slug: true, avatar: true, city: true, country: true } },
    },
    orderBy: { joinedAt: "desc" },
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireBandAdmin(bandId: string, artistId: string) {
  const member = await prisma.bandMember.findUnique({
    where: { bandId_artistId: { bandId, artistId } },
  });
  if (!member || !member.isAdmin || member.status !== "ACTIVE") {
    throw new AppError(403, "Solo los administradores de la banda pueden realizar esta acción");
  }
}
