-- CreateTable
CREATE TABLE "BuyerSegment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuyerSegment_tenantId_idx" ON "BuyerSegment"("tenantId");

-- AddForeignKey
ALTER TABLE "BuyerSegment" ADD CONSTRAINT "BuyerSegment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerSegment" ADD CONSTRAINT "BuyerSegment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
