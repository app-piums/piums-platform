import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

// GET /api/admin/stats - Métricas generales
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener stats de diferentes servicios
    // Nota: En producción, estos datos vendrían de los microservicios correspondientes
    
    const [totalUsers, totalArtists, recentUsers] = await Promise.all([
      // Total usuarios (simulado - en producción vendría de users-service)
      prisma.user.count(),
      
      // Total artistas (simulado - vendría de artists-service)
      prisma.user.count({ where: { role: 'artist' } }),
      
      // Usuarios nuevos esta semana
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Datos simulados para demo (en producción vendrían de los servicios)
    const stats = {
      totalUsers,
      totalArtists,
      totalBookings: 45, // Vendría de booking-service
      totalRevenue: 12500.00, // Vendría de payments-service
      recentUsers,
      bookingsThisMonth: 15,
      revenueThisMonth: 4200.00,
      pendingReports: 3,
      
      // Bookings por mes (últimos 6 meses)
      bookingsByMonth: [
        { month: 'Sep', count: 8 },
        { month: 'Oct', count: 12 },
        { month: 'Nov', count: 15 },
        { month: 'Dec', count: 18 },
        { month: 'Jan', count: 22 },
        { month: 'Feb', count: 15 }
      ]
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
      where.role = role;
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

    res.json({ users, total, page: parseInt(page as string), limit: take });
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

    const where: any = { role: 'artist' };
    
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

    res.json({ artists, total, page: parseInt(page as string), limit: take });
  } catch (error: any) {
    logger.error(`Error getting artists: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// PATCH /api/admin/artists/:id/verify - Verificar artista
export const verifyArtist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const artist = await prisma.user.update({
      where: { id, role: 'artist' },
      data: { isVerified }
    });

    logger.info(`Artist ${isVerified ? 'verified' : 'unverified'}`, 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      artistId: id
    });

    res.json({ message: `Artist ${isVerified ? 'verified' : 'unverified'} successfully`, artist });
  } catch (error: any) {
    logger.error(`Error verifying artist: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/bookings - Lista todas las reservas
export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status = '' } = req.query;
    
    // En producción, esto vendría del booking-service
    // Datos simulados para demo
    const bookings = [
      {
        id: '1',
        userId: 'user1',
        artistId: 'artist1',
        userName: 'Juan Pérez',
        artistName: 'María García',
        service: 'Tatuaje pequeño',
        date: '2026-03-01',
        status: 'confirmed',
        amount: 150.00,
        createdAt: '2026-02-20'
      },
      {
        id: '2',
        userId: 'user2',
        artistId: 'artist2',
        userName: 'Ana López',
        artistName: 'Carlos Ruiz',
        service: 'Piercing nariz',
        date: '2026-02-28',
        status: 'pending',
        amount: 80.00,
        createdAt: '2026-02-19'
      }
    ];

    logger.info('Admin retrieved bookings list', 'ADMIN_CONTROLLER', { 
      adminId: (req as any).user?.id 
    });

    res.json({ 
      bookings, 
      total: bookings.length, 
      page: parseInt(page as string), 
      limit: parseInt(limit as string) 
    });
  } catch (error: any) {
    logger.error(`Error getting bookings: ${error.message}`, 'ADMIN_CONTROLLER');
    next(error);
  }
};

// GET /api/admin/reports - Reportes pendientes
export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status = 'pending' } = req.query;
    
    // En producción, esto vendría de un reports-service o moderation-service
    // Datos simulados para demo
    const reports = [
      {
        id: '1',
        type: 'review',
        reporterId: 'user1',
        reporterName: 'Juan Pérez',
        targetId: 'review1',
        targetType: 'review',
        reason: 'Contenido inapropiado',
        description: 'El review contiene lenguaje ofensivo',
        status: 'pending',
        createdAt: '2026-02-24',
        content: 'Este artista es terrible...'
      },
      {
        id: '2',
        type: 'user',
        reporterId: 'user2',
        reporterName: 'Ana López',
        targetId: 'user3',
        targetType: 'user',
        reason: 'Spam',
        description: 'Usuario está enviando mensajes spam',
        status: 'pending',
        createdAt: '2026-02-23'
      },
      {
        id: '3',
        type: 'artist',
        reporterId: 'user4',
        reporterName: 'Carlos Díaz',
        targetId: 'artist1',
        targetType: 'artist',
        reason: 'Fraude',
        description: 'El artista no cumplió con el servicio pagado',
        status: 'pending',
        createdAt: '2026-02-22'
      }
    ];

    logger.info('Admin retrieved reports list', 'ADMIN_CONTROLLER', { 
      adminId: (req as any).user?.id 
    });

    res.json({ 
      reports, 
      total: reports.length, 
      page: parseInt(page as string), 
      limit: parseInt(limit as string) 
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
    const { action, reason } = req.body; // action: 'approve', 'reject', 'delete_content'

    // En producción, esto actualizaría el estado en la base de datos
    // y tomaría acciones según el tipo de reporte
    
    logger.info(`Report resolved`, 'ADMIN_CONTROLLER', {
      adminId: (req as any).user?.id,
      reportId: id,
      action,
      reason
    });

    res.json({ 
      message: 'Report resolved successfully',
      reportId: id,
      action
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

    // En producción, obtendríamos también:
    // - Historial de bookings (de booking-service)
    // - Reseñas escritas (de reviews-service)
    // - Reportes relacionados
    
    const userDetail = {
      ...user,
      bookingsCount: 5, // Simulado
      reviewsCount: 3,  // Simulado
      reportsCount: 0   // Simulado
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
