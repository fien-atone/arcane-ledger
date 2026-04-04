-- AlterTable
ALTER TABLE "NPCGroupMembership" ADD COLUMN     "playerVisible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "NPCLocationPresence" ADD COLUMN     "playerVisible" BOOLEAN NOT NULL DEFAULT false;
