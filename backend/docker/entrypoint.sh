#!/bin/sh
set -eu
php artisan config:cache
php artisan migrate --force
if [ "${SEED_DEMO:-false}" = "true" ]; then
    php artisan db:seed --force
fi
exec "$@"
