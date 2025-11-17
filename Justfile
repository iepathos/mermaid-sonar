# Justfile for mermaid-sonar
# Maps npm scripts to just recipes for easier workflow integration

# Default recipe - show available commands
default:
    @just --list

# Development
dev:
    npm run dev

# Build
build:
    npm run build

# Testing
test:
    npm test

test-watch:
    npm run test:watch

test-coverage:
    npm run test:coverage

# Code Quality
lint:
    npm run lint

format:
    npm run format

fmt: format

format-check:
    npm run format:check

fmt-check: format-check

typecheck:
    npm run typecheck

# Combined quality checks
check: typecheck lint format-check

# Clean
clean:
    npm run clean

# Full CI-like check
ci: clean check build test

# Install dependencies
install:
    npm install

# Prepare for publishing
prepublish: clean build test
