FROM php:8.4-cli-alpine

# System deps
RUN apk add --no-cache \
    git \
    curl \
    libpq-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql zip opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP deps (separate layer for cache)
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-dev --prefer-dist

COPY . .

RUN mkdir -p bootstrap/cache storage/logs storage/framework/cache storage/framework/sessions storage/framework/views \
    && composer dump-autoload --optimize \
    && php artisan storage:link 2>/dev/null || true \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000
