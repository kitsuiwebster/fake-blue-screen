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

**Fake Blue Screen Generator** - Une application web innovante développée en Angular qui simule des écrans d'erreur système ultra-réalistes à des fins éducatives et de démonstration.

**Stack :** Angular 20 · Flask · Gunicorn · Nginx · SQLite · Docker Compose

---

### 1.2 Schéma de l'architecture

![Architecture Screenfake](./images/Screenfake%20Drawio%20(1).png)

**Flux upload public :**
```
Client → POST /api/uploads → Nginx (rate limit 1/20s, max 10Mo)
       → Flask (Pillow : validation MIME + re-encodage WebP + suppression EXIF)
       → ./data/media/<uuid>.webp
       → Retourne { id, url, delete_token }
```

→ Spécifications complètes : [`cahier_des_charges.md`](./cahier_des_charges.md)

---

## 2. Sécurité & Conception

### 2.1 cahier des charges sécurité

→ [`cahier_des_charges.md`](./cahier_des_charges.md) — sections 3, 5

**Security by Design :** Les contrôles de sécurité sont intégrés dès la conception de chaque fonctionnalité. Points clés :
- Validation MIME réelle (Pillow) — pas de confiance sur l'extension
- Re-encodage WebP systématique — neutralise tout contenu malveillant
- UUID v4 côté serveur — chemin jamais influençable par le client
- Nginx comme seul point d'entrée — Flask non exposé directement
- Rate limiting au niveau proxy — 1 upload / 20s / IP

**Privacy by Design :**
- Aucune IP stockée en base de données
- Aucun EXIF conservé après re-encodage
- `access_log off` sur `/api/uploads` et `/media`
- Upload privé : stockage 100% local (IndexedDB), rien ne transite au réseau

---

### 2.2 Liste des exigences de sécurité

→ [`Security_acceptance_criteria.md`](./Security_acceptance_criteria.md)

14 critères d'acceptation sécurité pour l'upload (AC-UP-01 à AC-UP-14), plus les critères pour la galerie, le mode plein écran, le partage d'URL et la suppression par token.

---

## 3. Agile & Gestion de Projet

Le projet suit une approche **feature-driven avec intégration sécurité continue**. Pour chaque fonctionnalité :

1. **User Story sécurité** — définit le besoin de sécurité du point de vue système
2. **Acceptance Criteria** — conditions binaires testables avant intégration
3. **Definition of Done** — checklist go/no-go avant déploiement
4. **Backlog sécurité** — mesures identifiées mais hors périmètre MVP, priorisées pour les évolutions

```
Feature identifiée
      │
      ▼
Security User Story (SUS-XXX)
      │
      ▼
Acceptance Criteria sécurité (AC-UP-XX)
      │
      ▼
Développement + tests
      │
      ▼
Definition of Done (checklist go/no-go)
      │
      ▼
Déploiement CI/CD (scans automatiques)
```

---

### 3.1 Backlog sécurité

→ [`backlogs.md`](./backlogs.md)

Mesures de sécurité identifiées pour les fonctionnalités futures, organisées par feature (Catalogue, Upload, API, Infrastructure).

---

### 3.2 Security User Stories

→ [`userstory.md`](./userstory.md)

16 user stories sécurité (SUS-001 à SUS-016) couvrant : plein écran, responsive, partage d'URL, upload, galerie, sécurité transversale.

---

### 3.3 Acceptance Criteria sécurité

→ [`Security_acceptance_criteria.md`](./Security_acceptance_criteria.md)

Critères d'acceptation détaillés par fonctionnalité avec hypothèses de conception, cas de test et comportements attendus.

---

### 3.4 Definition of Done sécurité

→ [`definition_of_done.md`](./definition_of_done.md)

Conditions minimales avant mise en production : tests, scans CI, configuration déploiement, privacy, secrets, monitoring.

---

## 4. Analyse de Risques (EBIOS Simplifiée)

→ [`Ebios Matrice.xlsx`](./Ebios Matrice.xlsx)

Matrice EBIOS Risk Manager simplifiée : identification des biens supports, sources de risque, scénarios d'attaque et mesures de traitement.

---

## 5. Technique & DevSecOps

### 5.1 Application fonctionnelle

**Production :** [screenfake.xyz](https://screenfake.xyz)

Fonctionnalités déployées :
- 15 écrans prédéfinis (Windows, Linux, macOS, Ransomware)
- Mode plein écran (touche Q)
- Upload privé local (IndexedDB)
- Galerie publique avec upload anonyme
- Suppression par token, expiration 3 ans

---

### 5.2 Mesures de sécurité mises en place

→ [`cahier_des_charges.md`](./cahier_des_charges.md) — sections 3, 5
→ [`Security_acceptance_criteria.md`](./Security_acceptance_criteria.md)

| Couche | Mesures |
|--------|---------|
| **Nginx** | Rate limit upload, `client_max_body_size 10m`, `/media` read-only, `autoindex off` |
| **Flask** | Validation MIME (Pillow), re-encodage WebP, UUID v4, hash SHA-256 delete_token |
| **Headers** | `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, CSP `frame-ancestors 'none'` |
| **Privacy** | Zéro IP/EXIF stockés, `access_log off` sur uploads et media |
| **Secrets** | GitHub Secrets uniquement, variables d'environnement Docker |

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
