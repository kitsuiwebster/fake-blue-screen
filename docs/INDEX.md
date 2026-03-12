# Documentation — Fake Error Screen Generator

**Module :** Fil Rouge Master 1 Cybersécurité
**Application :** [screenfake.xyz](https://screenfake.xyz)

---

## Sommaire

1. [Projet (Général)](#1-projet-général)
   - [Description du projet](#11-description-du-projet)
   - [Schéma de l'architecture](#12-schéma-de-larchitecture)
2. [Sécurité & Conception](#2-sécurité--conception)
   - [Cahier des charges sécurité](#21-cahier-des-charges-résumé)
   - [Liste des exigences de sécurité](#22-liste-des-exigences-de-sécurité)
3. [Agile & Gestion de Projet](#3-agile--gestion-de-projet)
   - [Backlog sécurité](#31-backlog-sécurité)
   - [Security User Stories](#32-security-user-stories)
   - [Acceptance Criteria sécurité](#33-acceptance-criteria-sécurité)
   - [Definition of Done sécurité](#34-definition-of-done-sécurité)
4. [Analyse de Risques (EBIOS)](#4-analyse-de-risques-ebios-simplifiée)
5. [Technique & DevSecOps](#5-technique--devsecops)
   - [Application fonctionnelle](#51-application-fonctionnelle)
   - [Mesures de sécurité mises en place](#52-mesures-de-sécurité-mises-en-place)
   - [Pipeline DevSecOps](#53-pipeline-devsecops)
   - [Preuves des scans / contrôles sécurité](#54-preuves-des-scans--contrôles-sécurité)
6. [Suivi & Gouvernance](#6-suivi--gouvernance)

---

## 1. Projet (Général)

### 1.1 Description du projet

Générateur d'écrans d'erreur / virus en plein écran — Windows BSOD, Linux Kernel Panic, macOS, Ransomware.

**[screenfake.xyz](https://screenfake.xyz)**

**Fonctionnalités :**
- 15 écrans prédéfinis (Windows, Linux, macOS, Ransomware)
- Mode plein écran — touche **Q** pour quitter
- Upload privé local (non transmis au serveur)
- Galerie publique : upload anonyme, re-encodage WebP, EXIF supprimé
- URL partageable par image (`?image=<uuid>`)
- Data privacy · Conservation 3 ans · Suppression instantanée

## Stack

Angular 20 · Flask · Gunicorn · Nginx · SQLite · Docker Compose

Frontend sur Hostinger, backend sur VPS (Docker Compose).
---

### 1.2 Schéma de l’architecture

![Architecture Screenfake](./images/Screenfake%20Drawio%20(1).png)

---

## 2. Sécurité & Conception

Le cahier des charges a été élaboré en intégrant des exigences de sécurité dès la phase de conception, conformément aux principes de **security by design** et de **privacy by design**.

### 2.1 Cahier des charges (résumé)

→ Détail complet : [`cahier_des_charges.md`](./cahier_des_charges.md)

**Security by Design :**
- Validation et analyse et re-encodage Pillow (WebP) — l'image original n’est pas conservé
- Génération UUID v4 côté serveur — Le nom du fichier est aléatoire avec un ID UUIID V4. 
- Nginx comme point d’entrée unique — Flask n’est pas exposé sur le WAN
- Rate limit : 1 upload chaque 20 s par IP (Nginx)
- CSP `frame-ancestors ‘none’` — protection contre le clickjacking
- Contrôle strict des paramètres URL (liste blanche)

**Privacy by Design :**
- Aucune IP stockée en base de données
- Aucun EXIF conservé après re-encodage
- Désactivation des logs sur endpoint sensible — Les requêtes vers /api/uploads et /media ne sont pas logs dans Nginx (Ex : Ip, Date, User-agent...).
- Upload privé côté navigateur — Lorsqu’un utilisateur choisit un upload privé, l’image est stockée localement dans le navigateur (IndexedDB) et n’est pas envoyée au serveur.
---
**Headers de sécurité :** `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`

### 2.2 Liste des exigences de sécurité

Cette partie définit les 13 critères de sécurité pour les fonctionnalités suivantes :  Upload, Galerie publique, mode plein écran, partage d’URL et la suppression des images.

→ Détail complet : [`Security_acceptance_criteria.md`](./Security_acceptance_criteria.md) — voir la section §5.2 de ce document pour les preuves d’implémentation.

| ID | Critère |
|---|---|
| AC-UP-01 | Limites de taille fichier (10.1mo) |
| AC-UP-02 | Rate limiting (1 upload/20s par IP) |
| AC-UP-03 | Validation du contenu fichier (magic bytes / Pillow decode) |
| AC-UP-04 | Re-encodage obligatoire WebP — original non conservé |
| AC-UP-05 | Supression des métadonnées (EXIF/XMP) |
| AC-UP-06 | Générations de noms des fichiers (UUID v4) |
| AC-UP-07 | Lecture seule `/media` (read-only) |
| AC-UP-08 | Protection du dossier `/media`(nosniff, autoindex off) |
| AC-UP-09 | Supression des images|
| AC-UP-10 | Comportement en cas de disque plein (503/507) |
| AC-UP-11 | Timeouts upload image  |
| AC-UP-12 | Logs anonymisés |
| AC-UP-13 | Error-Handling - Messages d'erreur contrôlés | |

---

## 3. Agilité & Gestion de Projet

Le développement est organisé par fonctionnalités, La sécurité est intégrée dès la conception.
Pour chaque fonctionnalité, le workflow suivant a été appliqué :

1. **Security User Story** — Définit un besoin fonctionnel du point de vue d'un utilisateurs ou d'un système.
Acceptance Criteria — critères testables permettant de vérifier que les fonctionnalités implémentées respectent les exigences définies.

3. **Definition of Done** — Définit les conditions pour considérer une tâche ou une fonctionnalité comme terminée.
4. **Backlog** — Definit les améliorations et mesures de sécurité pour des évolutions futures.
---

### 3.1 Backlog 

Definit les améliorations et mesures de sécurité pour des évolutions futures. organisées par feature (Catalogue, Upload, API, Infrastructure).

→ [`backlogs.md`](./backlogs.md)


---

### 3.2 Security User Stories

16 userstories (SUS-001 à SUS-016) couvrant : plein écran, responsive, partage d'URL, upload, galerie, sécurité transversale.

→ [`userstory.md`](./userstory.md)

---

### 3.3 Acceptance Criteria sécurité

La liste des critères est définie en §2.2. Ce document ajoute pour chaque critère : les cas de test, les comportements attendus et les conditions de rejet.

→ [`Security_acceptance_criteria.md`](./Security_acceptance_criteria.md)


---

### 3.4 Definition of Done sécurité

Checklist qui permet de considérer une fonctionnalité comme terminée. Inclue : Tests, scans CI (Trivy), configuration du déploiement (CD), gestion des secrets.

→ [`definition_of_done.md`](./definition_of_done.md)

---

## 4. Analyse de Risques (EBIOS Simplifiée)

Matrice EBIOS Risk Manager simplifiée appliquée au projet : identification des biens supports, des sources de risque, des scénarios d'attaque et évaluation vraisemblance/impact.

Risques principaux identifiés : upload malveillant (DoS disque/CPU, fichier piégé), fuite de métadonnées (EXIF/localisation), énumération d'IDs, abus de la galerie publique.

→ [`Ebios Matrice.xlsx`](./Ebios%20Matrice.xlsx)

---

## 5. Partie Technique & DevOps

### 5.1 Rappel : Synthèse de l'Application 

**PROD :** [screenfake.xyz](https://screenfake.xyz)

Fonctionnalités déployées :
- 15 écrans prédéfinis (Windows, Linux, macOS, Ransomware)
- Mode plein écran (touche Q)
- Upload privé local (IndexedDB) + Upload Publique. 
- Upload publique avec upload anonyme
- Suppression par token, expiration 3 ans
---

### 5.2 Mesures de sécurité mises en place (Preuves d’implémentation)

Cette section apporte les preuves concrètes que les exigences définies dans [`Security_acceptance_criteria.md`](./Security_acceptance_criteria.md) sont implémentées et actives en PRODUCTION.

**AC-UP-01 — Limites de taille multi-couches**
- Critères : taille maximale des fichiers limitée à 10.1 MB.
- Implémentation : [`backend/app.py` L36](../backend/app.py#L36) — constante `MAX_BYTES = 10 * 1024 * 1024` · [`backend/app.py` L253-254](../backend/app.py#L253) — rejet si dépassement · [`docs/nginx_setup.md` L52](./nginx_setup.md#L52) — `client_max_body_size 10m` (double couche Nginx)
- Vérification : screen test image + message de rejet

![alt text](<Screenshot 2026-03-09 at 18.18.18.png>)
![alt text](<Screenshot 2026-03-09 at 18.47.01.png>)
---

**AC-UP-02 — Rate limiting (1 upload/20s par IP)**
- Critères : 1 upload / 20 s / IP sur `POST /api/uploads` — empêcher la saturation disque/CPU.
- Implémentation : [`backend/app.py` L26-30](../backend/app.py#L26) — initialisation `flask-limiter` · [`backend/app.py` L246](../backend/app.py#L246) — décorateur `@limiter.limit("3 per minute")` · [`docs/nginx_setup.md` L12](./nginx_setup.md#L12) — `limit_req_zone 3r/m` · [`docs/nginx_setup.md` L55](./nginx_setup.md#L55) — `limit_req zone=upload_limit burst=1 nodelay`
- Vérification : screen test 2 uploads < 20 s 
![alt text](<Screenshot 2026-03-09 at 18.23.23.png>)
---

**AC-UP-03 — Validation du contenu fichier (magic bytes / Pillow decode)**
- Critères : rejet si Pillow ne peut pas décoder l’image — types acceptés : png/jpg/jpeg/webp.
- Implémentation : [`backend/app.py` L257-263](../backend/app.py#L257) — `Image.open()` + `img.verify()` + `img.convert("RGB")` dans un bloc `try/except` — tout fichier non-image est rejeté avec 400
- Vérification : screen test `.exe` renommé en `.jpg` + message de rejet
![alt text](<Screenshot 2026-03-09 at 18.21.26.png>)
![alt text](<Screenshot 2026-03-09 at 18.21.14.png>)
---

**AC-UP-04 — Re-encodage obligatoire WebP — original non conservé**
- Critères : le serveur re-encode systématiquement en WebP via Pillow — l’original n’est jamais conservé.
- Implémentation : [`backend/app.py` L265-268](../backend/app.py#L265) — `rgb.save(output, format="WEBP", quality=85)` — seul le résultat re-encodé est écrit sur disque (`file_path.write_bytes(webp_data)` L280), le buffer original `data` est abandonné
- Vérification : screen URL publique + vérification format WebP servi

![alt text](<Screenshot 2026-03-09 at 18.25.26.png>)
---

**AC-UP-05 — Suppression des métadonnées (EXIF/XMP)**
- Critères : aucune métadonnée conservée après re-encodage (EXIF/XMP).
- Implémentation : [`backend/app.py` L261](../backend/app.py#L261) — `img.convert("RGB")` supprime le canal alpha et les métadonnées EXIF/XMP · [`backend/app.py` L266-267](../backend/app.py#L266) — `rgb.save(..., format="WEBP")` sans paramètre `exif=` → aucune métadonnée transférée dans l'output
- Vérification : screen outil EXIF sur image uploadée + absence de données GPS

Avant publication : ![alt text](<Screenshot 2026-03-09 at 18.29.39.png>)

Après publication : ![alt text](<Screenshot 2026-03-09 at 18.33.20.png>)
---

**AC-UP-06 — Génération de noms de fichiers (UUID v4)** / reste à valider
- Critères : ID UUID v4 généré côté serveur.
- Implémentation : [`backend/app.py` L275](../backend/app.py#L275) — `image_id = str(uuid.uuid4())` — le nom du fichier sur disque est `{uuid}.webp`, aucun nom utilisateur n'est conservé
- Vérification : screen nom de fichier dans `/media` + format UUID
![alt text](<Screenshot 2026-03-10 at 16.32.37.png>)
---

**AC-UP-07 — Lecture seule `/media`**
- Critères : les fichiers du dossier `/media` sont accessibles en lecture uniquement et ne peuvent pas être modifiés ou uploadés directement depuis Internet.
- Implémentation : [`docs/nginx_setup.md` L70-72](./nginx_setup.md#L70) — bloc `limit_except GET HEAD { deny all; }` dans le `location /media/` — tout verbe autre que GET/HEAD est bloqué au niveau Nginx avant d'atteindre Flask
- Vérification : screen test PUT/POST sur `/media/...` + réponse 404/405

![alt text](<Screenshot 2026-03-09 at 18.44.22.png>)
---

**AC-UP-08 — Protection du dossier `/media`**
- Critères : `X-Content-Type-Options: nosniff`, `Content-Type: image/webp`, `autoindex off` actifs sur `/media/`.
- Implémentation : [`docs/nginx_setup.md` L69-75](./nginx_setup.md#L69) — `autoindex off` · `add_header X-Content-Type-Options "nosniff" always` · `add_header Content-Type "image/webp" always` — les trois directives sont dans le bloc `location /media/`
- Vérification : screen headers de réponse + absence de listing du dossier

![alt text](<Screenshot 2026-03-09 at 18.40.48.png>)

![alt text](<Screenshot 2026-03-09 at 18.42.48.png>)
---

**AC-UP-09 — Signalement → suppression immédiate** 
- Critères : un signalement déclenche la suppression fichier + DB (`status=deleted`) — réponse API sans indication sur l’existence de l’ID.
- Implémentation : [`backend/app.py` L356-421](../backend/app.py#L356) — route `POST /api/delete` : `Path(row["path"]).unlink(missing_ok=True)` supprime le fichier disque · `UPDATE uploads SET status = ‘deleted’` marque en base · réponse uniforme `{"success": True}` ou `{"error": "Not found"}` sans fuite d’information
- Vérification : screen test signalement + vérification suppression en base

![alt text](<Screenshot 2026-03-10 at 16.35.14.png>)

après supression : 

![alt text](<Screenshot 2026-03-10 at 16.36.32.png>)


---

**AC-UP-10 — Comportement en cas de disque plein** / reste à prouver
- Critères : si espace disque 90% < uploads refusés avec message d’erreur simple (503/507).
- Implémentation : [`backend/app.py` L271-273](../backend/app.py#L271) — `shutil.disk_usage(MEDIA_DIR)` · `if disk.used / disk.total > 0.90:` → retourne 507 avec message générique `"Service temporarily unavailable"` (commentaire `# AC-UP-11` présent dans le code)
- Vérification : screen test simulation disque plein + réponse 503/507

![alt text](<Screenshot 2026-03-10 at 16.38.21.png>)

---
 
**AC-UP-11 — Timeouts upload image** / reste à prouver
- Critères : timeout traitement image + timeout Gunicorn actifs — éviter les workers bloqués.
- Implémentation : [`backend/Dockerfile` L16](../backend/Dockerfile#L16) — `gunicorn --timeout 30` (worker tué après 30 s) · [`docs/nginx_setup.md` L64](./nginx_setup.md#L64) — `proxy_read_timeout 120` sur `/api/uploads` (timeout Nginx côté reverse proxy)
- Vérification : 

![alt text](<Screenshot 2026-03-10 at 16.39.10.png>)

---

**AC-UP-12 — Logs anonymisés** / reste à prouver
- Critères : pas d’IP stockée en DB — `access_log off` sur `/api/uploads` et `/media`.
- Implémentation : [`docs/nginx_setup.md` L57](./nginx_setup.md#L57) — `access_log off` dans `location = /api/uploads` · [`docs/nginx_setup.md` L76](./nginx_setup.md#L76) — `access_log off` dans `location /media/` · [`backend/app.py` L84-96](../backend/app.py#L84) — schéma table `uploads` : colonnes `id, created_at, expires_at, status, path, bytes, delete_token_hash` — aucune colonne IP
- Vérification : screen schéma SQLite table `uploads` + config Nginx access_log

---

**AC-UP-13 — Error Handling — Messages d’erreur contrôlés**
- Critères : messages explicites côté utilisateur (format, taille, surcharge) — aucune fuite interne (stacktrace, chemins serveur, versions libs).
- Implémentation : [`backend/app.py` L429-453](../backend/app.py#L429) — handlers Flask pour 404, 405, 413, 429, 500 — chaque handler retourne un JSON `{"error": "..."}` avec un message générique, sans stacktrace ni chemin serveur · messages inline dans la route upload : `"File too large (max 10 MB)"`, `"Invalid or unsupported image"`, `"Service temporarily unavailable"` (L254, L263, L273)
- Vérification : screen message d’erreur affiché 

exemple message d'erreur : 

![alt text](<Screenshot 2026-03-09 at 18.31.21.png>)
![alt text](<Screenshot 2026-03-09 at 18.47.01-1.png>)


### 5.3 Pipeline DevSecOps

La CI /CD est composés de 4 jobs. qui se suivent 2 par 2. 
le premier DUO de job est spécifique à la partie Frontend. 
le second sur la partie Backend. 


# CI CD FRONTEND
→ [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

CI FRONT END
```
    CI
    ├── Push sur main
    │
    ├── Set up Repo (Connexion au repo)
    ├── Set up Node JS + Yarn (Installation des dépendances)
    ├── Trivy (scan filesystem) ─ tout échec → bloquant
    ├── Tests unitaires (ChromeHeadless) — tout test en échec bloque le pipeline
    ├── SonarQube (Cloud) ── Quality Gate -> failed = bloquant
    ├── Build Angular
    │
    │
    CD 
    ├── Deploy frontend (FTPS → Hostinger)
```

CI Backend



SONARQUBE 

CD BACKEND

CD FRONTEND
---

### 5.4 Preuves CI / des scans / contrôles sécurité

| Outil | Contrôle | Résultat |
|-------|------------------|--------------------------|
| **Trivy** | Vulnérabilités HIGH/CRITICAL filesystem + dépendances | GitHub → Security → Code scanning |
| **yarn audit** | Vulnérabilités npm HIGH/CRITICAL | GitHub → Actions → Logs CI |
| **SonarQube Cloud** | Qualité code, bugs sécurité, coverage | SonarQube Cloud dashboard |
| **Tests Angular** | Validation inputs, parsing URL, comportements sécurité | GitHub → Actions → Logs CI |

---

## 6. Suivi & Gouvernance

### Tableau de bord sécurité (KPIs / KRIs)

![alt text](<Screenshot 2026-03-10 at 18.37.36.png>)

https://admin.screenfake.xyz/

Identifiant : admin
Mot de passe (Fournit en message privé discord)
# Tableau de Bord : Indicateurs de Performance et de Risque

Ce document présente les **Indicateurs Clés de Performance (KPIs)** et les **Indicateurs Clés de Risque (KRIs)** pour le projet. Ces indicateurs permettent de suivre la santé technique, la sécurité et la qualité du système.

---

## 1. Indicateurs de Performance (KPIs)

Les KPIs mesurent l'efficacité et la qualité des composants critiques du système.

| ID     | Indicateur               | Mesure                                      | Source                          | Objectif   |
|--------|--------------------------|---------------------------------------------|---------------------------------|------------|
| KPI-01 | Disponibilité API        | Taux de disponibilité de `/api/health`      | Prometheus / monitoring uptime  | ≥ 99,9 %   |
| KPI-02 | Vulnérabilités sécurité  | Nombre de vulnérabilités HIGH / CRITICAL   | Scan Trivy (CI GitHub Actions)  | 0          |
| KPI-03 | Qualité du code          | Résultat Quality Gate                       | SonarQube Cloud                 | PASSED     |
| KPI-04 | Tests frontend            | Taux de réussite des tests Angular          | CI GitHub Actions               | 100 %      |
| KPI-05 | Utilisation du disque    | Pourcentage d’espace utilisé dans `/media`  | `shutil.disk_usage` (app.py:271)| < 80 %     |

---

## 2. Indicateurs de Risque (KRIs)

Les KRIs identifient les risques potentiels et déclenchent des alertes en cas de dépassement de seuil.

| ID     | Indicateur                | Mesure                                      | Source                     | Alerte                     | Action (si applicable)               |
|--------|---------------------------|---------------------------------------------|----------------------------|----------------------------|--------------------------------------|
| KRI-01 | Erreurs 429 (rate limit)  | Nombre de réponses 429 sur `/api/uploads`  | Métriques Prometheus       | > 10 / heure               |                                      |
| KRI-02 | Requêtes invalides        | Nombre de réponses 400 sur `/api/uploads`  | Prometheus                 | > 20 / heure               |                                      |
| KRI-03 | Tentatives d’écriture    | Réponses 403 sur `/media` (méthode PUT/POST)| Prometheus                 | > 5 / jour                 |                                      |
| KRI-04 | Saturation disque         | Utilisation disque                          | Logique app.py:272         | > 90 %                     | Rejet automatique des uploads (HTTP 507) |
| KRI-05 | Vulnérabilités dépendances| Nouvelles vulnérabilités HIGH / CRITICAL   | `yarn audit` + Trivy (CI)  | Toute nouvelle vulnérabilité détectée |                                      |

---

## 3. Annexes

### Sources de données
- **Prometheus** : Outil de monitoring pour les métriques système et API.
- **Trivy** : Scanner de vulnérabilités intégré dans la CI GitHub Actions.
- **SonarQube Cloud** : Plateforme d'analyse de la qualité du code.
- **GitHub Actions** : Pipeline CI/CD pour l'exécution des tests et scans.

### Actions recommandées
- **KRI-04** : En cas de saturation disque (> 90 %), le système rejette automatiquement les nouveaux uploads avec un code HTTP 507.
- **KRI-05** : Toute nouvelle vulnérabilité HIGH/CRITICAL doit être traitée en priorité.

---

© 2026 - Nils Jaudon
