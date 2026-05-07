import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { bookingClient } from '../clients/booking.client';
import { reviewsClient } from '../clients/reviews.client';
import { artistsClient } from '../clients/artists.client';

// GET /api/admin/stats - Métricas generales
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || '6m';
    const months =
      period === '7d' ? 1 :
      period === '30d' ? 1 :
      period === '3m' ? 3 :
      period === '1y' ? 12 : 6;

    const [
      totalUsers,
      totalArtists,
      verifiedArtists,
      recentUsers,
      bookingStats,
      reportStats,
      categoryStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ['artista', 'ambos'] } } }),
      prisma.user.count({ where: { role: { in: ['artista', 'ambos'] }, isVerified: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      bookingClient.getStats(months),
      reviewsClient.getStats(req.headers.authorization),
      artistsClient.getCategoryStats(),
    ]);

    // usersByMonth
    const now = new Date();
    const usersByMonthArr = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.user.count({ where: { createdAt: { gte: d, lt: nextD } } });
      usersByMonthArr.push({ month: d.toLocaleString('es-ES', { month: 'short' }), count });
    }

    // topArtists con nombres
    const topArtistsRaw = bookingStats.topArtists ?? [];
    let topArtists: any[] = [];
    if (topArtistsRaw.length > 0) {
      // Buscar nombre del artista en artists-service por su artistId
      const artistInfoList = await artistsClient.getByIds(topArtistsRaw.map((a) => a.artistId));
      const artistInfoMap = new Map(artistInfoList.map((a) => [a.id, a]));
      topArtists = topArtistsRaw.map((a) => {
        const info = artistInfoMap.get(a.artistId);
        return {
          artistId: a.artistId,
          nombre: info?.nombre ?? a.artistId.slice(0, 8),
          bookings: a.bookings,
          revenue: a.revenue / 100,
        };
      });
    }

    const artistsByCategory = Object.entries(categoryStats)
      .map(([category, count]) => ({ category, count: count as number }))
      .sort((a, b) => b.count - a.count);

    const stats = {
      totalUsers,
      totalArtists,
      totalBookings: bookingStats.total,
      totalRevenue: bookingStats.totalRevenue / 100,
      recentUsers,
      bookingsThisMonth: bookingStats.bookingsThisMonth || 0,
      revenueThisMonth: (bookingStats.revenueThisMonth || 0) / 100,
      pendingReports: reportStats.pendingCount,
      bookingsByMonth: bookingStats.bookingsByMonth || [],
      revenueByMonth: (bookingStats.revenueByMonth ?? []).map((r) => ({ ...r, amount: r.amount / 100 })),
      usersByMonth: usersByMonthArr,
      artistsByCategory,
      topArtists,
      conversionFunnel: { totalUsers, totalArtists, verifiedArtists },
    };

    logger.info('Admin stats retrieved', 'ADMIN_CONTROLLER', { adminId: (req as any).user?.id });
    res.json(stats);
  } catch (error: any) {
    logger.error(`Error getting admin stats: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/users - Lista usuarios
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search = '', role = '', provider = '', category = '' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    const andConditions: any[] = [];

    if (role) {
      where.role = role === 'user' ? 'cliente' : role === 'artist' ? { in: ['artista', 'ambos'] } : role as string;
    }

    if (search) {
      andConditions.push({
        OR: [
          { email: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } },
          { nombre: { contains: search as string, mode: 'insensitive' } },
        ],
      });
    }

    if (provider) {
      if (provider === 'email') {
        andConditions.push({ OR: [{ provider: 'email' }, { provider: null }] });
      } else {
        andConditions.push({ provider: provider as string });
      }
    }

    if (category) {
      const authIds = await artistsClient.getAuthIdsByCategory(category as string);
      if (authIds.length === 0) {
        return res.json({ users: [], total: 0, page: parseInt(page as string), totalPages: 0 });
      }
      andConditions.push({ id: { in: authIds } });
      if (!where.role) where.role = { in: ['artista', 'ambos'] };
    }

    if (andConditions.length > 0) where.AND = andConditions;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          provider: true,
          isBlocked: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    logger.info('Admin retrieved users list', 'ADMIN_CONTROLLER', { 
      adminId: (req as any).user?.id,
      count: users.length 
    });

    const normalized = users.map((u: any) => ({
      id: u.id,
      nombre: u.name ?? u.nombre ?? u.email.split('@')[0],
      email: u.email,
      role: u.role,
      provider: u.provider ?? 'email',
      isBlocked: u.isBlocked ?? false,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt ?? null,
    }));

    const totalPages = Math.ceil(total / take);
    res.json({ users: normalized, total, page: parseInt(page as string), totalPages });
  } catch (error: any) {
    logger.error(`Error getting users: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// PATCH /api/admin/users/:id/block - Bloquear/Desbloquear usuario
export const toggleBlockUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isBlocked, reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBlocked,
        status: isBlocked ? 'BANNED' : 'ACTIVE',
      },
    });

    // Si es artista, propagar el estado a artists-service para sacarlo/meterlo de búsquedas
    if (user.role === 'artista') {
      artistsClient.setActive(id, !isBlocked).catch(() => {});
    }

    logger.info(`User ${isBlocked ? 'blocked' : 'unblocked'}`, 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      userId: id,
      reason,
    });

    res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
  } catch (error: any) {
    logger.error(`Error toggling user block: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// DELETE /api/admin/users/:id - Eliminar usuario y sus datos en microservicios
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?.id;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });
    if (existing.role === 'admin') {
      return res.status(403).json({ error: 'No se puede eliminar un administrador' });
    }

    // Best-effort cleanup across services (fire-and-forget; never block the delete)
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const artistsUrl = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
    const usersUrl = process.env.USERS_SERVICE_URL || 'http://users-service:4002';
    if (internalSecret) {
      await Promise.allSettled([
        fetch(`${artistsUrl}/artists/internal/by-auth/${id}`, {
          method: 'DELETE',
          headers: { 'x-internal-secret': internalSecret },
        }),
        fetch(`${usersUrl}/users/internal/by-auth/${id}`, {
          method: 'DELETE',
          headers: { 'x-internal-secret': internalSecret },
        }),
      ]);
    }

    await prisma.user.delete({ where: { id } });

    logger.info('User deleted', 'ADMIN_CONTROLLER', { adminId, userId: id });
    res.json({ message: 'User deleted successfully', id });
  } catch (error: any) {
    logger.error(`Error deleting user: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/users/export - Exportar usuarios como CSV
export const exportUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', role = '', provider = '', category = '' } = req.query;

    const where: any = { deletedAt: null };
    const andConditions: any[] = [];

    if (role) {
      where.role = role === 'user' ? 'cliente' : role === 'artist' ? { in: ['artista', 'ambos'] } : role as string;
    }

    if (search) {
      andConditions.push({
        OR: [
          { email: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } },
          { nombre: { contains: search as string, mode: 'insensitive' } },
        ],
      });
    }

    if (provider) {
      if (provider === 'email') {
        andConditions.push({ OR: [{ provider: 'email' }, { provider: null }] });
      } else {
        andConditions.push({ provider: provider as string });
      }
    }

    if (category) {
      const authIds = await artistsClient.getAuthIdsByCategory(category as string);
      if (authIds.length === 0) {
        const csv = '\uFEFF' + 'ID,Nombre,Email,Rol,Origen,Estado,Verificado,Ciudad,Fecha registro,Último acceso\r\n';
        const date = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="usuarios-piums-${date}.csv"`);
        return res.send(csv);
      }
      andConditions.push({ id: { in: authIds } });
      if (!where.role) where.role = { in: ['artista', 'ambos'] };
    }

    if (andConditions.length > 0) where.AND = andConditions;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        nombre: true,
        role: true,
        provider: true,
        isBlocked: true,
        isVerified: true,
        ciudad: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // BOM UTF-8 para compatibilidad con Excel
    const BOM = '\uFEFF';
    const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Origen', 'Estado', 'Verificado', 'Ciudad', 'Fecha registro', 'Último acceso'];

    const escapeCell = (val: unknown): string => {
      const str = val == null ? '' : String(val);
      // Wrap in quotes if contains comma, newline or quote
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = users.map((u: any) => [
      escapeCell(u.id),
      escapeCell(u.name ?? u.nombre ?? ''),
      escapeCell(u.email),
      escapeCell(u.role),
      escapeCell(u.provider ?? 'email'),
      escapeCell(u.isBlocked ? 'Bloqueado' : 'Activo'),
      escapeCell(u.isVerified ? 'Sí' : 'No'),
      escapeCell(u.ciudad ?? ''),
      escapeCell(u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : ''),
      escapeCell(u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().slice(0, 10) : ''),
    ].join(','));

    const csv = BOM + [headers.join(','), ...rows].join('\r\n');

    const date = new Date().toISOString().slice(0, 10);
    const filename = `usuarios-piums-${date}.csv`;

    logger.info('Admin exported users CSV', 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      count: users.length,
      filters: { role, provider, search },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error: any) {
    logger.error(`Error exporting users CSV: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/artists - Lista artistas
export const getArtists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search = '', verified = '', category = '' } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { role: { in: ['artista', 'ambos'] } };
    const andConditions: any[] = [];
    
    if (search) {
      andConditions.push({
        OR: [
          { email: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } },
          { nombre: { contains: search as string, mode: 'insensitive' } },
        ]
      });
    }
    
    if (verified !== '') {
      where.isVerified = verified === 'true';
    }

    if (category) {
      const authIds = await artistsClient.getAuthIdsByCategory(category as string);
      if (authIds.length === 0) {
        return res.json({ artists: [], total: 0, page: parseInt(page as string), totalPages: 0 });
      }
      andConditions.push({ id: { in: authIds } });
    }

    if (andConditions.length > 0) where.AND = andConditions;

    const [artists, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          isBlocked: true,
          createdAt: true,
          // En producción, estos datos vendrían del artists-service
        }
      }),
      prisma.user.count({ where })
    ]);

    logger.info('Admin retrieved artists list', 'ADMIN_CONTROLLER', { 
      adminId: (req as any).user?.id,
      count: artists.length 
    });

    const artistIds = artists.map((a: any) => a.id);
    const [bookingStats, reviewStats] = await Promise.all([
      bookingClient.getBatchStats(artistIds),
      reviewsClient.getBatchStats(artistIds, req.headers.authorization)
    ]);

    const normalized = artists.map((a: any) => ({
      id: a.id,
      userId: a.id,
      nombre: a.name ?? a.nombre ?? a.email.split('@')[0],
      nombreArtistico: a.name ?? a.nombre ?? a.email.split('@')[0],
      email: a.email,
      categoria: a.artistCategory ?? 'General',
      isVerified: a.isVerified ?? false,
      isActive: !a.isBlocked,
      createdAt: a.createdAt,
      rating: reviewStats[a.id]?.rating || null,
      totalBookings: bookingStats[a.id]?.total || 0,
    }));

    const totalPages = Math.ceil(total / take);
    res.json({ artists: normalized, total, page: parseInt(page as string), totalPages });
  } catch (error: any) {
    logger.error(`Error getting artists: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// PATCH /api/admin/artists/:id/verify - Verificar artista
export const verifyArtist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isVerified, rejectionReason, adminNotes } = req.body;

    if (isVerified === false && !rejectionReason?.trim()) {
      return res.status(400).json({ message: 'Se requiere una razón de rechazo' });
    }

    const updateData: any = { isVerified };
    if (!isVerified && rejectionReason) updateData.rejectionReason = rejectionReason.trim();
    if (isVerified) updateData.rejectionReason = null; // clear on approval
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const artist = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Artist ${isVerified ? 'verified' : 'rejected'}`, 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      artistId: id,
      rejectionReason: isVerified ? undefined : rejectionReason,
    });

    res.json({ message: `Artist ${isVerified ? 'verified' : 'rejected'} successfully`, artist });
  } catch (error: any) {
    logger.error(`Error verifying artist: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/artists/:id - Detalle de artista
export const getArtistDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const artist = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        name: true,
        avatar: true,
        role: true,
        isVerified: true,
        isBlocked: true,
        emailVerified: true,
        ciudad: true,
        provider: true,
        googleId: true,
        facebookId: true,
        tiktokId: true,
        documentType: true,
        documentNumber: true,
        documentFrontUrl: true,
        documentBackUrl: true,
        documentSelfieUrl: true,
        rejectionReason: true,
        adminNotes: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const [bookingStats, reviewStats] = await Promise.all([
      bookingClient.getUserStats(id),
      reviewsClient.getUserStats(id)
    ]);

    const detail = {
      id: artist.id,
      userId: artist.id,
      nombre: artist.name ?? artist.nombre ?? artist.email.split('@')[0],
      nombreArtistico: artist.name ?? artist.nombre ?? artist.email.split('@')[0],
      email: artist.email,
      avatarUrl: artist.avatar,
      categoria: 'General',
      isVerified: artist.isVerified ?? false,
      isActive: !artist.isBlocked,
      emailVerified: artist.emailVerified,
      ciudad: artist.ciudad,
      provider: artist.provider ?? 'email',
      hasGoogleId: !!artist.googleId,
      hasFacebookId: !!artist.facebookId,
      hasTiktokId: !!artist.tiktokId,
      documentType: artist.documentType,
      documentNumber: artist.documentNumber,
      documentFrontUrl: artist.documentFrontUrl,
      documentBackUrl: artist.documentBackUrl,
      documentSelfieUrl: artist.documentSelfieUrl,
      rejectionReason: artist.rejectionReason,
      adminNotes: artist.adminNotes,
      accountStatus: artist.status,
      createdAt: artist.createdAt,
      lastLoginAt: artist.lastLoginAt,
      totalBookings: bookingStats.total,
      reviewsCount: reviewStats.totalReviews,
      rating: reviewStats.rating,
    };

    logger.info('Admin retrieved artist detail', 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      artistId: id
    });

    res.json(detail);
  } catch (error: any) {
    logger.error(`Error getting artist detail: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/bookings/:id - Detalle de una reserva
export const getBookingDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const booking = await bookingClient.getBookingDetail(id);

    // Enrich with user names
    const userIds = new Set<string>();
    if (booking.clientId) userIds.add(booking.clientId);
    if (booking.artistId) userIds.add(booking.artistId);

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true, email: true, nombre: true, phone: true },
    });
    const userMap = users.reduce((acc: any, u: any) => { acc[u.id] = u; return acc; }, {});

    const STATUS_ES: Record<string, string> = {
      PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PAYMENT_PENDING: 'Pago pendiente',
      PAYMENT_COMPLETED: 'Pagado', IN_PROGRESS: 'En progreso', COMPLETED: 'Completado',
      RESCHEDULED: 'Reprogramado', CANCELLED_CLIENT: 'Cancelado (cliente)',
      CANCELLED_ARTIST: 'Cancelado (artista)', REJECTED: 'Rechazado', NO_SHOW: 'No se presentó',
    };

    const client = userMap[booking.clientId];
    const artist = userMap[booking.artistId];

    res.json({
      ...booking,
      clienteNombre: client?.name || client?.nombre || client?.email?.split('@')[0] || 'Desconocido',
      clienteEmail: client?.email || '—',
      clientePhone: client?.phone || null,
      artistaNombre: artist?.name || artist?.nombre || artist?.email?.split('@')[0] || 'Desconocido',
      artistaEmail: artist?.email || '—',
      estadoLabel: STATUS_ES[booking.status] || booking.status,
      montoDecimal: booking.totalPrice != null ? booking.totalPrice / 100 : null,
    });
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.status === 404) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    logger.error(`Error getting booking detail: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/bookings - Lista todas las reservas
export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search = '', status = '', dateFrom = '', dateTo = '' } = req.query;
    logger.info(`ADMIN_GET_BOOKINGS_DIAG: page=${page}, search=${search}, status=${status}, dateFrom=${dateFrom}, dateTo=${dateTo}`, 'ADMIN_CONTROLLER');
    
    // Mapear estado de español (frontend) a inglés (backend/DB)
    const STATUS_MAP: Record<string, string> = {
      'pendiente': 'PENDING',
      'confirmado': 'CONFIRMED',
      'completado': 'COMPLETED',
      'cancelado': 'CANCELLED_CLIENT',
      'disputa': 'IN_PROGRESS',
    };

    const mappedStatus = status && STATUS_MAP[status as string] ? STATUS_MAP[status as string] : status;

    // Si la búsqueda parece un email, intentar encontrar el ID del usuario primero
    let effectiveSearch = search as string;
    if (effectiveSearch.includes('@')) {
      const foundUser = await prisma.user.findUnique({
        where: { email: effectiveSearch.toLowerCase() },
        select: { id: true }
      });
      if (foundUser) {
        effectiveSearch = foundUser.id;
        logger.info(`Búsqueda por email resuelta a ID: ${effectiveSearch}`, 'ADMIN_CONTROLLER');
      }
    }

    const result = await bookingClient.listBookings({
      page,
      limit,
      search: effectiveSearch,
      status: mappedStatus,
      ...(dateFrom ? { dateFrom: dateFrom as string } : {}),
      ...(dateTo ? { dateTo: dateTo as string } : {}),
    });

    // Obtener nombres de usuarios y artistas de una vez
    const userIds = new Set<string>();
    result.bookings.forEach((b: any) => {
      if (b.clientId) userIds.add(b.clientId);
      if (b.artistId) userIds.add(b.artistId);
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true, email: true, nombre: true }
    });

    const userMap = users.reduce((acc: any, u: any) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const STATUS_ES: Record<string, string> = {
      PENDING: 'pendiente',
      CONFIRMED: 'confirmado',
      PAYMENT_PENDING: 'pago pendiente',
      PAYMENT_COMPLETED: 'pagado',
      IN_PROGRESS: 'en progreso',
      COMPLETED: 'completado',
      RESCHEDULED: 'reprogramado',
      CANCELLED_CLIENT: 'cancelado (cliente)',
      CANCELLED_ARTIST: 'cancelado (artista)',
      REJECTED: 'rechazado',
      NO_SHOW: 'no se presentó',
    };

    const normalized = result.bookings.map((b: any) => ({
      id: b.id,
      code: b.code || b.id.substring(0, 8),
      clienteNombre: userMap[b.clientId]?.name || userMap[b.clientId]?.nombre || userMap[b.clientId]?.email.split('@')[0] || 'Usuario desconocido',
      clienteEmail: userMap[b.clientId]?.email || '—',
      artistaNombre: userMap[b.artistId]?.name || userMap[b.artistId]?.nombre || userMap[b.artistId]?.email.split('@')[0] || 'Artista desconocido', 
      servicio: b.serviceId, // Idealmente vendría el nombre de artists-service
      fecha: b.scheduledDate,
      estado: STATUS_ES[b.status] || b.status.toLowerCase(),
      monto: b.totalPrice / 100,
      createdAt: b.createdAt,
    }));

    res.json({ 
      bookings: normalized, 
      total: result.total, 
      page: parseInt(page as string), 
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    logger.error(`Error getting bookings: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/reports - Reportes pendientes
export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', estado } = req.query;
    
    const result = await reviewsClient.getPendingReports(
      req.headers.authorization,
      parseInt(page as string),
      parseInt(limit as string),
      estado as string | undefined
    );

    // Obtener nombres de los que reportan
    const reporterIds = Array.from(new Set(result.reports.map((r: any) => r.reportedBy)));
    const reporters = await prisma.user.findMany({
      where: { id: { in: reporterIds } },
      select: { id: true, name: true, email: true }
    });

    const reporterMap = reporters.reduce((acc: any, u: any) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const normalized = result.reports.map((r: any) => ({
      id: r.id,
      reporterNombre: reporterMap[r.reportedBy]?.name || 'Usuario desconocido',
      reporterEmail: reporterMap[r.reportedBy]?.email || '—',
      targetType: 'Review',
      targetId: r.reviewId,
      motivo: r.reason,
      descripcion: r.description || '—',
      estado: r.status,
      createdAt: r.createdAt,
    }));

    res.json({ 
      reports: normalized, 
      total: result.total, 
      page: parseInt(page as string), 
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    logger.error(`Error getting reports: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// PATCH /api/admin/reports/:id/resolve - Resolver reporte
export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    const result = await reviewsClient.resolveReport(
      id, 
      action, 
      notes, 
      req.headers.authorization
    );
    
    logger.info(`Report resolved via client`, 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      reportId: id,
      action
    });

    res.json({ 
      message: 'Report resolved successfully',
      result
    });
  } catch (error: any) {
    logger.error(`Error resolving report: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/users/:id - Obtener detalle de usuario
export const getUserDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        provider: true,
        documentType: true,
        documentNumber: true,
        documentFrontUrl: true,
        documentBackUrl: true,
        documentSelfieUrl: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [bookingStats, reviewStats] = await Promise.all([
      bookingClient.getUserStats(id),
      reviewsClient.getUserStats(id)
    ]);
    
    const userDetail = {
      ...user,
      bookingsCount: bookingStats.total,
      reviewsCount: reviewStats.totalReviews,
      reportsCount: reviewStats.totalReports
    };

    logger.info('Admin retrieved user detail', 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      targetUserId: id
    });

    res.json(userDetail);
  } catch (error: any) {
    logger.error(`Error getting user detail: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// ==================== USER IDENTITY VERIFICATION ====================

// GET /api/admin/users/pending-verification
export const getPendingVerifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '20'), 10);
    const skip = (page - 1) * limit;

    const where = {
      isVerified: false,
      documentFrontUrl: { not: null },
      documentSelfieUrl: { not: null },
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          nombre: true,
          name: true,
          email: true,
          role: true,
          provider: true,
          createdAt: true,
          documentType: true,
          documentNumber: true,
          documentFrontUrl: true,
          documentBackUrl: true,
          documentSelfieUrl: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const normalized = users.map((u: any) => ({
      ...u,
      nombre: u.nombre ?? u.name ?? u.email.split('@')[0],
    }));

    res.json({ users: normalized, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/verify
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { approved, rejectionReason } = req.body as { approved: boolean; rejectionReason?: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const updateData: any = { isVerified: approved };
    if (!approved && rejectionReason) updateData.rejectionReason = rejectionReason.trim();
    if (approved) updateData.rejectionReason = null;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, isVerified: true, email: true },
    });

    logger.info(`User identity ${approved ? 'approved' : 'rejected'}`, 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      targetUserId: id,
      approved,
    });

    res.json({ success: true, isVerified: updated.isVerified });
  } catch (error: any) {
    next(error);
  }
};

// ==================== SHADOW BAN ====================

// PATCH /api/admin/artists/:id/shadow-ban
export const shadowBanArtist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // authId of the artist
    const { banned, reason } = req.body as { banned: boolean; reason?: string };

    const ok = await artistsClient.shadowBan(id, banned, reason);
    if (!ok) {
      return res.status(502).json({ message: 'No se pudo actualizar el estado del artista' });
    }

    logger.info(`Admin ${banned ? 'shadow-banned' : 'unbanned'} artist ${id}`, 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      authId: id,
      banned,
    });

    res.json({ success: true, banned });
  } catch (error: any) {
    logger.error(`Error shadow-banning artist: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// ==================== COMMISSION RULES (PROXY) ====================

const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL || 'http://payments-service:4007';

// GET /api/admin/commission-rules
export const listCommissionRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const qs = new URLSearchParams(req.query as Record<string, string>).toString();
    const adminToken = req.headers.authorization;
    const response = await fetch(
      `${PAYMENTS_SERVICE_URL}/api/commission-rules${qs ? `?${qs}` : ''}`,
      { headers: { Authorization: adminToken ?? '' } }
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error(`Error listing commission rules: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// POST /api/admin/commission-rules
export const createCommissionRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const adminId = (req as any).user?.id;
    const body = { ...req.body, createdByAdminId: adminId };

    const response = await fetch(`${PAYMENTS_SERVICE_URL}/api/commission-rules/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret ?? '',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error(`Error creating commission rule: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// ==================== PAYOUTS (PROXY) ====================

// GET /api/admin/payouts
export const listPayouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const qs = new URLSearchParams(req.query as Record<string, string>).toString();
    const adminToken = req.headers.authorization;
    const response = await fetch(
      `${PAYMENTS_SERVICE_URL}/api/payouts${qs ? `?${qs}` : ''}`,
      { headers: { Authorization: adminToken ?? '' } }
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error(`Error listing payouts: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// PATCH /api/admin/payouts/:id/complete
export const completePayout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { transferReference } = req.body as { transferReference: string };
    const adminId = (req as any).user?.id;

    if (!transferReference?.trim()) {
      return res.status(400).json({ message: 'transferReference es requerido' });
    }

    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const response = await fetch(`${PAYMENTS_SERVICE_URL}/api/payouts/${id}/complete-manual`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret ?? '',
      },
      body: JSON.stringify({ transferReference, completedByAdmin: adminId }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error(`Error completing payout: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};
