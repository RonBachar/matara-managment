CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "leadSource" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'חדש',
    "notes" TEXT,
    "convertedClientId" TEXT,
    "agreementFileId" TEXT,
    "agreementFileName" TEXT,
    "agreementFileType" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'לביצוע',
    "priority" TEXT NOT NULL DEFAULT 'בינונית',

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
