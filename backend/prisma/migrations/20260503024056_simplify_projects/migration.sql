/*
  Warnings:

  - You are about to drop the column `billableTotal` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectType` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `remainingAmount` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `workedHours` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "billableTotal",
DROP COLUMN "hourlyRate",
DROP COLUMN "projectType",
DROP COLUMN "remainingAmount",
DROP COLUMN "workedHours",
ALTER COLUMN "status" SET DEFAULT 'התחיל';
