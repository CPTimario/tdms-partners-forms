# TDMS Partners Forms

Ten Days Missions — partner support form builder (Next.js). The app prepares partner support forms, lets users review data, and exports a PDF. It supports creating encrypted deeplink tokens for safe sharing.

Why this repo
--------------
- Browser-first PDF generation and preview.
- Shareable encrypted deeplink tokens (minimal fields) for pre-filling forms.
- Accessible UI built with MUI and responsive layouts.

Quick start
-----------
Prerequisites: Node >= 24.14.0 and npm (see `package.json` `engines`).

Install and run locally (recommended order):

```bash
# install project dependencies
npm ci

# install Playwright browsers if running E2E tests
npx playwright install --with-deps

# start dev server (this script will exit if DEEPLINK_KEY is not set)
npm run dev
```

Environment
-----------
The server-side deeplink endpoints require `DEEPLINK_KEY` to be set (used to encrypt/decrypt recipient tokens). The `dev` and `start` scripts run a pre-start check (`scripts/check-deeplink-key.js`) and will exit with a non-zero status if `DEEPLINK_KEY` is not set. This prevents starting the server in a misconfigured state.

Set it locally via `.env` or your shell:

```env
DEEPLINK_KEY=your-secure-random-key
```

In CI make `DEEPLINK_KEY` a repository secret and inject it into the workflow environment. See `.github/workflows/ci.yml` for an example where `DEEPLINK_KEY` is provided to the job environment.

Running tests
-------------
- Unit tests (Vitest):

```bash
npm run test:unit
```

- E2E tests (Playwright): ensure a dev server is running, then:

```bash
# install browsers once
npx playwright install --with-deps
# run playwright tests
npm run test:e2e
```

See `tests/` for test structure and examples. CI runs lint, typecheck, unit tests, installs Playwright browsers, and runs E2E tests (see `.github/workflows/ci.yml`).

APIs
----
- `POST /api/deeplink` — create an encrypted `token` from allowed fields.
- `GET /api/deeplink?token=...` — decrypt token and return `fields` for pre-filling.

Docs
----
Further privacy and testing details are in `docs/privacy.md` and `docs/testing.md`.

Development notes
-----------------
- Keep `DEEPLINK_KEY` out of source control. Use CI secrets for workflows.
- Unit tests mock or stub browser-specific components where appropriate; see `tests/unit` for examples.
- MUI portal root: the app provides a predictable portal container at `#mui-portal-root` (see `app/layout.tsx`). Portal-mounted UI (for example MUI `Snackbar`, dialogs, and popovers) renders into that element; tests and debug tooling may need to query that container.

Contributing checklist
----------------------
- Before opening a PR, run lint and typecheck:

```bash
npm run lint
npm run typecheck
```

- Run unit tests and ensure they pass:

```bash
npm run test:unit
```

- If your change affects UI flows covered by E2E tests, run Playwright locally (install browsers first):

```bash
npm ci
npx playwright install --with-deps
npm run test:e2e
```

- Ensure `DEEPLINK_KEY` is not committed and is present in CI (use repo secrets).

Contributing
------------
- Add focused changes with tests where applicable. Update docs when behavior changes.

