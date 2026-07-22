-- Coordonnées des propositions de lieux (pour renseigner EventLocation au choix final)
ALTER TABLE "event_place_proposals" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "event_place_proposals" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
