# Kasir Digital frontend

This directory is the deployable Next.js application. The repository root contains the architecture, setup, security, and release documentation.

## Commands

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

Copy `.env.example` to `.env.local` for local development. Keep `SUPABASE_SECRET_KEY` server-only and never commit real environment values.

For production setup, see `../docs/DEPLOYMENT.md`. For release verification, see `../docs/RELEASE_CHECKLIST.md`.
