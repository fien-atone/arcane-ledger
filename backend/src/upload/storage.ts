import fs from 'fs/promises';
import path from 'path';

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

export async function saveFile(
  campaignId: string,
  entity: string,
  entityId: string,
  buffer: Buffer,
  ext: string,
): Promise<string> {
  const dir = path.join(UPLOADS_ROOT, 'campaign', campaignId, entity);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${entityId}${ext}`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);
  return `/uploads/campaign/${campaignId}/${entity}/${filename}`;
}

export async function deleteFile(relativePath: string): Promise<void> {
  const filePath = path.join(UPLOADS_ROOT, relativePath.replace(/^\/uploads\//, ''));
  try {
    await fs.unlink(filePath);
  } catch {
    /* file may not exist */
  }
}
