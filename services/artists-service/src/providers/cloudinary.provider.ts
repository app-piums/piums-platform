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
}

export const cloudinaryProvider = new CloudinaryProvider();
