import { Router } from "express";
import { locationService } from "../services/location.service";

const router: Router = Router();

// ==================== COUNTRIES ====================

/**
 * GET /api/locations/countries
 * Listar países
 */
router.get("/locations/countries", async (req, res, next) => {
  try {
    const { isActive, isPopular } = req.query;
    const countries = await locationService.listCountries({
      isActive: isActive === "true",
      isPopular: isPopular === "true",
    });
    res.json(countries);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/locations/countries/:code
 * Obtener país por código
 */
router.get("/locations/countries/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const country = await locationService.getCountryByCode(code);
    res.json(country);
  } catch (error) {
    next(error);
  }
});

// ==================== STATES ====================

/**
 * GET /api/locations/countries/:countryId/states
 * Listar estados de un país
 */
router.get("/locations/countries/:countryId/states", async (req, res, next) => {
  try {
    const { countryId } = req.params;
    const states = await locationService.listStatesByCountry(countryId);
    res.json(states);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/locations/countries/:countryId/states/:code
 * Obtener estado por código
 */
router.get("/locations/countries/:countryId/states/:code", async (req, res, next) => {
  try {
    const { countryId, code } = req.params;
    const state = await locationService.getStateByCode(countryId, code);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

// ==================== CITIES ====================

/**
 * GET /api/locations/cities
 * Listar ciudades
 */
router.get("/locations/cities", async (req, res, next) => {
  try {
    const { stateId, isActive, isPopular, search } = req.query;
    const cities = await locationService.listCities({
      stateId: stateId as string,
      isActive: isActive === "true",
      isPopular: isPopular === "true",
      search: search as string,
    });
    res.json(cities);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/locations/cities/slug/:slug
 * Obtener ciudad por slug
 */
router.get("/locations/cities/slug/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const city = await locationService.getCityBySlug(slug);
    res.json(city);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/locations/cities/:id
 * Obtener ciudad por ID
 */
router.get("/locations/cities/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const city = await locationService.getCityById(id);
    res.json(city);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/locations/cities/:cityIdOrSlug/nearby
 * Obtener ciudades cercanas
 */
router.get("/locations/cities/:cityIdOrSlug/nearby", async (req, res, next) => {
  try {
    const { cityIdOrSlug } = req.params;
    const { radius } = req.query;
    const cities = await locationService.getCitiesNear(
      cityIdOrSlug,
      radius ? parseInt(radius as string) : 50
    );
    res.json(cities);
  } catch (error) {
    next(error);
  }
});

export default router;
