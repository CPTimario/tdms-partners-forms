# TDM Partners Forms

Web application for preparing Ten Days Missions support partner forms and exporting review-ready outputs.

## Overview

This project provides a client-side, guided form flow that captures:

- Partner information
- Accountability options
- Final review preview rendered from the generated PDF itself
- Single PDF export that matches the review preview

The app starts with a membership gate at `/`: "Are you a Victory church member?".

- `Yes` redirects to `/victory`, shows an accountability agreement gate, and requires `I Agree` before entering the form.
- `No` redirects to `/non-victory` and proceeds directly to the form using the non-victory variant.

Direct entry routes are also supported:

- `/victory`: starts at the agreement gate, then continues to the Victory variant after `I Agree`.
- `/non-victory`: skips membership/agreements and starts directly on the form.

After the gate, the app walks through Partner Information and Accountability, and finally unlocks Review once all required data is complete.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- CSS Modules + global CSS
- zod for schema-based form validation
- react-signature-canvas for drawn signature capture
- pdf-lib for template-based PDF generation
- Playwright for both unit and end-to-end test suites
- Just for local command automation

## Project Structure

- [app](app): Next.js app entrypoints, layout, and global styles
- [app/api/mapper/coordinates](app/api/mapper/coordinates): development-only API route that persists mapper coordinates to source
- [components/mapper](components/mapper): development mapper UI for visual coordinate tuning
- [components/support-form-builder](components/support-form-builder): feature UI for multi-step form and previews
- [hooks/use-support-form.ts](hooks/use-support-form.ts): form state, step transitions, and actions
- [lib/support-form.ts](lib/support-form.ts): domain model, copy constants, and validation rules
- [lib/pdf-generator.ts](lib/pdf-generator.ts): PDF generation and download helpers
- [lib/pdf-coordinates.ts](lib/pdf-coordinates.ts): tuned field coordinates for both templates
- [tests/unit](tests/unit): domain-focused unit tests
- [tests/e2e](tests/e2e): browser workflow tests
- [playwright.config.ts](playwright.config.ts): e2e test config
- [playwright.unit.config.ts](playwright.unit.config.ts): unit test config
- [justfile](justfile): local automation recipes


## Prerequisites

- Node.js 20+
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

Unit tests live in [tests/unit/support-form.spec.ts](tests/unit/support-form.spec.ts), [tests/unit/pdf-generator.spec.ts](tests/unit/pdf-generator.spec.ts), and [tests/unit/pdf-renderer.spec.ts](tests/unit/pdf-renderer.spec.ts), and cover:

- Domain behavior in [lib/support-form.ts](lib/support-form.ts), including required-field validation, step-level validity, and formatting helper behavior
- PDF data-model validation for review/export generation inputs
- Mapper/PDF renderer configuration constraints (template path, page selection, zoom bounds)

Run:

```bash
just test-unit
```

### End-to-End Tests

E2E tests in [tests/e2e/support-form.spec.ts](tests/e2e/support-form.spec.ts), [tests/e2e/pdf-generation.spec.ts](tests/e2e/pdf-generation.spec.ts), [tests/e2e/mapper.spec.ts](tests/e2e/mapper.spec.ts), and [tests/e2e/pdf-rendering.spec.ts](tests/e2e/pdf-rendering.spec.ts) cover:

- Membership gate flow and route redirects (`/` -> `/victory` or `/non-victory`)
- Direct route entry behavior for `/victory` and `/non-victory`
- Required-field blocking and recovery
- Accountability requirements enforced before Review (drawn signature and Partner Full Name)
- Review transition with generated PDF preview present
- Single download button behavior for PDF-only export
- PDF download triggers for both membership variants
- Mapper interactions: click-to-place, drag, keyboard nudge, resize, and save status behavior
- PDF.js mapper rendering behavior: non-victory template asset loads without 404, rapid template/page switching stability, and canvas overlay interaction behavior

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
- Review requires both a drawn signature and **Partner Full Name (Printed)** in the accountability section.
- Leaving the signature canvas blank blocks progression with "Signature is required." Leaving printed name blank blocks progression with "Partner Full Name is required."
- Navigating back to the accountability step retains the previously drawn signature.
- On review/export, the generated PDF includes an auto-cropped signature image centered within the mapped accountability signature field.

## Export Behavior

Export and preview implementation in [lib/pdf-generator.ts](lib/pdf-generator.ts):

- Uses static PDF templates from [public/tdms-forms](public/tdms-forms)
- Fills partner fields on page 1 and accountability/signature fields on page 2
- Centers text in mapped field boxes when text fields define both `width` and `height`
- Trims signature whitespace at capture time and centers the embedded signature image in the configured signature box
- Review preview embeds the generated PDF blob (single source of truth)
- Download action exports the same generated PDF bytes shown in review
- Output is PDF-only (PNG/image export removed)

