import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

/**
 * Genera un JWT para comunicación inter-servicios
 * @param userId - ID del usuario en nombre del cual el servicio actúa
 * @param email - Email del usuario (opcional)
 * @returns Token JWT
 */
export const generateServiceToken = (userId: string, email: string = 'service@internal'): string => {
  return jwt.sign(
    {
      userId,
      email,
      isService: true,
    },
    JWT_SECRET,
    { expiresIn: '5m' } // Tokens de servicio expiran en 5 minutos
  );
};

/**
 * Verifica un JWT y retorna el payload
 */
export const verifyServiceToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
