import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryProvider {
  async uploadBandAvatar(buffer: Buffer, bandId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder:    'piums/band-avatars',
          public_id: `band_${bandId}_${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  async deleteBandAvatar(avatarUrl: string): Promise<void> {
    try {
      const match = avatarUrl.match(/piums\/band-avatars\/([^/.]+)/);
      if (!match) return;
      await cloudinary.uploader.destroy(`piums/band-avatars/${match[1]}`);
    } catch {
      // No relanzar — fallo silencioso en limpieza
    }
  }

  /**
   * Sube (o reemplaza) el video presentación de 30s de un artista.
   * Usa resource_type 'video' para obtener `duration` y transcodificar a un mp4
   * canónico (9:16, H.264/AAC, <=30s) reproducible por AVPlayer/ExoPlayer/<video>.
   * public_id estable → un reemplazo sobrescribe el clip anterior (sin media huérfana).
   */
  async uploadStoryVideo(
    buffer: Buffer,
    artistId: string,
  ): Promise<{ secureUrl: string; publicId: string; posterUrl: string; durationMs: number }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'piums/story-videos',
          public_id: `story_${artistId}`,
          overwrite: true,
          invalidate: true,
          eager: [
            {
              width: 720,
              height: 1280,
              crop: 'fill',
              gravity: 'center',
              duration: 30,
              video_codec: 'h264',
              audio_codec: 'aac',
              quality: 'auto',
              format: 'mp4',
            },
          ],
          eager_async: false, // necesitamos la URL derivada de forma síncrona
        },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error('Fallo al subir el video a Cloudinary'));
          }
          // La duración del ORIGINAL — se usa para el rechazo duro de >30s
          const durationSec = result.duration ?? 0;
          const canonicalUrl = result.eager?.[0]?.secure_url ?? result.secure_url;
          const posterUrl = cloudinary.url(result.public_id, {
            resource_type: 'video',
            format: 'jpg',
            secure: true,
            transformation: [
              { width: 720, height: 1280, crop: 'fill', gravity: 'center', start_offset: '0' },
            ],
          });
          resolve({
            secureUrl: canonicalUrl,
            publicId: result.public_id,
            posterUrl,
            durationMs: Math.round(durationSec * 1000),
          });
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * Elimina el video presentación de Cloudinary. Fallo silencioso — la limpieza
   * nunca debe romper el flujo de borrado (mismo patrón que deleteBandAvatar).
   */
  async deleteStoryVideo(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video', invalidate: true });
    } catch {
      // No relanzar — fallo silencioso en limpieza
    }
  }
}

export const cloudinaryProvider = new CloudinaryProvider();
