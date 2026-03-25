set shell := ["bash", "-cu"]

# Show available recipes
default:
  @just --list

# Install dependencies
install:
  npm install

# Run Next.js development server
run: install
  npm run dev

# Build for production
build: install
  npm run build

# Start production server (after build)
start:
  npm run start

# Run linter
lint: install
  npm run lint

# Auto-fix lint issues
lint-fix: install
  npm run lint:fix

# Run unit tests
test-unit: install
  npm run test:unit

# Run end-to-end tests
test-e2e: install
  npm run test:e2e

# Run all tests
test: test-unit test-e2e

# Run local quality checks
check: lint typecheck test build

# Run TypeScript typecheck
typecheck: install
  npm run typecheck
