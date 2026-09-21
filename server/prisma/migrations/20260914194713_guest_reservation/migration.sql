-- DropForeignKey
ALTER TABLE `reservations` DROP FOREIGN KEY `reservations_userId_fkey`;

-- DropIndex
DROP INDEX `reservations_userId_fkey` ON `reservations`;

-- AlterTable
ALTER TABLE `menu_items` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `name` VARCHAR(100) NULL,
    ADD COLUMN `phone` VARCHAR(30) NULL,
    MODIFY `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

