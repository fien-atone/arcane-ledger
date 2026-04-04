const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateFile(file: Express.Multer.File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 5MB.`;
  }
  return null;
}
