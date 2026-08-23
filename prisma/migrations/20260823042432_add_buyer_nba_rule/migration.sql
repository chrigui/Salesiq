-- CreateTable
CREATE TABLE "BuyerNbaRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "conditions" JSONB NOT NULL,
    "suggestion" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerNbaRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuyerNbaRule_tenantId_priority_idx" ON "BuyerNbaRule"("tenantId", "priority");

-- AddForeignKey
ALTER TABLE "BuyerNbaRule" ADD CONSTRAINT "BuyerNbaRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
