-- CreateEnum
CREATE TYPE "DealRoomTemplateStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateEnum
CREATE TYPE "DealRoomStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateEnum
CREATE TYPE "DealRoomTheme" AS ENUM ('Light', 'Dark', 'Auto', 'Brand');

-- CreateEnum
CREATE TYPE "DealRoomAccessMode" AS ENUM ('PublicLink', 'Restricted');

-- CreateEnum
CREATE TYPE "DealRoomEventKind" AS ENUM ('View', 'Scan', 'Click', 'WidgetInteraction', 'Download', 'Share', 'ProposalAccepted', 'TaskCompleted', 'SignatureRequested', 'SignatureSigned');

-- CreateEnum
CREATE TYPE "DealRoomTaskStatus" AS ENUM ('Open', 'InProgress', 'Done');

-- CreateEnum
CREATE TYPE "DealRoomApprovalStepStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "DealRoomSignatureStatus" AS ENUM ('Requested', 'Signed', 'Declined');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'Designer';

-- CreateTable
CREATE TABLE "DealRoomTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "status" "DealRoomTemplateStatus" NOT NULL DEFAULT 'Draft',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealRoomTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealRoomTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "sections" JSONB NOT NULL,
    "theme" JSONB NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "changeReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealRoomTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealRoom" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "accessMode" "DealRoomAccessMode" NOT NULL DEFAULT 'PublicLink',
    "accessCode" TEXT,
    "packId" TEXT,
    "itemId" TEXT,
    "leadId" TEXT,
    "sectionOverrides" JSONB,
    "theme" "DealRoomTheme",
    "status" "DealRoomStatus" NOT NULL DEFAULT 'Draft',
    "createdById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealRoomAsset" (
    "id" TEXT NOT NULL,
    "dealRoomId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealRoomAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealRoomEvent" (
    "id" TEXT NOT NULL,
    "dealRoomId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "DealRoomEventKind" NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealRoomEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealRoomTask" (
    "id" TEXT NOT NULL,
    "dealRoomId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "status" "DealRoomTaskStatus" NOT NULL DEFAULT 'Open',
    "assignedToId" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealRoomTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealRoomMessage" (
    "id" TEXT NOT NULL,
    "dealRoomId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealRoomMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealRoomApprovalStep" (
    "id" TEXT NOT NULL,
    "dealRoomId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "DealRoomApprovalStepStatus" NOT NULL DEFAULT 'Pending',
    "approverId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "DealRoomApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealRoomSignatureRequest" (
    "id" TEXT NOT NULL,
    "dealRoomId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "status" "DealRoomSignatureStatus" NOT NULL DEFAULT 'Requested',
    "signedName" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealRoomSignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealRoomTemplate_tenantId_idx" ON "DealRoomTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "DealRoomTemplate_tenantId_status_idx" ON "DealRoomTemplate"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DealRoomTemplateVersion_templateId_isCurrent_idx" ON "DealRoomTemplateVersion"("templateId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "DealRoomTemplateVersion_templateId_version_key" ON "DealRoomTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DealRoom_slug_key" ON "DealRoom"("slug");

-- CreateIndex
CREATE INDEX "DealRoom_tenantId_idx" ON "DealRoom"("tenantId");

-- CreateIndex
CREATE INDEX "DealRoom_tenantId_status_idx" ON "DealRoom"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DealRoom_templateId_idx" ON "DealRoom"("templateId");

-- CreateIndex
CREATE INDEX "DealRoomAsset_dealRoomId_idx" ON "DealRoomAsset"("dealRoomId");

-- CreateIndex
CREATE INDEX "DealRoomEvent_dealRoomId_createdAt_idx" ON "DealRoomEvent"("dealRoomId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DealRoomEvent_dealRoomId_kind_idx" ON "DealRoomEvent"("dealRoomId", "kind");

-- CreateIndex
CREATE INDEX "DealRoomTask_dealRoomId_idx" ON "DealRoomTask"("dealRoomId");

-- CreateIndex
CREATE INDEX "DealRoomMessage_dealRoomId_createdAt_idx" ON "DealRoomMessage"("dealRoomId", "createdAt");

-- CreateIndex
CREATE INDEX "DealRoomApprovalStep_dealRoomId_order_idx" ON "DealRoomApprovalStep"("dealRoomId", "order");

-- CreateIndex
CREATE INDEX "DealRoomSignatureRequest_dealRoomId_idx" ON "DealRoomSignatureRequest"("dealRoomId");

-- AddForeignKey
ALTER TABLE "DealRoomTemplate" ADD CONSTRAINT "DealRoomTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomTemplate" ADD CONSTRAINT "DealRoomTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomTemplateVersion" ADD CONSTRAINT "DealRoomTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DealRoomTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomTemplateVersion" ADD CONSTRAINT "DealRoomTemplateVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomTemplateVersion" ADD CONSTRAINT "DealRoomTemplateVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoom" ADD CONSTRAINT "DealRoom_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoom" ADD CONSTRAINT "DealRoom_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DealRoomTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoom" ADD CONSTRAINT "DealRoom_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "DealRoomTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoom" ADD CONSTRAINT "DealRoom_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoom" ADD CONSTRAINT "DealRoom_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomAsset" ADD CONSTRAINT "DealRoomAsset_dealRoomId_fkey" FOREIGN KEY ("dealRoomId") REFERENCES "DealRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomAsset" ADD CONSTRAINT "DealRoomAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomEvent" ADD CONSTRAINT "DealRoomEvent_dealRoomId_fkey" FOREIGN KEY ("dealRoomId") REFERENCES "DealRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomEvent" ADD CONSTRAINT "DealRoomEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomTask" ADD CONSTRAINT "DealRoomTask_dealRoomId_fkey" FOREIGN KEY ("dealRoomId") REFERENCES "DealRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomTask" ADD CONSTRAINT "DealRoomTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomTask" ADD CONSTRAINT "DealRoomTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomMessage" ADD CONSTRAINT "DealRoomMessage_dealRoomId_fkey" FOREIGN KEY ("dealRoomId") REFERENCES "DealRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomMessage" ADD CONSTRAINT "DealRoomMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomMessage" ADD CONSTRAINT "DealRoomMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomApprovalStep" ADD CONSTRAINT "DealRoomApprovalStep_dealRoomId_fkey" FOREIGN KEY ("dealRoomId") REFERENCES "DealRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomApprovalStep" ADD CONSTRAINT "DealRoomApprovalStep_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomApprovalStep" ADD CONSTRAINT "DealRoomApprovalStep_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomSignatureRequest" ADD CONSTRAINT "DealRoomSignatureRequest_dealRoomId_fkey" FOREIGN KEY ("dealRoomId") REFERENCES "DealRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRoomSignatureRequest" ADD CONSTRAINT "DealRoomSignatureRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
