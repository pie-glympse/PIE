CREATE TABLE IF NOT EXISTS google_tag_sub_groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  group_id BIGINT NOT NULL REFERENCES google_tag_groups(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS google_tag_sub_groups_group_id_sort_order_idx
  ON google_tag_sub_groups (group_id, sort_order);

ALTER TABLE google_tags
  ADD COLUMN IF NOT EXISTS sub_group_id BIGINT REFERENCES google_tag_sub_groups(id) ON DELETE SET NULL;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS confirmed_google_tag_sub_group_id BIGINT REFERENCES google_tag_sub_groups(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "_EventSelectedGoogleTagGroups" (
  "A" BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  "B" BIGINT NOT NULL REFERENCES google_tag_groups(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "_EventSelectedGoogleTagGroups_AB_unique"
  ON "_EventSelectedGoogleTagGroups" ("A", "B");
CREATE INDEX IF NOT EXISTS "_EventSelectedGoogleTagGroups_B_index"
  ON "_EventSelectedGoogleTagGroups" ("B");

-- Default sub-groups per principal group
INSERT INTO google_tag_sub_groups (name, group_id, sort_order)
SELECT sub.name, g.id, sub.sort_order
FROM google_tag_groups g
JOIN (
  VALUES
    ('Restauration', 'Restaurant', 1),
    ('Restauration', 'Café & bar', 2),
    ('Restauration', 'Boulangerie & pâtisserie', 3),
    ('Restauration', 'Traiteur & buffet', 4),
    ('Afterwork', 'Bar & pub', 1),
    ('Afterwork', 'Brasserie', 2),
    ('Afterwork', 'Nightlife', 3),
    ('Team Building', 'Loisirs & jeux', 1),
    ('Team Building', 'Culture & visites', 2),
    ('Team Building', 'Nature & outdoor', 3),
    ('Séminaire', 'Salles & conférences', 1),
    ('Séminaire', 'Coworking & bureaux', 2),
    ('Sport', 'Fitness & gym', 1),
    ('Sport', 'Sports collectifs', 2),
    ('Sport', 'Outdoor & nature', 3),
    ('Autre', 'Divers', 1)
) AS sub(group_name, name, sort_order)
  ON g.name = sub.group_name
WHERE NOT EXISTS (SELECT 1 FROM google_tag_sub_groups LIMIT 1);

-- Migrate tags from group_id to sub_group_id (first sub-group of each group)
UPDATE google_tags t
SET sub_group_id = sg.id
FROM google_tag_sub_groups sg
WHERE t.group_id = sg.group_id
  AND t.sub_group_id IS NULL
  AND sg.sort_order = (
    SELECT MIN(sort_order)
    FROM google_tag_sub_groups
    WHERE group_id = sg.group_id
  );

-- Migrate event theme votes if old column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'EventThemeVote' AND column_name = 'googleTagId'
  ) THEN
    NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_theme_votes' AND column_name = 'google_tag_id'
  ) THEN
    ALTER TABLE event_theme_votes ADD COLUMN IF NOT EXISTS google_tag_sub_group_id BIGINT REFERENCES google_tag_sub_groups(id) ON DELETE CASCADE;
    UPDATE event_theme_votes v
    SET google_tag_sub_group_id = t.sub_group_id
    FROM google_tags t
    WHERE v.google_tag_id = t.id AND v.google_tag_sub_group_id IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS google_tags_sub_group_id_sort_order_idx
  ON google_tags (sub_group_id, sort_order);
