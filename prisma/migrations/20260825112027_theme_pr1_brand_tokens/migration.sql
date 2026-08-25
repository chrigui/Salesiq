-- CreateEnum
CREATE TYPE "BrandCardStyle" AS ENUM ('Glass', 'Solid', 'Outlined');

-- CreateEnum
CREATE TYPE "BrandButtonStyle" AS ENUM ('Filled', 'Outline', 'Ghost');

-- CreateEnum
CREATE TYPE "BrandBorderRadius" AS ENUM ('Sharp', 'Soft', 'Round');

-- CreateEnum
CREATE TYPE "BrandShadowIntensity" AS ENUM ('Flat', 'Subtle', 'Elevated');

-- CreateEnum
CREATE TYPE "BrandSpacingScale" AS ENUM ('Compact', 'Comfortable', 'Spacious');

-- AlterTable
ALTER TABLE "BrandProfile" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "borderRadius" "BrandBorderRadius" NOT NULL DEFAULT 'Soft',
ADD COLUMN     "buttonStyle" "BrandButtonStyle" NOT NULL DEFAULT 'Filled',
ADD COLUMN     "cardStyle" "BrandCardStyle" NOT NULL DEFAULT 'Glass',
ADD COLUMN     "defaultMotionPreset" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shadowIntensity" "BrandShadowIntensity" NOT NULL DEFAULT 'Elevated',
ADD COLUMN     "spacingScale" "BrandSpacingScale" NOT NULL DEFAULT 'Comfortable',
ADD COLUMN     "textColor" TEXT;
