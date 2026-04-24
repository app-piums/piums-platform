/**
 * Transforms a Cloudinary URL to go through the internal image proxy (/api/img).
 * This avoids ad-blocker blocks on res.cloudinary.com and the Next.js
 * remotePatterns requirement for /_next/image.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.includes('res.cloudinary.com')) {
    return `/api/img?u=${encodeURIComponent(url)}`;
  }
  return url;
}
