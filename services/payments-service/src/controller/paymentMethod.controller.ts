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

export const paymentMethodController = {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
};
