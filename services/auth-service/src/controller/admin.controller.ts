import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { bookingClient } from '../clients/booking.client';
import { reviewsClient } from '../clients/reviews.client';

// GET /api/admin/stats - Métricas generales
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener stats de diferentes servicios
    // Nota: En producción, estos datos vendrían de los microservicios correspondientes
    
    const [
      totalUsers, 
      totalArtists, 
      recentUsers,
      bookingStats,
      reportStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'artista' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      bookingClient.getStats(),
      reviewsClient.getStats(req.headers.authorization)
    ]);

    const stats = {
      totalUsers,
      totalArtists,
      totalBookings: bookingStats.total,
      totalRevenue: bookingStats.totalRevenue / 100, // Convertir de centavos a moneda
      recentUsers,
      bookingsThisMonth: bookingStats.bookingsThisMonth || 0,
      revenueThisMonth: (bookingStats.revenueThisMonth || 0) / 100,
      pendingReports: reportStats.pendingCount,
      bookingsByMonth: bookingStats.bookingsByMonth || []
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
    const { page = '1', limit = '20', search = '', role = '' } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = role === 'user' ? 'cliente' : (role === 'artist' ? 'artista' : role);
    }

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
      isBlocked: u.isBlocked ?? false,
      createdAt: u.createdAt,
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
      data: { isBlocked }
    });

    logger.info(`User ${isBlocked ? 'blocked' : 'unblocked'}`, 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      userId: id,
      reason
    });

    res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
  } catch (error: any) {
    logger.error(`Error toggling user block: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/artists - Lista artistas
export const getArtists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search = '', verified = '' } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { role: 'artista' };
    
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (verified !== '') {
      where.isVerified = verified === 'true';
    }

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
      where: { id, role: 'artista' },
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
      where: { id, role: 'artista' },
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
    const { page = '1', limit = '20', search = '', status = '' } = req.query;
    logger.info(`ADMIN_GET_BOOKINGS_DIAG: page=${page}, search=${search}, status=${status}`, 'ADMIN_CONTROLLER');
    
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
      status: mappedStatus
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
        provider: true
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
