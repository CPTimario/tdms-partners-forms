# Contributing

Thanks for helping improve this project. Follow these quick guidelines to make contributions smooth.

- Branching: Create a feature branch off `main`/`master` with a short descriptive name.
- Commit messages: Keep commits focused and descriptive. Prefer one change per commit.
- Pull requests: Include a short description, testing notes, and commands to reproduce locally.

Required checks before opening a PR (run locally):

```bash
npm ci
npm run format
npm run lint
npm run typecheck
npm run test:unit
```

- Formatting: This repo uses Prettier. Run `npm run format` or configure your editor to format on save.
- Linting: Run `npm run lint` and fix any issues before opening a PR.
- TypeScript: Keep `strict` enabled and avoid `any` in production code; test files may use narrow `any` with justification.
- Tests: Add or update unit and e2e tests for user-facing behavior.

CI

- The GitHub Actions pipeline runs formatting checks, lint, typecheck, and unit tests. Ensure your branch passes CI before merging.

Thank you! If you're unsure about a change, open an issue or ask in the PR for guidance.
