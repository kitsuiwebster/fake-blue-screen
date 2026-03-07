# Definition of Done (DoD) — Sécurité

**Projet :** Simulateur d'écrans d'erreur
**Règle :** Aucune mise en production si un point est rouge.

> Les critères d'acceptation détaillés par fonctionnalité sont dans [`Security_acceptance_criteria.md`](./Security_acceptance_criteria.md).

---

## Checklist Go / No-Go

### Tests

- [ ] Tests unitaires passés (validation paramètres, bornes, tokens)
- [ ] Tests d'intégration passés : upload valide + invalide + >10 Mo, rate limit (429), pagination bornée, delete token invalide, accès `/media/` sans listing
- [ ] Aucune requête abusive ne retourne un 500

### Scans CI/CD

- [ ] `yarn audit --level high` → 0 vulnérabilité HIGH/CRITICAL non dérogée
- [ ] Trivy → 0 vulnérabilité HIGH/CRITICAL non dérogée
- [ ] SonarQube → Quality Gate passé

### Configuration déploiement

- [ ] Nginx : `client_max_body_size 10m` actif
- [ ] Nginx : rate limit upload actif (1/20s/IP)
- [ ] Nginx : `/media/` en lecture seule, `autoindex off`
- [ ] Headers actifs : `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, CSP avec `frame-ancestors 'none'`

### Privacy

- [ ] Aucune IP / UA / referer stockés en base
- [ ] EXIF supprimés après re-encodage WebP
- [ ] `access_log off` sur `/api/uploads` et `/media`

### Secrets & déploiement

- [ ] Aucun secret dans le repository (Trivy + vérification manuelle)
- [ ] Secrets injectés via variables d'environnement Docker uniquement
- [ ] Volume `./data` conservé — aucune étape CD n'exécute `docker compose down -v`

### Revue & monitoring

- [ ] Revue de code effectuée (validation inputs, pas de fuite stacktrace/paths, cohérence suppression)
- [ ] `/api/health` répond `ok` en production
- [ ] Logs applicatifs sans PII

---

**Résultat : toutes les cases cochées → GO production.**
