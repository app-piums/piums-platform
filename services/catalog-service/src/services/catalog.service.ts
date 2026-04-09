import { PrismaClient, PricingType, ServiceStatus } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class CatalogService {
  // ==================== CATEGORÍAS ====================

  /**
   * Obtener todas las categorías
   */
  async getAllCategories(includeInactive = false) {
    const categories = await prisma.serviceCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return categories;
  }

  /**
   * Obtener categoría por ID
   */
  async getCategoryById(id: string) {
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        parent: true,
      },
    });

    if (!category) {
      throw new AppError(404, "Categoría no encontrada");
    }

    return category;
  }

  /**
   * Crear una nueva categoría
   */
  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    parentId?: string;
    order?: number;
  }) {
    // Verificar que el slug no exista
    const existing = await prisma.serviceCategory.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new AppError(400, "Ya existe una categoría con ese slug");
    }

    // Si tiene parentId, verificar que exista
    if (data.parentId) {
      const parent = await prisma.serviceCategory.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new AppError(404, "Categoría padre no encontrada");
      }
    }

    const category = await prisma.serviceCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        parentId: data.parentId,
        order: data.order || 0,
      },
    });

    logger.info("Categoría creada", "CATALOG_SERVICE", { categoryId: category.id });
    return category;
  }

  /**
   * Actualizar categoría
   */
  async updateCategory(id: string, data: Partial<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    parentId: string;
    order: number;
    isActive: boolean;
  }>) {
    // Verificar que exista
    await this.getCategoryById(id);

    // Si actualiza slug, verificar que no esté tomado
    if (data.slug) {
      const existing = await prisma.serviceCategory.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existing) {
        throw new AppError(400, "Ya existe una categoría con ese slug");
      }
    }

    const category = await prisma.serviceCategory.update({
      where: { id },
      data,
    });

    logger.info("Categoría actualizada", "CATALOG_SERVICE", { categoryId: id });
    return category;
  }

  /**
   * Eliminar categoría
   */
  async deleteCategory(id: string) {
    // Verificar que no tenga servicios asociados
    const servicesCount = await prisma.service.count({
      where: { categoryId: id },
    });

    if (servicesCount > 0) {
      throw new AppError(
        400,
        "No se puede eliminar la categoría porque tiene servicios asociados"
      );
    }

    // Verificar que no tenga subcategorías
    const subcategoriesCount = await prisma.serviceCategory.count({
      where: { parentId: id },
    });

    if (subcategoriesCount > 0) {
      throw new AppError(
        400,
        "No se puede eliminar la categoría porque tiene subcategorías"
      );
    }

    await prisma.serviceCategory.delete({
      where: { id },
    });

    logger.info("Categoría eliminada", "CATALOG_SERVICE", { categoryId: id });
  }

  // ==================== SERVICIOS ====================

  /**
   * Buscar servicios con filtros
   */
  async searchServices(filters: {
    artistId?: string;
    categoryId?: string;
    pricingType?: PricingType;
    minPrice?: number;
    maxPrice?: number;
    status?: ServiceStatus;
    isFeatured?: boolean;
    tags?: string[];
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.artistId) where.artistId = filters.artistId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.pricingType) where.pricingType = filters.pricingType;
    if (filters.status) where.status = filters.status;
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

    // Filtro de precio
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters.minPrice !== undefined) where.basePrice.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.basePrice.lte = filters.maxPrice;
    }

    // Filtro de tags
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: true,
          addons: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return {
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener servicio por ID
   */
  async getServiceById(id: string, incrementView = false) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        addons: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!service) {
      throw new AppError(404, "Servicio no encontrado");
    }

    // Incrementar contador de vistas
    if (incrementView) {
      await prisma.service.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return service;
  }

  /**
   * Crear nuevo servicio
   */
  async createService(data: {
    artistId: string;
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    pricingType: PricingType;
    basePrice: number;
    currency?: string;
    durationMin?: number;
    durationMax?: number;
    images?: string[];
    thumbnail?: string;
    requiresDeposit?: boolean;
    depositAmount?: number;
    depositPercentage?: number;
    requiresConsultation?: boolean;
    whatIsIncluded?: string[];
    cancellationPolicy?: string;
    termsAndConditions?: string;
    tags?: string[];
    minGuests?: number;
    maxGuests?: number;
  }) {
    // Verificar que la categoría exista
    await this.getCategoryById(data.categoryId);

    // Verificar que no exista un servicio con el mismo slug para este artista
    const existing = await prisma.service.findUnique({
      where: {
        artistId_slug: {
          artistId: data.artistId,
          slug: data.slug,
        },
      },
    });

    if (existing) {
      throw new AppError(
        400,
        "Ya tienes un servicio con ese slug. Por favor elige otro."
      );
    }

    const service = await prisma.service.create({
      data: {
        artistId: data.artistId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        pricingType: data.pricingType,
        basePrice: data.basePrice,
        currency: data.currency || "GTQ",
        durationMin: data.durationMin,
        durationMax: data.durationMax,
        images: data.images || [],
        thumbnail: data.thumbnail,
        requiresDeposit: data.requiresDeposit || false,
        depositAmount: data.depositAmount,
        depositPercentage: data.depositPercentage,
        requiresConsultation: data.requiresConsultation || false,
        whatIsIncluded: data.whatIsIncluded || [],
        cancellationPolicy: data.cancellationPolicy,
        termsAndConditions: data.termsAndConditions,
        tags: data.tags || [],
        minGuests: data.minGuests,
        maxGuests: data.maxGuests,
      },
      include: {
        category: true,
        addons: true,
      },
    });

    // Si es el primer servicio activo del artista, marcarlo como servicio principal
    const existingMainService = await prisma.service.findFirst({
      where: { artistId: data.artistId, isMainService: true, status: "ACTIVE" },
    });
    if (!existingMainService) {
      await prisma.service.update({ where: { id: service.id }, data: { isMainService: true } });
      (service as any).isMainService = true;
    }

    logger.info("Servicio creado", "CATALOG_SERVICE", {
      serviceId: service.id,
      artistId: data.artistId,
    });

    return service;
  }

  /**
   * Actualizar servicio
   */
  async updateService(id: string, artistId: string, data: any) {
    // Verificar que el servicio existe y pertenece al artista
    const existing = await prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Servicio no encontrado");
    }

    if (existing.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para editar este servicio");
    }

    // Si actualiza categoryId, verificar que exista
    if (data.categoryId) {
      await this.getCategoryById(data.categoryId);
    }

    // Si actualiza slug, verificar que no esté tomado
    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.service.findUnique({
        where: {
          artistId_slug: {
            artistId,
            slug: data.slug,
          },
        },
      });

      if (slugTaken) {
        throw new AppError(400, "Ya tienes un servicio con ese slug");
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data,
      include: {
        category: true,
        addons: true,
      },
    });

    logger.info("Servicio actualizado", "CATALOG_SERVICE", {
      serviceId: id,
      artistId,
    });

    return service;
  }

  /**
   * Eliminar servicio
   */
  async deleteService(id: string, artistId: string) {
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new AppError(404, "Servicio no encontrado");
    }

    if (service.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para eliminar este servicio");
    }

    await prisma.service.delete({
      where: { id },
    });

    logger.info("Servicio eliminado", "CATALOG_SERVICE", {
      serviceId: id,
      artistId,
    });
  }

  /**
   * Alternar estado de servicio (activar/desactivar)
   */
  async toggleServiceStatus(id: string, artistId: string) {
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new AppError(404, "Servicio no encontrado");
    }

    if (service.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para modificar este servicio");
    }

    const newStatus = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const updated = await prisma.service.update({
      where: { id },
      data: { status: newStatus },
      include: {
        category: true,
        addons: true,
      },
    });

    logger.info("Estado de servicio actualizado", "CATALOG_SERVICE", {
      serviceId: id,
      oldStatus: service.status,
      newStatus,
    });

    return updated;
  }

  // ==================== ADD-ONS ====================

  /**
   * Crear addon para un servicio
   */
  async createAddon(serviceId: string, artistId: string, data: {
    name: string;
    description?: string;
    price: number;
    isOptional?: boolean;
    isDefault?: boolean;
    order?: number;
  }) {
    // Verificar que el servicio existe y pertenece al artista
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new AppError(404, "Servicio no encontrado");
    }

    if (service.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para modificar este servicio");
    }

    const addon = await prisma.serviceAddon.create({
      data: {
        serviceId,
        name: data.name,
        description: data.description,
        price: data.price,
        isOptional: data.isOptional ?? true,
        isDefault: data.isDefault ?? false,
        order: data.order || 0,
      },
    });

    logger.info("Addon creado", "CATALOG_SERVICE", {
      addonId: addon.id,
      serviceId,
    });

    return addon;
  }

  /**
   * Actualizar addon
   */
  async updateAddon(addonId: string, artistId: string, data: any) {
    const addon = await prisma.serviceAddon.findUnique({
      where: { id: addonId },
      include: { service: true },
    });

    if (!addon) {
      throw new AppError(404, "Addon no encontrado");
    }

    if (addon.service.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para modificar este addon");
    }

    const updated = await prisma.serviceAddon.update({
      where: { id: addonId },
      data,
    });

    logger.info("Addon actualizado", "CATALOG_SERVICE", { addonId });
    return updated;
  }

  /**
   * Eliminar addon
   */
  async deleteAddon(addonId: string, artistId: string) {
    const addon = await prisma.serviceAddon.findUnique({
      where: { id: addonId },
      include: { service: true },
    });

    if (!addon) {
      throw new AppError(404, "Addon no encontrado");
    }

    if (addon.service.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para eliminar este addon");
    }

    await prisma.serviceAddon.delete({
      where: { id: addonId },
    });

    logger.info("Addon eliminado", "CATALOG_SERVICE", { addonId });
  }

  // ==================== PAQUETES ====================

  /**
   * Crear paquete de servicios
   */
  async createPackage(data: {
    artistId: string;
    name: string;
    description: string;
    serviceIds: string[];
    originalPrice: number;
    packagePrice: number;
    savings: number;
    currency?: string;
    thumbnail?: string;
    validFrom?: Date;
    validUntil?: Date;
  }) {
    // Verificar que todos los servicios existan y pertenezcan al artista
    const services = await prisma.service.findMany({
      where: {
        id: { in: data.serviceIds },
        artistId: data.artistId,
      },
    });

    if (services.length !== data.serviceIds.length) {
      throw new AppError(
        400,
        "Uno o más servicios no existen o no te pertenecen"
      );
    }

    const pkg = await prisma.servicePackage.create({
      data: {
        artistId: data.artistId,
        name: data.name,
        description: data.description,
        serviceIds: data.serviceIds,
        originalPrice: data.originalPrice,
        packagePrice: data.packagePrice,
        savings: data.savings,
        currency: data.currency || "GTQ",
        thumbnail: data.thumbnail,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      },
    });

    logger.info("Paquete creado", "CATALOG_SERVICE", {
      packageId: pkg.id,
      artistId: data.artistId,
    });

    return pkg;
  }

  /**
   * Obtener paquetes de un artista
   */
  async getPackagesByArtist(artistId: string) {
    const packages = await prisma.servicePackage.findMany({
      where: {
        artistId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return packages;
  }

  /**
   * Actualizar paquete
   */
  async updatePackage(id: string, artistId: string, data: any) {
    const pkg = await prisma.servicePackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      throw new AppError(404, "Paquete no encontrado");
    }

    if (pkg.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para modificar este paquete");
    }

    const updated = await prisma.servicePackage.update({
      where: { id },
      data,
    });

    logger.info("Paquete actualizado", "CATALOG_SERVICE", { packageId: id });
    return updated;
  }

  /**
   * Eliminar paquete
   */
  async deletePackage(id: string, artistId: string) {
    const pkg = await prisma.servicePackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      throw new AppError(404, "Paquete no encontrado");
    }

    if (pkg.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para eliminar este paquete");
    }

    await prisma.servicePackage.delete({
      where: { id },
    });

    logger.info("Paquete eliminado", "CATALOG_SERVICE", { packageId: id });
  }

  /**
   * Establece un servicio como el servicio principal del artista
   */
  async setMainService(serviceId: string, artistId: string) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new AppError(404, "Servicio no encontrado");
    if (service.artistId !== artistId) throw new AppError(403, "No tienes permiso para modificar este servicio");

    await prisma.service.updateMany({
      where: { artistId, isMainService: true },
      data: { isMainService: false },
    });

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { isMainService: true },
      include: { category: true, addons: true },
    });

    logger.info("Servicio principal actualizado", "CATALOG_SERVICE", { serviceId, artistId });
    return updated;
  }
}

export const catalogService = new CatalogService();
