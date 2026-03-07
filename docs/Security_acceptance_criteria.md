# Security Acceptance Criteria et Definition of Done (DoD)

## 1. Objectif

Ce document définit les exigences sécurité obligatoires pour l’application de simulation d’écrans systèmes. Il complète les exigences fonctionnelles et s’applique à toutes les fonctionnalités présentes et futures.

Le but est :

- réduire les risques majeurs (upload, abuse, fuite d’informations),
    
- garantir un niveau sécurité cohérent MVP → scale,
    
- fournir un référentiel clair pour développement, revue et CI/CD.
    

---

## 2. Security Acceptance Criteria (par fonctionnalité)

### 2.1 Upload d’images — Mode public (galerie sans compte)

**Résumé (quoi / pourquoi)** : permet de publier une image anonyme ; c’est la surface d’attaque principale (DoS disque/CPU, fichiers piégés, fuite de métadonnées), donc on impose des contrôles stricts côté serveur.

#### conception de l'architecture

- Volume : 50–500 uploads/jour.
    
- Surcharge : blocage temporaire acceptable.
    
- Signalement : bouton oui ; 1 signalement ⇒ suppression.
    
- Suppression auto : denylist de hash (hash connu) ⇒ rejet/suppression.
    
- Disque plein : upload bloqué.
    
- Taille max : 10 Mo.
    
- Traitement : Pillow.
    
- Sortie : WebP obligatoire.
    
- Qualité : priorité qualité.
    
- Anti-bot : pas de CAPTCHA ; logs anonymisés autorisés.
    
- UX : message explicite en cas de rejet.
    
- Latence cible : ≤ 2 s.
    

#### Acceptance Criteria — Sécurité

**AC-UP-01 — Limites de taille multi-couches**

- Nginx : `client_max_body_size 10m` actif.
    
- Backend : limite de taille active (rejet sans traitement).
    
- Test : 10.1 Mo ⇒ rejet (413/400) et aucun fichier écrit.
    

**AC-UP-02 — Rate limiting anti-pollution**

- Nginx : 1 upload / 20 s / IP sur `POST /api/uploads`.
    
- But : empêcher l’envoi massif d’uploads qui saturent disque/CPU.
    
- Test : 2 uploads < 20 s ⇒ le 2e retourne 429.
    

**AC-UP-03 — Validation format réelle (pas extension)**

- Rejet si Pillow ne peut pas décoder l’image.
    
- Types acceptés : png/jpg/jpeg/webp.
    
- Test : renommer un `.exe` en `.jpg` ⇒ doit faire un rejet.
    

**AC-UP-04 — Re-encodage obligatoire WebP — original non conservé**

- Le serveur ouvre l'image (via Pillow) puis re-encode en WebP.
    
- L’original n’est pas conservé.
    
- Test : l’URL publique sert toujours un WebP généré par le serveur.
    

**AC-UP-05 — Neutralisation métadonnées**

- Aucune métadonnée conservée (EXIF/XMP ; ICC seulement si nécessaire).
    
- Test : EXIF GPS absent après re-encodage.
    

**AC-UP-06 — Nommage et chemins non influençables**

- ID : UUID v4 (ou équivalent non prédictible).
    
- Chemin : construit côté serveur depuis une racine fixe (`./data/media/`).
    
- But : empêcher écrasement de fichiers et attaques par chemin.
    

**AC-UP-07 — Pas d’upload direct sur /media**

- Nginx sert `/media/*` en statique read-only.
    
- But : empêcher un attaquant d’écrire des fichiers servis au public.
    
- Test : PUT/POST sur `/media/...` ⇒ 404/405.
    

**AC-UP-08 — Service des médias sûr**

- `/media/` : `X-Content-Type-Options: nosniff`, `Content-Type: image/webp`, `autoindex off`.
    
- But : empêcher l’exécution de contenu déguisé + éviter le listing des fichiers.
    

**AC-UP-09 — Signalement ⇒ suppression**

- Un signalement déclenche suppression (fichier + DB `status=deleted`).
    
- Réponse API sans indication sur l’existence de l’ID.
    

**AC-UP-10 — Denylist de hash**

- Calcul d’un hash (SHA-256) sur la version re-encodée, stocké en DB.
    
- Si hash présent dans denylist ⇒ rejet/suppression.
    

**AC-UP-11 — Disque plein**

- Si espace disque < seuil ⇒ uploads refusés (503/507) avec message explicite.
    
- Pas de purge automatique.
    

**AC-UP-12 — Timeouts (résilience)**

- Timeout traitement image + timeout Gunicorn.
    
- But : éviter les workers bloqués.
    

**AC-UP-13 — Logs anonymisés**

- Pas d’IP stockée en DB.
    
- Nginx `access_log off` sur `/api/uploads` et `/media`.
    
- Logs applicatifs : métriques agrégées (compteurs, latence, codes), sans PII.
    

