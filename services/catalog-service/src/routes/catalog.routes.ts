import { Router } from "express";
import { catalogController } from "../controller/catalog.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createServiceLimiter,
  updateLimiter,
  searchLimiter,
} from "../middleware/rateLimiter";

const router: Router = Router();

// ==================== CATEGORÍAS ====================

/**
 * GET /api/categories
 * Obtener todas las categorías
 * Público
 */
router.get("/categories", catalogController.getAllCategories.bind(catalogController));

/**
 * GET /api/categories/:id
 * Obtener categoría por ID
 * Público
 */
router.get("/categories/:id", catalogController.getCategoryById.bind(catalogController));

/**
 * POST /api/categories
 * Crear nueva categoría
 * Requiere autenticación (admin)
 */
router.post(
  "/categories",
  authenticateToken,
  createServiceLimiter,
  catalogController.createCategory.bind(catalogController)
);

/**
 * PUT /api/categories/:id
 * Actualizar categoría
 * Requiere autenticación (admin)
 */
router.put(
  "/categories/:id",
  authenticateToken,
  updateLimiter,
  catalogController.updateCategory.bind(catalogController)
);

/**
 * DELETE /api/categories/:id
 * Eliminar categoría
 * Requiere autenticación (admin)
 */
router.delete(
  "/categories/:id",
  authenticateToken,
  catalogController.deleteCategory.bind(catalogController)
);

// ==================== SERVICIOS ====================

/**
 * GET /api/services
 * Buscar servicios con filtros
 * Público
 */
router.get("/services", searchLimiter, catalogController.searchServices.bind(catalogController));

/**
 * GET /api/services/:id
 * Obtener servicio por ID
 * Público
 */
router.get("/services/:id", catalogController.getServiceById.bind(catalogController));

/**
 * POST /api/services
 * Crear nuevo servicio
 * Requiere autenticación (artista)
 */
router.post(
  "/services",
  authenticateToken,
  createServiceLimiter,
  catalogController.createService.bind(catalogController)
);

/**
 * PUT /api/services/:id
 * Actualizar servicio
 * Requiere autenticación (propietario del servicio)
 */
router.put(
  "/services/:id",
  authenticateToken,
  updateLimiter,
  catalogController.updateService.bind(catalogController)
);

/**
 * DELETE /api/services/:id
 * Eliminar servicio
 * Requiere autenticación (propietario del servicio)
 */
router.delete(
  "/services/:id",
  authenticateToken,
  catalogController.deleteService.bind(catalogController)
);

/**
 * PATCH /api/services/:id/toggle-status
 * Activar/Desactivar servicio
 * Requiere autenticación (propietario del servicio)
 */
router.patch(
  "/services/:id/toggle-status",
  authenticateToken,
  catalogController.toggleServiceStatus.bind(catalogController)
);

/**
 * PATCH /api/services/:id/set-main
 * Establecer servicio como servicio principal del artista
 * Requiere autenticación (propietario del servicio)
 */
router.patch(
  "/services/:id/set-main",
  authenticateToken,
  updateLimiter,
  catalogController.setMainService.bind(catalogController)
);

// ==================== ADD-ONS ====================

/**
 * POST /api/services/:serviceId/addons
 * Crear addon para un servicio
 * Requiere autenticación (propietario del servicio)
 */
router.post(
  "/services/:serviceId/addons",
  authenticateToken,
  createServiceLimiter,
  catalogController.createAddon.bind(catalogController)
);

/**
 * PUT /api/addons/:addonId
 * Actualizar addon
 * Requiere autenticación (propietario del servicio)
 */
router.put(
  "/addons/:addonId",
  authenticateToken,
  updateLimiter,
  catalogController.updateAddon.bind(catalogController)
);

/**
 * DELETE /api/addons/:addonId
 * Eliminar addon
 * Requiere autenticación (propietario del servicio)
 */
router.delete(
  "/addons/:addonId",
  authenticateToken,
  catalogController.deleteAddon.bind(catalogController)
);

// ==================== PAQUETES ====================

/**
 * POST /api/packages
 * Crear paquete de servicios
 * Requiere autenticación (artista)
 */
router.post(
  "/packages",
  authenticateToken,
  createServiceLimiter,
  catalogController.createPackage.bind(catalogController)
);

/**
 * GET /api/artists/:artistId/packages
 * Obtener paquetes de un artista
 * Público
 */
router.get("/artists/:artistId/packages", catalogController.getPackagesByArtist.bind(catalogController));

/**
 * PUT /api/packages/:id
 * Actualizar paquete
 * Requiere autenticación (propietario del paquete)
 */
router.put(
  "/packages/:id",
  authenticateToken,
  updateLimiter,
  catalogController.updatePackage.bind(catalogController)
);

/**
 * DELETE /api/packages/:id
 * Eliminar paquete
 * Requiere autenticación (propietario del paquete)
 */
router.delete(
  "/packages/:id",
  authenticateToken,
  catalogController.deletePackage.bind(catalogController)
);

export default router;
