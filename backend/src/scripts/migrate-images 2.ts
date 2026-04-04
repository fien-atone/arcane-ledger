/**
 * One-time migration script: converts base64 image data stored in the DB
 * to files on disk, updating the DB with relative file paths.
 *
 * Usage:
 *   npx tsx src/scripts/migrate-images.ts
 */

import { PrismaClient } from '@prisma/client';
import { saveFile } from '../upload/storage.js';

const prisma = new PrismaClient();

interface EntityConfig {
  label: string;
  model: string;
  campaignIdField: string;
  entityPrefix: string;
}

const ENTITIES: EntityConfig[] = [
  { label: 'NPC', model: 'nPC', campaignIdField: 'campaignId', entityPrefix: 'npc' },
  { label: 'PlayerCharacter', model: 'playerCharacter', campaignIdField: 'campaignId', entityPrefix: 'character' },
  { label: 'Location', model: 'location', campaignIdField: 'campaignId', entityPrefix: 'location' },
  { label: 'Species', model: 'species', campaignIdField: 'campaignId', entityPrefix: 'species' },
];

function detectExtension(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/(\w+);/);
  if (!match) return '.jpg';
  const mime = match[1];
  const map: Record<string, string> = {
    jpeg: '.jpg',
    jpg: '.jpg',
    png: '.png',
    webp: '.webp',
    gif: '.gif',
  };
  return map[mime] || '.jpg';
}

function decodeBase64(dataUrl: string): Buffer {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

async function migrateEntity(config: EntityConfig): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records = await (prisma as any)[config.model].findMany({
    where: {
      image: { startsWith: 'data:' },
    },
    select: {
      id: true,
      image: true,
      [config.campaignIdField]: true,
    },
  });

  console.log(`  Found ${records.length} ${config.label} records with base64 images`);

  let migrated = 0;
  for (const record of records) {
    try {
      const ext = detectExtension(record.image);
      const buffer = decodeBase64(record.image);
      const campaignId = record[config.campaignIdField] as string;

      const relativePath = await saveFile(
        campaignId,
        config.entityPrefix,
        record.id as string,
        buffer,
        ext,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any)[config.model].update({
        where: { id: record.id },
        data: { image: relativePath },
      });

      migrated++;
      console.log(`    Migrated ${config.label} ${record.id} -> ${relativePath}`);
    } catch (err) {
      console.error(`    Failed to migrate ${config.label} ${record.id}:`, err);
    }
  }

  return migrated;
}

async function main() {
  console.log('Starting base64 -> file migration...\n');

  let totalMigrated = 0;

  for (const entity of ENTITIES) {
    console.log(`Processing ${entity.label}...`);
    const count = await migrateEntity(entity);
    totalMigrated += count;
    console.log(`  Migrated ${count} ${entity.label} records\n`);
  }

  console.log(`Done! Total records migrated: ${totalMigrated}`);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
