-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "website" TEXT,
    "packageType" TEXT,
    "renewalPrice" DECIMAL(14,2),
    "renewalDate" TEXT,
    "notes" TEXT,
    "contractFileId" TEXT,
    "contractFileName" TEXT,
    "contractFileType" TEXT,
    "agreementFileId" TEXT,
    "agreementFileName" TEXT,
    "agreementFileType" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_clientName_idx" ON "Client"("clientName");
