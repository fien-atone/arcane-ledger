-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "playerVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playerVisibleFields" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "NPC" ADD COLUMN     "playerVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playerVisibleFields" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "playerVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playerVisibleFields" TEXT[] DEFAULT ARRAY[]::TEXT[];
