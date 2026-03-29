-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "enabledSections" TEXT[] DEFAULT ARRAY[]::TEXT[];
