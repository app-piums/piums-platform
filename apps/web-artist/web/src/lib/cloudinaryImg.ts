export function cImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.includes('res.cloudinary.com')) {
    return `/api/img?u=${encodeURIComponent(url)}`;
  }
  return url;
}
