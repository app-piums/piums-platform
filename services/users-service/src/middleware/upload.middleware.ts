import multer from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Configuración de Multer para manejo de archivos en memoria
const storage = multer.memoryStorage();

// Validación de archivos
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Tipos MIME permitidos
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        'Formato de archivo no permitido. Solo se permiten JPG, PNG y WebP.'
      )
    );
  }
};

// Configuración de Multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Middleware para manejo de errores de Multer
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'El archivo es demasiado grande. Tamaño máximo: 5MB',
      });
    }
    return res.status(400).json({
      error: `Error al subir archivo: ${error.message}`,
    });
  }
  next(error);
};
