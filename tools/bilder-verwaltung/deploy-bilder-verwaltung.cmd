@echo off
rem Deployt: Backend (Tabellen photos + image_reviews, Endpunkte /api/photos, /api/image-reviews),
rem Frontend (Bilder-Verwaltung /konto/bilder, /konto/benennen) und die neue Caddyfile
rem (Browser-Popup weg, /assets/ nur mit Login-Cookie).
rem Voraussetzung: "npx ng build --configuration production" lief bereits (Ordner www).
rem Doppelklick oder im Terminal ausfuehren.

set SRV=swaggypotter@192.168.0.102
set DIR=/home/swaggypotter/gleisbau

cd /d "%~dp0\..\..\backend"
tar czf - --exclude=node_modules --exclude=dist package.json package-lock.json tsconfig.json Dockerfile src db | ssh %SRV% "tar xzf - -C %DIR%/backend/"
ssh %SRV% "cd %DIR% && docker compose --env-file deploy/.env up -d --build api"

cd /d "%~dp0\..\..\www"
ssh %SRV% "rm -rf %DIR%/deploy/frontend-dist/*"
tar czf - . | ssh %SRV% "tar xzf - -C %DIR%/deploy/frontend-dist/"

cd /d "%~dp0\..\..\deploy"
scp Caddyfile %SRV%:%DIR%/deploy/Caddyfile.neu
ssh %SRV% "cd %DIR% && cp deploy/Caddyfile deploy/Caddyfile.alt && cp deploy/Caddyfile.neu deploy/Caddyfile && docker compose --env-file deploy/.env exec -T proxy caddy validate --config /etc/caddy/Caddyfile && docker compose --env-file deploy/.env exec -T proxy caddy reload --config /etc/caddy/Caddyfile || (echo FEHLER in der Caddyfile - alte Version wird wiederhergestellt && cp deploy/Caddyfile.alt deploy/Caddyfile)"

echo.
echo Fertig. Seite: https://app.gleisbau-digital.org/  (kein Browser-Popup mehr, Login nur in der App)
pause
