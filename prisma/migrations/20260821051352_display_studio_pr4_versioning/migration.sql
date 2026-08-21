-- CreateTable
CREATE TABLE "DisplayProfileVersion" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "sections" JSONB NOT NULL,
    "motion" JSONB NOT NULL,
    "idle" JSONB,
    "brandSnapshot" JSONB,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "changeReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisplayProfileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisplayProfileVersion_profileId_isCurrent_idx" ON "DisplayProfileVersion"("profileId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayProfileVersion_profileId_version_key" ON "DisplayProfileVersion"("profileId", "version");

-- AddForeignKey
ALTER TABLE "DisplayProfileVersion" ADD CONSTRAINT "DisplayProfileVersion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "DisplayProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayProfileVersion" ADD CONSTRAINT "DisplayProfileVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayProfileVersion" ADD CONSTRAINT "DisplayProfileVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
