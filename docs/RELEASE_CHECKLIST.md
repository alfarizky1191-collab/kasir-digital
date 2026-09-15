# Release checklist

## Automated

- [ ] GitHub Actions lint passes
- [ ] TypeScript check passes
- [ ] Next.js production build passes
- [ ] Production dependency audit passes
- [ ] Supabase security advisor has no unresolved error
- [ ] Supabase performance advisor findings are reviewed

## Access

- [ ] Anonymous visitor cannot access staff data
- [ ] Kitchen cannot access cashier, history, audit, or admin data
- [ ] Cashier cannot access owner settings, staff approval, or refund
- [ ] Owner can access every administrative screen
- [ ] Disabled staff loses access after signing in again

## Sales flow

- [ ] Order cannot be created without an open shift
- [ ] Browser-supplied prices are ignored
- [ ] Stock cannot drop below zero
- [ ] Duplicate checkout token creates only one order
- [ ] Invalid status transitions are rejected
- [ ] Duplicate payment key creates only one payment
- [ ] QRIS requires an explicit cashier confirmation
- [ ] Void restores tracked stock
- [ ] Refund is owner-only and optionally restocks
- [ ] Shift cannot close with unfinished orders

## Deployment

- [ ] Production environment variables are set
- [ ] Supabase Auth Site URL and redirect allowlist are correct
- [ ] Table QR codes point to the final HTTPS domain
- [ ] Health endpoint returns 200
- [ ] Database backup policy is enabled and tested
- [ ] Preview is tested on desktop and a real phone
