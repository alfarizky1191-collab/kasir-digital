# Production deployment

## 1. Supabase

Use the selected Supabase project and apply every migration from `supabase/migrations/` in filename order. The tables use the `pos_` prefix so they do not collide with the touring application in the same project.

After migration:

- verify every `pos_` table has RLS enabled;
- run the Supabase security and performance advisors;
- keep email/password Auth enabled;
- set the Auth Site URL to the production Vercel URL;
- add the production URL to allowed redirect URLs;
- configure database backups appropriate for real sales data.

Customer order creation and public-token status lookup use a server-only Supabase secret key so callers cannot bypass the Next.js rate limit. Use a current `sb_secret_...` key, never a browser-exposed key or a legacy key when a current secret key is available. This key bypasses RLS across the shared project, so keep it only in Vercel's encrypted environment settings and rotate it immediately if exposed.

## 2. Vercel

Import this GitHub repository and set **Root Directory** to `frontend`.

Configure:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` — server-only; never prefix with `NEXT_PUBLIC_`
- `RATE_LIMIT_SECRET` — at least 32 random bytes
- `NEXT_PUBLIC_APP_URL` — final HTTPS origin without a trailing slash

Deploy a preview from the review branch first. Do not promote to production until the release checklist passes.

## 3. First owner

1. Open `/login` and create an account.
2. Confirm the email if confirmation is enabled.
3. Sign in and open `/access`.
4. Claim the first owner role.
5. Add and verify products, table QR codes, opening cash, and QRIS instructions.

Only the first POS account can self-claim owner. Later accounts require owner approval.

## 4. Smoke test

- `GET /api/health` returns HTTP 200.
- Open a shift.
- Place one table order.
- Move it from pending to cooking to ready.
- Pay it in cash and verify the printed receipt.
- Place and void another order; verify stock is restored.
- Open a current shift, then refund a paid test order as owner.
- Close the shift and verify expected cash and difference.
- Verify the audit page includes every sensitive action.
