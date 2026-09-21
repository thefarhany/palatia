/*
  Warnings:

  - You are about to alter the column `slot` on the `reservations` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE `reservations` MODIFY `slot` VARCHAR(20) NOT NULL;
