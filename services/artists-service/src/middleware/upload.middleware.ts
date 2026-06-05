import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Formato no permitido. Solo JPG, PNG y WebP.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const handleMulterError = (error: any, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ error: 'Archivo muy grande. Máximo 5 MB.' });
    return res.status(400).json({ error: `Error al subir archivo: ${error.message}` });
  }
  if (error?.message?.startsWith('Formato no permitido'))
    return res.status(400).json({ error: error.message });
  next(error);
};
