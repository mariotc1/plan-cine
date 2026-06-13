.PHONY: up down restart logs shell-backend shell-db migrate seed fresh

# Levantar todo
up:
	docker compose up --build -d

# Sin rebuild
start:
	docker compose up -d

# Apagar
down:
	docker compose down

# Apagar y borrar volúmenes (reset total DB)
reset:
	docker compose down -v

# Reiniciar un servicio: make restart s=backend
restart:
	docker compose restart $(s)

# Logs en tiempo real
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

# Shell en el backend
shell:
	docker compose exec backend sh

# Shell en PostgreSQL
psql:
	docker compose exec db psql -U plan_cine -d plan_cine

# Artisan directo: make artisan cmd="migrate:status"
artisan:
	docker compose exec backend php artisan $(cmd)

# Migraciones
migrate:
	docker compose exec backend php artisan migrate

# Seed
seed:
	docker compose exec backend php artisan db:seed

# Reset completo de DB + seed
fresh:
	docker compose exec backend php artisan migrate:fresh --seed
