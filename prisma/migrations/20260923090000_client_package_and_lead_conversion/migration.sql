-- DropForeignKey
ALTER TABLE "ClientService" DROP CONSTRAINT "ClientService_clientId_fkey";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "leadSource" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "packageType" TEXT,
ADD COLUMN     "reminderDaysBefore" INTEGER,
ADD COLUMN     "renewalDate" TIMESTAMP(3),
ADD COLUMN     "renewalPrice" DECIMAL(14,2),
ADD COLUMN     "serviceType" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "convertedClientId" TEXT;

-- DropTable
DROP TABLE "ClientService";

