# Texas Childcare Advisors Compliance Tracker

A SaaS compliance dashboard for Texas daycare center directors to track staff certifications, expiration dates, and Rising Star scoring. Multi-location support with free tier limits (15 staff, 3 locations).

## Run & Operate

- `pnpm --filter @workspace/compliance-tracker run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by Replit Clerk

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, wouter, TanStack Query
- Auth: Clerk (Replit-managed)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod v3 (catalog pinned), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)

## Where things live

- `artifacts/compliance-tracker/` — React frontend
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks (DO NOT edit)
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation (DO NOT edit)
- `lib/db/src/schema/` — Drizzle DB schema (locations, staff, certificationTypes, certifications)

## Architecture Decisions

- **Orval generates `zod.int()` (Zod v4 API) but catalog pins zod v3** — all integer fields in `openapi.yaml` use `type: number` instead of `type: integer` to make Orval emit `zod.number()` which is compatible with v3.
- **Free tier limits enforced server-side** — 15 staff max and 3 locations max checked in POST route handlers, returning HTTP 403 when exceeded.
- **All data is user-scoped via Clerk userId** — locations are tagged with `clerk_user_id`; staff and certifications cascade from locations, enforcing data isolation.
- **Rising Star scoring is computed on-the-fly** from live certification data — no separate table needed for MVP.
- **Certification status (`valid`/`expiring`/`expired`/`no_expiry`) is computed at read time** — not stored, always fresh.

## Product

- Multi-location daycare compliance tracker
- Staff certification management (add/edit/delete with expiration tracking)
- 10 default certification types pre-seeded (CPR, First Aid, CDA, Food Handler, etc.)
- Dashboard with compliant/expiring/expired counts and location breakdown
- Rising Star calculator (1–4 star levels based on certification coverage)
- CSV export of all certification data
- Free tier: 15 staff, 3 locations

## User Preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before using new hooks.
- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before leaf artifact typechecks or you'll get "no exported member" errors.
- Use `type: number` (not `type: integer`) in `openapi.yaml` — see Architecture Decisions above.
- The Clerk "development keys" warning in the browser console is expected and normal during development.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk setup and customization
