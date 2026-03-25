# TDMS Partners Forms

Minimal README focused on setup, features, API, and test commands.

## Quick overview

A small Next.js app for preparing Ten Days Missions support partner forms and exporting a review-ready PDF. Includes a guided form flow, an accessible Autocomplete for missioner/team lookup, and a mapping-backed PDF generator.

## Key features

- Guided Partner → Accountability → Review flow
- Accessible Autocomplete sourcing missioner/team suggestions from MongoDB
- Programmatic autofill of dependent fields (nation, travel date, sending church)
- PDF generation and single-file download using templates in `public/tdms-forms`
- Unit (Vitest) and E2E (Playwright) test suites with an accessibility smoke check

## Prerequisites

- Node.js 20+ and npm 9+

## Setup

Install dependencies and Playwright browsers (if running e2e locally):

```bash
just install
npx playwright install --with-deps chromium
```

Run the app locally:

```bash
just run
# or
npm run dev
```

Open: http://127.0.0.1:3000

## Environment

This app requires MongoDB credentials for the teams API. Provide these via environment variables (no silent defaults):

- `MONGODB_URI` — MongoDB connection string
- `MONGODB_DB` — Database name

A sample file is included: `.env.example` (intentionally tracked so teams can copy it without exposing secrets).

## Teams API (used by Autocomplete)

- Endpoint: `GET /api/teams`
- Optional query param: `q` to substring-search `teamName` (case-insensitive)
- Response shape:

```json
{
  "teams": [
    {
      "teamId": "<stable-id>",
      "teamName": "...",
      "nation": "...",
      "travelDate": "YYYY-MM-DD",
      "sendingChurch": "...",
      "missioners": ["Alice", "Bob"]
    }
  ]
}
```

Frontend notes:
- `teamId` is derived from the DB `_id` and is used to build stable suggestion ids.
- The Autocomplete displays both `Team: <teamName>` suggestions and individual missioner names.
- Selecting a suggestion fills `nation`, `travelDate`, and `sendingChurch` via the form's programmatic `setField` API.

Files to inspect:
- `app/api/teams/route.ts` — server route
- `hooks/useTeams.ts` — fetch + normalize
- `components/support-form-builder/Autocomplete.tsx` and `FillStep.tsx` — UI wiring

## Tests

Unit (Vitest):

```bash
just test-unit
# or
npm run test:unit
```

End-to-end (Playwright):

```bash
just test-e2e
# or
npm run test:e2e
```

Accessibility smoke (Playwright + axe): included at `tests/e2e/accessibility.spec.ts`. It injects `axe-core` in the page and fails on violations.

A unit test asserting suggestion id uniqueness is included at `tests/unit/suggestions-unique.spec.ts`.

## Useful scripts

Available via `just` and `package.json` (common):

- `just install` — install deps
- `just run` — start dev server
- `just test-unit` — Vitest
- `just test-e2e` — Playwright e2e
- `just check` — lint + tests + build

Or with npm:

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`

## Contributing

- Keep changes focused and add tests for behavior changes.
- Run `just check` before opening a PR.

---

For more details (PDF mapping, signature behavior, and edge-case notes), inspect `lib/pdf-generator.ts`, `lib/pdf-coordinates.ts`, and `components/support-form-builder`.

## Continuous Integration

- **Node engine:** `>=20.19.0` (see [package.json](package.json))
- **Workflow:** CI runs lint, typecheck, unit tests, and Playwright e2e on Node 20.19.0 — see [.github/workflows/ci.yml](.github/workflows/ci.yml).
- **To run e2e locally:**

```bash
npm ci
npx playwright install --with-deps
npm run test:e2e
```

- **To run on GitHub:** push your branch or open a pull request to trigger the workflow.

Note: If e2e tests fail in CI, ensure Playwright browsers are installed and the runner uses Node 20.19.0.

