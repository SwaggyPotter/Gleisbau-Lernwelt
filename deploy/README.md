# Backend Deployment (Ubuntu + Cloudflare)

Secure-by-default stack: Postgres + Node API + Caddy (TLS) via Docker Compose.

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
- Create A-record `api` pointing to your public IP. During first certificate issuance set proxy to “DNS only” (grey cloud). You can re-enable proxy later if desired.
- If IP is dynamic, add a small Cloudflare DDNS updater or use a Cloudflare Tunnel.

## 3) Configure
- Copy template: `cp deploy/.env.example deploy/.env`
- Fill `deploy/.env`:
  - `API_DOMAIN`: e.g. `api.example.com`
  - `CADDY_EMAIL`: email for Let’s Encrypt
  - `POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB`: DB creds
  - `CORS_ORIGIN`: frontend origin, e.g. `https://app.example.com`
  - `RATE_LIMIT_*` and `API_PORT` normally stay as-is

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

## 6) Backups & updates
- DB data lives in `db_data` volume; take `pg_dump` regularly.
- Update app/images: `docker compose --env-file deploy/.env pull && docker compose --env-file deploy/.env up -d --build`
- Host patches: `sudo apt upgrade`

Notes:
- The DB port is not published externally; only the proxy exposes 80/443.
- Caddy auto-manages TLS. Ensure port 80 stays reachable for HTTP-01 challenges unless you switch to DNS-01.
