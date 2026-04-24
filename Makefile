SHELL := /bin/bash
.DEFAULT_GOAL := help

BACKEND_HOST ?= 127.0.0.1
BACKEND_PORT ?= 8000
FRONTEND_PORT ?= 3000
API_BASE_URL ?= http://localhost:$(BACKEND_PORT)

.PHONY: help init backend-init frontend-init dev stop backend frontend test backend-test frontend-test build frontend-build

help:
	@printf "SEA-GO root commands\n"
	@printf "  make init           Install backend and frontend dependencies\n"
	@printf "  make dev            Start FastAPI and Next.js together\n"
	@printf "  make stop           Kill any running services on the configured ports\n"
	@printf "  make backend        Start only the FastAPI backend\n"
	@printf "  make frontend       Start only the Next.js frontend\n"
	@printf "  make test           Run backend and frontend tests\n"
	@printf "  make build          Build the frontend\n"

init: backend-init frontend-init

backend-init:
	$(MAKE) -C backend init

frontend-init:
	$(MAKE) -C frontend init

dev:
	@printf "Starting FastAPI on http://$(BACKEND_HOST):$(BACKEND_PORT)\n"
	@printf "Starting Next.js on http://localhost:$(FRONTEND_PORT)\n"
	@set -e; \
	trap 'kill $${backend_pid:-} $${frontend_pid:-} 2>/dev/null || true; sleep 0.3; lsof -ti :$(BACKEND_PORT) | xargs kill 2>/dev/null || true; lsof -ti :$(FRONTEND_PORT) | xargs kill 2>/dev/null || true' INT TERM EXIT; \
	$(MAKE) backend & backend_pid=$$!; \
	$(MAKE) frontend & frontend_pid=$$!; \
	wait $$backend_pid $$frontend_pid

stop:
	@-lsof -ti :$(BACKEND_PORT) | xargs kill -9 2>/dev/null; true
	@-lsof -ti :$(FRONTEND_PORT) | xargs kill -9 2>/dev/null; true
	@printf "Stopped services on ports $(BACKEND_PORT) and $(FRONTEND_PORT)\n"

backend:
	$(MAKE) -C backend dev HOST=$(BACKEND_HOST) PORT=$(BACKEND_PORT)

frontend:
	$(MAKE) -C frontend dev PORT=$(FRONTEND_PORT) NEXT_PUBLIC_API_BASE_URL=$(API_BASE_URL)

test: backend-test frontend-test

backend-test:
	$(MAKE) -C backend test

frontend-test:
	$(MAKE) -C frontend test

build: frontend-build

frontend-build:
	$(MAKE) -C frontend build NEXT_PUBLIC_API_BASE_URL=$(API_BASE_URL)
