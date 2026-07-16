UPDATE "WorkOrder" SET "priority" = 'HIGH' WHERE "priority" = 'URGENT';
UPDATE "WorkOrder" SET "priority" = 'HIGH' WHERE "priority" = 'DARURAT';
UPDATE "WorkOrder" SET "priority" = 'MEDIUM' WHERE "priority" = 'HIGH';
UPDATE "WorkOrder" SET "priority" = 'MEDIUM' WHERE "priority" = 'PROSES_BERHENTI';
UPDATE "WorkOrder" SET "priority" = 'LOW' WHERE "priority" = 'MEDIUM';
UPDATE "WorkOrder" SET "priority" = 'LOW' WHERE "priority" = 'LOW';
UPDATE "WorkOrder" SET "priority" = 'LOW' WHERE "priority" = 'PROSES_BERJALAN';
