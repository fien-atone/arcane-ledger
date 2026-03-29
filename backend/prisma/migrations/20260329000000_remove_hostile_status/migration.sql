-- Update any existing HOSTILE NPCs to ALIVE before removing the enum value
UPDATE "NPC" SET status = 'ALIVE' WHERE status = 'HOSTILE';

-- Remove HOSTILE from NPCStatus enum
CREATE TYPE "NPCStatus_new" AS ENUM ('ALIVE', 'DEAD', 'MISSING', 'UNKNOWN');
ALTER TABLE "NPC" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "NPC" ALTER COLUMN status TYPE "NPCStatus_new" USING (status::text::"NPCStatus_new");
ALTER TABLE "NPC" ALTER COLUMN status SET DEFAULT 'ALIVE'::"NPCStatus_new";
DROP TYPE "NPCStatus";
ALTER TYPE "NPCStatus_new" RENAME TO "NPCStatus";
