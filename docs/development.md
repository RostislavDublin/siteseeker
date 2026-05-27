# Development Guide

## Quick Reference

| Action | Command |
|---|---|
| Dev server (auto-restart) | `npm run dev` |
| Type check | `npx tsc --noEmit` |
| Run all tests | `npx vitest run` |
| Run one test file | `npx vitest run test/api/watches.test.ts` |
| Filter tests by name | `npx vitest run --testNamePattern "creates a watch"` |

## Code Conventions

- No semicolons in TypeScript unless syntactically required
- Single quotes, 2-space indent
- ESM only: use `.js` extensions in imports (TypeScript NodeNext resolution)
- Strict TypeScript (no `any`, no type assertions unless unavoidable)
- All distances in miles (mi), never km
- Errors: fail fast at boundaries, propagate typed errors internally
- Rate limiting: declared by adapter, enforced by engine (adapters must not self-throttle)
- Config: YAML for user config, environment variables for secrets
- Do not over-engineer: no abstractions for one-time operations, no speculative features
- SQLite schema changes must be additive (no destructive migrations in dev phase)
- Match deduplication must be preserved (never re-notify for the same slot)
- English for code, comments, and documentation

## Workflow: Documentation-first

Before implementing any feature, change, or refactoring:

1. Describe the planned change and get approval
2. Update relevant documentation FIRST (README.md, roadmap.md, architecture docs, ADRs) to reflect the intended new state
3. Then implement the code change
4. Run type check (`npx tsc --noEmit`) to validate
5. Verify docs still match the final result (adjust if implementation diverged from plan)

This ensures documentation never lags behind the code.

## Workflow: Test-driven development

All functionality must be covered by integration/e2e/acceptance tests.

### Principles

- Every new feature or endpoint gets tests BEFORE or ALONGSIDE the implementation
- Every existing feature must have corresponding tests; if coverage gaps are found, fill them
- Tests validate real behavior end-to-end (HTTP calls to Hono app, DB state assertions, engine runs)
- No mocking of internal layers; mock only external services (recreation.gov API, Telegram)

### Test suite structure

- Runner: vitest (verbose reporter, `vitest.config.ts`)
- Organized by domain area: `test/api/`, `test/engine/`, `test/sources/`, `test/notify/`
- Helper: `test/helpers/setup.ts` - `createTestApp()` returns isolated in-memory SQLite DB + Hono app
- Each test is fully idempotent: fresh `:memory:` DB per test, no shared state, no cleanup needed
- Tests create their own prerequisites (user before watch, watch before run) - never depend on other test files

### When to run tests

- After implementing a feature: run the relevant test file
- Before committing: run the full suite (`npx vitest run`)
- After refactoring: run the full suite to catch regressions

## Workflow: Commit discipline

Commit at natural breakpoints:

- After completing a logical unit of work (feature, bugfix, refactor)
- After documentation updates that stand on their own
- Before switching to a different area of the codebase
- After a successful type check confirms a set of changes is coherent

Prefer small, focused commits with descriptive messages. Do not accumulate unrelated changes in a single commit.

## Sequence for any change

```
docs-first (plan + update docs) → tests (write/update) → implementation → type check → run tests → commit
```

## Implementing a new source adapter

1. Create `src/sources/{name}/index.ts` implementing `CampsiteSource` (see `docs/architecture/source-adapter-interface.md`)
2. Add rate policy constants appropriate for the source
3. Register in `src/sources/index.ts`
4. Add tests in `test/sources/{name}.test.ts`
5. Implement `getFacilities()` or provide seed data for Facility Registry

## Implementing a new notification channel

1. Create `src/notify/{name}.ts` implementing `NotificationChannel`
2. Register in `src/notify/index.ts`
3. Add tests in `test/notify/{name}.test.ts`
4. Document config schema in `config.example.yaml`

## Configuration

- `config.yaml` (runtime): database path, port, check_interval, sources, notifications
- `config.example.yaml` (committed template)
- `.env` for secrets (TELEGRAM_BOT_TOKEN, etc.) - never committed
- RIDB API key: configured in `config.yaml` under `sources`

## Directory Layout

```
src/
├── api/        Hono REST routes (users, watches, runs, health)
├── config/     YAML config loader
├── db/         SQLite stores: schema, user-store, watch-store, run-store
├── domain/     Core types (Watch, WatchTarget, SiteMatch, etc.)
├── engine/     Scheduler loop, per-watch evaluation, RunLogger
├── notify/     NotificationDispatcher, Telegram channel, channel interface
├── registry/   FacilityRegistry, facility records
├── sources/    CampsiteSource interface + adapters (recreation-gov/)
├── store/      MatchStore (deduplication)
└── util/       Logger

test/
├── api/        REST endpoint tests
├── engine/     Engine/scheduler tests
├── sources/    Adapter tests
├── notify/     Channel tests
├── helpers/    setup.ts (createTestApp factory)
└── fixtures/   YAML watch definitions

docs/
├── architecture/   System design, domain model, adapter interface, ADRs
└── product/        Vision, roadmap
```
