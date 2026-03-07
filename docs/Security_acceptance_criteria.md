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

<!--

### 2.2 Galerie d’écrans prédéfinis (assets locaux)

**Résumé (quoi / pourquoi)** : catalogue d’images embarquées ; le risque principal est l’injection (XSS) et le chargement de ressources externes (tracking/attaque supply-chain).


**AC-GA-01** — Assets packagés dans le build Angular (pas de sources externes).

- Critère : les images du catalogue sont dans le build (packagées avec l’appli, pas chargées depuis internet).
- But : zéro appel vers un serveur externe.
- Implémentation : assets dans le dossier `assets/` Angular.
- Vérification : Devtools → 0 requête externe en naviguant dans le catalogue.

**AC-GA-02** — CSP active et compatible Angular.

- Critère : un header CSP (Content Security Policy — liste blanche de ce que la page peut charger) est actif.
- But : bloquer le chargement de ressources non autorisées.
- Implémentation : header CSP défini dans Nginx.
- Vérification : Devtools → header `Content-Security-Policy` présent dans la réponse HTTP.
    

---

### 2.3 Mode plein écran immersif

**Résumé (quoi / pourquoi)** : affiche un écran en plein écran ; le risque principal est l’abus via paramètres URL (injection) et l’embed dans un site tiers (clickjacking).

Acceptance Criteria — Sécurité

**AC-PS-01** — Paramètres URL : parsing strict + liste blanche (template/options) + bornes.

- Critère : seuls les paramètres URL connus (liste blanche) sont acceptés — les inconnus sont ignorés, jamais affichés dans la page.
- But : empêcher l’injection de code via l’URL.
- Implémentation : Angular valide chaque paramètre et ignore les inconnus.
- Vérification : `?foo=<script>alert(1)</script>` dans l’URL → rien ne s’affiche, rien de cassé.

**AC-PS-03** — Anti-embed : `frame-ancestors ‘none’` (sauf exigence future documentée).

- Critère : la page ne peut pas être chargée dans un iframe (fenêtre intégrée dans un autre site).
- But : protection contre le clickjacking (piège visuel pour faire cliquer l’utilisateur à son insu).
- Implémentation : header `Content-Security-Policy: frame-ancestors ‘none’` dans Nginx.
- Vérification : header HTTP → `frame-ancestors ‘none’` présent.


---

### 2.4 Upload privé local (IndexedDB)

**Résumé (quoi / pourquoi)** : l’utilisateur importe une image privée stockée uniquement dans le navigateur ; le risque principal est une fuite réseau involontaire et l’affichage non sûr.

Acceptance Criteria — Sécurité

**AC-PR-01** — Validation client : extensions autorisées + taille ≤ 10 Mo.

- Critère : le navigateur vérifie l’extension et la taille avant de stocker quoi que ce soit.
- But : rejeter les fichiers non image ou trop lourds avant même de les traiter.
- Implémentation : validation dans Angular avant stockage IndexedDB (base de données locale du navigateur).
- Vérification : upload d’un `.exe` ou fichier > 10 Mo ⇒ rejet côté navigateur, rien stocké.

**AC-PR-02** — Stockage local uniquement (IndexedDB) ; aucune requête réseau pendant l’import.

- Critère : l’image reste dans le navigateur (IndexedDB — stockage local). jamais envoyée au serveur.
- But : l’upload privé est vraiment privé.
- Implémentation : stockage IndexedDB uniquement, aucun appel API.
- Vérification : mode avion → import OK, 0 requête réseau dans Devtools.

Test

- Mode avion : import OK, plein écran OK.
    

---

### 2.5 Galerie publique paginée (images users)

**Résumé (quoi / pourquoi)** : liste paginée d’images publiques ; le risque principal est la surcharge serveur (pagination abusive) et le scraping.

Acceptance Criteria — Sécurité

**AC-GP-01** — Endpoint listing : `limit` borné côté serveur (ex : max 100) et `page` borné.

- Critère : `limit` (nombre de résultats demandés) plafonné à 100 côté Flask. quelle que soit la valeur envoyée.
- But : éviter les requêtes qui ramènent 10 000 entrées et saturent la DB.
- Implémentation : plafonnement dans Flask avant la requête SQLite.
- Vérification : `GET /api/gallery?limit=1000` ⇒ retourne max 100 entrées.

**AC-GP-02** — Tri récent uniquement ; pas de texte utilisateur (titre/description) en MVP.

- Critère : tri par date décroissante uniquement. Aucun champ texte utilisateur stocké en DB.
- But : pas de surface XSS (injection de code via du texte affiché).
- Implémentation : schéma SQLite sans champ titre/description, tri par `created_at DESC`.
- Vérification : réponse API → aucun champ texte utilisateur dans le JSON.

