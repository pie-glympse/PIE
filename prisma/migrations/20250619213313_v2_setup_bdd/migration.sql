/*
  Warnings:

  - The primary key for the `EventLocation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `mapsId` on the `EventLocation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId]` on the table `EventLocation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `EventLocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `EventLocation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EventLocation" DROP CONSTRAINT "EventLocation_mapsId_fkey";

-- AlterTable
CREATE SEQUENCE event_id_seq;
ALTER TABLE "Event" ALTER COLUMN "id" SET DEFAULT nextval('event_id_seq');
ALTER SEQUENCE event_id_seq OWNED BY "Event"."id";

-- AlterTable
ALTER TABLE "EventLocation" DROP CONSTRAINT "EventLocation_pkey",
DROP COLUMN "mapsId",
ADD COLUMN     "eventId" BIGINT NOT NULL,
ADD COLUMN     "id" BIGINT NOT NULL,
ADD CONSTRAINT "EventLocation_pkey" PRIMARY KEY ("id");

-- AlterTable
CREATE SEQUENCE eventsusersphoto_id_seq;
ALTER TABLE "EventsUsersPhoto" ALTER COLUMN "id" SET DEFAULT nextval('eventsusersphoto_id_seq');
ALTER SEQUENCE eventsusersphoto_id_seq OWNED BY "EventsUsersPhoto"."id";

-- AlterTable
CREATE SEQUENCE user_id_seq;
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq');
ALTER SEQUENCE user_id_seq OWNED BY "User"."id";

-- CreateIndex
CREATE UNIQUE INDEX "EventLocation_eventId_key" ON "EventLocation"("eventId");

-- AddForeignKey
ALTER TABLE "EventLocation" ADD CONSTRAINT "EventLocation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
