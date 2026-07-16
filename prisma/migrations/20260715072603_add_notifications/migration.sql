-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WO_CREATED', 'WO_ASSIGNED', 'WO_STATUS_CHANGED', 'WO_COMPLETED', 'INBOUND', 'OUTBOUND', 'STOCK_LOW', 'TOOL_BORROWED', 'TOOL_RETURNED', 'PM_DUE');

-- CreateEnum
CREATE TYPE "NotificationReferenceType" AS ENUM ('WORK_ORDER', 'PART', 'TOOL', 'PM_SCHEDULE');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "referenceId" TEXT,
    "referenceType" "NotificationReferenceType",
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
