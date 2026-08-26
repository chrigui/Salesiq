-- CreateEnum
CREATE TYPE "RecapStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateEnum
CREATE TYPE "RecapEventKind" AS ENUM ('View', 'PropertyView', 'GalleryView', 'FloorPlanView', 'PaymentView', 'InvestmentView', 'ComparisonView', 'Favorite', 'Unfavorite', 'ContactClick', 'ShareClick', 'QrScan', 'LinkOpen');

-- CreateTable
CREATE TABLE "Recap" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RecapStatus" NOT NULL DEFAULT 'Draft',
    "packId" TEXT NOT NULL,
    "buyerProfileId" TEXT,
    "createdById" TEXT,
    "customerNameSnapshot" TEXT,
    "customerStory" JSONB NOT NULL,
    "requirementsSnapshot" JSONB NOT NULL,
    "shortlistedProperties" JSONB NOT NULL,
    "comparedProperties" JSONB,
    "finalRecommendationItemId" TEXT,
    "salespersonMessage" JSONB,
    "nextSteps" JSONB,
    "sectionVisibility" JSONB NOT NULL,
    "privateNotes" TEXT,
    "brandProfileId" TEXT,
    "brandSnapshot" JSONB,
    "lastViewedSnapshot" JSONB,
    "expiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecapEvent" (
    "id" TEXT NOT NULL,
    "recapId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "RecapEventKind" NOT NULL,
    "itemId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecapEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recap_code_key" ON "Recap"("code");

-- CreateIndex
CREATE INDEX "Recap_tenantId_idx" ON "Recap"("tenantId");

-- CreateIndex
CREATE INDEX "Recap_tenantId_createdAt_idx" ON "Recap"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Recap_buyerProfileId_idx" ON "Recap"("buyerProfileId");

-- CreateIndex
CREATE INDEX "RecapEvent_recapId_createdAt_idx" ON "RecapEvent"("recapId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RecapEvent_recapId_kind_idx" ON "RecapEvent"("recapId", "kind");

-- AddForeignKey
ALTER TABLE "Recap" ADD CONSTRAINT "Recap_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recap" ADD CONSTRAINT "Recap_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recap" ADD CONSTRAINT "Recap_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recap" ADD CONSTRAINT "Recap_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecapEvent" ADD CONSTRAINT "RecapEvent_recapId_fkey" FOREIGN KEY ("recapId") REFERENCES "Recap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecapEvent" ADD CONSTRAINT "RecapEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
