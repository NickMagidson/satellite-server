.PHONY: help install dev up down logs clean

.DEFAULT_GOAL := help

help: ## print target descriptions
	@awk 'BEGIN {FS = ":.*##"; print "Targets:"} /^[a-zA-Z_-]+:.*##/ {printf "  %-10s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## install dependencies
	npm install

dev: ## run local dev server
	npm run dev

up: ## start docker compose stack (build if needed)
	docker compose up -d --build

down: ## stop docker compose stack
	docker compose down

logs: ## follow compose logs
	docker compose logs -f

clean: ## remove local build/dependency artifacts safely
	rm -rf node_modules dist .turbo .cache coverage
	find apps packages -mindepth 2 -maxdepth 2 \( -name node_modules -o -name dist -o -name .turbo -o -name .cache -o -name coverage \) -type d -prune -exec rm -rf {} + 2>/dev/null || true
