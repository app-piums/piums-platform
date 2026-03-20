import { Router } from 'express';
import { calculatePrice, getPricingSummary, validatePricing } from '../controller/pricing.controller';

const router: Router = Router();

// Calcular precio completo de un servicio
router.post('/calculate', calculatePrice);

// Obtener resumen de pricing de un servicio
router.get('/summary/:serviceId', getPricingSummary);

// Validar configuración de pricing de un servicio
router.get('/validate/:serviceId', validatePricing);

export default router;
