import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import type { PrismaClient } from '@prisma/client';
import { authenticate } from '../auth/middleware.js';
import { saveFile, deleteFile } from './storage.js';
import { validateFile } from './validation.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadRouter = Router();

const VALID_ENTITIES = ['npc', 'character', 'location', 'species'] as const;

const MODEL_MAP: Record<string, string> = {
  npc: 'nPC',
  character: 'playerCharacter',
  location: 'location',
  species: 'species',
};

async function getExistingImage(
  prisma: PrismaClient,
  entity: string,
  entityId: string,
): Promise<string | null> {
  const model = MODEL_MAP[entity];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (prisma as any)[model].findUnique({
    where: { id: entityId },
    select: { image: true },
  });
  return record?.image ?? null;
}

async function updateEntityImage(
  prisma: PrismaClient,
  entity: string,
  entityId: string,
  imagePath: string,
): Promise<void> {
  const model = MODEL_MAP[entity];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any)[model].update({
    where: { id: entityId },
    data: { image: imagePath },
  });
}

uploadRouter.post(
  '/upload/:campaignId/:entity/:entityId',
  upload.single('file'),
  async (req, res) => {
    try {
      // 1. Auth
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const prisma = req.app.locals.prisma as PrismaClient;
      const user = await authenticate(token, prisma);
      if (!user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      // 2. Campaign membership check (GM only)
      const campaignId = req.params.campaignId as string;
      const entity = req.params.entity as string;
      const entityId = req.params.entityId as string;
      const member = await prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId, userId: user.id } },
      });
      if (!member || member.role !== 'GM') {
        res.status(403).json({ error: 'Only GMs can upload files' });
        return;
      }

      // 3. Validate entity type
      if (!VALID_ENTITIES.includes(entity as (typeof VALID_ENTITIES)[number])) {
        res.status(400).json({ error: `Invalid entity type: ${entity}` });
        return;
      }

      // 4. Validate file
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }
      const validationError = validateFile(req.file);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      // 5. Delete old file if entity already has an image
      const oldImage = await getExistingImage(prisma, entity, entityId);
      if (oldImage && oldImage.startsWith('/uploads/')) {
        await deleteFile(oldImage);
      }

      // 6. Save new file
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const relativePath = await saveFile(campaignId, entity, entityId, req.file.buffer, ext);

      // 7. Update DB record
      await updateEntityImage(prisma, entity, entityId, relativePath);

      res.json({ path: relativePath });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  },
);
