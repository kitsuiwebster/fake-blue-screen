# Fake Error Screen Generator

A web application to display realistic OS error screens (Windows BSOD, macOS/Linux Kernel Panic, Ransomware) in fullscreen for educational demonstrations. Supports anonymous public image sharing with a community gallery.

**Visit: [screenfake.xyz](https://screenfake.xyz)**

---

## Architecture

```
Nginx (port 80)
├── /           → Angular SPA  (./data/html/)
├── /media/     → Public images (./data/media/, read-only)
└── /api/       → Flask + Gunicorn (port 5000)

Persistence: ./data/
├── app.db      SQLite database
└── media/      Public images (WebP)
```

**Stack:** Angular 20 · Flask · Gunicorn · Nginx · SQLite · Docker Compose

---

## Features

### Catalogue
- 15 predefined error screens: Windows (BSOD, ACPI), Linux Kernel Panic (3 variants), macOS (panic + 5 startup errors), Ransomware (WannaCry, Petya, Retis)
- Fullscreen mode — press **Q** to exit on desktop
- Shareable URL per screen (`?screen=<name>`)
- Private local upload — stays in browser, not transmitted

### Public Gallery
- Anonymous upload → published immediately in the community gallery
- Images re-encoded to WebP server-side (EXIF stripped, polyglots neutralised)
- Delete token shown once at upload — store it to remove your image later
- Shareable URL (`?image=<uuid>`) reconstructs the fullscreen view
- Paginated gallery (24 items/page)
- 3-year automatic retention, daily cleanup job

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check → `{ status: "ok" }` |
| `POST` | `/api/uploads` | Upload image (multipart) → `{ id, url, delete_token }` |
| `GET` | `/api/gallery?page=&limit=` | Paginated gallery → `{ items, page, limit, total }` |
| `POST` | `/api/delete` | Delete image → `{ id, delete_token }` |

**Limits:** 10 MB max · PNG/JPG/WebP only · 1 upload / 20 s / IP

---

## Security & Privacy

- Server-side image validation (Pillow open + verify)
- Re-encoding to WebP strips EXIF and neutralises polyglot files
- UUID4 filenames — no user data in paths
- Delete tokens stored hashed (SHA-256), shown once
- No IP, User-Agent or Referer stored
- Rate limiting via Nginx (`limit_req_zone`, 3 req/min ≈ 1/20 s)
- CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`
- `/media/` served read-only

---

## Deployment

### Prerequisites
- VPS with Docker + Docker Compose
- FTP access (FTPS) for frontend deployment

### First setup on VPS

```bash
git clone <repo> /opt/fake-blue-screen
cd /opt/fake-blue-screen
mkdir -p data/html data/media
docker compose up -d
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `FTP_SERVER` | FTPS server hostname |
| `FTP_USERNAME` | FTP username |
| `FTP_PASSWORD` | FTP password |
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | SSH username |
| `VPS_SSH_KEY` | Private SSH key (PEM) |
| `VPS_APP_DIR` | App directory on VPS (e.g. `/opt/fake-blue-screen`) |
| `SONAR_TOKEN` | SonarQube token (optional) |

### CI/CD pipeline (on push to `main`)

1. `yarn install` → Trivy scan → `yarn audit` → unit tests → SonarQube
2. `yarn build`
3. FTPS → deploy Angular build to `VPS_APP_DIR/data/html/`
4. SSH → `docker compose pull && docker compose up -d --remove-orphans`

> **Never** run `docker compose down -v` in production — it deletes `./data` (SQLite + images).

---

## Local development

```bash
# Frontend
yarn install
yarn start          # http://localhost:4200

# Backend (requires Python 3.12+)
cd backend
pip install -r requirements.txt
DATA_DIR=./dev-data python app.py   # http://localhost:5000

# Full stack with Docker
docker compose up --build
```

---

## Available screens

| OS | Screen |
|----|--------|
| Windows | BSOD · BSOD (Functional) · ACPI Critical Error |
| Linux | Kernel Panic (Black · Pink · Purple) |
| macOS | Kernel Panic · Startup Apple · Globe Warning · Prohibited Boot · Boot Warning · Missing System |
| Ransomware | WannaCry · Petya · Retis |
