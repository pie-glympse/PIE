# Stratégie de Cache - Glyms App

## 📚 Types de Cache Expliqués

### 1. **Cache Navigateur (Client-Side)**
- **Où** : Stocké dans le navigateur de l'utilisateur
- **Durée** : Définie par les headers `Cache-Control`
- **Avantage** : Réduit les requêtes réseau, chargement instantané
- **Utilisation** : Ressources statiques (images, CSS, JS), données peu volatiles

### 2. **Cache CDN (Vercel Edge Network)**
- **Où** : Sur les serveurs Edge de Vercel (près de l'utilisateur)
- **Durée** : Définie par les headers `Cache-Control` et `vercel.json`
- **Avantage** : Réduit la charge sur le serveur, latence réduite
- **Utilisation** : Pages statiques, API routes avec cache approprié

### 3. **Cache Serveur (Next.js)**
- **Où** : Sur le serveur Next.js
- **Durée** : Définie par Next.js (revalidate)
- **Avantage** : Génération de pages en avance, moins de calculs
- **Utilisation** : Pages générées statiquement, ISR (Incremental Static Regeneration)

### 4. **ETag (Validation Conditionnelle)**
- **Où** : Header HTTP pour validation
- **Fonction** : Permet au navigateur de vérifier si les données ont changé
- **Avantage** : Économise la bande passante si rien n'a changé (304 Not Modified)

## 🎯 Stratégie de Cache pour Glyms

### **Ressources Statiques** (Images, CSS, JS, Fonts)
- **Cache** : 1 an (`public, max-age=31536000, immutable`)
- **Raison** : Ces fichiers ne changent jamais (hash dans le nom)

### **Données Statiques** (Tags, Company info)
- **Cache** : 1 heure (`public, s-maxage=3600, stale-while-revalidate=86400`)
- **Raison** : Changent rarement, acceptable d'afficher une version légèrement obsolète
- **ETag** : Oui, pour validation conditionnelle

### **Données Semi-Statiques** (Events, Users)
- **Cache** : 5 minutes (`private, max-age=300, stale-while-revalidate=600`)
- **Raison** : Changent modérément, besoin de données récentes mais pas instantanées
- **ETag** : Oui, pour validation conditionnelle
- **Note** : `private` car dépendent de l'utilisateur connecté

### **Données Dynamiques** (Notifications, Stats temps réel)
- **Cache** : Pas de cache (`no-cache, no-store`)
- **Raison** : Doivent être toujours à jour

### **Pages Next.js**
- **Cache** : Géré par Next.js (ISR si applicable)
- **Headers** : Définis dans `vercel.json` pour les routes statiques

## 📋 Headers Cache-Control Expliqués

- `public` : Peut être mis en cache par le navigateur ET le CDN
- `private` : Cache uniquement dans le navigateur (pas dans le CDN partagé)
- `max-age=X` : Durée en secondes que le navigateur peut garder en cache
- `s-maxage=X` : Durée en secondes pour le cache CDN (Vercel Edge)
- `stale-while-revalidate=X` : Permet de servir du contenu obsolète pendant X secondes pendant la revalidation en arrière-plan
- `no-cache` : Doit vérifier avec le serveur avant d'utiliser le cache
- `no-store` : Ne jamais mettre en cache
- `immutable` : Le fichier ne changera jamais (pour les assets avec hash)

## 🔄 ETag - Comment ça marche ?

1. Le serveur génère un hash du contenu (ex: `"abc123"`)
2. Le serveur envoie `ETag: "abc123"` dans les headers
3. Le navigateur stocke l'ETag avec la réponse
4. Lors de la prochaine requête, le navigateur envoie `If-None-Match: "abc123"`
5. Si le contenu n'a pas changé, le serveur répond `304 Not Modified` (sans body)
6. Le navigateur utilise sa version en cache

**Avantage** : Économise la bande passante et réduit le temps de réponse.
