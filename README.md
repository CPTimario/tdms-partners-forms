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
- react-signature-canvas for drawn signature capture
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
- Drawn signature requirement enforced before Review
- Review transition with signature present
- Printed partner name visible in accountability preview signature area
- PNG/PDF download triggers

Run:

```bash
just test-e2e
```

**E2E prerequisite:** `just test-e2e` starts the Next.js dev server automatically via `webServer` in [playwright.config.ts](playwright.config.ts). If a different process is already occupying 127.0.0.1:3000, tests will fail immediately at membership-gate assertions because Playwright's `reuseExistingServer: true` will connect to that process instead. Stop the conflicting server before running e2e.

**Signature canvas simulation:** The `drawSignature` helper in the e2e suite calls `scrollIntoViewIfNeeded()` before reading `boundingBox()` and passes `{ steps: 10 }` to `mouse.move()`. Both are required for `signature_pad` to receive intermediate `pointermove` events and record stroke data — if either is omitted the canvas will stay empty and the signature-required error will appear.

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

## Signature

The accountability step includes a drawn signature pad powered by `react-signature-canvas`.

- Draw using mouse, touch, or stylus on the canvas area.
- Use **Clear Signature** to reset and re-draw at any time.
- A signature is required before the Review step is available; leaving the canvas blank blocks progression with "Signature is required."
- Navigating back to the accountability step retains the previously drawn signature.
- On review, the accountability preview shows the drawn signature image followed by the partner's full name (taken from the Partner Name field filled in step 1) above the rule line, matching the physical form's "PARTNER'S SIGNATURE OVER PRINTED NAME" label. Both elements are present in PNG and PDF exports automatically — no extra steps needed.
- The printed name is sourced from `partnerName` (always required in step 1), so it is always populated by the time the preview renders. No separate input is needed.

## Export Behavior

Export implementation in [lib/export-form.ts](lib/export-form.ts):

- Captures review surfaces with html2canvas at 2× scale
- Exports PNG via data URL download
- Exports PDF via jsPDF in A4 portrait format
- Drawn signature renders as an inline `<img>` inside the accountability preview so html2canvas captures it without any additional configuration

## Troubleshooting

- If Playwright tests fail before running, install browsers then rerun:

```bash
npx playwright install --with-deps chromium
just test-e2e
```

- If e2e tests fail immediately with unexpected page content (e.g. a login prompt) rather than a form assertion, another app is occupying 127.0.0.1:3000. Stop it and rerun.

- If signature-related e2e tests fail with "Signature is required." despite `drawSignature` being called, the most likely cause is that the canvas was off-screen when pointer events fired. The helper already calls `scrollIntoViewIfNeeded()` — verify it has not been removed if tests are modified.

- If the drawn signature does not appear in exported PDFs or PNGs, confirm the accountability preview is rendering an `<img>` element (not a `<canvas>`) for the signature field. html2canvas can capture `<img>` tags directly; `<canvas>` elements inside iframes or cross-origin contexts may not render.

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