**AC-GP-03** — Paramètres invalides ⇒ 400 contrôlé.

- Critère : un paramètre invalide retourne une erreur 400 (Bad Request) avec un message clair.
- But : pas de crash silencieux ni de fuite d'erreur interne.
- Implémentation : validation Flask → retour JSON `{"error": "..."}` et code 400.
- Vérification : `GET /api/gallery?page=-1` ⇒ réponse 400, message contrôlé.

    

---

### 2.6 Suppression par token

**Résumé (quoi / pourquoi)** : permet à l’uploader anonyme de supprimer son image ; le risque principal est la suppression non autorisée et l’énumération d’IDs.

**AC-ST-01** — DB : hash du token (jamais en clair).

- Critère : seul le hash (empreinte numérique) du token est stocké en DB — jamais le token brut.
- But : si la DB fuite, personne ne peut supprimer les images avec les données volées.
- Implémentation : `hashlib.sha256(token).hexdigest()` stocké dans `delete_token_hash`.
- Vérification : inspection SQLite → colonne `delete_token_hash` contient un hash, pas le token.

**AC-ST-02** — Delete : réponse générique si token invalide ou id inexistant (anti-énumération).

- Critère : toute suppression échouée retourne la même réponse générique — que l'ID existe ou non.
- But : empêcher de deviner quelles images existent (énumération d'IDs).
- Implémentation : Flask retourne toujours `{"error": "not found"}` et 404, sans distinction.
- Vérification : token invalide ⇒ 404 générique. ID inexistant ⇒ même 404 générique.

**AC-ST-03** — Suppression cohérente : fichier + DB (`status=deleted`).

- Critère : une suppression efface le fichier sur le disque ET met `status=deleted` en DB.
- But : pas de fichier orphelin (fichier présent mais sans entrée DB) et vice-versa.
- Implémentation : Flask supprime le fichier puis `UPDATE uploads SET status='deleted'`.
- Vérification : après suppression → fichier absent de `/media/`, statut `deleted` en DB.

Tests
- Token incorrect ⇒ 403 générique.
- Rejeu suppression ⇒ réponse générique, pas de fuite.
    

---

### 2.7 Expiration automatique (3 ans)

**Résumé (quoi / pourquoi)** : purge automatique des contenus publics ; réduit le risque juridique, limite la surface d’attaque, et évite l’accumulation disque.

Acceptance Criteria — Sécurité

**AC-EX-01** — Job quotidien : supprime entrées expirées + fichiers associés.

- Critère : un script tourne chaque jour et supprime les uploads dont la date d’expiration (`expires_at`) est dépassée.
- But : éviter l’accumulation de fichiers sur le disque sur 3 ans.
- Implémentation : script Python planifié via cron (planificateur de tâches), supprime fichier + entrée DB.
- Vérification : simuler une entrée avec `expires_at` dans le passé ⇒ fichier supprimé au prochain run.



---

### 2.8 Partage d’URL

**Résumé (quoi / pourquoi)** : URL pour reconstruire un écran ; le risque principal est l’injection via paramètres et la fuite de données via tracking.

Acceptance Criteria — Sécurité

**AC-URL-01** — Templates prédéfinis : query params whitelist + bornes strictes.

- Critère : seuls les paramètres URL de la liste blanche (whitelist) sont acceptés.
- But : pas d’injection via les paramètres de l’URL partagée.
- Implémentation : parsing Angular avec whitelist, valeurs hors bornes ignorées.
- Vérification : URL avec paramètre inconnu ⇒ ignoré, aucun rendu inattendu.

**AC-URL-02** — Images publiques : URL unique `/media/<id>.webp`.

- Critère : chaque image publique est accessible uniquement via son URL avec UUID (identifiant unique et aléatoire).
- But : URL non prédictible — impossible de deviner les URLs des autres images.
- Implémentation : UUID v4 généré côté serveur, servi statiquement par Nginx.
- Vérification : URL retournée par l’API → format `/media/<uuid>.webp`.

**AC-URL-03** — Images privées : non partageables.

- Critère : une image en mode privé ne génère jamais d’URL partageable.
- But : l’upload privé reste dans le navigateur — pas de fuite possible via un partage.
- Implémentation : aucun endpoint d’upload pour les images privées — IndexedDB uniquement.
- Vérification : en mode privé, aucun bouton de partage ne génère une URL serveur.

Test

- Paramètre inconnu / hors borne ⇒ ignoré/rejeté ; pas d’exécution.


-->

---
