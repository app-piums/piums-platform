import { z } from "zod";

export const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["cliente", "artista"], { errorMap: () => ({ message: "El rol debe ser cliente o artista" }) }),
  pais: z.string().min(2, "Selecciona un país"),
  codigoPais: z.string().min(1, "Código de país requerido"),
  telefono: z.string().min(8, "Número de teléfono inválido"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
