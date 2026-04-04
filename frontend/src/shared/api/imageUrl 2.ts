const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql';
const API_BASE = GRAPHQL_URL.replace(/\/graphql$/, '');

export function resolveImageUrl(image: string | undefined | null, cacheBust?: number): string | undefined {
  if (!image) return undefined;
  if (image.startsWith('data:')) return image;   // legacy base64
  if (image.startsWith('http')) return image;     // absolute URL (future S3)
  const url = `${API_BASE}${image}`;
  return cacheBust ? `${url}?v=${cacheBust}` : url;
}
