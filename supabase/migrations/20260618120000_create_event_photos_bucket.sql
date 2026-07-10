-- Bucket Supabase Storage pour les photos d'événements
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lecture publique (URLs publiques)
DROP POLICY IF EXISTS "Public read event photos" ON storage.objects;
CREATE POLICY "Public read event photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-photos');
