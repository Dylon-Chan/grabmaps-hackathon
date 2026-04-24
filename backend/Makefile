SHELL := /bin/bash
.DEFAULT_GOAL := help

HOST ?= 127.0.0.1
PORT ?= 8000

.PHONY: help init dev test lint

help:
	@printf "SEA-GO backend commands\n"
	@printf "  make init      Create .env if needed and install Python deps\n"
	@printf "  make dev       Start FastAPI with reload\n"
	@printf "  make test      Run pytest\n"
	@printf "  make lint      Run ruff checks\n"

init:
	@if [ ! -f .env ]; then cp .env.example .env && printf "Created backend/.env from .env.example\n"; else printf "backend/.env already exists\n"; fi
	uv sync --dev

dev:
	uv run uvicorn app.main:app --reload --host $(HOST) --port $(PORT)

test:
	uv run pytest tests -q

lint:
	uv run ruff check app tests
