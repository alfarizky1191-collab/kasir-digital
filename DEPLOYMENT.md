# Production deployment

## Backend

Set the variables shown in `backend/.env.example`, then deploy from the `backend` directory.

Run these commands once for each release and initial owner setup:

```bash
npx prisma migrate deploy
npm run seed
```

`OWNER_PASSWORD` should be changed after bootstrap if the deployment platform keeps build or command logs. Keep `JWT_SECRET` stable across deploys; rotating it signs every user out.

## Frontend

Deploy from the `frontend` directory and set `BACKEND_URL` to the backend origin. Browser requests use the frontend's same-origin `/api` rewrite, so the session cookie remains first-party.

## Release checks

```bash
cd backend && npm ci && npm run build && npm test -- --runInBand
cd ../frontend && npm ci && npm run lint && npm run build
```

After deployment, verify login, open shift, customer checkout, kitchen progression, cash and QRIS payment, void, refund, stock decrement, report totals, and audit entries using test data.
