CREATE TABLE IF NOT EXISTS google_tag_groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE google_tags
  ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES google_tag_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS google_tags_group_id_sort_order_idx
  ON google_tags (group_id, sort_order);

INSERT INTO google_tag_groups (name, sort_order)
SELECT v.name, v.sort_order
FROM (
  VALUES
    ('Restauration', 1),
    ('Afterwork', 2),
    ('Team Building', 3),
    ('Séminaire', 4),
    ('Sport', 5),
    ('Autre', 6)
) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM google_tag_groups LIMIT 1);
