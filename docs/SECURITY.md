# Security model

## Trust boundaries

The browser is untrusted. Prices, totals, stock checks, role checks, status transitions, payments, refunds, and shift calculations are validated in Postgres functions.

Next.js route handlers act as a backend-for-frontend:

- staff tokens are stored in Secure, HttpOnly, SameSite cookies;
- protected handlers verify the authenticated user and required role;
- Supabase RLS independently restricts table reads;
- tables do not grant direct write privileges to browser roles;
- sensitive writes use narrowly scoped RPC functions.

## Payment integrity

- Only a ready, unpaid order can be paid.
- A row lock and unique sale index prevent double payment.
- An idempotency key makes safe retries possible.
- QRIS is marked paid only after a cashier confirms the transfer.
- Refund is owner-only and has its own idempotency key.
- Void/refund reasons are mandatory and recorded server-side.

## Inventory integrity

Product rows are locked while an order is created. Stock deduction, order creation, order items, and the stock movement record commit together. A failed request rolls back all of them.

## Audit integrity

Clients cannot insert audit rows. Database functions create audit entries using the authenticated actor ID. Audit rows are readable only by owners.

## Operational controls

- Rotate `RATE_LIMIT_SECRET` if exposed.
- Never add service-role credentials to the app.
- Review pending staff accounts regularly.
- Disable staff access immediately when a person leaves.
- Keep Supabase and Vercel account MFA enabled.
- Review dependency alerts and failed quality workflows before merging.
