/*
  Warnings:

  - Added the required column `userId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ProjectBrief` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'legacy';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'legacy';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'legacy';

-- AlterTable
ALTER TABLE "ProjectBrief" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'legacy';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'legacy';

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "ProjectBrief_userId_idx" ON "ProjectBrief"("userId");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "userId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "userId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "userId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProjectBrief" ALTER COLUMN "userId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "userId" DROP DEFAULT;
