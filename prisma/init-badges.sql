-- Script SQL pour initialiser les badges dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- Insérer les 4 badges de base
INSERT INTO "Badge" (id, name, description, icon, "pointsRequired", "order", "createdAt")
VALUES 
  (1, 'Robuste Diplomate', 'Complétez votre première action et rejoignez l''aventure', '/images/illustration/joy.png', 0, 1, NOW()),
  (2, 'Explorateur étoilé', 'Gagnez 100 points en participant activement à des événements', '/images/illustration/magic.png', 100, 2, NOW()),
  (3, 'Harmoniste enjoleur', 'Atteignez 500 points et repandez l''amour autour de vous', '/images/illustration/sad.png'  , 500, 3, NOW()),
  (4, 'Chuchoteur de Paix', 'Obtenez 1000 points et rejoignez la cour des legendes', '/images/illustration/base.png', 1000, 4, NOW())
ON CONFLICT (name) DO NOTHING;

-- Exemple: Ajouter des points à un utilisateur et créer l'historique
-- INSERT INTO "PointsHistory" ("userId", points, action, description, "eventId", "createdAt")
-- VALUES (1, 50, 'event_participation', 'Participation à l''événement Team Building', 1, NOW()); 

-- Exemple: Débloquer un badge pour un utilisateur
-- INSERT INTO "UserBadge" ("userId", "badgeId", "unlockedAt")
-- VALUES (1, 1, NOW());
