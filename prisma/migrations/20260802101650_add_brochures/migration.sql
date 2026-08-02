-- CreateEnum
CREATE TYPE "BrochureTemplate" AS ENUM ('Modern', 'Luxury', 'Minimal');

-- CreateEnum
CREATE TYPE "BrochureTheme" AS ENUM ('Light', 'Dark', 'Auto', 'Brand');

-- CreateEnum
CREATE TYPE "BrochureStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateEnum
CREATE TYPE "BrochureEventKind" AS ENUM ('View', 'Scan', 'Click', 'LeadSubmitted');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "brochureId" TEXT;

-- CreateTable
CREATE TABLE "Brochure" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "template" "BrochureTemplate" NOT NULL DEFAULT 'Modern',
    "theme" "BrochureTheme" NOT NULL DEFAULT 'Light',
    "sections" JSONB NOT NULL,
    "brandingOverrides" JSONB,
    "status" "BrochureStatus" NOT NULL DEFAULT 'Draft',
    "createdById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brochure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrochureAsset" (
    "id" TEXT NOT NULL,
    "brochureId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrochureAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrochureEvent" (
    "id" TEXT NOT NULL,
    "brochureId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "BrochureEventKind" NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrochureEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brochure_slug_key" ON "Brochure"("slug");

-- CreateIndex
CREATE INDEX "Brochure_tenantId_idx" ON "Brochure"("tenantId");

-- CreateIndex
CREATE INDEX "Brochure_tenantId_status_idx" ON "Brochure"("tenantId", "status");

-- CreateIndex
CREATE INDEX "BrochureAsset_brochureId_idx" ON "BrochureAsset"("brochureId");

-- CreateIndex
CREATE INDEX "BrochureEvent_brochureId_createdAt_idx" ON "BrochureEvent"("brochureId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BrochureEvent_brochureId_kind_idx" ON "BrochureEvent"("brochureId", "kind");

-- AddForeignKey
ALTER TABLE "Brochure" ADD CONSTRAINT "Brochure_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brochure" ADD CONSTRAINT "Brochure_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrochureAsset" ADD CONSTRAINT "BrochureAsset_brochureId_fkey" FOREIGN KEY ("brochureId") REFERENCES "Brochure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrochureAsset" ADD CONSTRAINT "BrochureAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrochureEvent" ADD CONSTRAINT "BrochureEvent_brochureId_fkey" FOREIGN KEY ("brochureId") REFERENCES "Brochure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrochureEvent" ADD CONSTRAINT "BrochureEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
