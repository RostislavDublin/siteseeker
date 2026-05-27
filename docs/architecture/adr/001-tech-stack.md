# ADR-001: Technology Stack

## Status

Accepted

## Context

SiteSeeker needs to:
- Make HTTP API calls (recreation.gov)
- Run headless browser automation (Xanterra, state parks)
- Maintain persistent state (watches, seen matches)
- Send notifications (Telegram, email)
- Optionally serve a REST API and web UI
- Be self-hostable as a single binary/container

## Decision

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Single language for all layers; strong typing for adapter contracts; NPM ecosystem |
| Runtime | Node.js 20+ | Native async I/O, Playwright compatibility, broad hosting support |
| Scraping | Playwright | Full browser automation for JS-heavy booking sites; same vendor as VS Code/Copilot tooling |
| HTTP client | Native fetch (Node 20+) | Zero dependencies for API-based adapters |
| Database | SQLite (self-hosted) / PostgreSQL (SaaS) | SQLite = zero-config single-file; Postgres = scalable multi-tenant. Prisma ORM bridges both |
| ORM | Prisma | Type-safe, migrations, dual SQLite/Postgres support |
| Task scheduling | Internal interval loop (MVP) / BullMQ (SaaS) | MVP needs no external dependencies; BullMQ adds Redis-backed reliability for SaaS |
| Notifications | Direct integrations (Telegram Bot API, Resend for email) | Lightweight, no notification SaaS dependency |
| API framework | Hono | Lightweight, edge-compatible, TypeScript-first |
| Testing | Vitest | Fast, ESM-native, compatible with TypeScript |
| Packaging | Docker (multi-stage build) | Universal deployment target |
| CI | GitHub Actions | Free for OSS, integrated with repo |

## Consequences

- Playwright adds ~150MB to Docker image (headless Chromium). Mitigated with multi-stage build and optional playwright install.
- SQLite limits to single-writer; acceptable for self-hosted (one user, one process). SaaS path requires Postgres migration.
- No Python - entire stack in one language reduces context-switching and simplifies contributions.
