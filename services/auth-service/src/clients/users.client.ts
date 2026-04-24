import axios from 'axios';
import { logger } from '../utils/logger';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:4002';

export class UsersClient {
  /**
   * Crea el perfil del usuario en users-service después del registro.
   * Se llama con fire-and-forget para no bloquear la respuesta de auth.
   */
  async createUserProfile(data: {
    authId: string;
    email: string;
    nombre: string;
    ciudad?: string;
    avatar?: string;
  }) {
    try {
      await axios.post(`${USERS_SERVICE_URL}/api/users`, {
        authId: data.authId,
        email: data.email,
        nombre: data.nombre,
        ciudad: data.ciudad,
        avatar: data.avatar,
        pais: 'Guatemala',
      }, {
        timeout: 5000,
        headers: { 'x-internal-service': 'auth-service' },
      });

      logger.info('User profile created in users-service', 'USERS_CLIENT', { authId: data.authId });
    } catch (error: any) {
      // No propagamos el error: el registro en auth ya fue exitoso.
      // El perfil se puede crear luego si falla aquí.
      logger.warn('Could not create user profile in users-service', 'USERS_CLIENT', {
        authId: data.authId,
        message: error.message,
      });
    }
  }
}

export const usersClient = new UsersClient();
