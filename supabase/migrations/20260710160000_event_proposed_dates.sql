-- Dates proposées (potentiellement non consécutives) parmi lesquelles les
-- participants votent. startDate/endDate restent le min/max (compat existant).
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "proposed_dates" TEXT[] NOT NULL DEFAULT '{}';
