-- CreateEnum
CREATE TYPE "BookTier" AS ENUM ('standard', 'premium');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN "tier" "BookTier" NOT NULL DEFAULT 'standard';
