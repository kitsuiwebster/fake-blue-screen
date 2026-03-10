.PHONY: help list install dev-front dev-back dev-admin up down restart rebuild logs ps clean \
	up-back down-back restart-back logs-back build-back rebuild-back \
	up-admin down-admin restart-admin logs-admin build-admin rebuild-admin \
	build test

COMPOSE = docker compose

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Docker stack:"
	@echo "  up                Build + start all services"
	@echo "  down              Stop and remove containers"
	@echo "  restart           Restart all services"
	@echo "  rebuild           Rebuild all (no-cache) + restart"
	@echo "  logs              Follow all logs"
	@echo "  ps                Show compose services status"
	@echo "  clean             Stop stack + remove local built images"
	@echo "  list              Show local URLs to use"
	@echo ""
	@echo "Docker par conteneur:"
	@echo "  up-back           Start backend"
	@echo "  down-back         Stop backend"
	@echo "  restart-back      Restart backend"
	@echo "  logs-back         Follow backend logs"
	@echo "  build-back        Build backend image"
	@echo "  rebuild-back      Rebuild backend (no-cache) + restart"
	@echo "  up-admin          Start admin"
	@echo "  down-admin        Stop admin"
	@echo "  restart-admin     Restart admin"
	@echo "  logs-admin        Follow admin logs"
	@echo "  build-admin       Build admin image"
	@echo "  rebuild-admin     Rebuild admin (no-cache) + restart"
	@echo ""
	@echo "Ports par defaut:"
	@echo "  backend   -> http://localhost:5000"
	@echo "  admin     -> http://localhost:3001"
	@echo ""
	@echo "Local dev (without Docker):"
	@echo "  install    Install frontend + backend dependencies"
	@echo "  dev-front  Start Angular dev server (http://localhost:4200)"
	@echo "  dev-back   Start Flask API (http://localhost:5000)"
	@echo "  dev-admin  Start admin dev server (http://localhost:4300)"
	@echo "  build      Build Angular app"
	@echo "  test       Run Angular unit tests (headless)"

list:
	@echo "Local URLs:"
	@echo "  Frontend (dev) : http://localhost:$${FRONT_PORT:-4200}"
	@echo "  Backend API    : http://localhost:$${BACK_PORT:-5000}"
	@echo "  Admin UI       : http://localhost:$${ADMIN_PORT:-3001}"
	@echo ""
	@echo "If needed:"
	@echo "  Start all       : make up"
	@echo "  Start frontend  : make dev-front"
	@echo "  Start admin dev : make dev-admin"

open:
	@echo "Backend API    : http://localhost:$${BACK_PORT:-5000}/api/health"
	@echo "Admin UI       : http://localhost:$${ADMIN_PORT:-3001}"

install:
	cd frontend && yarn install --frozen-lockfile
	cd admin && yarn install --frozen-lockfile
	cd backend && pip3 install -r requirements.txt

dev-front:
	cd frontend && yarn install --frozen-lockfile && yarn start

dev-back:
	cd backend && DATA_DIR=./dev-data python3 app.py

dev-admin:
	cd admin && yarn install --frozen-lockfile && yarn start

up:
	mkdir -p data/media
	@echo "Using BACK_PORT=$${BACK_PORT:-5000} ADMIN_PORT=$${ADMIN_PORT:-3001}"
	$(COMPOSE) up --build -d --remove-orphans

down:
	$(COMPOSE) down --remove-orphans

restart: down up

rebuild:
	mkdir -p data/media
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d --remove-orphans

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down --remove-orphans --rmi local

up-back:
	mkdir -p data/media
	@echo "Using BACK_PORT=$${BACK_PORT:-5000}"
	$(COMPOSE) up -d backend

down-back:
	$(COMPOSE) stop backend

restart-back:
	$(COMPOSE) restart backend

logs-back:
	$(COMPOSE) logs -f backend

build-back:
	$(COMPOSE) build backend

rebuild-back:
	mkdir -p data/media
	@echo "Using BACK_PORT=$${BACK_PORT:-5000}"
	$(COMPOSE) build --no-cache backend
	$(COMPOSE) up -d backend

up-admin:
	$(COMPOSE) up -d admin

down-admin:
	$(COMPOSE) stop admin

restart-admin:
	$(COMPOSE) restart admin

logs-admin:
	$(COMPOSE) logs -f admin

build-admin:
	$(COMPOSE) build admin

rebuild-admin:
	$(COMPOSE) build --no-cache admin
	$(COMPOSE) up -d admin

build:
	cd frontend && yarn install --frozen-lockfile && yarn build

test:
	cd frontend && yarn install --frozen-lockfile && yarn test -- --watch=false --browsers=ChromeHeadless
