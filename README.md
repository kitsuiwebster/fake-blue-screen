# screenfake.xyz

Générateur d'écrans d'erreur factices en plein écran — BSOD, Kernel Panic, macOS, Ransomware & plus.

**[screenfake.xyz](https://screenfake.xyz)**

---

## Apercu

15 faux écrans d'erreur, mode plein écran, galerie publique d'images uploadées, et un panneau d'administration avec monitoring CI/CD en temps réel.

---

## Architecture

```
                  screenfake.xyz          admin.screenfake.xyz
                       |                         |
                   [ Hostinger ]            [ Hostinger ]
                   Frontend (Angular)     Admin UI (Angular)
                       |                         |
                       +------------+------------+
                                    |
                            api.screenfake.xyz
                                    |
                              [ VPS Docker ]
                              Flask + Gunicorn
                                    |
                              SQLite + Media
```

| Composant | Stack | Hebergement |
|-----------|-------|-------------|
| **Frontend** | Angular 20 | Hostinger (FTPS) |
| **Admin** | Angular 20 | Hostinger (FTPS) |
| **Backend** | Flask, Gunicorn, SQLite | VPS (Docker Compose) |

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
| **backend-cd** | Deploy VPS + health check |
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
make up             # lance le backend
make logs           # logs en continu
make down           # arret
```
