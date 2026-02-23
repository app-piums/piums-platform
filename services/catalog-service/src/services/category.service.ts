import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class CategoryService {
  // ==================== CREATE CATEGORY ====================

  /**
   * Crear una nueva categoría
   */
  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    image?: string;
    parentId?: string;
    order?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    primaryColor?: string;
    secondaryColor?: string;
  }) {
    // Verificar slug único
    const existing = await prisma.serviceCategory.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new AppError(400, "Ya existe una categoría con este slug");
    }

    // Calcular nivel y path
    let level = 0;
    let path = data.slug;

    if (data.parentId) {
      const parent = await prisma.serviceCategory.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new AppError(404, "Categoría padre no encontrada");
      }

      level = parent.level + 1;
      path = parent.path ? `${parent.path}/${data.slug}` : data.slug;
    }

    const category = await prisma.serviceCategory.create({
      data: {
        ...data,
        level,
        path,
      },
    });

    logger.info("Categoría creada", "CATEGORY_SERVICE", {
      categoryId: category.id,
      name: category.name,
      level,
    });

    return category;
  }

  // ==================== GET CATEGORY ====================

  /**
   * Obtener categoría por ID
   */
  async getCategoryById(id: string) {
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        subcategories: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        services: {
          where: { status: "ACTIVE" },
          take: 10,
        },
      },
    });

    if (!category) {
      throw new AppError(404, "Categoría no encontrada");
    }

    return category;
  }

  /**
   * Obtener categoría por slug
   */
  async getCategoryBySlug(slug: string) {
    const category = await prisma.serviceCategory.findUnique({
      where: { slug },
      include: {
        parent: true,
        subcategories: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!category) {
      throw new AppError(404, "Categoría no encontrada");
    }

    return category;
  }

  // ==================== LIST CATEGORIES ====================

  /**
   * Listar categorías raíz
   */
  async listRootCategories(includeInactive = false) {
    const where: any = { level: 0 };
    if (!includeInactive) where.isActive = true;

    const categories = await prisma.serviceCategory.findMany({
      where,
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return categories;
  }

  /**
   * Listar subcategorías de una categoría
   */
  async listSubcategories(parentId: string) {
    const categories = await prisma.serviceCategory.findMany({
      where: {
        parentId,
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        subcategories: {
          where: { isActive: true },
        },
      },
    });

    return categories;
  }

  /**
   * Listar categorías destacadas
   */
  async listFeaturedCategories() {
    const categories = await prisma.serviceCategory.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return categories;
  }

  // ==================== UPDATE CATEGORY ====================

  /**
   * Actualizar categoría
   */
  async updateCategory(id: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    image?: string;
    order?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    primaryColor?: string;
    secondaryColor?: string;
  }) {
    const category = await prisma.serviceCategory.findUnique({
where: { id },
    });

    if (!category) {
      throw new AppError(404, "Categoría no encontrada");
    }

    // Si se cambia el slug, verificar que no exista
    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.serviceCategory.findUnique({
        where: { slug: data.slug },
      });

      if (existing) {
        throw new AppError(400, "Ya existe una categoría con este slug");
      }
    }

    const updated = await prisma.serviceCategory.update({
      where: { id },
      data,
    });

    logger.info("Categoría actualizada", "CATEGORY_SERVICE", {
      categoryId: id,
    });

    return updated;
  }

  // ==================== DELETE CATEGORY ====================

  /**
   * Eliminar categoría (solo si no tiene servicios ni subcategorías)
   */
  async deleteCategory(id: string) {
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: true,
        subcategories: true,
      },
    });

    if (!category) {
      throw new AppError(404, "Categoría no encontrada");
    }

    if (category.services.length > 0) {
      throw new AppError(400, "No se puede eliminar una categoría con servicios");
    }

    if (category.subcategories.length > 0) {
      throw new AppError(400, "No se puede eliminar una categoría con subcategorías");
    }

    await prisma.serviceCategory.delete({
      where: { id },
    });

    logger.info("Categoría eliminada", "CATEGORY_SERVICE", {
      categoryId: id,
    });

    return { deleted: true };
  }

  // ==================== STATS ====================

  /**
   * Obtener estadísticas de categorías
   */
  async getCategoryStats() {
    const [total, active, featured, byLevel] = await Promise.all([
      prisma.serviceCategory.count(),
      prisma.serviceCategory.count({ where: { isActive: true } }),
      prisma.serviceCategory.count({ where: { isFeatured: true } }),
      prisma.serviceCategory.groupBy({
        by: ["level"],
        _count: true,
        orderBy: { level: "asc" },
      }),
    ]);

    return {
      total,
      active,
      featured,
      byLevel: byLevel.map((l: any) => ({
        level: l.level,
        count: l._count,
      })),
    };
  }
}

export const categoryService = new CategoryService();
