import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { UsersService } from "../services/users.service";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();
const usersService = new UsersService();

type FavoriteEntityType = "ARTIST" | "SERVICE" | "PACKAGE";
const VALID_ENTITY_TYPES: FavoriteEntityType[] = ["ARTIST", "SERVICE", "PACKAGE"];

/**
 * GET /api/users/me/favorites
 * Lista los favoritos del usuario autenticado.
 * Query params opcionales: entityType (ARTIST | SERVICE | PACKAGE)
 */
export const listFavorites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const user = await usersService.getUserByAuthId(authId);

    const { entityType, page = "1", limit = "20" } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (entityType) {
      if (!VALID_ENTITY_TYPES.includes(entityType as FavoriteEntityType)) {
        throw new AppError(400, `entityType debe ser uno de: ${VALID_ENTITY_TYPES.join(", ")}`);
      }
      where.entityType = entityType;
    }

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
        select: {
          id: true,
          entityType: true,
          entityId: true,
          notes: true,
          createdAt: true,
        },
      }),
      prisma.favorite.count({ where }),
    ]);

    res.json({
      favorites,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/me/favorites
 * Agrega un favorito para el usuario autenticado.
 * Body: { entityType, entityId, notes? }
 */
export const addFavorite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const user = await usersService.getUserByAuthId(authId);

    const { entityType, entityId, notes } = req.body;

    if (!entityType || !entityId) {
      throw new AppError(400, "entityType y entityId son requeridos");
    }

    if (!VALID_ENTITY_TYPES.includes(entityType as FavoriteEntityType)) {
      throw new AppError(400, `entityType debe ser uno de: ${VALID_ENTITY_TYPES.join(", ")}`);
    }

    if (typeof entityId !== "string" || entityId.trim().length === 0) {
      throw new AppError(400, "entityId inválido");
    }

    // upsert para ser idempotente: si ya existe lo reactiva (quita deletedAt)
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_entityType_entityId: {
          userId: user.id,
          entityType: entityType as FavoriteEntityType,
          entityId: entityId.trim(),
        },
      },
      create: {
        userId: user.id,
        entityType: entityType as FavoriteEntityType,
        entityId: entityId.trim(),
        notes: notes ?? null,
      },
      update: {
        deletedAt: null,
        notes: notes !== undefined ? notes : undefined,
      },
      select: {
        id: true,
        entityType: true,
        entityId: true,
        notes: true,
        createdAt: true,
      },
    });

    logger.info(`Favorite added: user=${user.id} type=${entityType} entity=${entityId}`, "FAVORITES");

    res.status(201).json({ favorite });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me/favorites/:id
 * Elimina (soft delete) un favorito del usuario autenticado.
 */
export const removeFavorite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const user = await usersService.getUserByAuthId(authId);
    const { id } = req.params;

    const existing = await prisma.favorite.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!existing) {
      throw new AppError(404, "Favorito no encontrado");
    }

    await prisma.favorite.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    logger.info(`Favorite removed: id=${id} user=${user.id}`, "FAVORITES");

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/favorites/check
 * Verifica si un entity está en favoritos. Query: entityType, entityId
 */
export const checkFavorite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const user = await usersService.getUserByAuthId(authId);
    const { entityType, entityId } = req.query as Record<string, string>;

    if (!entityType || !entityId) {
      throw new AppError(400, "entityType y entityId son requeridos");
    }

    if (!VALID_ENTITY_TYPES.includes(entityType as FavoriteEntityType)) {
      throw new AppError(400, `entityType debe ser uno de: ${VALID_ENTITY_TYPES.join(", ")}`);
    }

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        entityType: entityType as FavoriteEntityType,
        entityId: entityId.trim(),
        deletedAt: null,
      },
      select: { id: true },
    });

    res.json({ isFavorite: !!favorite, favoriteId: favorite?.id ?? null });
  } catch (error) {
    next(error);
  }
};
