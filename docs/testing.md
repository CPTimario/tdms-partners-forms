# Testing

This file documents the repository's test setup and common commands for running tests locally and in CI.

## Unit tests

- Runner: Vitest
- Command:

```bash
npm run test:unit
```

- Unit tests stub browser-specific or heavy UI modules where appropriate (see `tests/unit/*` for examples).

## End-to-end tests (E2E)

- Runner: Playwright
- Before running E2E tests, install browsers and start a dev server. Recommended sequence:

```bash
# install project dependencies
npm ci

# install playwright browsers
npx playwright install --with-deps

# start dev server in one terminal
npm run dev

# in another terminal, run E2E tests
npm run test:e2e
```

- Playwright is configured to use `http://127.0.0.1:3000` as the `baseURL` and will start a local dev server via the `webServer` setting if needed. See `playwright.config.ts` for the exact `baseURL` and `webServer` command/timeouts.
- Many E2E tests interact with MUI components; tests use combobox/listbox triggers and visible listbox options rather than native `select` elements. See `tests/e2e/` for patterns.

CI
-- The included GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, installs Playwright browsers, and runs E2E tests. Ensure `DEEPLINK_KEY` is set in repository secrets and injected into the job environment.

## Troubleshooting

- If Playwright tests fail due to inaccessible elements, verify the dev server is ready and increase timeouts locally.
- Unit tests may mock `@mui/x-date-pickers` and other ESM-heavy modules; if you add new UI dependencies, add lightweight mocks in `tests/unit` to keep unit runs fast and deterministic.
