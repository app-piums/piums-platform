import { z } from "zod";

// Schema para obtener perfil (sin validación extra)
export const getUserSchema = z.object({
  id: z.string().uuid("ID de usuario inválido"),
});

// Schema para actualizar perfil
export const updateUserSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  avatar: z.string().url("URL de avatar inválida").optional(),
  bio: z.string().max(500, "La biografía no puede exceder 500 caracteres").optional(),
  telefono: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Número de teléfono inválido").optional(),
  pais: z.string().min(2, "País inválido").optional(),
  language: z.enum(["es", "en", "pt"]).optional(),
  timezone: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

// Schema para crear/actualizar dirección
export const addressSchema = z.object({
  label: z.string().min(1, "Etiqueta requerida"),
  street: z.string().min(5, "Dirección debe tener al menos 5 caracteres"),
  city: z.string().min(2, "Ciudad requerida"),
  state: z.string().min(2, "Estado/Provincia requerido"),
  country: z.string().min(2, "País requerido"),
  zipCode: z.string().min(3, "Código postal requerido"),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional(),
});

// Schema para crear usuario inicial (desde auth-service)
export const createUserSchema = z.object({
  authId: z.string().min(1, "authId requerido"),
  email: z.string().email("Email inválido"),
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  telefono: z.string().optional(),
  pais: z.string().optional(),
});
