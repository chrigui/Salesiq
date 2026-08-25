-- CreateEnum
CREATE TYPE "BrandHeadingWeight" AS ENUM ('Regular', 'Medium', 'Semibold', 'Bold');

-- CreateEnum
CREATE TYPE "BrandLetterSpacing" AS ENUM ('Tight', 'Normal', 'Wide');

-- AlterTable
ALTER TABLE "BrandProfile" ADD COLUMN     "dangerColor" TEXT,
ADD COLUMN     "headingWeight" "BrandHeadingWeight" NOT NULL DEFAULT 'Semibold',
ADD COLUMN     "letterSpacing" "BrandLetterSpacing" NOT NULL DEFAULT 'Normal',
ADD COLUMN     "mutedTextColor" TEXT,
ADD COLUMN     "successColor" TEXT,
ADD COLUMN     "surfaceColor" TEXT,
ADD COLUMN     "warningColor" TEXT;
