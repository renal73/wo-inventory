/*
  Warnings:

  - The values [DARURAT,PROSES_BERHENTI,PROSES_BERJALAN] on the enum `Priority` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TechnicianSpec" AS ENUM ('MACHINERY', 'UTILITY_FACILITY');

-- AlterEnum
BEGIN;
CREATE TYPE "Priority_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
ALTER TABLE "public"."WorkOrder" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "WorkOrder" ALTER COLUMN "priority" TYPE "Priority_new" USING ("priority"::text::"Priority_new");
ALTER TYPE "Priority" RENAME TO "Priority_old";
ALTER TYPE "Priority_new" RENAME TO "Priority";
DROP TYPE "public"."Priority_old";
ALTER TABLE "WorkOrder" ALTER COLUMN "priority" SET DEFAULT 'LOW';
COMMIT;

-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "airPressureValue" DOUBLE PRECISION,
ADD COLUMN     "machineType" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "powerWatt" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "specialization" "TechnicianSpec";

-- AlterTable
ALTER TABLE "WorkOrder" ALTER COLUMN "priority" SET DEFAULT 'LOW';

-- CreateTable
CREATE TABLE "WorkOrderPart" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "qtyTaken" INTEGER NOT NULL,
    "takenById" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationNotes" TEXT NOT NULL,

    CONSTRAINT "WorkOrderPart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderPart_workOrderId_idx" ON "WorkOrderPart"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderPart_takenById_idx" ON "WorkOrderPart"("takenById");

-- CreateIndex
CREATE INDEX "WorkOrderPart_takenAt_idx" ON "WorkOrderPart"("takenAt");

-- AddForeignKey
ALTER TABLE "WorkOrderPart" ADD CONSTRAINT "WorkOrderPart_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderPart" ADD CONSTRAINT "WorkOrderPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderPart" ADD CONSTRAINT "WorkOrderPart_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
