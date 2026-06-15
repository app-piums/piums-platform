import { AppError } from '../middleware/errorHandler';

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const BLOCKED_HOSTNAMES = ['localhost', 'metadata.google.internal'];

export function validateSafeHttpsUrl(url: string, fieldName: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError(400, `${fieldName}: URL inválida`);
  }
  if (parsed.protocol !== 'https:') {
    throw new AppError(400, `${fieldName}: solo se permiten URLs https://`);
  }
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new AppError(400, `${fieldName}: hostname no permitido`);
  }
  if (PRIVATE_IP_RANGES.some(re => re.test(hostname))) {
    throw new AppError(400, `${fieldName}: IPs internas no permitidas`);
  }
}

export function validateCloudinaryUrl(url: string, fieldName: string): void {
  validateSafeHttpsUrl(url, fieldName);
  if (!url.includes('res.cloudinary.com')) {
    throw new AppError(400, `${fieldName}: solo se permiten URLs de Cloudinary`);
  }
}
