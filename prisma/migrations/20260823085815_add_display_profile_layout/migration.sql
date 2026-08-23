-- CreateEnum
CREATE TYPE "DisplayProfileLayout" AS ENUM ('Stack', 'Grid');

-- AlterEnum
ALTER TYPE "DisplayTemplate" ADD VALUE 'Dashboard';

-- AlterTable
ALTER TABLE "DisplayProfile" ADD COLUMN     "layout" "DisplayProfileLayout" NOT NULL DEFAULT 'Stack';
