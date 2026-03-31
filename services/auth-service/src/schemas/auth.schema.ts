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
export const registerArtistSchema = baseRegisterSchema.extend({
  role: z.literal("artista").default("artista"),
});

// Schema específico para registro de clientes (rol fijo: cliente)
export const registerClientSchema = baseRegisterSchema.extend({
  role: z.literal("cliente").default("cliente"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterArtistInput = z.infer<typeof registerArtistSchema>;
export type RegisterClientInput = z.infer<typeof registerClientSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

