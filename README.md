# Yatriko Gears

> **Rent the Best, Trek with Confidence.**

Yatriko Gears is a full-stack camping and trekking gear rental and sales platform for Gabu, Khokana, Lalitpur, Nepal.

The repository contains three independent pnpm applications:

| Application | Directory | Local URL | Purpose |
|---|---|---|---|
| Public website | `frontend/` | <http://localhost:5173> | Customer catalogue, bookings, blog, contact and checkout |
| Admin CMS | `admin/` | <http://localhost:5173/admin> | Protected content, booking and customer management |
| REST API | `backend/` | <http://localhost:9005> | Express API, MongoDB, authentication and integrations |

The applications do not import code from one another. The React applications communicate with the backend through the HTTP API at `/api/v1`.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Development commands](#development-commands)
- [Application routes](#application-routes)
- [API overview](#api-overview)
- [Authentication and sessions](#authentication-and-sessions)
- [Media and uploads](#media-and-uploads)
- [Testing and checks](#testing-and-checks)
- [Deployment](#deployment)
- [Project conventions](#project-conventions)
- [Troubleshooting](#troubleshooting)

## Features

### Public website

- Gear catalogue for sale and rental, with category/search filters and URL-based pagination.
- Gear detail pages with galleries, videos, pricing, stock information and cart actions.
- Rental terms, booking checkout, availability checks and booking status tracking.
- Customer registration, password reset, Google Sign-In and booking history.
- Blog listing and article pages with pagination and structured metadata.
- Portfolio videos, destinations, contact form, newsletter subscription and chatbot.
- Breadcrumbs, JSON-LD structured data, canonical metadata, loading skeletons and responsive Tailwind UI.
- Bundled fallback gear data when the API is unavailable.

### Admin CMS

- Dashboard with catalogue and activity summaries.
- CRUD for gear, categories, packages, destinations and blog posts.
- Cloudinary video upload and management.
- Booking status management, customer records, contact leads and subscribers.
- Settings, promotions and CSV export where supported.
- Admin-only route guard with namespaced access and refresh-token storage.

### Backend

- JWT access and refresh authentication with revocable database sessions.
- Google ID-token verification through Google JWKS.
- MongoDB persistence through Mongoose and Zod DTO validation.
- Server-side gear, blog, booking and availability pagination.
- Server-side booking pricing and stock/date-overlap validation.
- Cash-payment booking records with admin payment-status tracking.
- Cloudinary signed image and video uploads.
- Gemini chatbot history with TTL persistence.
- Helmet, CORS allowlist, request rate limits and centralized error handling.

## Architecture

```text
yatriko-gears/
├── frontend/                 # public React + Vite + TypeScript app
│   ├── src/api/              # API functions; components do not call axios directly
│   ├── src/components/       # layout, home, gear, UI and modal components
│   ├── src/pages/            # public route screens
│   ├── src/types/            # Zod schemas and domain types
│   └── scripts/               # sitemap generation
├── admin/                    # React + Vite + TypeScript CMS
│   └── src/                   # API layer, auth/session, forms, tables and pages
├── backend/                  # Express + TypeScript API
│   └── src/
│       ├── config/            # the only place backend process.env is read
│       ├── middlewares/       # auth, validation, uploads and errors
│       ├── modules/           # feature-module routes/controllers/models/DTOs
│       ├── services/          # email and external service helpers
│       └── utilities/         # pagination, schemas, slugs and query helpers
├── Makefile                  # root install, development, build and check commands
├── DEPLOYMENT.md             # Render/Vercel deployment instructions
└── render.yaml               # Render blueprint for the backend
```

Each app has its own `package.json`, lockfile and dependencies. Use pnpm from the relevant directory; this is not a pnpm workspace.

## Requirements

- Node.js 22 or newer
- pnpm 9 or newer
- MongoDB Atlas or a reachable MongoDB instance
- Cloudinary account for video uploads and optional hosted media
- Google OAuth web client if Google Sign-In is enabled
- SMTP or Resend credentials if transactional/admin email is enabled

Install pnpm with Corepack if needed:

```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate
```

## Quick start

From the repository root:

```bash
make install
make env
```

Fill in the generated environment files, then seed the database:

```bash
make seed
```

Run all three applications:

```bash
make dev-all
```

Open:

- Public site: <http://localhost:5173>
- Rental list: <http://localhost:5173/rental-list>
- Admin CMS: <http://localhost:5173/admin>
- Backend health: <http://localhost:9005/health>

The admin dev server runs on port `5174` and is proxied through the public Vite server at `/admin`. The backend runs on port `9005`.

### Run applications separately

```bash
make dev-backend
make dev-frontend
make dev-admin
```

Or run commands directly:

```bash
cd backend && pnpm dev
cd frontend && pnpm dev
cd admin && pnpm dev
```

## Environment variables

Use the checked-in examples:

```bash
backend/.env-sample   -> backend/.env
frontend/.env.example -> frontend/.env
admin/.env.example    -> admin/.env
```

### Backend

The backend reads environment variables through `backend/src/config/AppConfig.ts`. Important variables include:

| Variable | Purpose |
|---|---|
| `PORT` | API port; local default is `9005` |
| `MONGODB_URL`, `DB_NAME` | MongoDB connection and database |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Required access/refresh token secrets |
| `ALLOWED_ORIGINS` | Comma-separated frontend/admin origins |
| `SMTP_*`, `FROM_ADDRESS`, `ADMIN_NOTIFY_EMAIL` | Email delivery and notifications |
| `RESEND_API_KEY`, `RESEND_FROM` | Optional HTTP email fallback for hosted environments |
| `CLOUDINARY_*` | Signed video/media integration |
| `GEMINI_API_KEY` | Chatbot integration |
| `GOOGLE_CLIENT_ID` | Google Sign-In verification |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE` | Seeded admin account |

The complete list and comments are in [backend/.env-sample](backend/.env-sample).

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API origin/base; leave empty in development to use the Vite proxy |
| `SITEMAP_API_URL` | Optional API URL used by sitemap generation |
| `VITE_SITE_URL` | Canonical public origin, currently `https://www.yatrikogears.com.np` |
| `VITE_GOOGLE_CLIENT_ID` | Google Sign-In client ID; blank hides the button |
| `VITE_WHATSAPP_NUMBER` | Floating WhatsApp contact number without `+` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Optional frontend Cloudinary display configuration |

### Admin

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Full API URL including `/api/v1` in production; blank in development |
| `VITE_PUBLIC_SITE_URL` | Public-site URL used by the CMS link |

Vite variables are embedded at build time. Redeploy after changing any `VITE_*` value.

## Development commands

### Root Makefile

| Command | Purpose |
|---|---|
| `make install` | Install all three apps |
| `make env` | Copy missing environment examples |
| `make dev-all` | Run backend, frontend and admin together |
| `make dev-backend` / `make dev-frontend` / `make dev-admin` | Run one app |
| `make seed` | Run the idempotent backend seeder |
| `make check` | Backend/admin typechecks, frontend lint and backend/frontend tests |
| `make build` | Build backend, frontend and admin |
| `make deploy-check` | Run checks and all production builds |
| `make preview` | Preview the frontend production build |
| `make clean` | Remove build output |

### App scripts

```bash
# frontend
cd frontend
pnpm dev
pnpm build       # generate sitemap, typecheck and Vite build
pnpm lint
pnpm test

# admin
cd admin
pnpm dev
pnpm build
pnpm typecheck
pnpm lint

# backend
cd backend
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm test
pnpm seed
```

## Application routes

### Public frontend

| Path | Screen |
|---|---|
| `/` | Home |
| `/gear` | Gear catalogue |
| `/gear/:slug` | Gear detail |
| `/rental-list` | Rental catalogue |
| `/rental-terms` | Rental terms and agreement |
| `/portfolio` | Video portfolio |
| `/contact` | Contact and map |
| `/blog` | Blog list |
| `/blog/:slug` | Blog article |
| `/cart` | Cart and booking checkout |
| `/bookings` | Authenticated customer bookings |
| `/login`, `/register` | Customer authentication |
| `/forgot-password`, `/reset-password` | Password recovery |

Gear and blog pagination use `?page=N`. Gear search/category state uses URL search parameters so refresh, back/forward navigation and sharing preserve the view.

### Admin CMS

The admin router uses `/admin` as its basename:

| Path | Screen |
|---|---|
| `/admin` | Dashboard |
| `/admin/gear` | Gear list and management |
| `/admin/categories` | Category management |
| `/admin/packages` | Package management |
| `/admin/destinations` | Destination management |
| `/admin/blog` | Blog management |
| `/admin/videos` | Cloudinary video management |
| `/admin/bookings` | Booking management |
| `/admin/leads` | Contact leads |
| `/admin/subscribers` | Newsletter subscribers |
| `/admin/customers` | Customer accounts |
| `/admin/promotions` | Promotions |
| `/admin/settings` | Admin settings |

## API overview

Base URL: `http://localhost:9005/api/v1`

Every response uses:

```json
{
  "data": "payload or null",
  "message": "human-readable message",
  "meta": "pagination metadata or null"
}
```

List responses use `meta: { page, limit, total }`. Public lists default to active records. User-facing resource detail routes use slugs.

| Area | Main endpoints |
|---|---|
| Auth | `/auth/register`, `/auth/login`, `/auth/google`, `/auth/me`, `/auth/logout`, `/auth/refresh-token`, `/auth/forgot-password`, `/auth/reset-password` |
| Catalogue | `/gear`, `/category`, `/package`, `/destination`, `/video` |
| Booking | `/booking`, `/booking/my`, `/booking/availability`, `/booking/:id/cancel` |
| Content | `/blog`, `/contact`, `/subscriber`, `/settings` |
| Users | `/user` |
| Chat | `/chat` |
| Uploads | `/uploads` |

Writes are protected by the appropriate auth role. Booking prices are calculated from server-side gear data; client-supplied totals are not trusted.

For the complete request collection, import [backend/postman/yatriko-api.postman_collection.json](backend/postman/yatriko-api.postman_collection.json) into Postman.

## Authentication and sessions

### Public customer app

- Access token: `localStorage["yatriko.accessToken"]`
- User profile: `localStorage["yatriko.user"]`
- The frontend revalidates the session through `GET /auth/me`.

### Admin CMS

- Access token: `localStorage["yatriko.admin.accessToken"]`
- Refresh token: `sessionStorage["yatriko.admin.refreshToken"]`
- Admin routes require the `admin` role.

Backend sessions are stored in MongoDB and can be revoked. Password reset revokes existing sessions. Self-registration always creates a customer and cannot create an admin account.

## Media and uploads

- Local images are imported from `frontend/src/assets/` and hashed by Vite.
- Admin gear/category/destination/blog image forms request a signed Cloudinary upload and then save the returned URL/public ID through the API.
- Images and videos use signed Cloudinary direct-upload flows; media files do not pass through Express.
- New frontend raster assets should remain compressed and generally under about 200 KB.

## Testing and checks

Run the standard repository check before deployment:

```bash
make check
```

For a full production validation:

```bash
make deploy-check
```

The current automated tests cover frontend forms/API behavior and backend booking pricing, settings DTOs and upload helpers. Also manually verify:

- Public site and `/admin` deep links after deployment.
- Gear and rental pagination at one, two and many pages.
- Search/category changes reset to page 1.
- Browser back/forward behavior for query parameters.
- Customer booking and booking-status flows.
- Admin image and Cloudinary video uploads.
- CORS origins and production API URL.

## Deployment

Read [DEPLOYMENT.md](DEPLOYMENT.md) for the Render and Vercel procedure.

The intended deployment is:

1. Backend API on Render using [render.yaml](render.yaml).
2. Public frontend as a Vercel project with root directory `frontend`.
3. Admin CMS as a Vercel project with root directory `admin`, mounted at `/admin` through the public site's rewrite/proxy configuration.

Before production:

- Set strong secrets and production `ALLOWED_ORIGINS`.
- Set `VITE_API_BASE_URL` to the deployed API including `/api/v1`.
- Set the public canonical `VITE_SITE_URL` and admin public-site URL.
- Configure Google OAuth authorized origins.
- Configure MongoDB Atlas network access.
- Configure Cloudinary and email delivery.
- Run the seeder once against the intended production database.
- Confirm `/health`, live API data, customer auth, booking creation and admin login.

## Project conventions

- Use pnpm only; do not use npm or yarn.
- Keep frontend, admin and backend dependencies separate.
- Frontend/admin API access goes through `lib/api.ts` and a feature file under `src/api/`.
- Keep backend environment reads inside `backend/src/config/AppConfig.ts`.
- Preserve the API response envelope and centralized backend error handling.
- Do not trust browser identity, roles or money values.
- Use `@/` imports; the alias must exist in both TypeScript and Vite configuration.
- Keep backend controllers, DTOs, models and routes inside their feature modules.
- Do not commit `.env` files, credentials, build output or `node_modules`.

## Troubleshooting

| Symptom | Check |
|---|---|
| Public site shows bundled/stale gear | Check the browser console for the fallback warning and verify backend/API proxy availability |
| API requests fail locally | Confirm backend is running on `9005` and frontend/admin Vite proxies target `http://localhost:9005` |
| Admin page is blank or assets 404 | Use `/admin` through the public site and confirm the admin build uses `base: "/admin/"` |
| Google Sign-In is hidden | Set both frontend `VITE_GOOGLE_CLIENT_ID` and backend `GOOGLE_CLIENT_ID` |
| MongoDB connection fails | Check Atlas network access, credentials, DNS and `MONGODB_URL` |
| Images fail after deployment | Check Cloudinary credentials, stored Cloudinary URLs and the upload configuration described in [DEPLOYMENT.md](DEPLOYMENT.md) |
| 401 or 403 responses | Re-authenticate, check token/session state and confirm the account role |
| Vite env changes have no effect | Rebuild; `VITE_*` values are embedded during the build |

## Contact

**Yatriko Gears**

Gabu, Khokana, Lalitpur, Nepal

Phone: `+977 9747672039` / `9747672040`
Email: `yatrikogears1234@gmail.com`

Made with ❤️ in Nepal 🇳🇵