**AC-UP-14 — Erreurs explicites sans fuite**

- Messages explicites (format, taille, surcharge, disque plein).
    
- Aucune fuite d’infos internes (stacktrace, chemins serveur, versions libs).
    

---

### 2.2 Galerie d’écrans prédéfinis (assets locaux)

**Résumé (quoi / pourquoi)** : catalogue d’images embarquées ; le risque principal est l’injection (XSS) et le chargement de ressources externes (tracking/attaque supply-chain).

Acceptance Criteria — Sécurité

- Assets packagés dans le build Angular (pas de sources externes).
    
- Pas de rendu de HTML dynamique non échappé (pas de `innerHTML` alimenté par données runtime).
    
- CSP active et compatible Angular.
    
- Aucun appel réseau déclenché par la navigation dans le catalogue.
    

Test

- Devtools : 0 requête externe lors de l’affichage du catalogue.
    

---

### 2.3 Mode plein écran immersif

**Résumé (quoi / pourquoi)** : affiche un écran en plein écran ; le risque principal est l’abus via paramètres URL (injection) et l’embed dans un site tiers (clickjacking).

Acceptance Criteria — Sécurité

- Sortie plein écran desktop uniquement via touche `Q` (front uniquement).
    
- Paramètres URL : parsing strict + liste blanche (template/options) + bornes.
    
- Paramètres inconnus : ignorés ou rejetés ; aucun rendu basé sur contenu arbitraire.
    
- Anti-embed : `frame-ancestors 'none'` (sauf exigence future documentée).
    

Test

- Paramètres inattendus/longs ⇒ pas d’erreur, pas d’injection, comportement déterministe.
    

---

### 2.4 Upload privé local (IndexedDB)

**Résumé (quoi / pourquoi)** : l’utilisateur importe une image privée stockée uniquement dans le navigateur ; le risque principal est une fuite réseau involontaire et l’affichage non sûr.

Acceptance Criteria — Sécurité

- Validation client : extensions autorisées + taille ≤ 10 Mo.
    
- Stockage local uniquement (IndexedDB) ; aucune requête réseau pendant l’import.
    
- Rendu via `blob:` / `data:` contrôlé ; pas d’exécution.
    
- Pas de lecture/stockage EXIF côté client.
    

Test

- Mode avion : import OK, plein écran OK.
    

---

### 2.5 Galerie publique paginée (images users)

**Résumé (quoi / pourquoi)** : liste paginée d’images publiques ; le risque principal est la surcharge serveur (pagination abusive) et le scraping.

Acceptance Criteria — Sécurité

- Endpoint listing : `limit` borné côté serveur (ex : max 100) et `page` borné.
    
- Tri récent uniquement ; pas de texte utilisateur (titre/description) en MVP.
    
- Paramètres invalides ⇒ 400 contrôlé.
    
- Option anti-abus : rate limit sur GET listing (facultatif MVP).
    

Test

- `limit=1000` ⇒ ramené à 100 (ou 400) ; pas de charge excessive.
    

---

### 2.6 Suppression par token

**Résumé (quoi / pourquoi)** : permet à l’uploader anonyme de supprimer son image ; le risque principal est la suppression non autorisée et l’énumération d’IDs.

Acceptance Criteria — Sécurité

- `delete_token` généré cryptographiquement ; affiché une seule fois.
    
- DB : hash du token (jamais en clair).
    
- Delete : réponse générique si token invalide ou id inexistant (anti-énumération).
    
- Rate limit sur delete (option Nginx) ; erreurs contrôlées.
    
- Suppression cohérente : fichier + DB (`status=deleted`).
    

Tests

- Token incorrect ⇒ 403 générique.
    
- Rejeu suppression ⇒ réponse générique, pas de fuite.
    

---

### 2.7 Expiration automatique (3 ans)

**Résumé (quoi / pourquoi)** : purge automatique des contenus publics ; réduit le risque juridique, limite la surface d’attaque, et évite l’accumulation disque.

Acceptance Criteria — Sécurité

- Job quotidien : supprime entrées expirées + fichiers associés.
    
- Suppression hors périmètre impossible : chemin = racine média + id connu.
    
- Gestion erreurs : si suppression fichier échoue, DB reste cohérente et l’item sera retenté au prochain run.
    

Test

- Entrée expirée simulée ⇒ fichier supprimé, DB mise à jour.
    

---

### 2.8 Partage d’URL

**Résumé (quoi / pourquoi)** : URL pour reconstruire un écran ; le risque principal est l’injection via paramètres et la fuite de données via tracking.

Acceptance Criteria — Sécurité

- Templates prédéfinis : query params whitelist + bornes strictes.
    
- Images publiques : URL unique `/media/<id>.webp`.
    
- Images privées : non partageables.
    
- Aucun paramètre de tracking ajouté.
    

Test

- Paramètre inconnu / hors borne ⇒ ignoré/rejeté ; pas d’exécution.
    

---
