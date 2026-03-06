import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { stripeProvider } from "../providers/stripe.provider";

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

      // 4. Detach del customer en Stripe
      try {
        await stripeProvider.detachPaymentMethod(method.stripePaymentMethodId);
      } catch (stripeError: any) {
        logger.warn(
          "Failed to detach payment method from Stripe",
          "PAYMENT_METHOD_SERVICE",
          { error: stripeError.message }
        );
        // Continuar aunque falle el detach en Stripe
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
