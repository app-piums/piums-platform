import axios from 'axios';
import { logger } from '../utils/logger';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

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
  nombre?: string;
  avatar?: string;
  addresses?: Address[];
}

export class UsersClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = USERS_SERVICE_URL;
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/users/internal/by-auth/${userId}`, {
        headers: { 'x-internal-secret': INTERNAL_SERVICE_SECRET },
        timeout: 5000,
      });
      if (response.status === 200 && response.data) {
        return response.data;
      }
    } catch {
      // fall through to auth-service
    }
    // fallback: get basic info from auth-service
    try {
      const fallback = await axios.get(`${AUTH_SERVICE_URL}/internal/users/${userId}/info`, {
        headers: { 'x-internal-secret': INTERNAL_SERVICE_SECRET },
        timeout: 5000,
      });
      if (fallback.status === 200 && fallback.data) {
        return fallback.data;
      }
    } catch (error: any) {
      logger.error('Error calling users-service (auth fallback)', 'USERS_CLIENT', {
        error: error.message,
        userId,
      });
    }
    return null;
  }

  async checkClientIdentity(authId: string): Promise<{ hasDocuments: boolean }> {
    try {
      const response = await axios.get(
        `${AUTH_SERVICE_URL}/internal/users/${authId}/identity-status`,
        {
          headers: { 'x-internal-secret': INTERNAL_SERVICE_SECRET },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error('Error checking client identity', 'USERS_CLIENT', {
        error: error.message,
        authId,
      });
      // If auth-service is unreachable, fail open to avoid blocking clients
      return { hasDocuments: true };
    }
  }
}

export const usersClient = new UsersClient();
