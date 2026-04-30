import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import { AppError } from './errorHandler';

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Formato de archivo no permitido. Solo se permiten JPG, PNG y WebP.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    fields: 10,
  },
});

// Verifica magic bytes después de que multer carga el buffer
export const verifyMagicBytes = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  const detected = await fileTypeFromBuffer(req.file.buffer);

  if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
    return res.status(400).json({
      error: 'Formato de archivo no permitido. Solo se permiten JPG, PNG y WebP.',
    });
  }

  // Corregir el mimetype al valor real detectado (no el que envió el cliente)
  req.file.mimetype = detected.mime;
  next();
};

export const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Tamaño máximo: 5MB' });
    }
    return res.status(400).json({ error: `Error al subir archivo: ${error.message}` });
  }
  next(error);
};
