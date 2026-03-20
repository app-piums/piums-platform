import { Router } from "express";
import { categoryService } from "../services/category.service";

const router: Router = Router();

// ==================== CATEGORIES ====================

/**
 * GET /api/categories
 * Listar categorías raíz
 */
router.get("/categories", async (req, res, next) => {
  try {
    const categories = await categoryService.listRootCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/featured
 * Listar categorías destacadas
 */
router.get("/categories/featured", async (req, res, next) => {
  try {
    const categories = await categoryService.listFeaturedCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/stats
 * Estadísticas de categorías
 */
router.get("/categories/stats", async (req, res, next) => {
  try {
    const stats = await categoryService.getCategoryStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/slug/:slug
 * Obtener categoría por slug
 */
router.get("/categories/slug/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);
    res.json(category);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/:id
 * Obtener categoría por ID
 */
router.get("/categories/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    res.json(category);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/:id/subcategories
 * Listar subcategorías
 */
router.get("/categories/:id/subcategories", async (req, res, next) => {
  try {
    const { id } = req.params;
    const subcategories = await categoryService.listSubcategories(id);
    res.json(subcategories);
  } catch (error) {
    next(error);
  }
});

export default router;
