-- CreateEnum
CREATE TYPE "DisplayDefaultExperience" AS ENUM ('Welcome', 'PropertyHero', 'CustomIntro');

-- AlterTable
ALTER TABLE "Display" ADD COLUMN     "defaultExperience" "DisplayDefaultExperience" NOT NULL DEFAULT 'Welcome';
