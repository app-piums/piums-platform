import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { stripeProvider } from "../providers/stripe.provider";
import { tilopayProvider } from "../providers/tilopay.provider";
import { bookingClient } from "../clients/booking.client";

const prisma = new PrismaClient();

export class PaymentMethodService {
  /**
   * Obtener todos los métodos de pago de un usuario
   */
  async getUserPaymentMethods(userId: string) {
    try {
      const methods = await prisma.paymentMethod.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      logger.info("Payment methods retrieved", "PAYMENT_METHOD_SERVICE", {
        userId,
        count: methods.length,
      });

      return methods;
    } catch (error: any) {
      logger.error("Error getting payment methods", "PAYMENT_METHOD_SERVICE", error);
      throw error;
    }
  }

  /**
   * Agregar nuevo método de pago
   */
  async addPaymentMethod(
    userId: string,
    stripePaymentMethodId: string,
    setAsDefault: boolean = false
  ) {
    try {
      // 1. Obtener información del payment method desde Stripe
      const stripeMethod = await stripeProvider.retrievePaymentMethod(
        stripePaymentMethodId
      );

      // 2. Verificar que el método no esté ya guardado
      const existing = await prisma.paymentMethod.findUnique({
        where: { stripePaymentMethodId },
      });

      if (existing && !existing.deletedAt) {
        throw new AppError(400, "Este método de pago ya está registrado");
      }

      // 3. Si se establece como predeterminado, quitar el flag de los demás
      if (setAsDefault) {
        await prisma.paymentMethod.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // 4. Si es el primer método del usuario, hacerlo predeterminado automáticamente
      const userMethodsCount = await prisma.paymentMethod.count({
        where: { userId, deletedAt: null },
      });

      const isFirst = userMethodsCount === 0;

      // 5. Crear el registro del método de pago
      const method = await prisma.paymentMethod.create({
        data: {
          userId,
          stripePaymentMethodId,
          type: stripeMethod.type,
          cardBrand: stripeMethod.card?.brand || null,
          cardLast4: stripeMethod.card?.last4 || null,
          cardExpMonth: stripeMethod.card?.exp_month || null,
          cardExpYear: stripeMethod.card?.exp_year || null,
          isDefault: setAsDefault || isFirst,
          metadata: {},
        },
      });

      logger.info("Payment method added", "PAYMENT_METHOD_SERVICE", {
        userId,
        methodId: method.id,
        type: method.type,
        isDefault: method.isDefault,
      });

      return method;
    } catch (error: any) {
      logger.error("Error adding payment method", "PAYMENT_METHOD_SERVICE", error);
      throw error;
    }
  }

  /**
   * Eliminar método de pago (soft delete)
   */
  async deletePaymentMethod(userId: string, methodId: string) {
    try {
      // 1. Verificar que el método existe y pertenece al usuario
      const method = await prisma.paymentMethod.findUnique({
        where: { id: methodId },
      });

      if (!method || method.deletedAt) {
        throw new AppError(404, "Método de pago no encontrado");
      }

      if (method.userId !== userId) {
        throw new AppError(403, "No tienes permiso para eliminar este método");
      }

      // 2. Soft delete
      const deleted = await prisma.paymentMethod.update({
        where: { id: methodId },
        data: { deletedAt: new Date() },
      });

      // 3. Si era el método predeterminado, establecer otro como predeterminado
      if (deleted.isDefault) {
        const nextMethod = await prisma.paymentMethod.findFirst({
          where: { userId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        });

        if (nextMethod) {
          await prisma.paymentMethod.update({
            where: { id: nextMethod.id },
            data: { isDefault: true },
          });
        }
      }

      // 4. Detach del customer en Stripe (solo para PMs de Stripe)
      const methodProvider: string = (method as any).provider || 'STRIPE';
      if (methodProvider === 'STRIPE' && method.stripePaymentMethodId.startsWith('pm_')) {
        try {
          await stripeProvider.detachPaymentMethod(method.stripePaymentMethodId);
        } catch (stripeError: any) {
          logger.warn(
            "Failed to detach payment method from Stripe",
            "PAYMENT_METHOD_SERVICE",
            { error: stripeError.message }
          );
        }
      }

      logger.info("Payment method deleted", "PAYMENT_METHOD_SERVICE", {
        userId,
        methodId,
      });

      return { message: "Método de pago eliminado exitosamente" };
    } catch (error: any) {
      logger.error("Error deleting payment method", "PAYMENT_METHOD_SERVICE", error);
      throw error;
    }
  }

  /**
   * Obtener método de pago predeterminado del usuario (sin deleted)
   */
  async getDefaultPaymentMethod(userId: string) {
    try {
      const method = await prisma.paymentMethod.findFirst({
        where: { userId, isDefault: true, deletedAt: null },
      });
      return method;
    } catch (error: any) {
      logger.error("Error getting default payment method", "PAYMENT_METHOD_SERVICE", error);
      throw error;
    }
  }

  /**
   * Guardar token de proveedor (Tilopay hash o Stripe PM) como método guardado.
   * Hace upsert: si ya existe el token, solo actualiza isDefault.
   */
  async saveProviderToken(
    userId: string,
    data: {
      provider: 'TILOPAY' | 'STRIPE';
      token: string;
      cardBrand?: string;
      cardLast4?: string;
      cardExpMonth?: number;
      cardExpYear?: number;
    }
  ) {
    try {
      // Use a prefixed token to avoid collisions between providers
      const tokenKey = data.provider === 'TILOPAY' ? `tilopay_${data.token}` : data.token;

      // Check if already saved (idempotent)
      const existing = await (prisma as any).paymentMethod.findFirst({
        where: { userId, stripePaymentMethodId: tokenKey, deletedAt: null },
      });

      if (existing) {
        // Already saved — ensure it's the default
        await (prisma as any).paymentMethod.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
        const updated = await (prisma as any).paymentMethod.update({
          where: { id: existing.id },
          data: { isDefault: true },
        });
        return updated;
      }

      // Set all existing as non-default first
      await prisma.paymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      const method = await (prisma as any).paymentMethod.create({
        data: {
          userId,
          provider: data.provider,
          stripePaymentMethodId: tokenKey,
          type: 'card',
          cardBrand: data.cardBrand || null,
          cardLast4: data.cardLast4 || null,
          cardExpMonth: data.cardExpMonth || null,
          cardExpYear: data.cardExpYear || null,
          isDefault: true,
          metadata: {},
        },
      });

      logger.info("Provider token saved as payment method", "PAYMENT_METHOD_SERVICE", {
        userId,
        provider: data.provider,
        methodId: method.id,
      });

      return method;
    } catch (error: any) {
      logger.error("Error saving provider token", "PAYMENT_METHOD_SERVICE", error);
      throw error;
    }
  }

  /**
   * Cobrar con tarjeta guardada (one-click checkout)
   */
  async chargeWithSavedCard(
    userId: string,
    methodId: string,
    bookingId: string,
    amount: number,
    currency: string
  ) {
    const method = await prisma.paymentMethod.findUnique({ where: { id: methodId } });
    if (!method || method.deletedAt) throw new AppError(404, "Método de pago no encontrado");
    if (method.userId !== userId) throw new AppError(403, "No tienes permiso para usar este método");

    const booking = await bookingClient.getBooking(bookingId);
    if (!booking) throw new AppError(404, "Reserva no encontrada");
    if (booking.clientId !== userId) throw new AppError(403, "No tienes permiso para pagar esta reserva");

    const provider: string = (method as any).provider || 'STRIPE';

    if (provider === 'TILOPAY') {
      // Strip the tilopay_ prefix to get the raw hash
      const hash = method.stripePaymentMethodId.replace(/^tilopay_/, '');
      const result = await tilopayProvider.chargeToken({ hash, amount, currency, bookingId });

      if (!result.approved) {
        throw new AppError(402, `Pago rechazado por Tilopay (código ${result.responseCode})`);
      }

      // Mark booking as paid
      await bookingClient.markPayment(bookingId, amount, 'TILOPAY', result.orderNumber, 'FULL_PAYMENT');

      logger.info("One-click Tilopay charge succeeded", "PAYMENT_METHOD_SERVICE", {
        userId, bookingId, methodId, orderNumber: result.orderNumber,
      });

      return { success: true, orderNumber: result.orderNumber, provider: 'TILOPAY' };
    }

    // Stripe: use saved PM with off-session confirm
    const pmId = method.stripePaymentMethodId;
    const { stripe } = await import('../providers/stripe.provider');
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      payment_method: pmId,
      confirm: true,
      off_session: true,
    });

    if (intent.status !== 'succeeded') {
      throw new AppError(402, `Pago Stripe no completado: ${intent.status}`);
    }

    await bookingClient.markPayment(bookingId, amount, 'STRIPE', intent.id, 'FULL_PAYMENT');

    logger.info("One-click Stripe charge succeeded", "PAYMENT_METHOD_SERVICE", {
      userId, bookingId, methodId, intentId: intent.id,
    });

    return { success: true, orderNumber: intent.id, provider: 'STRIPE' };
  }

  /**
   * Establecer método de pago como predeterminado
   */
  async setDefaultPaymentMethod(userId: string, methodId: string) {
    try {
      // 1. Verificar que el método existe y pertenece al usuario
      const method = await prisma.paymentMethod.findUnique({
        where: { id: methodId },
      });

      if (!method || method.deletedAt) {
        throw new AppError(404, "Método de pago no encontrado");
      }

      if (method.userId !== userId) {
        throw new AppError(403, "No tienes permiso para modificar este método");
      }

      // 2. Quitar el flag de predeterminado de todos los métodos del usuario
      await prisma.paymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      // 3. Establecer el nuevo método como predeterminado
      const updatedMethod = await prisma.paymentMethod.update({
        where: { id: methodId },
        data: { isDefault: true },
      });

      logger.info("Default payment method set", "PAYMENT_METHOD_SERVICE", {
        userId,
        methodId,
      });

      return updatedMethod;
    } catch (error: any) {
      logger.error(
        "Error setting default payment method",
        "PAYMENT_METHOD_SERVICE",
        error
      );
      throw error;
    }
  }
}
