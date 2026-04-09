import { z } from "zod";

// Schema base de registro (campos comunes)
const baseRegisterSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  pais: z.string().min(2, "Selecciona un país").optional(),
  codigoPais: z.string().optional(),
  telefono: z.string().min(6, "Número de teléfono inválido").optional(),
});

// Schema general (con selección de rol - para uso interno/admin)
export const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["cliente", "artista"], { errorMap: () => ({ message: "El rol debe ser cliente o artista" }) }),
  pais: z.string().min(2, "Selecciona un país").optional(),
  codigoPais: z.string().optional(),
  telefono: z.string().min(6, "Número de teléfono inválido").optional(),
});

// Schema específico para registro de artistas (rol fijo: artista)
// Requiere documento de identidad obligatorio
export const registerArtistSchema = baseRegisterSchema.extend({
  role: z.literal("artista").default("artista"),
  nombreArtistico: z.string().max(50).optional(),
  ciudad: z.string().min(2, "Ingresa tu ciudad"),
  birthDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")),
  documentType: z.enum(["DPI", "PASSPORT", "RESIDENCE_CARD"], { errorMap: () => ({ message: "Tipo de documento inválido" }) }),
  documentNumber: z.string().min(6, "Número de documento muy corto").max(20, "Número de documento muy largo"),
  documentFrontUrl: z.string().url("URL del documento inválida"),
  documentBackUrl: z.string().url("URL inválida").optional().nullable(),
  documentSelfieUrl: z.string().url("URL de selfie inválida"),
});

// Schema específico para registro de clientes (rol fijo: cliente)
// Sin documento de identidad
export const registerClientSchema = baseRegisterSchema.extend({
  role: z.literal("cliente").default("cliente"),
  ciudad: z.string().min(2, "Ingresa tu ciudad").optional(),
  birthDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterArtistInput = z.infer<typeof registerArtistSchema>;
export type RegisterClientInput = z.infer<typeof registerClientSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

