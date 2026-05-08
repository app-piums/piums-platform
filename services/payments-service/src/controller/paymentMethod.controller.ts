import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { PaymentMethodService } from "../services/paymentMethod.service";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { addPaymentMethodSchema } from "../schemas/payment.schema";

const paymentMethodService = new PaymentMethodService();

/**
 * GET /api/payments/methods - Obtener métodos de pago del usuario
 */
export const getPaymentMethods = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "No autenticado");
    }

    const methods = await paymentMethodService.getUserPaymentMethods(userId);

    logger.info("User payment methods retrieved", "PAYMENT_METHOD_CONTROLLER", {
      userId,
      count: methods.length,
    });

    res.json({ methods, count: methods.length });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/methods - Agregar nuevo método de pago
 */
export const addPaymentMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "No autenticado");
    }

    const validatedData = addPaymentMethodSchema.parse(req.body);

    const method = await paymentMethodService.addPaymentMethod(
      userId,
      validatedData.stripePaymentMethodId,
      validatedData.setAsDefault
    );

    logger.info("Payment method added", "PAYMENT_METHOD_CONTROLLER", {
      userId,
      methodId: method.id,
      isDefault: method.isDefault,
    });

    res.status(201).json({
      message: "Método de pago agregado exitosamente",
      method,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/payments/methods/:id - Eliminar método de pago
 */
export const deletePaymentMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "No autenticado");
    }

    const id = req.params['id'] as string;

    await paymentMethodService.deletePaymentMethod(userId, id);

    logger.info("Payment method deleted", "PAYMENT_METHOD_CONTROLLER", {
      userId,
      methodId: id,
    });

    res.json({ message: "Método de pago eliminado exitosamente" });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/payments/methods/:id/default - Establecer método como predeterminado
 */
export const setDefaultPaymentMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "No autenticado");
    }

    const id = req.params['id'] as string;

    const method = await paymentMethodService.setDefaultPaymentMethod(
      userId,
      id
    );

    logger.info("Default payment method set", "PAYMENT_METHOD_CONTROLLER", {
      userId,
      methodId: id,
    });

    res.json({
      message: "Método de pago predeterminado establecido",
      method,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/methods/default — Obtener método de pago predeterminado
 */
export const getDefaultPaymentMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, "No autenticado");

    const method = await paymentMethodService.getDefaultPaymentMethod(userId);
    res.json({ method: method || null });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/methods/save-token — Guardar token de proveedor (Tilopay/Stripe)
 */
export const saveProviderToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, "No autenticado");

    const { provider, token, cardBrand, cardLast4, cardExpMonth, cardExpYear } = req.body as {
      provider: 'TILOPAY' | 'STRIPE';
      token: string;
      cardBrand?: string;
      cardLast4?: string;
      cardExpMonth?: number;
      cardExpYear?: number;
    };

    if (!provider || !token) throw new AppError(400, "provider y token son requeridos");
    if (!['TILOPAY', 'STRIPE'].includes(provider)) throw new AppError(400, "provider inválido");

    const method = await paymentMethodService.saveProviderToken(userId, {
      provider, token, cardBrand, cardLast4, cardExpMonth, cardExpYear,
    });

    logger.info("Provider token saved", "PAYMENT_METHOD_CONTROLLER", { userId, provider });
    res.status(201).json({ message: "Tarjeta guardada", method });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/methods/:id/charge — One-click checkout con tarjeta guardada
 */
export const chargeWithSavedCard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, "No autenticado");

    const methodId = req.params['id'] as string;
    const { bookingId, amount, currency } = req.body as {
      bookingId: string;
      amount: number;
      currency?: string;
    };

    if (!bookingId || !amount) throw new AppError(400, "bookingId y amount son requeridos");

    const result = await paymentMethodService.chargeWithSavedCard(
      userId,
      methodId,
      bookingId,
      amount,
      currency || 'USD'
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const paymentMethodController = {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
  saveProviderToken,
  chargeWithSavedCard,
};
