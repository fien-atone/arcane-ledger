-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('ADMIN', 'USER');

-- AlterEnum: rename Role to CampaignRole
ALTER TYPE "Role" RENAME TO "CampaignRole";

-- AlterTable: add role column to User with default USER
ALTER TABLE "User" ADD COLUMN "role" "SystemRole" NOT NULL DEFAULT 'USER';
