-- AlterTable
ALTER TABLE "DisplayProfile" ADD COLUMN     "brandProfileId" TEXT;

-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "brandSoft" TEXT,
    "logoGlyph" TEXT,
    "fontHeading" TEXT,
    "fontBody" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayProfileAsset" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisplayProfileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandProfile_tenantId_idx" ON "BrandProfile"("tenantId");

-- CreateIndex
CREATE INDEX "DisplayProfileAsset_profileId_idx" ON "DisplayProfileAsset"("profileId");

-- AddForeignKey
ALTER TABLE "DisplayProfile" ADD CONSTRAINT "DisplayProfile_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayProfileAsset" ADD CONSTRAINT "DisplayProfileAsset_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "DisplayProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayProfileAsset" ADD CONSTRAINT "DisplayProfileAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
