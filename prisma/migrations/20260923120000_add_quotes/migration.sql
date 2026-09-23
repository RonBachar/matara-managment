-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "amount" DECIMAL(14,2),
    "status" TEXT NOT NULL DEFAULT 'נשלחה',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),
    "signerName" TEXT,
    "signerEmail" TEXT,
    "signatureUrl" TEXT,
    "signedCopyUrl" TEXT,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_slug_key" ON "Quote"("slug");

-- CreateIndex
CREATE INDEX "Quote_userId_idx" ON "Quote"("userId");

-- CreateIndex
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