## Development Mapper

A non-production mapper route is available at [app/mapper/page.tsx](app/mapper/page.tsx).

- Route: `/mapper`
- Availability: any non-production environment (`NODE_ENV !== "production"`)
- Production behavior: resolves to not found
- Purpose: inspect/copy coordinate snippets while tuning [lib/pdf-coordinates.ts](lib/pdf-coordinates.ts)

Mapper capabilities:

- Switch between Victory and Non-Victory templates
- Switch between page 1 and page 2 field groups
- Position field boxes directly on the rendered template page
- Click the template to place the selected field
- Drag boxes to move them and use arrow keys for fine nudging
- Resize selected fields using the corner resize handle
- Edit x/y/width/height values in mm and copy field snippets
- Persist draft coordinates with **Save to app file**

Mapper save API:

- Endpoint: `POST /api/mapper/coordinates`
- Handler: [app/api/mapper/coordinates/route.ts](app/api/mapper/coordinates/route.ts)
- Availability: any non-production environment (`NODE_ENV !== "production"`); returns 404 in production
- Request body: `{ "coordinates": { "victory": TemplateCoordinates, "nonVictory": TemplateCoordinates } }`
- Validation: zod payload validation before file write
- Success: `200 { "ok": true }`
- Failures:
	- `400 { "error": "Invalid payload", "details": ... }`
	- `500 { "error": "Failed to save coordinates" }`

Coordinate configuration notes:

- Text centering is opt-in via `width` and `height` on text fields in [lib/pdf-coordinates.ts](lib/pdf-coordinates.ts).
- If either dimension is missing, text rendering falls back to x/y placement with baseline nudge.
- Template asset mapping is explicit by membership type (`victory` -> `pic-saf-victory.pdf`, `nonVictory` -> `pic-saf-non-victory.pdf`) to avoid filename mismatch.

## Verified Behavior and Caveats

Primary validation commands used for focused and regression checks:

- `npx tsc --noEmit`
- `npm run test:unit -- --reporter=list`
- `npx playwright test tests/e2e/mapper.spec.ts tests/e2e/pdf-rendering.spec.ts --reporter=list`
- `npx playwright test tests/e2e/pdf-generation.spec.ts tests/e2e/support-form.spec.ts --reporter=list`
- `npm run test:e2e -- --reporter=list`

Current caveats/limitations:

- Coordinates are template-specific; if source PDFs change, update [lib/pdf-coordinates.ts](lib/pdf-coordinates.ts).
- Saving from `/mapper` rewrites [lib/pdf-coordinates.ts](lib/pdf-coordinates.ts) using deterministic serialization and may replace manual formatting/comments in that file.
- Mapper template rendering depends on the generated worker asset at `/public/pdf.worker.mjs`; if the worker copy step fails, mapper PDF rendering will show a "PDF Render Error" state.
- Review preview uses an embedded PDF frame; browser PDF rendering differences can affect how quickly the preview appears, but download still works from the same generated bytes.
- Responsiveness applies to form UI only. PDF placement remains fixed to template coordinates by design.
- The Victory agreement gate does not close on `Escape` (covered by e2e tests). It is also implemented without a Back action. To switch to non-victory after entering `/victory`, navigate to `/` or `/non-victory`.
- Membership choice is route-driven at the URL level; reloading on `/victory` or `/non-victory` keeps that route context instead of returning to the root membership gate.
- Route-context persistence does not imply form-data persistence. Entered form values are in-memory UI state and reset on full page reload.

## Troubleshooting

- If Playwright tests fail before running, install browsers then rerun:

```bash
npx playwright install --with-deps chromium
just test-e2e
```

- If e2e tests fail immediately with unexpected page content (e.g. a login prompt) rather than a form assertion, another app is occupying 127.0.0.1:3000. Stop it and rerun.

- If signature-related e2e tests fail with "Signature is required." despite `drawSignature` being called, the most likely cause is that the canvas was off-screen when pointer events fired. The helper already calls `scrollIntoViewIfNeeded()` — verify it has not been removed if tests are modified.

- If progression is blocked with "Partner Full Name is required.", fill **Partner Full Name (Printed)** in the accountability section before clicking Review Forms.

- If preview appears blank on a specific browser, use the Download PDF action to verify generation output. The exported file is the source of truth.

- If local artifacts appear in git status, verify [.gitignore](.gitignore) is up to date and remove stale tracked files manually.

## Contributing

- Keep changes scoped and aligned to existing form and PDF generation behavior
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
