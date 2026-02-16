-- Requête SQL pour insérer 5 utilisateurs supplémentaires dans Supabase
-- Mot de passe de base pour tous : "motdepasse"
-- Assurez-vous que l'extension pgcrypto est activée : CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Activer l'extension pgcrypto si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insérer 5 utilisateurs avec des mots de passe hachés en bcrypt
INSERT INTO "User" (email, password, "firstName", "lastName", role, "photoUrl", "hasSeenOnboarding", points)
VALUES 
  ('sophie.martin@test.com', crypt('motdepasse', gen_salt('bf', 10)), 'Sophie', 'Martin', 'STANDARD', '', false, 0),
  ('thomas.bernard@test.com', crypt('motdepasse', gen_salt('bf', 10)), 'Thomas', 'Bernard', 'STANDARD', '', false, 0),
  ('marie.dubois@test.com', crypt('motdepasse', gen_salt('bf', 10)), 'Marie', 'Dubois', 'STANDARD', '', false, 0),
  ('pierre.leroy@test.com', crypt('motdepasse', gen_salt('bf', 10)), 'Pierre', 'Leroy', 'STANDARD', '', false, 0),
  ('julie.moreau@test.com', crypt('motdepasse', gen_salt('bf', 10)), 'Julie', 'Moreau', 'STANDARD', '', false, 0)
ON CONFLICT (email) DO NOTHING;

-- Vérification : Afficher les utilisateurs créés
SELECT id, email, "firstName", "lastName", role FROM "User" WHERE email LIKE '%@test.com' ORDER BY id DESC LIMIT 5;
