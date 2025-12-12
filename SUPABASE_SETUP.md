# Configuration Supabase Storage

Ce guide explique comment configurer Supabase Storage pour les uploads d'images (avatars et bannières).

## 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Variables publiques (déjà configurées)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key

# Variable serveur (à ajouter)
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

**Important** : La `SUPABASE_SERVICE_ROLE_KEY` est sensible et ne doit jamais être exposée côté client. Elle est utilisée uniquement côté serveur pour les opérations d'upload.

### Où trouver la Service Role Key ?

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez la **service_role key** (pas l'anon key)

## 2. Création des buckets dans Supabase

Vous devez créer deux buckets dans Supabase Storage :

### Option A : Via l'interface Supabase

1. Allez dans votre projet Supabase
2. Cliquez sur **Storage** dans le menu de gauche
3. Cliquez sur **New bucket**
4. Créez deux buckets :
   - **Nom** : `avatars`
     - **Public** : ✅ Oui (pour que les images soient accessibles publiquement)
     - **File size limit** : 5 MB
     - **Allowed MIME types** : `image/jpeg,image/jpg,image/png,image/gif,image/webp`
   
   - **Nom** : `banners`
     - **Public** : ✅ Oui
     - **File size limit** : 5 MB
     - **Allowed MIME types** : `image/jpeg,image/jpg,image/png,image/gif,image/webp`

### Option B : Via SQL (dans l'éditeur SQL de Supabase)

```sql
-- Créer le bucket avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Créer le bucket banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  5242880, -- 5 MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);
```

## 3. Politiques de sécurité (RLS)

Par défaut, Supabase Storage utilise Row Level Security (RLS). Pour permettre les uploads et les lectures publiques :

### Via l'interface Supabase

1. Allez dans **Storage** > **Policies**
2. Pour chaque bucket (`avatars` et `banners`), créez ces politiques :

**Politique 1 : Lecture publique**
- **Policy name** : `Public read access`
- **Allowed operation** : `SELECT`
- **Policy definition** : `true` (permet la lecture à tous)

**Politique 2 : Upload authentifié**
- **Policy name** : `Authenticated users can upload`
- **Allowed operation** : `INSERT`
- **Policy definition** : `auth.role() = 'authenticated'`

**Politique 3 : Mise à jour authentifiée**
- **Policy name** : `Authenticated users can update`
- **Allowed operation** : `UPDATE`
- **Policy definition** : `auth.role() = 'authenticated'`

**Politique 4 : Suppression authentifiée**
- **Policy name** : `Authenticated users can delete`
- **Allowed operation** : `DELETE`
- **Policy definition** : `auth.role() = 'authenticated'`

### Via SQL

```sql
-- Politiques pour le bucket avatars
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Politiques pour le bucket banners
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE
USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE
USING (bucket_id = 'banners' AND auth.role() = 'authenticated');
```

## 4. Vérification

Une fois la configuration terminée :

1. Redémarrez votre serveur de développement
2. Allez sur la page de profil
3. Essayez d'uploader une photo de profil ou une bannière
4. Vérifiez que l'image s'affiche correctement

## 5. Structure des fichiers

Les fichiers sont organisés ainsi dans Supabase Storage :

```
avatars/
  └── {timestamp}-{random}.{ext}
banners/
  └── {timestamp}-{random}.{ext}
```

Les URLs générées ressemblent à :
```
https://{votre-projet}.supabase.co/storage/v1/object/public/avatars/{filename}
https://{votre-projet}.supabase.co/storage/v1/object/public/banners/{filename}
```

## Dépannage

### Erreur : "Bucket not found"
- Vérifiez que les buckets `avatars` et `banners` existent dans Supabase Storage
- Vérifiez que les noms sont exactement `avatars` et `banners` (minuscules)

### Erreur : "new row violates row-level security policy"
- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que vous utilisez la `SUPABASE_SERVICE_ROLE_KEY` côté serveur

### Erreur : "Invalid API key"
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien définie dans `.env.local`
- Redémarrez le serveur après avoir ajouté la variable

### Les images ne s'affichent pas
- Vérifiez que les buckets sont publics
- Vérifiez que l'URL retournée par l'API est correcte
- Ouvrez l'URL dans un navigateur pour vérifier qu'elle est accessible

