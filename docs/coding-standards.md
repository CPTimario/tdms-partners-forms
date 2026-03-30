**Coding Standards**

This document captures the core coding standards and best practices for the tdm-partners-forms repository. It is intended for contributors, reviewers, and maintainers to keep the codebase consistent, readable, and reliable.

**Purpose**

- **Audience**: Contributors, reviewers, and CI maintainers.
- **Goal**: Improve readability, reduce bugs, and maintain a consistent developer experience.

**Formatting & Linting**

- **Linting**: Follow rules in [eslint.config.mjs](eslint.config.mjs). Run `npm run lint` before committing.
- **Formatting**: Use the repository formatter/IDE integration. Run `npm run format` if available, otherwise use your editor's configured formatter.
- **Imports**: Keep imports grouped (external, absolute, relative) and ordered alphabetically per group.

**TypeScript & Types**

- **Strictness**: Prefer explicit types for public interfaces and component props. Avoid `any` except in narrow, documented cases.
- **tsconfig**: Follow [tsconfig.json](tsconfig.json) project settings. Add new compiler options only via PR discussion.
- **Types Location**: Put shared types under `types/` or alongside the module that owns them.

**React & Components**

- **Functional Components**: Use function components with hooks. Keep components small and focused (single responsibility).
- **Props**: Define a props interface and destructure in the parameter list: `function MyComp({ prop }: Props) {}`.
- **State & Effects**: Minimize local state; prefer derived state where possible. Keep `useEffect` dependencies complete and stable.
- **Styling**: Use CSS Modules for component-scoped styles (files under `components/` use `.module.css`). Avoid global CSS unless intentionally shared in `app/globals.css`.

**Accessibility (a11y)**

- **Semantics**: Prefer semantic HTML elements; keep interactive elements keyboard accessible.
- **Labels**: Ensure form controls have associated labels or accessible names.
- **Testing**: Include basic accessibility assertions in unit or e2e tests when practical.

**Testing**

- **Unit tests**: Use Vitest for unit tests. Keep unit tests fast and focused. Run `npm run test:unit` locally.
- **E2E tests**: Use Playwright for end-to-end tests; configuration lives in [playwright.config.ts](playwright.config.ts). Run `npm run test:e2e` when changing user flows.
- **Fixtures & Mocks**: Keep test fixtures in `tests/` and avoid coupling tests to internal implementation details.

**Performance & Bundling**

- **Client bundle**: Avoid shipping large dependencies to the client. Use dynamic imports for heavy or rarely-used modules.
- **Images & Assets**: Optimize images and serve appropriately sized assets.

**Security & Secrets**

- **No secrets in repo**: Never commit private keys, tokens, or credentials. Use environment variables and keep them out of source control.
- **Deps**: Keep dependencies up to date and respond to security alerts promptly.

**Git & Workflow**

- **Branching**: Use short-lived feature branches from `main`/`master` and open a PR for review.
- **Commits**: Write clear, focused commit messages. Include context for non-obvious changes.
- **PRs**: Include a short description, testing notes, and any migration steps. Add screenshots where UI changes are involved.

**Continuous Integration**

- **CI**: The repository runs linting, typechecking, unit and e2e tests in CI. Ensure your branch passes these checks before merging.
- **Local checks**: Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, and `npm run test:e2e` (or the subset that applies) before opening a PR.

**Code Review Checklist**

- **Correctness**: Does the change do what it intends and handle edge cases?
- **Readability**: Is the code clear and easy to follow? Are tests present and meaningful?
- **Safety**: Any user-facing change validated by e2e tests? Any secrets or credentials added accidentally?
- **Performance & Size**: Any large dependency or bundle impact?

**Emergencies & Rollbacks**

- **Hotfixes**: Apply minimal, well-tested changes and open a follow-up PR to clean up technical debt.
- **Rollback**: If a deploy causes regressions, revert the change and follow the incident process.

**Useful Commands**

- **Install**: `npm ci`
- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Unit tests**: `npm run test:unit`
- **E2E tests**: `npm run test:e2e`

**Folder & File Structure**

- **app/**: Next.js app routes, layout and page entry points. See [app/](app/).
- **components/**: Reusable UI components. Use subfolders for feature groups (e.g., `support-form-builder`, `mapper`).
- **hooks/**: Custom React hooks (prefix files with `use-`).
- **lib/**: Domain logic and utilities (kebab-case filenames).
- **types/**: Shared TypeScript types and declaration files.
- **tests/**: Test sources — `tests/unit` for Vitest unit tests and `tests/e2e` for Playwright tests.
- **public/**: Static assets served by Next.js.
- **scripts/**: Local build/dev helper scripts.
- Configuration files: root-level configs live at [eslint.config.mjs](eslint.config.mjs), [tsconfig.json](tsconfig.json), [playwright.config.ts](playwright.config.ts), [vitest.config.ts](vitest.config.ts), and `.prettierrc`.

**Naming Conventions**

- **React components (files):** PascalCase with the component name, e.g. `AccountabilityModal.tsx`. Component files should export the component as the default export when the file contains a single primary component.
- **Component styles:** Use CSS Modules named to match the component: `ComponentName.module.css` (see [components/AccountabilityModal.module.css](components/AccountabilityModal.module.css)).
- **Hooks:** Prefix with `use-` and use kebab-case, e.g. `use-snackbar.ts`.
- **Utilities & libs:** Use kebab-case filenames, e.g. `deeplink-client.ts`, `pdf-generator.ts`.
- **Types & d.ts:** Keep in `types/` or colocated next to the owner module. Use descriptive names like `qrcode.d.ts` or `pdf-form.ts`.
- **Tests:** Unit tests use `*.spec.tsx` under `tests/unit/`; e2e tests use `*.spec.ts` under `tests/e2e/`. Match the tested module path when practical.
- **Assets:** Put static assets in `public/` and avoid checked-in large binaries.

**Where to Update This Doc**

- Update this file when adding or changing repository-wide tooling, lint rules, build steps, or test strategies.

---

Contributors: follow these standards and add repository-specific exceptions to a PR description when necessary.
