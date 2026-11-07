# syntax=docker/dockerfile:1.7
FROM php:8.2-fpm-alpine@sha256:bac1671323a3d8073da3fbd45c313e153ec033431489737c20367152abeafb41 AS php-base
RUN apk add --no-cache oniguruma libxml2 \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS oniguruma-dev libxml2-dev \
    && docker-php-ext-install -j$(nproc) pdo_mysql bcmath mbstring xml opcache \
    && apk del .build-deps
WORKDIR /var/www/html

FROM php-base AS dependencies
COPY --from=composer:2@sha256:8de2184c6de224f4689e8f80ed5f5edaf0030b6b8b7839a22a2bcb6722ac87d0 /usr/bin/composer /usr/local/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1
COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/root/.composer/cache composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress
COPY . .
RUN mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && composer dump-autoload --no-dev --classmap-authoritative --no-interaction

FROM php-base AS runtime
RUN apk add --no-cache nginx supervisor \
    && addgroup -g 10001 app && adduser -D -u 10001 -G app app
COPY . .
COPY --from=dependencies /var/www/html/vendor ./vendor
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/production.ini
COPY docker/entrypoint.sh /usr/local/bin/app-entrypoint
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && sed -i '/^[[:space:]]*user =/d; /^[[:space:]]*group =/d' /usr/local/etc/php-fpm.d/www.conf \
    && mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && chown -R app:app bootstrap/cache storage \
    && chmod +x /usr/local/bin/app-entrypoint
USER app
EXPOSE 8080
ENTRYPOINT ["app-entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
