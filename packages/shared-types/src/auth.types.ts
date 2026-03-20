// ============================================================================
// @piums/shared-types — Auth domain types
// ============================================================================

export type UserRole = 'USER' | 'ARTIST' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceId?: string;
  deviceName?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  phone?: string;
}

export interface RegisterArtistRequest extends RegisterRequest {
  artistCategory?: string;
  cityId?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
}

export interface SessionInfo {
  id: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}
