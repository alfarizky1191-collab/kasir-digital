# Kasir Digital

Kasir Digital is a Next.js point-of-sale application for Aluna Eats. The production architecture is intentionally small:

- **Vercel** runs the Next.js UI and server-side route handlers.
- **Supabase Auth** handles staff identities and sessions.
- **Supabase Postgres** stores products, stock, orders, payments, shifts, and immutable audit events.
- **Row Level Security** and database RPC functions enforce authorization and transaction integrity.

The old NestJS/Prisma runtime was retired. It remains recoverable from Git history but is not part of the deployment.

## What is included

- Customer table ordering with server-priced items
- Configurable products, stock, sold-out state, options, categories, and tables
- Kitchen queue with valid status transitions
- Cash and manually confirmed QRIS payments
- Idempotent checkout and payment requests
- Atomic stock deduction and restoration on void/refund
- One active cashier shift with cash reconciliation
- Owner-only refunds, configuration, staff approval, reporting, and audit log
- Roles: `owner`, `cashier`, and `kitchen`
- Anonymous order rate limiting without storing raw IP addresses
- Health endpoint at `/api/health`
- GitHub Actions quality gate

## Repository layout

- `frontend/` — the deployable Next.js application
- `supabase/migrations/` — ordered database migrations
- `docs/` — deployment, security, and release procedures

## Local setup

1. Apply the SQL files in `supabase/migrations/` in filename order.
2. Copy `frontend/.env.example` to `frontend/.env.local` and use the matching Supabase project values.
3. From `frontend/`, run `npm ci` and `npm run dev`.
4. Create the first account at `/login`. After login, `/access` allows the first POS user to claim the owner role.
5. Future staff create an account, request access, and wait for an owner to approve a role in `/admin/staff`.

Never put a Supabase secret/service-role key in a `NEXT_PUBLIC_` variable or commit it to Git.
