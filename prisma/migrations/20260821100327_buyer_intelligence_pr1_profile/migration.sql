-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "buyerProfileId" TEXT;

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "emailNormalized" TEXT,
    "phoneNormalized" TEXT,
    "preferredLanguage" TEXT,
    "market" TEXT,
    "leadSource" TEXT NOT NULL DEFAULT '',
    "assignedToId" TEXT,
    "requirements" JSONB,
    "financial" JSONB,
    "purposes" TEXT[],
    "motivations" JSONB,
    "priorities" JSONB,
    "preferences" JSONB,
    "intentLevel" TEXT,
    "intentReasons" JSONB,
    "intentUpdatedAt" TIMESTAMP(3),
    "purchaseReadiness" TEXT,
    "purchaseReadinessConfidence" INTEGER,
    "purchaseReadinessSignals" JSONB,
    "lastInteractionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerRequirementChange" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerRequirementChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerObjection" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerObjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerRejectedItem" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "overriddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerRejectedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerItemRelationship" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerItemRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerConversationNote" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "extracted" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "confirmedFields" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerConversationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerActivityEvent" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "packId" TEXT,
    "itemId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuyerProfile_tenantId_idx" ON "BuyerProfile"("tenantId");

-- CreateIndex
CREATE INDEX "BuyerProfile_tenantId_emailNormalized_idx" ON "BuyerProfile"("tenantId", "emailNormalized");

-- CreateIndex
CREATE INDEX "BuyerProfile_tenantId_phoneNormalized_idx" ON "BuyerProfile"("tenantId", "phoneNormalized");

-- CreateIndex
CREATE INDEX "BuyerProfile_tenantId_branchId_idx" ON "BuyerProfile"("tenantId", "branchId");

-- CreateIndex
CREATE INDEX "BuyerProfile_tenantId_assignedToId_idx" ON "BuyerProfile"("tenantId", "assignedToId");

-- CreateIndex
CREATE INDEX "BuyerRequirementChange_buyerProfileId_createdAt_idx" ON "BuyerRequirementChange"("buyerProfileId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BuyerObjection_buyerProfileId_createdAt_idx" ON "BuyerObjection"("buyerProfileId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "BuyerRejectedItem_buyerProfileId_packId_itemId_key" ON "BuyerRejectedItem"("buyerProfileId", "packId", "itemId");

-- CreateIndex
CREATE INDEX "BuyerItemRelationship_buyerProfileId_packId_itemId_idx" ON "BuyerItemRelationship"("buyerProfileId", "packId", "itemId");

-- CreateIndex
CREATE INDEX "BuyerItemRelationship_buyerProfileId_createdAt_idx" ON "BuyerItemRelationship"("buyerProfileId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BuyerConversationNote_buyerProfileId_createdAt_idx" ON "BuyerConversationNote"("buyerProfileId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BuyerActivityEvent_buyerProfileId_createdAt_idx" ON "BuyerActivityEvent"("buyerProfileId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BuyerActivityEvent_buyerProfileId_kind_idx" ON "BuyerActivityEvent"("buyerProfileId", "kind");

-- CreateIndex
CREATE INDEX "Lead_tenantId_buyerProfileId_idx" ON "Lead"("tenantId", "buyerProfileId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerRequirementChange" ADD CONSTRAINT "BuyerRequirementChange_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerRequirementChange" ADD CONSTRAINT "BuyerRequirementChange_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerObjection" ADD CONSTRAINT "BuyerObjection_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerObjection" ADD CONSTRAINT "BuyerObjection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerRejectedItem" ADD CONSTRAINT "BuyerRejectedItem_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerRejectedItem" ADD CONSTRAINT "BuyerRejectedItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerItemRelationship" ADD CONSTRAINT "BuyerItemRelationship_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerItemRelationship" ADD CONSTRAINT "BuyerItemRelationship_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerConversationNote" ADD CONSTRAINT "BuyerConversationNote_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerConversationNote" ADD CONSTRAINT "BuyerConversationNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerConversationNote" ADD CONSTRAINT "BuyerConversationNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerActivityEvent" ADD CONSTRAINT "BuyerActivityEvent_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerActivityEvent" ADD CONSTRAINT "BuyerActivityEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
