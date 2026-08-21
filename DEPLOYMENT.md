# Deployment Guide

Lasso Consultancy is two deployable pieces:

| Piece | Tech | Where it can run |
|---|---|---|
| Frontend | Vite + React SPA | Any static host (Vercel, Netlify, Nginx) |
| Backend | Express + SQLite | **A host with a persistent disk** (VPS) — not serverless |

## Why the backend cannot go on Vercel/Netlify functions

It writes to two places on local disk:

- `server/database.sqlite` — all CMS content, enquiries and the admin account
- `server/uploads/` — every image uploaded through the CMS

Serverless filesystems are ephemeral and often read-only. Deploying the backend
there means **every redeploy silently wipes all content and images**. Use a VPS
(or migrate to Postgres + object storage first — see "Scaling up" below).

## 1. Backend (VPS)

```bash
git clone <repo> /var/www/lasso
cd /var/www/lasso/server
npm ci --omit=dev
```

Create the **root** `.env` (one level above `server/`) from the template:

```bash
cp server/.env.production.example .env
$EDITOR .env
```

Generate a strong JWT secret:

```bash
openssl rand -hex 48
```

`NODE_ENV=production` activates boot-time configuration validation. The server
**refuses to start** if `JWT_SECRET` is missing, too short, or still the old
default; if SMTP is unset; or if `FRONTEND_URL` points at localhost (which
would make password-reset emails link to the recipient's own machine).

### Keep it running with systemd

`/etc/systemd/system/lasso-api.service`:

```ini
[Unit]
Description=Lasso Consultancy API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lasso/server
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now lasso-api
sudo systemctl status lasso-api
```

### Reverse proxy (Nginx)

The app calls the API at `https://lassoconsultancy.com.np/api`, so `/api` and
`/uploads` must proxy to port 5000 on the same domain.

```nginx
server {
    listen 443 ssl http2;
    server_name lassoconsultancy.com.np www.lassoconsultancy.com.np;

    # TLS via certbot
    ssl_certificate     /etc/letsencrypt/live/lassoconsultancy.com.np/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lassoconsultancy.com.np/privkey.pem;

    client_max_body_size 12M;          # uploads are capped at 10MB server-side

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }

    # SPA build output
    root /var/www/lasso/dist;
    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name lassoconsultancy.com.np www.lassoconsultancy.com.np;
    return 301 https://$host$request_uri;
}
```

`X-Forwarded-For` matters: the app sets `trust proxy`, and without that header
every visitor looks like the proxy to the rate limiter and they'd share one quota.

## 2. Frontend

```bash
npm ci
npm run build      # reads .env.production -> VITE_API_URL
```

Deploy `dist/`. `.env.production` already sets:

```
VITE_API_URL=https://lassoconsultancy.com.np/api
```

On Vercel, `vercel.json` handles SPA routing. If the backend is on a different
host, add that origin to `allowedOrigins` in `server/index.js`.

## 3. First login

The first boot seeds an admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. It seeds
**only when no admin exists**, so later edits to `.env` have no effect. To change
the password afterwards, use **Change Password** in the CMS sidebar, or:

```bash
cd server && node scripts/reset-admin-password.js
```

## 4. Backups (not automatic — set this up)

Everything lives in two paths. Losing them loses all content.

```bash
#!/bin/bash
# /usr/local/bin/lasso-backup.sh
set -euo pipefail
DEST=/var/backups/lasso
STAMP=$(date +%F_%H%M)
mkdir -p "$DEST"
# .backup is safe on a live SQLite DB; plain cp can capture a torn file
sqlite3 /var/www/lasso/server/database.sqlite ".backup '$DEST/db_$STAMP.sqlite'"
tar czf "$DEST/uploads_$STAMP.tar.gz" -C /var/www/lasso/server uploads
find "$DEST" -mtime +30 -delete
```

```cron
0 3 * * * /usr/local/bin/lasso-backup.sh
```

Copy backups off the box as well — a snapshot on the same disk is not a backup.

## Security posture

Already handled in code:

- Rate limiting: login (8 per 15 min, failures only), forgot-password (3/hr),
  reset-password (10/hr), public enquiries (20/hr), global backstop (600 per 15 min)
- `helmet` security headers; `compression`
- Uploads require a valid admin JWT and are restricted to raster images
  (JPEG/PNG/WebP/GIF/AVIF). SVG is rejected because it can carry inline script
  and would be served from our own origin
- Passwords hashed with bcrypt (cost 12); reset tokens are `crypto.randomBytes`,
  single-use, 1-hour expiry, pruned when new ones are issued
- CORS allows localhost only outside production
- Boot-time config validation under `NODE_ENV=production`

Still worth doing:

- **JWTs last 7 days with no server-side revocation.** Logout only clears
  `localStorage`, so a stolen token stays valid until it expires. Shorten the
  lifetime or add a token blocklist if that risk matters.
- Tokens live in `localStorage`, so any XSS can read them.
- No error monitoring (Sentry or similar) and no structured request logging.

## Scaling up

SQLite handles this workload fine — it's one admin and modest read traffic. Move
to Postgres and object storage (S3/R2) when you need multiple app servers, or
zero-downtime deploys without a shared disk. `routes/crud.js` is a thin
JSON-blob layer, so swapping the driver is contained.

## Dependency notes

`npm audit` in `server/` reports 9 advisories, all reached through
`sqlite3 → node-gyp → tar/cacache`. `node-gyp` compiles the native binding at
install time and is not loaded at runtime, so these are **not reachable by the
running server**. `npm audit fix --force` would pull `sqlite3@6` (a breaking
driver change) — test it before accepting. Install with `npm ci --omit=dev` in
production to skip dev-only trees.
