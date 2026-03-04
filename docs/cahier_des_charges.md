# Spécifications Techniques : Simulateur d'Écrans d'Erreur (MVP)

Application web permettant de simuler des écrans d’erreur systèmes réalistes à des fins éducatives ou de démonstration.

---

## 1. Objectif du Projet
* **Sélection d’écrans :** Windows (BSOD), Linux (Kernel Panic), macOS, Ransomwares.
* **Affichage :** Mode immersif plein écran.
* **Upload d’images personnalisées :**
    * **Privé local :** Stockage via le navigateur (IndexedDB).
    * **Public :** Publication anonyme dans une galerie commune.
    * **Partage :** URL pour reconstruire un écran et/ou afficher une image publique.

### Contraintes Techniques
| Composant | Technologie |
| :--- | :--- |
| **Frontend** | Angular (Build statique) |
| **Backend** | Flask (Python) + Gunicorn |
| **Base de données** | SQLite |
| **Reverse Proxy** | Nginx |
| **Infrastructure** | VPS Hostinger, Docker Compose |
| **CI/CD** | GitHub Actions |

---

## 2. Architecture Cible

### 2.1 Composants & Flux
* **Nginx :** Sert Angular, proxy `/api` vers Flask, sert `/media/` (images publiques) et gère le *rate-limit*.
* **Flask :** Logique d'upload, validation, suppression et pagination de la galerie.
* **Persistance :**
    * `./data/app.db` (SQLite)
    * `./data/media/` (Stockage images)

---

## 3. Fonctionnalités (Secure & Privacy by Design)

### 3.1 Galerie & Mode Plein Écran
* **Galerie :** Écrans prédéfinis packagés dans le build (pas d'appels externes).
* **Plein écran :** * Sortie via touche **Q** (Desktop) ou rechargement (Mobile).
    * **Sécurité :** CSP `frame-ancestors 'none'`, parsing strict des paramètres d'URL (liste blanche).
    * **Privacy :** Aucune télémétrie, aucun appel serveur lors de la navigation locale.

### 3.2 Gestion des Uploads
#### Mode Privé (Local)
* Stockage local uniquement (IndexedDB).
* Aucune donnée envoyée au serveur. Pas de lecture de métadonnées EXIF.

#### Mode Public (Galerie sans compte)
* **Validation serveur :** Taille max 10 Mo, types autorisés (png, jpg, jpeg, webp).
* **Re-encodage :** Conversion systématique en **WebP** pour supprimer les métadonnées et neutraliser les fichiers malveillants.
* **Anti-abus :** Rate-limit Nginx (1 upload / 20 s / IP).
* **Privacy :** Ne pas stocker l'IP ou le User-Agent. `access_log off` pour les uploads.

### 3.3 Suppression & Expiration
* **Suppression :** Un `delete_token` est fourni à l'upload (haché en base).
* **Expiration :** Job quotidien supprimant les fichiers vieux de plus de **3 ans**.

---

## 4. Spécifications API (Minimale)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/uploads` | Upload d'image (retourne `id`, `url`, `delete_token`). |
| `GET` | `/api/gallery` | Liste paginée (ex: 24 éléments/page). |
| `POST` | `/api/delete` | Body: `{id, delete_token}`. |
| `GET` | `/api/health` | Statut du service. |

### Modèle SQLite
```sql
CREATE TABLE uploads (
    id TEXT PRIMARY KEY,
    created_at INTEGER,
    expires_at INTEGER,
    status TEXT, -- active | deleted
    path TEXT,
    bytes INTEGER,
    delete_token_hash TEXT
);
```

---

## 5. Sécurité & Plateforme
* **Headers :** `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.
* **Secrets :** Variables d'environnement Docker (pas de secrets dans le repo).
* **Images :** Service `/media` en lecture seule, `client_max_body_size 10m`.

---

## 6. CI/CD (GitHub Actions)
* **CI :** `yarn audit`, Tests (ChromeHeadless), Build Angular.
* **CD :** * Front : Déploiement FTPS.
    * Back : SSH VPS -> `docker compose pull` -> `docker compose up -d`.
* **Règle d'or :** Persistance des données SQLite et `/media` entre les déploiements.

---

## 7. Critères d'Acceptation (MVP)
- [ ] Plein écran fonctionnel (Sortie via 'Q').
- [ ] Upload public avec validation et re-encodage WebP.
- [ ] Rate-limit actif (1 upload / 20s).
- [ ] Suppression effective via token.
- [ ] Zéro stockage d'IP ou de métadonnées EXIF.
- [ ] Déploiement automatisé sans perte de données.

---
**Hors périmètre :** Comptes utilisateurs, modération automatisée, stockage Cloud externe.