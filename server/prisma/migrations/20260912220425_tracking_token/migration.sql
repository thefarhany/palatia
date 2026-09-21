-- AlterTable
ALTER TABLE `orders` ADD COLUMN `trackingToken` VARCHAR(32) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `orders_trackingToken_key` ON `orders`(`trackingToken`);

