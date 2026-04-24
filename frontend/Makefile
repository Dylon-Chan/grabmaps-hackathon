SHELL := /bin/bash
.DEFAULT_GOAL := help

PORT ?= 3000
NEXT_PUBLIC_API_BASE_URL ?= http://localhost:8000

.PHONY: help init dev build test

help:
	@printf "SEA-GO frontend commands\n"
	@printf "  make init      Create .env.local if needed and install Node deps\n"
	@printf "  make dev       Start Next.js\n"
	@printf "  make build     Build Next.js\n"
	@printf "  make test      Run Vitest\n"

init:
	@if [ ! -f .env.local ]; then cp .env.example .env.local && printf "Created frontend/.env.local from .env.example\n"; else printf "frontend/.env.local already exists\n"; fi
	npm install

dev:
	env NEXT_PUBLIC_API_BASE_URL="$(NEXT_PUBLIC_API_BASE_URL)" npm run dev -- --port $(PORT)

build:
	env NEXT_PUBLIC_API_BASE_URL="$(NEXT_PUBLIC_API_BASE_URL)" npm run build

test:
	npm run test
