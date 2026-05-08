import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { CloudinaryProvider } from '../providers/cloudinary.provider';
import { logger } from '../utils/logger';

const cloudinaryProvider = new CloudinaryProvider();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

async function getUserDocumentUrls(authId: string): Promise<string[]> {
  const res = await fetch(`${AUTH_SERVICE_URL}/internal/users/${authId}/document-urls`, {
    headers: { 'x-internal-secret': INTERNAL_SECRET },
  });
  if (!res.ok) return [];
  const data = await res.json() as { documentFrontUrl?: string | null; documentBackUrl?: string | null; documentSelfieUrl?: string | null };
  return [data.documentFrontUrl, data.documentBackUrl, data.documentSelfieUrl].filter(Boolean) as string[];
}

/**
 * POST /api/users/documents/upload
 * Sube un documento de identidad a Cloudinary.
 * No requiere autenticación (se llama durante el registro del artista).
 * Acepta: campo 'file' (multipart/form-data) y query param 'folder' (front | back | selfie)
 */
export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No se proporcionó ningún archivo');
    }

    const folder = (req.query.folder as string) || 'misc';
    const validFolders = ['front', 'back', 'selfie', 'avatar'];
    if (!validFolders.includes(folder)) {
      throw new AppError(400, `Carpeta inválida. Usa: ${validFolders.join(', ')}`);
    }

    const url = folder === 'avatar'
      ? await cloudinaryProvider.uploadAvatarTemp(req.file.buffer)
      : await cloudinaryProvider.uploadDocument(req.file.buffer, folder);

    logger.info('Document uploaded', 'DOCUMENT_CONTROLLER', { folder, size: req.file.size });

    res.json({ url });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me/documents - Eliminar documento de identidad de Cloudinary
 */
export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, 'No autenticado');

    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      throw new AppError(400, 'URL requerida');
    }

    if (!url.includes('res.cloudinary.com') || !url.includes('piums/documents/')) {
      throw new AppError(400, 'URL de documento inválida');
    }

    const ownedUrls = await getUserDocumentUrls(authId);
    if (!ownedUrls.includes(url)) {
      throw new AppError(403, 'No tienes permiso para eliminar este documento');
    }

    await cloudinaryProvider.deleteDocument(url);

    logger.info('Document deleted by user', 'DOCUMENT_CONTROLLER', { authId });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};
