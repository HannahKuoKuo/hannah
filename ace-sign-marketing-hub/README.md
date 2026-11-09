# ACE SIGN Marketing Hub

B2B marketing management for ACE SIGN Australia: dashboard, campaigns, ad copy drafting, content planning, CSV imports and reports. It runs locally against PostgreSQL. **Integrations are off and nothing is published, posted or emailed.**

> Demo data is synthetic and labelled everywhere it appears ("Demo data" badges, a `data_source` column in exports, and `INCLUDES-DEMO-DATA` in export file names). Never present it as real results.

## Quick start

Requirements: Node.js 20.9+ (22 recommended), Docker (for PostgreSQL).

```bash
npm install                 # also generates the Prisma client
cp .env.example .env.local  # used by Next.js
cp .env.example .env        # used by the Prisma CLI
npm run db:up               # starts PostgreSQL 16 in Docker
npm run setup               # applies migrations + loads demo data
npm run dev                 # http://localhost:3000
```

No Docker? Point `DATABASE_URL` at any PostgreSQL 14+ database you control.

## What works, what is simulated, what needs external access

| Area | Status |
| --- | --- |
| **Dashboard** | Working. KPIs (spend, leads, cost per lead, engagements, clicks, CTR, CPC, ROAS) computed from the database, compared with the previous period of equal length. Date presets (7/30/90 days) and custom ranges, platform and data-source filters (all / imported only / demo only), metric switcher on the trend chart, click-a-channel to filter, CSV export. |
| **Campaigns** | Working CRUD (create, edit, delete with confirmation), search and filters, per-campaign performance and CSV export. |
| **Ad variations** | Working approval workflow: Draft → In review → Approved / Changes requested, enforced on the server by role. |
| **Ad Launcher** | Working: brief → variations → edit → creative selection → feed preview → save as a draft campaign. **Simulated:** copy comes from offline templates (labelled "Template copy") until an AI provider is configured. Asset library images are gradient placeholders. |
| **Publishing ads** | **Blocked.** The Publish button asks for confirmation, records the attempt in the audit log, and sends nothing. Needs the Meta / LinkedIn integrations. |
| **Content Planner** | Working: month calendar and list, create/edit/delete posts, review queue, approve / request changes (note required) / mark scheduled. Editing approved content returns it to Draft. Times are Sydney time. **Posting to social accounts is not implemented.** |
| **CSV import** | Working: upload, row-by-row validation with line numbers, preview, all-or-nothing import, recognises common Meta / LinkedIn / Google export headers and DD/MM/YYYY dates, re-imports replace earlier imported values, undo per import. |
| **Reports** | Working: campaign summary and daily detail CSV downloads for any filter; formula-injection-safe; every export is audited. |
| **Settings** | Working: integration status read from env, role/permission table, demo-user switcher, remove demo data (Admin, typed confirmation), audit log. Brand guidelines are read-only placeholders. |
| **Access control** | Role checks on every server action and API route (Admin, Manager, Editor, Viewer). **Simulated sign-in:** you act as a seeded demo user chosen in Settings. Auth.js login is not wired up yet, so **do not expose this build on a network**. |
| **Audit log** | Working, persisted. Metadata is redacted (emails, phone numbers, contact fields). |
| **Email Marketing, Lead Management, AI Assistant** | Not built yet. Pages describe the planned scope. Database models for leads, companies, segments and email campaigns exist. |
| **GA4, Meta, LinkedIn, email service** | **Need external access.** Disabled by default. Each needs an app/account created in the provider's developer portal, OAuth credentials, and your approval to connect. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Regenerates route types, then `tsc --noEmit` |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright) against a production build. Run `npm run build` first. |
| `npm run db:up` | Start PostgreSQL in Docker |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:deploy` | Apply migrations (non-interactive) |
| `npm run db:seed` | Reload demo data. Only rows marked DEMO are replaced. |

### End-to-end tests

The E2E suite uses a **separate** database, `acesign_hub_test` by default (override with `E2E_DATABASE_URL`; the name must end in `_test`). Create it once:

```bash
docker compose exec postgres createdb -U acesign acesign_hub_test
```

Setup applies migrations, removes rows earlier test runs created (names starting with `E2E `), and re-seeds demo data. It never wipes the database. If your Playwright browser version differs from the installed one, set `PLAYWRIGHT_CHROMIUM_PATH` to a Chromium binary.

## CSV import format

Required columns: `date`, `campaign`, `platform`, `impressions`, `clicks`, `spend`. Optional: `conversions`, `revenue`, `engagements`, `leads`. Download the template from **Analytics → Template**.

- Platforms: facebook, instagram, linkedin, google, email (aliases such as `meta`, `fb`, `ig`, `google ads` work)
- Dates: `YYYY-MM-DD` or `DD/MM/YYYY`
- Money: AUD, `$` and thousands separators are allowed
- Leave `revenue` blank where there is no attribution. ROAS is only calculated over rows that have revenue.
- Limit: 2 MB / 10,000 rows. Any invalid row blocks the whole import.

## Architecture

```
src/
  app/(app)/            pages: dashboard, campaigns, ad-launcher, content-planner, analytics, settings, …
  app/api/              ai/ad-copy (POST), reports/performance (GET CSV)
  components/           UI primitives (shadcn-style) and feature components
  lib/                  pure logic: metrics/KPIs, date ranges, filters, CSV import/export,
                        validation (Zod), RBAC, audit redaction, AI provider abstraction,
                        integration registry, demo data
  server/               server-only: Prisma queries, session, audit writes, server actions
prisma/                 schema, migrations, seed
tests/unit, tests/e2e   Vitest and Playwright
```

- **Next.js 16 App Router** with Cache Components: request-time data is read inside `<Suspense>` with skeleton fallbacks; mutations are server actions that validate with Zod, check permissions, write an audit entry, then invalidate cached pages.
- **PostgreSQL + Prisma 7** (driver adapter `@prisma/adapter-pg`). Every metric, campaign and post carries a `source` (`DEMO`, `MANUAL`, `CSV_IMPORT`, and later `META`, `LINKEDIN`, `GA4`, `EMAIL_PROVIDER`).
- **AI provider abstraction** (`src/lib/ai`): `demo` (offline templates) is the default. `AI_PROVIDER=anthropic` is reserved for Phase 3 and currently returns a clear "not configured" error.
- **Integrations** (`src/lib/integrations/registry.ts`): each is enabled only when its `*_ENABLED` flag is `"true"` and its credentials are present. Secret values are never sent to the browser.

## Security notes

- No API keys or credentials in code. `.env*` files are git-ignored except `.env.example`.
- Server logs record error types only, never request bodies, so customer details stay out of logs.
- CSV exports neutralise spreadsheet formulas (`=`, `+`, `-`, `@`).
- Destructive actions (delete campaign, remove demo data, undo import) need confirmation and are audited.
- **Before deploying anywhere:** enable Auth.js sign-in (Phase 2b) and remove the demo-user switcher.

## Roadmap

1. ~~Phase 1 – app shell, dashboard, Ad Launcher, Content Planner, demo data~~
2. Phase 2 – ~~persistence, CSV import, analytics, reports~~; Auth.js sign-in, Lead Management
3. Phase 3 – language-model copy generation with brand grounding, editable brand guidelines, asset uploads, AI Assistant
4. Phase 4 – Meta Marketing API, LinkedIn Marketing API, GA4 Data API, email service, via official OAuth. Each needs your credentials and approval.
