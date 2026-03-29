# TDMS Partners Forms

Ten Days Missions support form builder — a Next.js application that prepares partner support forms and exports a review-ready PDF.

Overview
--------
- Server-side deeplinking: the app creates and validates encrypted `recipient` tokens via server endpoints. Tokens contain a minimal set of fields used for pre-filling the form.
- Native date input: `Travel Date` uses the browser's `input[type="date"]` and stores values as ISO `YYYY-MM-DD`. Validation requires the date to be today or later. QR labels render the travel date as a human-friendly string (e.g., "June 20, 2026").
- QR sharing: generating a share link requests a server-created token, appends `recipient=<token>` to the canonical URL, and produces a QR PNG that points to that URL.

Quick start
-----------
Prerequisites: Node 20+ and npm.

Install and run locally:

```bash
npm ci
npx playwright install --with-deps chromium   # only if running E2E
npm run dev
```

API endpoints
-------------
- `POST /api/deeplink` — accepts JSON with the allowed fields (missionaryName, nation, travelDate, sendingChurch) and returns `{ token }` (encrypted).
- `GET /api/deeplink?token=...` — returns `{ fields }` by decrypting the provided token.

Security / encryption
---------------------
- Tokens are now encrypted server-side using AES-256-GCM and the `DEEPLINK_KEY` environment variable. This provides confidentiality and authentication for token payloads (fields used to pre-fill the form).
- Keep `DEEPLINK_KEY` secret and rotate it if compromised. Tokens are short-lived only by design; consider adding `iat`/`exp` claims if you need TTL enforcement.

Configuration
-------------
Set the following environment variable for server-side deeplink operations:

```env
DEEPLINK_KEY=your-secret-key
```

Testing
-------
- Unit tests: `npm run test:unit` (Vitest).
- E2E tests: `npm run test:e2e` (Playwright). Tests that need deterministic suggestions stub `GET /api/teams`.

CI
-- Ensure `DEEPLINK_KEY` is provided in CI environment variables.
-- CI should run lint, typecheck, unit tests, install Playwright browsers, and run E2E in a separate job against a started dev server. See `.github/workflows/ci.yml` for an example.

Relevant files
--------------
- Form UI: `components/support-form-builder/SupportFormBuilder.tsx`, `components/support-form-builder/FillStep.tsx`
- Deeplink crypto: `lib/deeplink-crypto.ts`
- Deeplink API: `app/api/deeplink/route.ts`
- Teams API shim: `app/api/teams/route.ts` and `hooks/useTeams.ts`
- QR generation: `lib/qr.ts`

Contributing
------------
Keep changes focused and include tests for behavior changes. Avoid committing secrets; set `DEEPLINK_KEY` through CI/project settings.
