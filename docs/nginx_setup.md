# Configuration Nginx — Critères sécurité screenfake.xyz

## Fichier 1 : nginx.conf

```
sudo nano /etc/nginx/nginx.conf
```

Ajouter dans le bloc `http { }` :

```nginx
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=3r/m;
```

## Fichier 2 : api.screenfake.xyz

```
sudo nano /etc/nginx/sites-available/api.screenfake.xyz
```

Remplacer tout le contenu par :

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.screenfake.xyz;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}


server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.screenfake.xyz;

    ssl_certificate /etc/letsencrypt/live/api.screenfake.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.screenfake.xyz/privkey.pem;

    client_max_body_size 10m;

    location = /api/uploads {
        limit_req zone=upload_limit burst=1 nodelay;
        limit_req_status 429;
        access_log off;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120;
    }

    location /media/ {
        alias /home/ash/kitsui/fake-blue-screen/data/media/;
        autoindex off;
        limit_except GET HEAD {
            deny all;
        }
        add_header X-Content-Type-Options "nosniff" always;
        add_header Content-Type "image/webp" always;
        add_header Cache-Control "public, max-age=86400";
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120;
    }
}
```

## Tester et recharger

```
sudo nginx -t && sudo systemctl reload nginx
```

## Tests de validation

AC-UP-01 — Fichier > 10 Mo rejeté :

```
dd if=/dev/zero of=/tmp/test11m.bin bs=1M count=11
curl -X POST -F "file=@/tmp/test11m.bin" https://api.screenfake.xyz/api/uploads
```

AC-UP-02 — Rate limit (2 uploads rapides) :

```
curl -X POST -F "file=@une_image.jpg" https://api.screenfake.xyz/api/uploads
curl -X POST -F "file=@une_image.jpg" https://api.screenfake.xyz/api/uploads
```

AC-UP-07 — PUT/POST sur /media bloqué :

```
curl -X PUT https://api.screenfake.xyz/media/test.webp
curl -X POST https://api.screenfake.xyz/media/test.webp
```

AC-UP-08 — Headers et pas de listing :

```
curl -I https://api.screenfake.xyz/media/
```

AC-UP-13 — Vérifier absence de logs :

```
sudo tail -f /var/log/nginx/access.log
```
