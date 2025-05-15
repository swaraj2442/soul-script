# Supabase Database Management Makefile

# Variables
SUPABASE_PROJECT_ID ?= ltgvfjmkyaklsqvfvaki
SUPABASE_DB_URL ?= postgresql://postgres:postgres@localhost:54322/postgres
MIGRATIONS_DIR = supabase/migrations

# Colors for terminal output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help migrate-new migrate-up migrate-down migrate-reset db-push db-pull db-reset db-status

help:
	@echo "${GREEN}Available commands:${NC}"
	@echo "  ${YELLOW}migrate-new${NC}    - Create a new migration file"
	@echo "  ${YELLOW}migrate-up${NC}     - Apply all pending migrations"
	@echo "  ${YELLOW}migrate-down${NC}   - Rollback the last migration"
	@echo "  ${YELLOW}migrate-reset${NC}  - Reset all migrations"
	@echo "  ${YELLOW}db-push${NC}        - Push local changes to remote database"
	@echo "  ${YELLOW}db-pull${NC}        - Pull remote database changes"
	@echo "  ${YELLOW}db-reset${NC}       - Reset the database to initial state"
	@echo "  ${YELLOW}db-status${NC}      - Show migration status"

# Create a new migration file
migrate-new:
	@read -p "Enter migration name: " name; \
	supabase migration new "$$name"

# Apply all pending migrations
migrate-up:
	@echo "${GREEN}Applying pending migrations...${NC}"
	@supabase db push

# Rollback the last migration
migrate-down:
	@echo "${YELLOW}Rolling back last migration...${NC}"
	@supabase db reset --db-url $(SUPABASE_DB_URL)

# Reset all migrations
migrate-reset:
	@echo "${RED}Resetting all migrations...${NC}"
	@supabase db reset --db-url $(SUPABASE_DB_URL)

# Push local changes to remote database
db-push:
	@echo "${GREEN}Pushing local changes to remote database...${NC}"
	@supabase db push

# Pull remote database changes
db-pull:
	@echo "${GREEN}Pulling remote database changes...${NC}"
	@supabase db pull

# Reset the database to initial state
db-reset:
	@echo "${RED}Resetting database to initial state...${NC}"
	@supabase db reset

# Show migration status
db-status:
	@echo "${GREEN}Current migration status:${NC}"
	@supabase migration list

# Development commands
dev:
	@echo "${GREEN}Starting development environment...${NC}"
	@supabase start

stop:
	@echo "${YELLOW}Stopping development environment...${NC}"
	@supabase stop

# Database backup and restore
backup:
	@echo "${GREEN}Creating database backup...${NC}"
	@mkdir -p backups
	@supabase db dump -f backups/backup_$$(date +%Y%m%d_%H%M%S).sql

restore:
	@echo "${YELLOW}Restoring database from backup...${NC}"
	@ls -t backups/*.sql | head -n 1 | xargs -I {} supabase db restore -f {}

# Type generation
types:
	@echo "${GREEN}Generating TypeScript types...${NC}"
	@supabase gen types typescript --project-id $(SUPABASE_PROJECT_ID) > types/supabase.ts 