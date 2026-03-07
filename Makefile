.PHONY: help list install dev-front dev-back up down restart rebuild logs ps clean \
	up-back down-back restart-back logs-back build-back rebuild-back \
	build test

COMPOSE = docker compose

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Docker stack (backend only):"
	@echo "  up                Build + start backend"
	@echo "  down              Stop and remove containers"
	@echo "  restart           Restart backend stack"
	@echo "  rebuild           Rebuild backend (no-cache) + restart backend stack"
	@echo "  logs              Follow backend logs"
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
	@echo ""
	@echo "Ports par defaut:"
	@echo "  backend   -> http://localhost:5000"
	@echo ""
	@echo "Local dev (without Docker):"
	@echo "  install    Install frontend + backend dependencies"
	@echo "  dev-front  Start Angular dev server (http://localhost:4200)"
	@echo "  dev-back   Start Flask API (http://localhost:5000)"
	@echo "  build      Build Angular app"
	@echo "  test       Run Angular unit tests (headless)"

list:
	@echo "Local URLs:"
	@echo "  Frontend (dev) : http://localhost:$${FRONT_PORT:-4200}"
	@echo "  Backend API    : http://localhost:$${BACK_PORT:-5000}"
	@echo ""
	@echo "If needed:"
	@echo "  Start backend stack : make up"
	@echo "  Start frontend dev  : make dev-front"

install:
	cd frontend && yarn install --frozen-lockfile
	cd backend && pip3 install -r requirements.txt

dev-front:
	cd frontend && yarn install --frozen-lockfile && yarn start

dev-back:
	cd backend && DATA_DIR=./dev-data python3 app.py

up:
	mkdir -p data/media
	@echo "Using BACK_PORT=$${BACK_PORT:-5000}"
	$(COMPOSE) up --build -d --remove-orphans backend

down:
	$(COMPOSE) down --remove-orphans

restart: down up

rebuild:
	mkdir -p data/media
	@echo "Using BACK_PORT=$${BACK_PORT:-5000}"
	$(COMPOSE) build --no-cache backend
	$(COMPOSE) up -d --remove-orphans backend

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

build:
	cd frontend && yarn install --frozen-lockfile && yarn build

test:
	cd frontend && yarn install --frozen-lockfile && yarn test -- --watch=false --browsers=ChromeHeadless
