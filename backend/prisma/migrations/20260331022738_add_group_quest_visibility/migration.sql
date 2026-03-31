-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "playerVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playerVisibleFields" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "playerVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playerVisibleFields" TEXT[] DEFAULT ARRAY[]::TEXT[];
