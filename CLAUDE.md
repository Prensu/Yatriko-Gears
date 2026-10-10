# Yatriko Gears — start here

Camping/trekking gear rental business in Gabu, Khokana, Lalitpur, Nepal.

**Read [AGENTS.md](AGENTS.md) before writing code.** It has the full architecture,
module conventions and the traps. This file is only the non-negotiables, because
it is loaded into every session and should stay short.

## Three apps, three package.json files — not a monorepo

| Path | What | Port |
|---|---|---|
| `frontend/` | public customer site (React + Vite + TS) | 5173 |
| `admin/` | admin CMS, served at `5173/admin` via proxy | 5174 |
| `backend/` | Express + MongoDB REST API | 9005 |

```bash
make dev-all      # run all three
make check        # typecheck + lint + tests — run before saying you're done
make deploy-check # everything CI/hosts will run
```

## Rules that prevent real damage

1. **pnpm only.** Never npm or yarn, in any of the three apps.
2. **Never trust the client for money or identity.** Booking totals are recomputed
   server-side from stored prices; booking payment status is controlled by the
   backend/admin flow; roles are never read from a third-party token.
3. **Every API response is Zod-validated** against the `{ data, message, meta }`
   envelope. Add a backend field → update the matching schema in
   `frontend/src/types/` or `admin/src/types/`, or the public site silently falls
   back to bundled dummy data.
4. **Secrets live in git-ignored `.env` files**, read only through
   `backend/src/config/AppConfig.ts` or `import.meta.env`. Never commit one.
5. **Cloudinary uploads happen before content mutations.** The browser first
   requests a signed upload payload, uploads directly to Cloudinary, then sends
   the returned URL/public ID to the API for validation and persistence.
6. **Don't leave dev servers running.** The user runs `make dev-all` themselves;
   stray servers cause EADDRINUSE on their next start.

## Current state

- Bookings currently use the configured cash-payment flow. Do not document or add
  an online payment gateway unless its backend route, verification flow and tests
  are implemented first.
- Deployment targets: **Vercel** (frontend + admin) and **Render** (backend).
  See [DEPLOYMENT.md](DEPLOYMENT.md).
- Tests: `backend/src/__tests__` and `frontend/src/__tests__` (Vitest).
