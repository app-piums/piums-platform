import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET no definido en producción');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-not-for-production';

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
