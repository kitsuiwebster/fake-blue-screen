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
    

**AC-UP-10 — Comportement en cas de disque plein (503/507)**

- Critère : l’espace disque disponible sur la partition contenant `/data/media` excède > 90 %), les nouveaux uploads sont refusés.

- Implémentation : vérification de l’espace disque disponible avant l’écriture du fichier.

- Vérification : simuler un disque avec < 10 % d’espace libre puis tenter un upload ⇒ réponse 503/507 et aucun fichier créé dans `/media`.    

**AC-UP-11 — Timeouts upload image**
- Critère : un upload ne peut pas dépasser un temps de traitement > 30s.

- Implémentation timeout Gunicorn sur la requête.
    
- But : éviter d'avoir X workers bloqués. Un worker bloqué est garanti d'être tué et remplacé.

**AC-UP-12 — Minimisation des logs**

- Critère : aucune adresse IP n’est stockée en DB. Les endpoints `/api/uploads` et `/media` n’enregistrent pas de logs utilisateurs 

- Implémentation : absence de champ  dans la base SQLite ; configuration Nginx et applicative limitant les données journalisées sur les routes sensibles.

- But : Privacy

**AC-UP-13 — Gestion sécurisée des erreurs**

- Critère : les erreurs retournent un message clair pour l’utilisateur. mais sans divulguer d’informations internes (chemins serveur, versions, stacktrace...).

- But : éviter la divulgation d’informations techniques exploitables.

- Implémentation : gestion des erreurs Flask avec réponses JSON adaptés.

- Vérification : provoquer une erreur (upload invalide ou endpoint inexistant) et vérifier l’absence de stacktrace (Error) dans la réponse.
---
