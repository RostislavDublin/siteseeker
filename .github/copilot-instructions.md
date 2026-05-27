# SiteSeeker - Project Instructions

SiteSeeker is a campsite availability monitor - self-hosted TypeScript/Node.js application that watches booking systems for cancellations and notifies users.

## Documentation

All detailed specifications, architecture, domain model, and product plans are in `docs/`. Read the relevant documents before making changes.

| Topic | Document |
|---|---|
| System architecture, layers, data flows | `docs/architecture/README.md` |
| Domain model (entities, types) | `docs/architecture/domain-model.md` |
| Source adapter contract | `docs/architecture/source-adapter-interface.md` |
| Architecture decisions | `docs/architecture/adr/` |
| Product vision | `docs/product/vision.md` |
| Roadmap and progress | `docs/product/roadmap.md` |
| Dev workflows, conventions, commands, recipes | `docs/development.md` |

## Essentials (quick orientation)

- **Stack:** TypeScript 5.5+ / Node.js 20+ / ESM / Hono / better-sqlite3 / vitest
- **Run dev:** `npm run dev` (tsx watch, port 3000)
- **Type check:** `npx tsc --noEmit`
- **Tests:** `npx vitest run`
- **Change sequence:** docs-first → tests → implementation → type check → run tests → commit
