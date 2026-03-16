# TDM Partners Forms

Web application for preparing Ten Days Missions support partner forms and exporting review-ready outputs.

## Overview

This project provides a client-side, guided form flow that captures:

- Partner information
- Accountability options
- Final review preview of both printable forms
- PNG and PDF export of each form preview

The app starts with membership type selection, then walks through Partner Information and Accountability, and finally unlocks Review once all required data is complete.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- CSS Modules + global CSS
- html2canvas + jsPDF for export
- Playwright for both unit and end-to-end test suites
- Just for local command automation

## Project Structure

- [app](app): Next.js app entrypoints, layout, and global styles
- [components/support-form-builder](components/support-form-builder): feature UI for multi-step form and previews
- [hooks/use-support-form.ts](hooks/use-support-form.ts): form state, step transitions, and actions
- [lib/support-form.ts](lib/support-form.ts): domain model, copy constants, and validation rules
- [lib/export-form.ts](lib/export-form.ts): PNG/PDF export utility
- [tests/unit](tests/unit): domain-focused unit tests
- [tests/e2e](tests/e2e): browser workflow tests
- [playwright.config.ts](playwright.config.ts): e2e test config
- [playwright.unit.config.ts](playwright.unit.config.ts): unit test config
- [justfile](justfile): local automation recipes


## Prerequisites

- Node.js 18+
- npm 9+

## Setup

Install dependencies:

```bash
just install
```

Verify end-to-end tooling is available:

```bash
just test-e2e
```

## Run Locally

Run the development server:

```bash
just run
```

Open http://127.0.0.1:3000 in your browser.

## Scripts

Available local workflows from [justfile](justfile):

- `just install`: install dependencies
- `just run`: start development server
- `just build`: production build
- `just start`: serve production build
- `just lint`: lint source
- `just test-unit`: run unit tests
- `just test-e2e`: run end-to-end tests
- `just test`: run unit and e2e tests
- `just check`: run lint, tests, and build

## Testing

### Unit Tests

Unit tests live in [tests/unit/support-form.spec.ts](tests/unit/support-form.spec.ts) and focus on domain behavior in [lib/support-form.ts](lib/support-form.ts), including:

- Required-field validation
- Step-level validity
- Formatting helper behavior

Run:

```bash
just test-unit
```

### End-to-End Tests

E2E tests live in [tests/e2e/support-form.spec.ts](tests/e2e/support-form.spec.ts) and cover:

- Membership gate flow
- Required-field blocking and recovery
- Review transition
- PNG/PDF download triggers

Run:

```bash
just test-e2e
```

For targeted Playwright execution, use project npm scripts directly from [package.json](package.json).

## Just Workflows

Project automation recipes in [justfile](justfile):

- `just install`
- `just run`
- `just lint`
- `just test-unit`
- `just test-e2e`
- `just test`
- `just build`
- `just start`
- `just check`

`just check` runs lint, tests, and build as one local quality gate.

## Environment and Ignore Policy

- Environment files are matched by `.env*` and ignored by default in [.gitignore](.gitignore)
- Generated test artifacts are ignored:
	- [playwright-report](playwright-report)
	- [test-results](test-results)
- Next.js and build outputs are ignored:
	- [.next](.next)
	- [out](out)
	- [build](build)

## Export Behavior

Export implementation in [lib/export-form.ts](lib/export-form.ts):

- Captures review surfaces with html2canvas
- Exports PNG via data URL download
- Exports PDF via jsPDF in A4 portrait format

## Troubleshooting

- If Playwright tests fail before running, rerun end-to-end tests after browser setup:

```bash
just test-e2e
```

- If e2e cannot connect to local app, confirm no process is blocking 127.0.0.1:3000 and rerun tests.

- If local artifacts appear in git status, verify [.gitignore](.gitignore) is up to date and remove stale tracked files manually.

## Contributing

- Keep changes scoped and aligned to existing form and export behavior
- Update tests when behavior changes
- Run local quality checks before opening a PR:

```bash
just check
```

- Update this README when scripts, workflow, or architecture guidance changes

## Deployment

Production commands:

```bash
just build
just start
```

You can deploy this Next.js app to your preferred Node-compatible hosting provider.
