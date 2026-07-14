import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

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

// ─── Video (video presentación / "historia") ────────────────────────────────

const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Formato de video no permitido. Solo MP4, MOV y WebM.'));
  },
  limits: { fileSize: MAX_VIDEO_BYTES },
});

export const handleVideoMulterError = (error: any, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ error: 'Video muy grande. Máximo 100 MB.' });
    return res.status(400).json({ error: `Error al subir video: ${error.message}` });
  }
  if (error?.message?.startsWith('Formato de video no permitido'))
    return res.status(400).json({ error: error.message });
  next(error);
};

/**
 * Verificación de magic bytes de contenedores de video (sin dependencias).
 * El mimetype declarado por el cliente es trivialmente falsificable; esto sniff-ea
 * la firma real del contenedor y rechaza cualquier cosa que no sea MP4/MOV/WebM.
 *  - WebM/Matroska: cabecera EBML `1A 45 DF A3`
 *  - MP4/MOV (ISO BMFF): bytes 4..7 == 'ftyp'
 */
export const assertVideoMagicBytes = (buffer: Buffer): void => {
  const ok =
    buffer.length >= 12 &&
    ((buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) ||
      (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70));
  if (!ok) {
    throw new AppError(400, 'El archivo no es un video válido (MP4, MOV o WebM).');
  }
};
