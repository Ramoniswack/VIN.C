# Backend: Runbook

Quick guide to run the backend locally and prepare for production.

## Dev (local)

- Copy `.env.example` to `.env` and fill values. Example values in `.env.example` work with the included local Postgres container.
- Optional dev helpers:
  - `DEV_AUTH_ENABLED=true` allows using headers `X-ADMIN=1` and `X-USER-EMAIL` to bypass Supabase for local testing. Keep this defaulted to `false` in production.

Commands (from `backend/`):

```bash
# install deps
npm install

# run the dev server (auto-reloads)
DEV_AUTH_ENABLED=true npm run dev
```

If you use Docker Compose or run Postgres directly, make sure `DATABASE_URL` points to your database.

## Migrations & Seed

Use Prisma to apply migrations and run seed data.

```bash
# apply migrations (non-interactive) for production
npx prisma migrate deploy

# for interactive local dev migrations
npx prisma migrate dev --name <name>

# run seed
npm run seed
```

## Production

Checklist before deploying:

- Set these env vars securely in your platform (never commit `.env`):

  - `DATABASE_URL` (Postgres connection)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (server role key)
  - `SUPABASE_ANON_KEY`
  - `ADMIN_EMAILS` (comma-separated)

- Disable dev auth fallback: unset `DEV_AUTH_ENABLED` or ensure it's `false`.
- Run migrations: `npx prisma migrate deploy`.
- Run seed if needed: `npm run seed`.
- Build and start the server:
  - `npm run build` then `npm start` or run a node process manager.

## Notes & Safety

- The server contains a local dev convenience that will bypass Supabase when `DEV_AUTH_ENABLED=true` and `X-ADMIN=1` is present. This is intended only for local development. Keep `DEV_AUTH_ENABLED` unset or `false` in production.
- API endpoints that mutate cart/wishlist require authentication (Supabase token) in production.

If you want, I can add a simple CI workflow (GitHub Actions) to run TypeScript checks and Prisma migrate dry-run on PRs.
