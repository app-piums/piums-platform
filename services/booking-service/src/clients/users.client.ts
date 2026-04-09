import axios from 'axios';
import { logger } from '../utils/logger';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  nombre?: string; // Por compatibilidad con users-service
  avatar?: string;
  addresses?: Address[];
}

export class UsersClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = USERS_SERVICE_URL;
  }

  /**
   * Obtener perfil de un usuario
   */
  async getUser(userId: string): Promise<UserProfile | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/users/${userId}`, {
        timeout: 5000,
      });

      if (response.status === 200 && response.data) {
        return response.data;
      }

      return null;
    } catch (error: any) {
      logger.error('Error calling users-service', 'USERS_CLIENT', {
        error: error.message,
        userId,
        url: `${this.baseUrl}/api/users/${userId}`,
      });
      return null;
    }
  }
}

export const usersClient = new UsersClient();
