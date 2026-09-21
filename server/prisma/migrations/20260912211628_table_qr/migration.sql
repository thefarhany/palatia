-- AlterTable
ALTER TABLE `tables` ADD COLUMN `qrToken` VARCHAR(32) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `tables_qrToken_key` ON `tables`(`qrToken`);

