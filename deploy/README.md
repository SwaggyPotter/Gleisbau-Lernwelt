# Deployment (Ubuntu + Cloudflare)

Secure-by-default stack: Postgres + Node API + Angular-Frontend + Caddy (TLS)
via Docker Compose. Caddy dient zwei Domains aus einer Config: `API_DOMAIN`
(Reverse-Proxy zur Node-API) und `APP_DOMAIN` (statische Angular-Dateien aus
`deploy/frontend-dist/`, per HTTP-Basic-Auth passwortgeschützt, solange die
App nicht öffentlich sein soll).

**Stand 2026-08-25**: läuft produktiv auf `michiserver`
(192.168.0.102, per SSH als `swaggypotter` erreichbar, Docker bereits
installiert). Öffentliche IP: `95.89.229.237` (IPv4). Domain
`gleisbau-digital.org` (Cloudflare) — DNS/Portweiterleitung stehen noch aus,
siehe Schritt 2/2b.

## 1) Server prep
- Update/patch: `sudo apt update && sudo apt upgrade -y`
- Install Docker & Compose plugin (once):  
  ```bash
  sudo apt install -y ca-certificates curl gnupg
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
  sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker $USER
  ```
- Firewall: `sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw --force enable`
- Home network: forward ports 80/443 from your router to the Ubuntu server.

## 2) DNS (Cloudflare)
- Create an **A-record** for both `API_DOMAIN` and `APP_DOMAIN` (e.g. `api`
  and `app` on `gleisbau-digital.org`) pointing to the server's public IPv4
  (`curl -4 https://ifconfig.me` on the server to check it — IPs can change,
  ISPs commonly rotate them, so check before assuming it's still correct).
- During first certificate issuance, set the Cloudflare proxy to **"DNS
  only" (grey cloud)** — Caddy needs direct HTTP-01/TLS-ALPN-01 validation.
  Can be switched to proxied (orange cloud) afterwards if desired, but note
  that proxied mode changes how the origin IP is exposed and may need
  Cloudflare's own TLS mode adjusted (Full/Strict) to keep working.
- If the IP is dynamic, add a Cloudflare DDNS updater or switch to a
  **Cloudflare Tunnel** (avoids router port-forwarding entirely, keeps the
  home IP hidden — the `cloudflare-one` setup covers this if wanted later).

## 2b) Router / firewall (only needed for the plain port-forward path above)
- Forward TCP 80 and 443 from the router to the server's LAN IP
  (`192.168.0.102` as of 2026-08-25).
- This step needs router admin access and can't be done remotely by an
  agent — has to happen on the router itself.

## 3) Configure
- Copy template: `cp deploy/.env.example deploy/.env`
- Fill `deploy/.env`:
  - `API_DOMAIN` / `APP_DOMAIN`: e.g. `api.example.com` / `app.example.com`
  - `CADDY_EMAIL`: email for Let's Encrypt
  - `POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB`: DB creds
  - `CORS_ORIGIN`: frontend origin, e.g. `https://app.example.com`
  - `ADMIN_EMAIL`/`ADMIN_PASSWORD`: bootstrap admin account for the backend
    (**required**, no default — server refuses to start without them,
    password must be 12+ chars)
  - `RATE_LIMIT_*` and `API_PORT` normally stay as-is
  - Sitewide password gate: **not** a Caddy/HTTP-Basic-Auth thing anymore
    (removed 2026-08-26 — the native browser Basic-Auth dialog didn't work
    from a corporate network). The login now lives inside the Angular app
    itself (`src/app/core/site-gate/`): a plain login form checks the
    entered password's SHA-256 against a hash baked into the JS bundle, and
    on success remembers it in that browser's `localStorage` so the form
    doesn't reappear. This is a soft gate only — `deploy/frontend-dist/`
    (JS/JSON/assets) is served with no server-side auth, just `noindex` +
    `robots.txt` to keep it out of search engines. To change the site
    password, edit `SITE_PASSWORD_SHA256` in `site-gate.component.ts`
    (compute with e.g. `node -e "console.log(require('crypto').createHash('sha256').update('newpassword','utf8').digest('hex'))"`)
    and rebuild/redeploy the frontend.
- Build the frontend locally and place it on the server at
  `deploy/frontend-dist/` (relative to this repo's root on the server):
  `npx ng build --configuration production` (outputs to `www/`, per
  `angular.json`), then copy the contents of `www/` into
  `deploy/frontend-dist/` on the server (e.g. via `scp`/`rsync`, or a tar
  pipe over `ssh` for many small files — plain `scp -r` also works, just
  slower for the many small JS chunk files).

## 4) Deploy
```bash
docker compose --env-file deploy/.env pull   # optional if images come from registry
docker compose --env-file deploy/.env up -d --build
docker compose --env-file deploy/.env ps
```

## 5) Verify
- Check logs: `docker compose --env-file deploy/.env logs -f proxy` and `logs -f api`
- Health: `curl -I https://api.example.com/health`
- API sample: `curl https://api.example.com/api/fields`
- Frontend: `curl -I https://app.example.com/` (expect `200` — no server-side
  auth anymore, the login form is inside the app, see above)

## 6) Backups & updates
- DB data lives in `db_data` volume; take `pg_dump` regularly.
- Update app/images: `docker compose --env-file deploy/.env pull && docker compose --env-file deploy/.env up -d --build`
- Host patches: `sudo apt upgrade`
- Redeploying the frontend after a content/code change: rebuild locally
  (`ng build --configuration production`), re-sync `www/` to
  `deploy/frontend-dist/` on the server — no container rebuild needed,
  Caddy serves the files directly from that mounted directory.

Notes:
- The DB port is not published externally; only the proxy exposes 80/443.
- Caddy auto-manages TLS. Ensure port 80 stays reachable for HTTP-01 challenges unless you switch to DNS-01.
- The deploying user needs to be in the `docker` group (passwordless
  `docker` commands) — `sudo` itself does **not** need to be passwordless
  for this deployment, since nothing here requires host-level `sudo`
  (firewall/`ufw` rules from step 1 are the only exception, and those are a
  one-time manual step anyway).
