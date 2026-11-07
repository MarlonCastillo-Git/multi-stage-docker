#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ -f .env ]; then
    echo '.env ya existe; no se modifica.'
    exit 0
fi
command -v openssl >/dev/null
umask 077
cp .env.example .env
app_key="$(openssl rand -base64 32)"
jwt="$(openssl rand -hex 32)"
db="$(openssl rand -hex 24)"
root="$(openssl rand -hex 24)"
# Valores hex/base64 sin interpolación de comandos ni dependencias de Python.
awk -v app="$app_key" -v jwt="$jwt" -v db="$db" -v root="$root" '
/^APP_KEY=/ {print "APP_KEY=base64:" app; next}
/^JWT_SECRET=/ {print "JWT_SECRET=" jwt; next}
/^MYSQL_PASSWORD=/ {print "MYSQL_PASSWORD=" db; next}
/^MYSQL_ROOT_PASSWORD=/ {print "MYSQL_ROOT_PASSWORD=" root; next}
{print}
' .env > .env.tmp
mv .env.tmp .env
echo '.env creado con secretos aleatorios. Ejecute: docker compose up --build'
