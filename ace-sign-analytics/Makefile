.PHONY: help install dev build test clean docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Run development servers"
	@echo "  make build      - Build for production"
	@echo "  make test       - Run tests"
	@echo "  make docker-up  - Start Docker services"
	@echo "  make docker-down - Stop Docker services"
	@echo "  make clean      - Clean build artifacts"

install:
	cd backend && npm install
	cd frontend && npm install

dev:
	docker-compose up

build:
	cd backend && npm run build
	cd frontend && npm run build

test:
	cd backend && npm test
	cd frontend && npm test

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

clean:
	rm -rf backend/dist
	rm -rf backend/node_modules
	rm -rf frontend/dist
	rm -rf frontend/node_modules

logs:
	docker-compose logs -f

db-migrate:
	docker exec ace-analytics-api npm run db:migrate

db-seed:
	docker exec ace-analytics-api npm run db:seed
