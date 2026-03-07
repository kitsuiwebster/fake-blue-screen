# Security Acceptance Criteria et Definition of Done (DoD)

## 1. Objectif

Ce document définit les exigences sécurité obligatoires pour screenfake.xyz. Il complète le cahier des charges.

Le but de ce document est de  :

- réduire les risques majeurs (upload, abuse, fuite d’informations),
- garantir un niveau sécurité pour le MVP.
    
---

## 2. Security Acceptance Criteria (par fonctionnalité)

#### Acceptance Criteria — Sécurité

**AC-UP-01 — Limites de taille fichier (10.1mo)**

- Nginx : `client_max_body_size 10m` actif.
    
- Backend : limite de taille de fichier. pour protéger l'espace disque.
    
- Test : 10.1 Mo ⇒ rejet et aucun fichier écrit.
    

**AC-UP-02 — Rate limiting (1 upload/20s par IP) -**

- Nginx : 1 upload / 20 s / IP sur `POST /api/uploads`.
    
- But : empêcher l’envoi massif d’uploads qui saturent disque/CPU.
    
- Test : 2 uploads en moins de < 20 s ⇒ le 2e retourne un message d'échec. 
    

**AC-UP-03 — Validation du contenu fichier (magic bytes / Pillow decode)**

- Rejet si Pillow ne peut pas décoder l’image ou si l'extension est falsifié.
    
- Types acceptés : png/jpg/jpeg/webp.
    
- Test : renommer un `.exe` en `.jpg` ⇒ doit faire un rejet.
    

**AC-UP-04 —Re-encodage obligatoire WebP — original non conservé**

- Le serveur ouvre l'image (via Pillow) puis re-encode en WebP.
    
- L'image original n'est pas conservé.
    
- Test : Regarder l’URL retournée par l’API ou dans la galerie.
    

**AC-UP-05 — Supression des métadonnées (EXIF/XMP)**
- Critère : Une image ne doit pas avoir de donnée EXIF.
- Aucune métadonnée conservée (EXIF/XMP ; ICC seulement si nécessaire).
    
- Test : EXIF GPS absent après re-encodage.
    

**AC-UP-06 — Génération de noms de fichiers (UUID v4)**

- ID : chaque fichier reçoit un identifiant UUID v4 généré aléatoirement par le VPS 
- But : le client ne choisit ni le nom du fichier ni son chemin de stockage.
- Vérification : après upload, l’image est placés dans `/media/<uuid>.webp` avec un nom généré par le serveur.

**AC-UP-07 — Lecture seule /media**

- Nginx sert `/media/*` en statique read-only.

- Critères : les fichiers du dossier `/media` sont accessibles en lecture uniquement et ne peuvent pas être modifiés ou uploadés directement depuis Internet. Seulement Flask écrit dans /media

- Test : PUT/POST sur `/media/...` ⇒ impossible.
    
**AC-UP-08 — Protection du dossier `/media`**

- Critère : - Critère : les images sont accessibles via leur URL, mais la liste du dossier `/media` n’est pas visible depuis le navigateur.

- Implémentation : Nginx applique `X-Content-Type-Options: nosniff`, `Content-Type: image/webp` et `autoindex off`.

- Test : vérifier les headers HTTP et tenter d’accéder à `https://www.screenfake.xyz/media/` → aucun fichier ne doit être affiché.

**AC-UP-09 — Signalement / supression → Captcha -> supression immédiate**

- Un signalement déclenche un webhook discord.
- La supression entraine un Captcha. 
    

**AC-UP-10 — Blacklist de hash d'images** ( a passer en backlog)

- But : Une image signalée et supprimée peut être empêchée de réupload en enregistrant son hash dans une liste de blocage (denylist) vérifiée lors des uploads.
    
- Implémentation :     

**AC-UP-11 — Comportement en cas de disque plein (503/507)**

- Critère : l’espace disque disponible sur la partition contenant `/data/media` excède > 90 %), les nouveaux uploads sont refusés.

- Implémentation : vérification de l’espace disque disponible avant l’écriture du fichier.

- Vérification : simuler un disque avec < 10 % d’espace libre puis tenter un upload ⇒ réponse 503/507 et aucun fichier créé dans `/media`.    

**AC-UP-12 — Timeouts upload image**
- Critère : un upload ne peut pas dépasser un temps de traitement > 30s.

- But Gunicorn gère plusieurs processus (workers)simultanées pour
    traiter images. Sans ce timeout, une image malformée
    peut bloquer un worker indéfiniment.

- Implémentation timeout Gunicorn sur la requête.
    
- But : éviter d'avoir X workers bloqués. Un worker bloqué est garanti d'être tué et remplacé.

**AC-UP-13 — Minimisation des logs**

- Critère : aucune adresse IP n’est stockée en DB. Les endpoints `/api/uploads` et `/media` n’enregistrent pas de logs utilisateurs 

- Implémentation : absence de champ  dans la base SQLite ; configuration Nginx et applicative limitant les données journalisées sur les routes sensibles.

- But : Vive la vie privée

**AC-UP-14 — Gestion sécurisée des erreurs**

- Critère : les erreurs retournent un message clair pour l’utilisateur. mais sans divulguer d’informations internes (chemins serveur, versions, stacktrace...).

- But : éviter la divulgation d’informations techniques exploitables.

- Implémentation : gestion des erreurs Flask avec réponses JSON adaptés.

- Vérification : provoquer une erreur (upload invalide ou endpoint inexistant) et vérifier l’absence de stacktrace (Error) dans la réponse.
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
