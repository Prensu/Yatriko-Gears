# ╔══════════════════════════════════════════════════════════════════╗
# ║                     YATRIKO GEARS — MAKEFILE                      ║
# ║  Root helper for the backend (Express/TS) + frontend (React/Vite) ║
# ╚══════════════════════════════════════════════════════════════════╝
#
# HOW TO USE
#   1. Put this file in the project root, next to backend/ and frontend/
#   2. Run:  make help        <- see every command with a description
#   3. Run:  make <command>   <- e.g. make dev, make build, make install
#
# WHY "make"?
#   Instead of remembering "cd backend && pnpm run dev" every time,
#   you just type "make dev-backend" from the project root.
#
# ----------------------------------------------------------------------

BACKEND_DIR  := backend
FRONTEND_DIR := frontend
PM           := pnpm

.DEFAULT_GOAL := help

# Colors used only inside the help output below
BOLD   := \033[1m
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RESET  := \033[0m


# ┌──────────────────────────────────────────────────────────────────┐
# │  📖  HELP                                                          │
# └──────────────────────────────────────────────────────────────────┘

.PHONY: help
help: ## Show this help menu (default when you just type "make")
	@echo ""
	@echo -e "$(BOLD)Yatriko Gears — Makefile Commands$(RESET)"
	@echo "Run any command below from the project root."
	@echo ""
	@echo -e "$(YELLOW)── Setup ──────────────────────────────────────────$(RESET)"
	@grep -E '^(install|install-backend|install-frontend|env):.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(YELLOW)── Development ────────────────────────────────────$(RESET)"
	@grep -E '^(dev|dev-backend|dev-frontend):.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(YELLOW)── Build & Run (production) ──────────────────────$(RESET)"
	@grep -E '^(build|build-backend|build-frontend|start|preview):.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(YELLOW)── Quality Checks ─────────────────────────────────$(RESET)"
	@grep -E '^(check|typecheck|lint):.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(YELLOW)── Database ───────────────────────────────────────$(RESET)"
	@grep -E '^(seed):.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(YELLOW)── Cleanup ────────────────────────────────────────$(RESET)"
	@grep -E '^(clean|clean-all):.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(GREEN)Typical first-time flow:$(RESET) make install -> make env -> make dev"
	@echo ""


# ┌──────────────────────────────────────────────────────────────────┐
# │  📦  SETUP — install dependencies & create .env files              │
# └──────────────────────────────────────────────────────────────────┘

.PHONY: install install-backend install-frontend env

install: install-backend install-frontend ## Install deps for BOTH backend + frontend

install-backend: ## Install backend dependencies only
	cd $(BACKEND_DIR) && $(PM) install

install-frontend: ## Install frontend dependencies only
	cd $(FRONTEND_DIR) && $(PM) install

env: ## Create .env files from samples (skips files that already exist)
	@test -f $(BACKEND_DIR)/.env || (cp $(BACKEND_DIR)/.env-sample $(BACKEND_DIR)/.env && echo "Created backend/.env")
	@test -f $(FRONTEND_DIR)/.env || (cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env && echo "Created frontend/.env")
	@echo "Env files ready — now edit backend/.env and frontend/.env with your real secrets."


# ┌──────────────────────────────────────────────────────────────────┐
# │  🛠️   DEVELOPMENT — hot-reloading local servers                    │
# └──────────────────────────────────────────────────────────────────┘

.PHONY: dev dev-backend dev-frontend

dev: ## Run backend + frontend together (Ctrl+C stops both)
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend: ## Run ONLY the backend dev server (nodemon + tsx)
	cd $(BACKEND_DIR) && $(PM) run dev

dev-frontend: ## Run ONLY the frontend dev server (Vite)
	cd $(FRONTEND_DIR) && $(PM) run dev


# ┌──────────────────────────────────────────────────────────────────┐
# │  🏗️   BUILD & RUN — production builds                              │
# └──────────────────────────────────────────────────────────────────┘

.PHONY: build build-backend build-frontend start preview

build: build-backend build-frontend ## Build BOTH backend + frontend for production

build-backend: ## Compile backend TypeScript -> backend/dist
	cd $(BACKEND_DIR) && $(PM) run build

build-frontend: ## Type-check + bundle frontend -> frontend/dist
	cd $(FRONTEND_DIR) && $(PM) run build

start: ## Start the COMPILED backend (run build-backend first)
	cd $(BACKEND_DIR) && $(PM) run start

preview: ## Preview the built frontend locally
	cd $(FRONTEND_DIR) && $(PM) run preview


# ┌──────────────────────────────────────────────────────────────────┐
# │  ✅  QUALITY CHECKS                                                │
# └──────────────────────────────────────────────────────────────────┘

.PHONY: check typecheck lint

check: typecheck lint ## Run every check (typecheck + lint)

typecheck: ## Typecheck backend without emitting files
	cd $(BACKEND_DIR) && $(PM) run typecheck

lint: ## Lint frontend source with ESLint
	cd $(FRONTEND_DIR) && $(PM) run lint


# ┌──────────────────────────────────────────────────────────────────┐
# │  🌱  DATABASE                                                      │
# └──────────────────────────────────────────────────────────────────┘

.PHONY: seed

seed: ## Seed the MongoDB database with sample data
	cd $(BACKEND_DIR) && $(PM) run seed


# ┌──────────────────────────────────────────────────────────────────┐
# │  🧹  CLEANUP                                                       │
# └──────────────────────────────────────────────────────────────────┘

.PHONY: clean clean-all

clean: ## Remove build output (backend/dist + frontend/dist)
	rm -rf $(BACKEND_DIR)/dist $(FRONTEND_DIR)/dist
	@echo "Build output removed."

clean-all: clean ## Remove build output AND node_modules (full reset)
	rm -rf $(BACKEND_DIR)/node_modules $(FRONTEND_DIR)/node_modules
	@echo "node_modules removed — run 'make install' to reinstall."
