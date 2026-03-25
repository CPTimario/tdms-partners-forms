# TDMS Partners Forms

A small Next.js app for preparing Ten Days Missions partner support forms and exporting a review-ready PDF.

Core points:
- Accessible Autocomplete for missioner/team lookup with programmatic autofill (nation, travel date, sending church).
- Deeplinking via a canonical `recipient` query parameter and client-side QR generation for sharing the current form state.

Quick setup
-----------
Requires Node 20+ and npm.

Install dependencies and Playwright browsers (for E2E):

```bash
just install
npx playwright install --with-deps chromium
```

Run locally:

```bash
just run
# or
npm run dev
```

Deep linking & QR sharing
-------------------------
- Canonical query param: `recipient` — a stable suggestion id only (no PII).
- URL writes are centralized in `components/support-form-builder/SupportFormBuilder.tsx`; child components report selections via `onRecipientSelect(item|null)`.
- Typing in the Autocomplete clears the selection and the `recipient` param; re-selecting restores it.
- The Share action generates a downloadable PNG with a QR linking to the canonical URL (client-side, dynamic import of `qrcode`).

Running tests
-------------
- Unit (Vitest):

```bash
just test-unit
# or
npm run test:unit
```

- E2E (Playwright):

```bash
just test-e2e
# or
npm run test:e2e
```

Testing notes
-------------
- E2E tests that need deterministic suggestions intercept `GET /api/teams` and return a fixed payload (see `tests/e2e/clear-reselect.spec.ts`).
- Prefer role-based selectors (`combobox`, `listbox`, `option`) for robust tests.
- Autocomplete and URL replace are asynchronous; increase timeouts if tests are flaky on slow machines.
- Playwright may emit artifacts to `playwright-report/` and `test-results/` during debugging; debug screenshots were removed from the stable E2E test, but local artifacts can be deleted if present.

CI notes
--------
- Ensure Playwright browsers are installed in CI (`npx playwright install --with-deps`).
- CI workflow should run lint, typecheck, unit tests, then E2E in a separate job with a started dev server. See `.github/workflows/ci.yml` for an example.

Where to look
-------------
- Form wiring: `components/support-form-builder/SupportFormBuilder.tsx`, `FillStep.tsx`, `Autocomplete.tsx`.
- Teams API: `app/api/teams/route.ts` and `hooks/useTeams.ts`.
- QR generation: implemented in the support form component (dynamic `qrcode` import).

Contributing
------------
- Keep changes focused and add tests for behavior changes. Run `just check` before opening a PR.
