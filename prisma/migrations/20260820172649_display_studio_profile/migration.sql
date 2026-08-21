-- CreateEnum
CREATE TYPE "DisplayTemplate" AS ENUM ('Minimal', 'NewDevelopment', 'Detailed', 'Lifestyle', 'Investment', 'LuxuryCinematic', 'Masterplan', 'Custom');

-- CreateEnum
CREATE TYPE "DisplayProfileStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateTable
CREATE TABLE "DisplayProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "template" "DisplayTemplate" NOT NULL DEFAULT 'Minimal',
    "brandOverrides" JSONB,
    "sections" JSONB NOT NULL,
    "motion" JSONB NOT NULL DEFAULT '{"preset": "Cinematic"}',
    "idle" JSONB,
    "status" "DisplayProfileStatus" NOT NULL DEFAULT 'Draft',
    "createdById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisplayProfile_tenantId_idx" ON "DisplayProfile"("tenantId");

-- CreateIndex
CREATE INDEX "DisplayProfile_tenantId_status_idx" ON "DisplayProfile"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DisplayProfile_tenantId_packId_itemId_idx" ON "DisplayProfile"("tenantId", "packId", "itemId");

-- AddForeignKey
ALTER TABLE "DisplayProfile" ADD CONSTRAINT "DisplayProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayProfile" ADD CONSTRAINT "DisplayProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
