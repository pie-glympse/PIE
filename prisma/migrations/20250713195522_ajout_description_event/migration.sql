/*
  Warnings:

  - You are about to drop the column `date` on the `Event` table. All the data in the column will be lost.
  - Made the column `title` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "date",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "maxDistance" DOUBLE PRECISION,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3),
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "state" SET DEFAULT 'PENDING',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
