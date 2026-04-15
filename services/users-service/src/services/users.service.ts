import { PrismaClient } from '@prisma/client';

import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class UsersService {
  private slugify(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private async generateUniqueProfileSlug(base: string) {
    const normalizedBase = this.slugify(base) || `user-${Date.now()}`;
    let candidate = normalizedBase;
    let suffix = 1;

    while (await prisma.profile.findUnique({ where: { slug: candidate } })) {
      candidate = `${normalizedBase}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  /**
   * Crear usuario inicial (llamado desde auth-service después de registro)
   */
  async createUser(data: {
    authId: string;
    email: string;
    nombre: string;
    ciudad?: string;
    telefono?: string;
    pais?: string;
  }) {
    try {
      // Verificar que no exista
        const existing = await prisma.user.findUnique({
          where: { authId: data.authId },
        });

      if (existing) {
        throw new AppError(409, "El usuario ya existe");
      }

      const user = await prisma.user.create({
        data: {
          authId: data.authId,
          email: data.email,
          nombre: data.nombre,
          telefono: data.telefono,
          pais: data.pais,
          lastLoginAt: new Date(),
        },
      });

      // Crear perfil base para persistir metadata pública inicial (ej. ciudad).
      // Si falla, no bloquea la creación del usuario.
      try {
        const existingProfile = await prisma.profile.findUnique({
          where: { userId: user.id },
        });

        if (!existingProfile) {
          const slug = await this.generateUniqueProfileSlug(`${data.nombre}-${data.authId.slice(0, 8)}`);

          await prisma.profile.create({
            data: {
              userId: user.id,
              displayName: data.nombre,
              slug,
              city: data.ciudad,
              country: data.pais ?? "Guatemala",
              keywords: [],
              categories: [],
            },
          });
        }
      } catch (profileError) {
        logger.warn("No se pudo crear perfil inicial", "USERS_SERVICE", {
          userId: user.id,
          error: profileError,
        });
      }

      logger.info("Usuario creado", "USERS_SERVICE", { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      logger.error("Error creando usuario", "USERS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Obtener perfil de usuario por authId
   */
  async getUserByAuthId(authId: string) {
    const user = await prisma.user.findUnique({
      where: { authId },
      include: {
        addresses: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new AppError(404, "Usuario no encontrado");
    }

    return user;
  }

  /**
   * Obtener perfil de usuario por ID
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new AppError(404, "Usuario no encontrado");
    }

    return user;
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateUser(id: string, data: any) {
    try {
      // Verificar que existe
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing || existing.deletedAt) {
        throw new AppError(404, "Usuario no encontrado");
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          addresses: true,
        },
      });

      logger.info("Usuario actualizado", "USERS_SERVICE", { userId: id });
      return user;
    } catch (error) {
      logger.error("Error actualizando usuario", "USERS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Eliminar cuenta (soft delete)
   */
  async deleteUser(id: string) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      logger.info("Usuario eliminado (soft delete)", "USERS_SERVICE", { userId: id });
      return { message: "Cuenta eliminada exitosamente" };
    } catch (error) {
      logger.error("Error eliminando usuario", "USERS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Agregar dirección
   */
  async addAddress(userId: string, data: any) {
    try {
      // Si es dirección por defecto, actualizar las demás
      if (data.isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.create({
        data: {
          ...data,
          userId,
        },
      });

      logger.info("Dirección agregada", "USERS_SERVICE", { userId, addressId: address.id });
      return address;
    } catch (error) {
      logger.error("Error agregando dirección", "USERS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Actualizar dirección
   */
  async updateAddress(addressId: string, userId: string, data: any) {
    try {
      // Verificar que la dirección pertenece al usuario
      const existing = await prisma.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!existing) {
        throw new AppError(404, "Dirección no encontrada");
      }

      // Si se marca como default, desmarcar las demás
      if (data.isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.update({
        where: { id: addressId },
        data,
      });

      logger.info("Dirección actualizada", "USERS_SERVICE", { addressId });
      return address;
    } catch (error) {
      logger.error("Error actualizando dirección", "USERS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Eliminar dirección
   */
  async deleteAddress(addressId: string, userId: string) {
    try {
      // Verificar que pertenece al usuario
      const existing = await prisma.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!existing) {
        throw new AppError(404, "Dirección no encontrada");
      }

      await prisma.address.delete({
        where: { id: addressId },
      });

      logger.info("Dirección eliminada", "USERS_SERVICE", { addressId });
      return { message: "Dirección eliminada" };
    } catch (error) {
      logger.error("Error eliminando dirección", "USERS_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Actualizar última fecha de login
   */
  async updateLastLogin(authId: string) {
    try {
      await prisma.user.update({
        where: { authId },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      logger.error("Error actualizando lastLoginAt", "USERS_SERVICE", { error });
    }
  }
}
