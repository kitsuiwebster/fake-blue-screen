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

Cette partie définit les 14 critères de sécurité pour les fonctionnalités suivantes :  Upload, Galerie publique, mode plein écran, partage d’URL et la suppression des images.

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
| AC-UP-10 | Blacklist de hash d'images (SHA-256) |
| AC-UP-11 | Comportement en cas de disque plein (503/507) |
| AC-UP-12 | Timeouts upload image  |
| AC-UP-13 | Logs anonymisés |
| AC-UP-14 | Error-Handling - Messages d'erreur contrôlés | |

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
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen test image + message de rejet

---

**AC-UP-02 — Rate limiting (1 upload/20s par IP)**
- Critères : 1 upload / 20 s / IP sur `POST /api/uploads` — empêcher la saturation disque/CPU.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen test 2 uploads < 20 s + réponse HTTP 429

---

**AC-UP-03 — Validation du contenu fichier (magic bytes / Pillow decode)**
- Critères : rejet si Pillow ne peut pas décoder l’image — types acceptés : png/jpg/jpeg/webp.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen test `.exe` renommé en `.jpg` + message de rejet

---

**AC-UP-04 — Re-encodage obligatoire WebP — original non conservé**
- Critères : le serveur re-encode systématiquement en WebP via Pillow — l’original n’est jamais conservé.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen URL publique + vérification format WebP servi

---

**AC-UP-05 — Suppression des métadonnées (EXIF/XMP)**
- Critères : aucune métadonnée conservée après re-encodage (EXIF/XMP).
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen outil EXIF sur image uploadée + absence de données GPS

---

**AC-UP-06 — Génération de noms de fichiers (UUID v4)**
- Critères : ID UUID v4 généré côté serveur.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen nom de fichier dans `/media` + format UUID

---

**AC-UP-07 — Lecture seule `/media`**
- Critères : les fichiers du dossier `/media` sont accessibles en lecture uniquement et ne peuvent pas être modifiés ou uploadés directement depuis Internet.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen test PUT/POST sur `/media/...` + réponse 404/405

---

**AC-UP-08 — Protection du dossier `/media`**
- Critères : `X-Content-Type-Options: nosniff`, `Content-Type: image/webp`, `autoindex off` actifs sur `/media/`.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen headers de réponse + absence de listing du dossier

---

**AC-UP-09 — Signalement → suppression immédiate**
- Critères : un signalement déclenche la suppression fichier + DB (`status=deleted`) — réponse API sans indication sur l’existence de l’ID.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen test signalement + vérification suppression en base

---

**AC-UP-10 — Blacklist de hash d’images (SHA-256)** (à passer en backlog)
- Critères : hash SHA-256 calculé sur la version re-encodée — rejet si présent dans la denylist.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen test image blacklistée + message de rejet

---

**AC-UP-11 — Comportement en cas de disque plein**
- Critères : si espace disque 90% < uploads refusés avec message d’erreur simple (503/507).
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen test simulation disque plein + réponse 503/507

---

**AC-UP-12 — Timeouts upload image**
- Critères : timeout traitement image + timeout Gunicorn actifs — éviter les workers bloqués.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen test upload image lourde/malformée + timeout déclenché

---

**AC-UP-13 — Logs anonymisés**
- Critères : pas d’IP stockée en DB — `access_log off` sur `/api/uploads` et `/media`.
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen schéma SQLite table `uploads` + config Nginx access_log

---

**AC-UP-14 — Error Handling — Messages d’erreur contrôlés**
- Critères : messages explicites côté utilisateur (format, taille, surcharge) — aucune fuite interne (stacktrace, chemins serveur, versions libs).
- Implémentation : (screen ou lien vers le bout de code)
- Vérification : screen message d’erreur affiché + absence d’info interne dans la réponse

### 5.3 Pipeline DevSecOps

La CI /CD est composés de 4 jobs. qui se suivent 2 par 2. 
le premier DUO de job est spécifique à la partie Frontend. 
le second sur la partie Backend. 


# CI CD FRONTEND
→ [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

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

> 🔲 **À définir** — section en cours de construction.

Les indicateurs retenus couvriront :
- Résultats des scans CI (Trivy, yarn audit, SonarQube)
- Contrôles applicatifs (rate limit, validation uploads, headers)
- Indicateurs de risque (espace disque, volume d'abus, vulnérabilités nouvelles)
- Gouvernance (dérogations documentées, décisions sécurité)
