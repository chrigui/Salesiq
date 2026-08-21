-- CreateEnum
CREATE TYPE "SharedExperienceEventKind" AS ENUM ('View', 'ItemClick', 'ProposalView');

-- CreateTable
CREATE TABLE "SharedExperience" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "itemIds" JSONB NOT NULL,
    "focusedItemId" TEXT,
    "proposalText" TEXT,
    "proposalEngine" TEXT,
    "customerName" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "SharedExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedExperienceEvent" (
    "id" TEXT NOT NULL,
    "sharedExperienceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "SharedExperienceEventKind" NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedExperienceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedExperience_code_key" ON "SharedExperience"("code");

-- CreateIndex
CREATE INDEX "SharedExperience_tenantId_idx" ON "SharedExperience"("tenantId");

-- CreateIndex
CREATE INDEX "SharedExperience_tenantId_createdAt_idx" ON "SharedExperience"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SharedExperienceEvent_sharedExperienceId_createdAt_idx" ON "SharedExperienceEvent"("sharedExperienceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SharedExperienceEvent_sharedExperienceId_kind_idx" ON "SharedExperienceEvent"("sharedExperienceId", "kind");

-- AddForeignKey
ALTER TABLE "SharedExperience" ADD CONSTRAINT "SharedExperience_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExperience" ADD CONSTRAINT "SharedExperience_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExperienceEvent" ADD CONSTRAINT "SharedExperienceEvent_sharedExperienceId_fkey" FOREIGN KEY ("sharedExperienceId") REFERENCES "SharedExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExperienceEvent" ADD CONSTRAINT "SharedExperienceEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
