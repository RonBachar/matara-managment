ALTER TABLE "Client"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Active';

CREATE TABLE "ClientService" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "billingCycle" TEXT,
    "renewalPrice" DECIMAL(14,2),
    "renewalDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,

    CONSTRAINT "ClientService_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientService_clientId_idx" ON "ClientService"("clientId");
CREATE INDEX "ClientService_type_idx" ON "ClientService"("type");

ALTER TABLE "ClientService"
ADD CONSTRAINT "ClientService_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
