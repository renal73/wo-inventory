-- CreateEnum
CREATE TYPE "Classification" AS ENUM ('ELECTRIC', 'MECHANIC', 'SIPIL', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('DARURAT', 'PROSES_BERHENTI', 'PROSES_BERJALAN');

-- CreateEnum
CREATE TYPE "WoStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "WoCategory" AS ENUM ('PERBAIKAN', 'PEMBUATAN', 'INSTALASI', 'MODIFIKASI', 'KESELAMATAN');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('MACHINERY', 'UTILITY', 'FACILITY_BUILDING');

-- CreateEnum
CREATE TYPE "PmFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PmStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'TECHNICIAN';
ALTER TYPE "Role" ADD VALUE 'OPERATOR';
ALTER TYPE "Role" ADD VALUE 'QC_ANALYST';

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "woNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" "WoCategory" NOT NULL DEFAULT 'PERBAIKAN',
    "classification" "Classification",
    "jobCategory" "JobCategory",
    "priority" "Priority" NOT NULL DEFAULT 'PROSES_BERJALAN',
    "status" "WoStatus" NOT NULL DEFAULT 'OPEN',
    "assignedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "requestedById" TEXT,
    "assignedToIds" TEXT[],
    "assignedNames" TEXT[],
    "attachments" TEXT[],
    "completionAttachments" TEXT[],
    "adminNotes" TEXT,
    "techNotes" TEXT,
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WoUpdate" (
    "id" TEXT NOT NULL,
    "woId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "note" TEXT,
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WoUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "description" TEXT,
    "classification" "Classification" NOT NULL,
    "frequency" "PmFrequency" NOT NULL,
    "estimatedDuration" INTEGER,
    "defaultTechId" TEXT,
    "checklistItems" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PmTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmSchedule" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "assignedToId" TEXT,
    "status" "PmStatus" NOT NULL DEFAULT 'PENDING',
    "checklistData" TEXT,
    "technicianNotes" TEXT,
    "attachments" TEXT[],
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PmSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_woNumber_key" ON "WorkOrder"("woNumber");

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WoUpdate" ADD CONSTRAINT "WoUpdate_woId_fkey" FOREIGN KEY ("woId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WoUpdate" ADD CONSTRAINT "WoUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmTemplate" ADD CONSTRAINT "PmTemplate_defaultTechId_fkey" FOREIGN KEY ("defaultTechId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmTemplate" ADD CONSTRAINT "PmTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmSchedule" ADD CONSTRAINT "PmSchedule_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmSchedule" ADD CONSTRAINT "PmSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PmTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
