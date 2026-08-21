-- CreateEnum
CREATE TYPE "DisplayStatus" AS ENUM ('Pending', 'Active', 'Archived');

-- CreateTable
CREATE TABLE "Display" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "pairingCode" TEXT NOT NULL,
    "deviceToken" TEXT,
    "idleProfileId" TEXT,
    "liveProfileId" TEXT,
    "status" "DisplayStatus" NOT NULL DEFAULT 'Pending',
    "lastSeenAt" TIMESTAMP(3),
    "lastSeenVersion" INTEGER,
    "userAgent" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Display_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Display_pairingCode_key" ON "Display"("pairingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Display_deviceToken_key" ON "Display"("deviceToken");

-- CreateIndex
CREATE INDEX "Display_tenantId_idx" ON "Display"("tenantId");

-- CreateIndex
CREATE INDEX "Display_tenantId_status_idx" ON "Display"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "Display" ADD CONSTRAINT "Display_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Display" ADD CONSTRAINT "Display_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Display" ADD CONSTRAINT "Display_idleProfileId_fkey" FOREIGN KEY ("idleProfileId") REFERENCES "DisplayProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Display" ADD CONSTRAINT "Display_liveProfileId_fkey" FOREIGN KEY ("liveProfileId") REFERENCES "DisplayProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Display" ADD CONSTRAINT "Display_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
