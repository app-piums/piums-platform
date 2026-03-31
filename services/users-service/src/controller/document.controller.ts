import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { CloudinaryProvider } from '../providers/cloudinary.provider';
import { logger } from '../utils/logger';

const cloudinaryProvider = new CloudinaryProvider();

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
    const validFolders = ['front', 'back', 'selfie'];
    if (!validFolders.includes(folder)) {
      throw new AppError(400, `Carpeta inválida. Usa: ${validFolders.join(', ')}`);
    }

    const url = await cloudinaryProvider.uploadDocument(req.file.buffer, folder);

    logger.info('Document uploaded', 'DOCUMENT_CONTROLLER', { folder, size: req.file.size });

    res.json({ url });
  } catch (error) {
    next(error);
  }
};
