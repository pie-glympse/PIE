-- Remaster générateur d'événements — fondations (strictement additif).
-- Catégories, questionnaires pondérés, réponses, lieu réel, propositions de lieux.
-- Ne touche à aucune table/colonne existante (compatible avec les tables
-- google_tag_groups / google_tag_sub_groups déjà présentes en base).

-- 1) Nouvelles colonnes sur Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "date_known" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "category_id" BIGINT;

-- 2) EventLocation devient un vrai lieu (colonnes nullable → additif)
ALTER TABLE "EventLocation" ADD COLUMN IF NOT EXISTS "place_id" TEXT;
ALTER TABLE "EventLocation" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "EventLocation" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "EventLocation" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "EventLocation" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;

-- 3) Catégories d'événement (Gastronomie, Culture, Divertissement, Sport)
CREATE TABLE IF NOT EXISTS "event_categories" (
    "id"         BIGSERIAL PRIMARY KEY,
    "name"       TEXT NOT NULL,
    "slug"       TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active"  BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "event_categories_name_key" ON "event_categories"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "event_categories_slug_key" ON "event_categories"("slug");

DO $$ BEGIN
    ALTER TABLE "Event"
        ADD CONSTRAINT "Event_category_id_fkey"
        FOREIGN KEY ("category_id") REFERENCES "event_categories"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Questions par catégorie
CREATE TABLE IF NOT EXISTS "category_questions" (
    "id"           BIGSERIAL PRIMARY KEY,
    "category_id"  BIGINT NOT NULL,
    "text"         TEXT NOT NULL,
    "sort_order"   INTEGER NOT NULL DEFAULT 0,
    "multi_select" BOOLEAN NOT NULL DEFAULT false,
    "max_choices"  INTEGER NOT NULL DEFAULT 1,
    "is_active"    BOOLEAN NOT NULL DEFAULT true,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_questions_category_id_fkey"
        FOREIGN KEY ("category_id") REFERENCES "event_categories"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "category_questions_category_id_sort_order_idx"
    ON "category_questions"("category_id", "sort_order");

-- 5) Options de réponse (poids par option ; all_category_tags = "Peu importe")
CREATE TABLE IF NOT EXISTS "category_question_options" (
    "id"                BIGSERIAL PRIMARY KEY,
    "question_id"       BIGINT NOT NULL,
    "label"             TEXT NOT NULL,
    "weight"            INTEGER NOT NULL DEFAULT 2,
    "all_category_tags" BOOLEAN NOT NULL DEFAULT false,
    "sort_order"        INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "category_question_options_question_id_fkey"
        FOREIGN KEY ("question_id") REFERENCES "category_questions"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "category_question_options_question_id_sort_order_idx"
    ON "category_question_options"("question_id", "sort_order");

-- 6) Tags Google Places associés à chaque option
CREATE TABLE IF NOT EXISTS "category_question_option_tags" (
    "option_id" BIGINT NOT NULL,
    "tag_id"    BIGINT NOT NULL,
    PRIMARY KEY ("option_id", "tag_id"),
    CONSTRAINT "category_question_option_tags_option_id_fkey"
        FOREIGN KEY ("option_id") REFERENCES "category_question_options"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "category_question_option_tags_tag_id_fkey"
        FOREIGN KEY ("tag_id") REFERENCES "google_tags"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "category_question_option_tags_tag_id_idx"
    ON "category_question_option_tags"("tag_id");

-- 7) Réponses des participants au questionnaire
CREATE TABLE IF NOT EXISTS "event_questionnaire_answers" (
    "event_id"   BIGINT NOT NULL,
    "user_id"    BIGINT NOT NULL,
    "option_id"  BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("event_id", "user_id", "option_id"),
    CONSTRAINT "event_questionnaire_answers_event_id_fkey"
        FOREIGN KEY ("event_id") REFERENCES "Event"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_questionnaire_answers_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_questionnaire_answers_option_id_fkey"
        FOREIGN KEY ("option_id") REFERENCES "category_question_options"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "event_questionnaire_answers_event_id_option_id_idx"
    ON "event_questionnaire_answers"("event_id", "option_id");

-- 8) Les 5 propositions de lieux générées à la clôture
CREATE TABLE IF NOT EXISTS "event_place_proposals" (
    "id"                 BIGSERIAL PRIMARY KEY,
    "event_id"           BIGINT NOT NULL,
    "place_id"           TEXT NOT NULL,
    "name"               TEXT NOT NULL,
    "address"            TEXT NOT NULL,
    "rating"             DOUBLE PRECISION,
    "user_ratings_total" INTEGER,
    "photo_url"          TEXT,
    "website_url"        TEXT,
    "score"              DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank"               INTEGER NOT NULL,
    "chosen"             BOOLEAN NOT NULL DEFAULT false,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_place_proposals_event_id_fkey"
        FOREIGN KEY ("event_id") REFERENCES "Event"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "event_place_proposals_event_id_place_id_key"
    ON "event_place_proposals"("event_id", "place_id");
CREATE INDEX IF NOT EXISTS "event_place_proposals_event_id_rank_idx"
    ON "event_place_proposals"("event_id", "rank");
