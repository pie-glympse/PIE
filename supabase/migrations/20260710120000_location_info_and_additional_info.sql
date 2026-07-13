-- Point 1 : card d'info sur le lieu choisi (site web, note) + point 3 : infos complémentaires
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "additional_info" TEXT NOT NULL DEFAULT '';

ALTER TABLE "EventLocation" ADD COLUMN IF NOT EXISTS "website_url" TEXT;
ALTER TABLE "EventLocation" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION;
ALTER TABLE "EventLocation" ADD COLUMN IF NOT EXISTS "user_ratings_total" INTEGER;
