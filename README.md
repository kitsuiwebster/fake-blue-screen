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

## Développement local

```bash
make install        # installe les dépendances frontend + backend

# Terminal 1
make back           # Flask sur http://localhost:5000

# Terminal 2
make dev            # Angular sur http://localhost:4200

make test           # tests unitaires Angular
```

---

## Production (VPS)

**Premier déploiement :**

```bash
git clone <repo> /opt/fake-blue-screen
cd /opt/fake-blue-screen
mkdir -p data/media
docker compose up -d --build
```

**CI/CD (push sur `main`) :**

1. Trivy · `yarn audit` · tests · SonarQube
2. Build Angular
3. FTPS → Hostinger (frontend)
4. SSH → `docker compose up -d --build` (backend)

**Secrets GitHub requis :**

| Secret | Description |
|--------|-------------|
| `FTP_SERVER` | Hostinger FTPS hostname |
| `FTP_USERNAME` | FTP username |
| `FTP_PASSWORD` | FTP password |
| `VPS_HOST` | IP ou hostname du VPS |
| `VPS_USER` | Utilisateur SSH |
| `VPS_SSH_KEY` | Clé SSH privée (PEM) |
| `VPS_APP_DIR` | Dossier de l'app sur le VPS |
| `SONAR_TOKEN` | Token SonarQube |

> Ne jamais lancer `docker compose down -v` en prod — cela supprime `./data` (SQLite + images).
