import { Request, Response } from 'express';
import {
  calculateServicePrice,
  getServicePricingSummary,
  validateServicePricing,
  PriceCalculationInput,
} from '../services/pricing.service';

/**
 * POST /api/pricing/calculate
 * Calcula el precio completo de un servicio con todos sus componentes
 */
export const calculatePrice = async (req: Request, res: Response) => {
  try {
    const input: PriceCalculationInput = req.body;

    if (!input.serviceId) {
      return res.status(400).json({
        error: 'serviceId is required',
      });
    }

    const quote = await calculateServicePrice(input);

    return res.json(quote);
  } catch (error: any) {
    console.error('Error calculating price:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * GET /api/pricing/summary/:serviceId
 * Obtiene un resumen de pricing de un servicio
 */
export const getPricingSummary = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.serviceId as string;

    const summary = await getServicePricingSummary(serviceId);

    return res.json(summary);
  } catch (error: any) {
    console.error('Error getting pricing summary:', error);
    return res.status(404).json({
      error: error.message || 'Service not found',
    });
  }
};

/**
 * GET /api/pricing/validate/:serviceId
 * Valida que un servicio tenga pricing configurado correctamente
 */
export const validatePricing = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.serviceId as string;

    const validation = await validateServicePricing(serviceId);

    return res.json(validation);
  } catch (error: any) {
    console.error('Error validating pricing:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};
