# Yatriko Gears — Backend API

Express 4 + TypeScript (strict) + MongoDB/Mongoose + Zod, built on the feature-module
architecture defined in `BACKEND_CONVENTIONS.md`. Includes helmet, an explicit CORS
allowlist, rate limiting, JWT auth with revocable DB sessions, multer image uploads,
and signed Cloudinary video uploads for the CMS.

## Setup

```bash
pnpm install
cp .env-sample .env   # then fill in real values (a prefilled .env is included for dev)
pnpm seed             # creates admin user + categories + 21 gear items + 5 destinations + combo package
pnpm dev              # starts nodemon + tsx on http://localhost:9005
```

Health check: `GET http://localhost:9005/api/v1/gear` should return the seeded gear list.

> **Security note:** rotate the MongoDB password, Gmail app password, and JWT secrets
> before deploying — the dev values were shared in chat and must be treated as leaked.

## Frontend integration

The Vite frontend proxies `/api` → `http://localhost:8000` by default. Either:
- change the proxy target in `yatriko-frontend/vite.config.ts` to `http://localhost:9005`, or
- set `PORT=8000` in this project's `.env`.

CORS already allows `http://localhost:5173`.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | nodemon + tsx, restarts on change |
| `pnpm build` | compile to `dist/` |
| `pnpm start` | run compiled `dist/server.js` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm seed` | idempotent seed (admin, categories, gear, destinations, package) |

## API overview (all under `/api/v1`, envelope `{ data, message, meta }`)

### Auth (`/auth`, rate-limited 20/15min)
| Method | Path | Access |
|---|---|---|
| POST | /auth/register | public (role always `customer`) |
| POST | /auth/login | public → `{ accessToken, refreshToken, user }` |
| GET | /auth/me | Bearer token |
| POST | /auth/logout | Bearer token (revokes session) |
| POST | /auth/refresh-token | public, body `{ refreshToken }` (rotates pair) |
| POST | /auth/forgot-password | public (emails 15-min reset token) |
| POST | /auth/reset-password | public, body `{ resetToken, password, confirmPassword }` |

### Catalog
| Method | Path | Access |
|---|---|---|
| GET | /gear?search=&category=&page=&limit= | public |
| GET | /gear/:slug | public |
| POST | /gear | admin, multipart (`image` file field) |
| PUT | /gear/:slug | admin, multipart |
| DELETE | /gear/:slug | admin |
| — same CRUD shape for `/category`, `/package` (JSON only), `/destination` | | |

### Portfolio videos (Cloudinary)
| Method | Path | Access |
|---|---|---|
| GET | /video?category= | public |
| POST | /video/upload-signature | admin → `{ cloudName, apiKey, timestamp, folder, signature, uploadUrl }` |
| POST | /video | admin, JSON `{ title, category, cloudinaryUrl, publicId }` |
| PUT | /video/:id | admin |
| DELETE | /video/:id | admin (also destroys the Cloudinary asset) |

**CMS upload flow:** ask for a signature → browser POSTs the file directly to
Cloudinary's video upload endpoint with `{ file, api_key, timestamp, folder, signature }`
→ Cloudinary returns `secure_url` + `public_id` → register it via `POST /video`.
The API secret never leaves the server; video bytes never touch the API.

### Forms (rate-limited 30/hour)
| Method | Path | Access |
|---|---|---|
| POST | /contact | public |
| GET | /contact?status= | admin |
| PATCH | /contact/:id/status | admin `{ status: new\|read\|resolved }` |
| DELETE | /contact/:id | admin |
| POST | /subscriber | public (idempotent) |
| GET | /subscriber | admin |
| DELETE | /subscriber/:id | admin |

### Users
| Method | Path | Access |
|---|---|---|
| GET | /user?role=&search= | admin |
| GET | /user/:id | admin |
| DELETE | /user/:id | admin (revokes their sessions) |

## Postman

Import `postman/yatriko-api.postman_collection.json`. It ships with:
- `baseUrl` collection variable (`http://localhost:9005/api/v1`)
- a Login request whose test script auto-saves `accessToken` + `refreshToken`
  into collection variables — every admin request then authorizes automatically
  via collection-level Bearer auth.

Suggested test order: Login (admin) → Gear list → Create gear (multipart) →
Contact submit → Subscriber submit → Video signature → Video register → Video list.
