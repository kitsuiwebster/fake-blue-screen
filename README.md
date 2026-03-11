# screenfake.xyz

Generateur d'ecrans d'erreur factices en plein ecran — BSOD, Kernel Panic, macOS, Ransomware & plus.

**[screenfake.xyz](https://screenfake.xyz)**

---

## Apercu

15 faux ecrans d'erreur, mode plein ecran, galerie publique d'images uploadees, et un panneau d'administration avec monitoring CI/CD en temps reel.

---

## Architecture

```
               screenfake.xyz
                     |
                [ Hostinger ]
               Frontend (Angular)
                     |
                     |
        api.screenfake.xyz + admin.screenfake.xyz
                     |
               [ VPS Docker ]
          ┌──────────┼──────────┐
          |          |          |
     Flask API    Admin UI    nginx
     (Gunicorn)  (Angular)   (reverse proxy)
          |
     SQLite + Media
```

| Composant | Stack | Hebergement |
|-----------|-------|-------------|
| **Frontend** | Angular 20 | Hostinger (FTPS) |
| **Backend** | Flask, Gunicorn, SQLite | VPS (Docker Compose) |
| **Admin** | Angular 20, nginx | VPS (Docker Compose) |

---

## CI/CD

Pipeline en Y — les 2 CI tournent en parallele, puis SonarQube, puis deploiement sequentiel.

```
frontend-ci ──┐
              ├── sonarqube ── backend-cd ── frontend-cd
backend-ci  ──┘
```

| Job | Etapes |
|-----|--------|
| **frontend-ci** | Trivy, tests Angular (Karma), build |
| **backend-ci** | Ruff, Bandit, Trivy, pytest, build Docker |
| **sonarqube** | Scan qualite full repo |
| **backend-cd** | Deploy VPS (backend + admin) + health check |
| **frontend-cd** | Deploy FTPS Hostinger |

---

## Dev local

```bash
make install        # deps frontend + backend
make dev-back       # Flask :5000
make dev-front      # Angular :4200
make test           # tests unitaires
```

## Docker Compose

```bash
make up             # lance backend + admin
make logs           # logs en continu
make down           # arret
```
