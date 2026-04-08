/*
  Warnings:

  - A unique constraint covering the columns `[customDomain]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "domainVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_customDomain_key" ON "users"("customDomain");

-- CreateIndex
CREATE INDEX "users_customDomain_idx" ON "users"("customDomain");
