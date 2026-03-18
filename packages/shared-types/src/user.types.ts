// ============================================================================
// @piums/shared-types — User domain types
// ============================================================================

import type { UserRole, UserStatus } from './auth.types';

export interface User {
  id: string;
  email: string;
  nombre: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProfileType = 'USER' | 'ARTIST';
export type ProfileVisibility = 'PUBLIC' | 'HIDDEN';

export interface UserProfile {
  id: string;
  userId: string;
  slug?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;
  profileType: ProfileType;
  visibility: ProfileVisibility;
  country?: string;
  city?: string;
  timezone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileRequest {
  slug?: string;
  displayName?: string;
  bio?: string;
  profileType?: ProfileType;
  visibility?: ProfileVisibility;
  country?: string;
  city?: string;
  timezone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export type UpdateProfileRequest = Partial<CreateProfileRequest>;

export interface NotificationSettings {
  id: string;
  userId: string;
  emailMarketing: boolean;
  emailBooking: boolean;
  emailPayment: boolean;
  emailReview: boolean;
  pushBooking: boolean;
  pushPayment: boolean;
  pushMessage: boolean;
  smsBooking: boolean;
  updatedAt: string;
}

export interface UpdateNotificationSettingsRequest {
  emailMarketing?: boolean;
  emailBooking?: boolean;
  emailPayment?: boolean;
  emailReview?: boolean;
  pushBooking?: boolean;
  pushPayment?: boolean;
  pushMessage?: boolean;
  smsBooking?: boolean;
}

export interface Address {
  id: string;
  userId: string;
  label?: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressRequest {
  label?: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isDefault?: boolean;
}
