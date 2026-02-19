.PHONY: help install dev back up down logs build test

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  install   Install all dependencies (frontend + backend)"
	@echo "  dev       Start Angular dev server (http://localhost:4200)"
	@echo "  back      Start Flask dev server  (http://localhost:5000)"
	@echo "  up        Build and start full stack with Docker Compose"
	@echo "  down      Stop Docker Compose"
	@echo "  logs      Follow Docker Compose logs"
	@echo "  build     Build Angular for production"
	@echo "  test      Run Angular unit tests (headless)"

install:
	cd frontend && yarn install --frozen-lockfile
	cd backend && pip3 install -r requirements.txt

dev:
	cd frontend && yarn install --frozen-lockfile && yarn start

back:
	cd backend && DATA_DIR=./dev-data python3 app.py

up:
	mkdir -p data/media
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

build:
	cd frontend && yarn install --frozen-lockfile && yarn build

test:
	cd frontend && yarn install --frozen-lockfile && yarn test -- --watch=false --browsers=ChromeHeadless
