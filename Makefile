project_name := satellite-server

compose_dev := docker compose --project-name=$(project_name) --file="$(CURDIR)/docker-compose.yml" --file="$(CURDIR)/docker-compose.dev.yml"

.PHONY: help install dev dev-image up down logs exec psql studio clean

.DEFAULT_GOAL := help

help: ## print target descriptions
	@awk 'BEGIN {FS = ":.*##"; print "Targets:"} /^[a-zA-Z_-]+:.*##/ {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## install dependencies
	npm install

dev: dev-image up logs ## build/start dev stack and follow logs

dev-image: ## build development image
	$(compose_dev) build migrate api frontend

up: ## start development stack
	$(compose_dev) up -d

down: ## stop development stack
	$(compose_dev) down

logs: ## follow compose logs
	$(compose_dev) logs -f

exec: up ## open shell in api container
	$(compose_dev) exec api sh

psql: up ## open psql in postgres container
	$(compose_dev) exec postgres psql -U satellite -d satellite

studio: up ## open Prisma Studio at http://localhost:5555
	$(compose_dev) exec api npm run db:studio

clean: ## remove local build/dependency artifacts safely
	rm -rf node_modules dist .turbo .cache coverage
	find apps packages -mindepth 2 -maxdepth 2 \( -name node_modules -o -name dist -o -name .turbo -o -name .cache -o -name coverage \) -type d -prune -exec rm -rf {} + 2>/dev/null || true

.EXPORT_ALL_VARIABLES:
DOCKER_BUILDKIT = 1
COMPOSE_DOCKER_CLI_BUILD = 1
COMPOSE_PROJECT_NAME := $(project_name)
