COMPOSE=docker compose

.PHONY: help
help:
	@echo "Finance Calculator commands:"
	@echo ""
	@echo "  make init          Copy .env.example to .env if .env does not exist"
	@echo "  make build         Build all Docker images"
	@echo "  make up            Start all services"
	@echo "  make up-build      Build and start all services"
	@echo "  make down          Stop services"
	@echo "  make restart       Restart services"
	@echo "  make logs          Show logs"
	@echo "  make logs-backend  Show backend logs"
	@echo "  make logs-frontend Show frontend logs"
	@echo "  make ps            Show containers"
	@echo "  make seed          Run demo seed data"
	@echo "  make migrate       Run backend migrations"
	@echo "  make reset-db      Remove volumes and recreate database"
	@echo "  make backend-shell Open shell in backend container"
	@echo "  make frontend-shell Open shell in frontend container"
	@echo "  make frontend-build Build frontend locally through npm"
	@echo "  make smoke         Print smoke-test URLs"
	@echo "  make test-backend       Run backend tests inside Docker"
	@echo "  make test-backend-cov   Run backend tests with coverage inside Docker"
	@echo "  make test-backend-local Run backend tests locally"

.PHONY: init
init:
	@if [ ! -f .env ]; then cp .env.example .env; echo ".env created from .env.example"; else echo ".env already exists"; fi

.PHONY: build
build:
	$(COMPOSE) build

.PHONY: up
up:
	$(COMPOSE) up -d

.PHONY: up-build
up-build:
	$(COMPOSE) up --build -d

.PHONY: down
down:
	$(COMPOSE) down

.PHONY: restart
restart:
	$(COMPOSE) down
	$(COMPOSE) up -d

.PHONY: logs
logs:
	$(COMPOSE) logs -f

.PHONY: logs-backend
logs-backend:
	$(COMPOSE) logs -f backend

.PHONY: logs-frontend
logs-frontend:
	$(COMPOSE) logs -f frontend

.PHONY: ps
ps:
	$(COMPOSE) ps

.PHONY: seed
seed:
	$(COMPOSE) --profile seed run --rm seed

.PHONY: migrate
migrate:
	$(COMPOSE) exec backend python -m alembic upgrade head

.PHONY: reset-db
reset-db:
	$(COMPOSE) down -v
	$(COMPOSE) up --build -d postgres
	$(COMPOSE) --profile seed run --rm seed
	$(COMPOSE) up --build -d

.PHONY: backend-shell
backend-shell:
	$(COMPOSE) exec backend sh

.PHONY: frontend-shell
frontend-shell:
	$(COMPOSE) exec frontend sh

.PHONY: frontend-build
frontend-build:
	cd frontend && npm run build

.PHONY: test-backend
test-backend:
	docker compose exec backend pytest

.PHONY: test-backend-cov
test-backend-cov:
	docker compose exec backend pytest --cov=app --cov-report=term-missing

.PHONY: test-backend-local
test-backend-local:
	cd backend && pytest

.PHONY: test-backend-local-cov
test-backend-local-cov:
	cd backend && pytest --cov=app --cov-report=term-missing

.PHONY: smoke
smoke:
	@echo "Frontend:"
	@echo "  http://localhost:$${FRONTEND_PORT:-8090}"
	@echo ""
	@echo "Backend:"
	@echo "  http://localhost:$${BACKEND_PORT:-8000}"
	@echo ""
	@echo "Swagger:"
	@echo "  http://localhost:$${BACKEND_PORT:-8000}/docs"
	@echo ""
	@echo "Healthcheck:"
	@echo "  curl http://localhost:$${BACKEND_PORT:-8000}/health"
	@echo ""
	@echo "Default credentials:"
	@echo "  admin@example.com"
	@echo "  admin123"