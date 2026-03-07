# Documentation — Fake Error Screen Generator

**Module :** Fil Rouge Master 1 Cybersécurité
**Application :** [screenfake.xyz](https://screenfake.xyz)

---

## Sommaire

1. [Projet (Général)](#1-projet-général)
   - [Description du projet](#11-description-du-projet)
   - [Schéma de l'architecture](#12-schéma-de-larchitecture)
2. [Sécurité & Conception](#2-sécurité--conception)
   - [Mini cahier des charges sécurité](#21-mini-cahier-des-charges-sécurité)
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

→ [`readme.md`](./readme.md)
# Fake Error Screen Generator

Générateur d'écrans d'erreur factices en plein écran — Windows BSOD, Linux Kernel Panic, macOS, Ransomware.

**[screenfake.xyz](https://screenfake.xyz)**

---

## Features

- 15 écrans prédéfinis (Windows, Linux, macOS, Ransomware)
- Mode plein écran — touche **Q** pour quitter
- URL partageable par écran (`?screen=<name>`)
- Upload privé local (non transmis au serveur)
- Galerie publique : upload anonyme, re-encodage WebP, EXIF supprimé
- URL partageable par image (`?image=<uuid>`)
- Pagination · Conservation 3 ans · Suppression instantanée

---

## Stack

Angular 20 · Flask · Gunicorn · Nginx · SQLite · Docker Compose

Frontend sur Hostinger, backend sur VPS (Docker Compose).


---

### 1.2 Schéma de l'architecture

![Architecture Screenfake](./images/Screenfake%20Drawio%20(1).png)

Le cahier des charges a été élaboré en intégrant des exigences de sécurité dès la phase de conception, conformément aux principes de security by design et de privacy by design.
→ Le cahier des charges se trouve dans : [`cahier_des_charges.md`](./cahier_des_charges.md)

---

## 2. Sécurité & Conception

### 2.1 cahier des charges  (résumé)

Cette section présente un résumé des principaux mécanismes de sécurité appliqués dans l’application. Les exigences complètes sont détaillées dans le document.
→ [`cahier_des_charges.md`](./cahier_des_charges.md) 


### 2.2 Liste des exigences de sécurité

Ce document définit 14 critères de sécurité pour les fonctionnalités suivantes :  Upload, Galerie publique, mode plein écran, partage d’URL et la suppression des images.

→ [`Security_acceptance_criteria.md`](./Security_acceptance_criteria.md)

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

Critères d'acceptation détaillés par fonctionnalité avec critères de conception, cas de test et comportements attendus.

→ [`Security_acceptance_criteria.md`](./Security_acceptance_criteria.md)


---

### 3.4 Definition of Done sécurité

Checklist qui permet de considérer une fonctionnalité comme terminée. Inclue : Tests, scans CI (Trivy), configuration du déploiement (CD), gestion des secrets.

→ [`definition_of_done.md`](./definition_of_done.md)

---

## 4. Analyse de Risques (EBIOS Simplifiée)

Matrice EBIOS Risk Manager simplifiée : sur le projet.

→ [`Ebios Matrice.xlsx`](./Ebios Matrice.xlsx)

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

### 5.2 Mesures de sécurité mises en place (Preuve d'implémentation)


**Security by Design :** Les contrôles de sécurité sont intégrés dès la conception de chaque fonctionnalité. Points clés :
- Validation et réencodage des images (Pillow) — Le fichier envoyé est traité avec la bibliothèque Pillow afin de vérifier qu’il peut être décodé comme une image valide, puis il est réencodé dans un nouveau fichier WebP.

- Génération d’identifiant aléatoire côté serveur (UUID v4) — Le nom du fichier est généré par le serveur à l’aide d’un identifiant UUID v4, ce qui empêche 
l’utilisateur d’influencer le nom ou le chemin du fichier stocké.

- Reverse proxy Nginx (backend non exposé) — L’application Flask n’est pas accessible directement depuis Internet et écoute uniquement en interne. Toutes les requêtes passent par Nginx.

- Limitation du nombre d’uploads par IP (rate limiting) — Une règle Nginx limite les uploads à un maximum d’un fichier toutes les 20 secondes par adresse IP.

**Privacy by Design :**
- Aucune IP stockée en base de données

- Aucun EXIF conservé après re-encodage

- Désactivation des logs sur endpoint sensible — Les requêtes vers /api/uploads et /media ne sont pas logs dans Nginx (Ex : Ip, Date, User-agent...).

- Upload privé côté navigateur — Lorsqu’un utilisateur choisit un upload privé, l’image est stockée localement dans le navigateur (IndexedDB) et n’est pas envoyée au serveur.
---

le détail est disponible ici :  (docs/Security_acceptance_criteria.md)
---

### 5.3 Pipeline DevSecOps

→ [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

```
Push sur main
    │
    ├── Trivy (scan filesystem) ──────── HIGH/CRITICAL → bloquant
    ├── yarn audit --level high ───────── HIGH/CRITICAL → bloquant
    ├── Tests unitaires (ChromeHeadless) ─ tout échec → bloquant
    ├── SonarQube Cloud ────────────────── Quality Gate failed → bloquant
    ├── Build Angular
    ├── Deploy frontend (FTPS → Hostinger)
    └── Deploy backend (SSH → docker compose up)
```

---

### 5.4 Preuves des scans / contrôles sécurité

| Outil | Ce qu'il contrôle | Où trouver les résultats |
|-------|------------------|--------------------------|
| **Trivy** | Vulnérabilités HIGH/CRITICAL filesystem + dépendances | GitHub → Security → Code scanning |
| **yarn audit** | Vulnérabilités npm HIGH/CRITICAL | GitHub → Actions → Logs CI |
| **SonarQube Cloud** | Qualité code, bugs sécurité, coverage | SonarQube Cloud dashboard |
| **Tests Angular** | Validation inputs, parsing URL, comportements sécurité | GitHub → Actions → Logs CI |

> Les résultats Trivy sont exportés au format SARIF et remontés automatiquement dans l'onglet **Security > Code scanning** du repository GitHub à chaque déploiement.

---

## 6. Suivi & Gouvernance

### Tableau de bord sécurité (KPIs / KRIs)

> 🔲 **À définir** — section en cours de construction.

Les indicateurs retenus couvriront :
- Résultats des scans CI (Trivy, yarn audit, SonarQube)
- Contrôles applicatifs (rate limit, validation uploads, headers)
- Indicateurs de risque (espace disque, volume d'abus, vulnérabilités nouvelles)
- Gouvernance (dérogations documentées, décisions sécurité)
