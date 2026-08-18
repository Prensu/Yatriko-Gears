# 🏕️ Yatriko Gears — Full-Stack Web Application

> **"Rent the Best, Trek with Confidence."**

A full-stack web platform for **Yatriko Gears**, a camping & trekking gear rental and sales business based in **Gabu, Khokana, Lalitpur, Nepal**. Customers can browse gear, packages, and camping destinations, watch portfolio videos, and submit booking/contact inquiries — while admins manage all content through protected API endpoints.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Frontend](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite-blue)
![Backend](https://img.shields.io/badge/backend-Express%20%2B%20TypeScript-green)
![Database](https://img.shields.io/badge/database-MongoDB%20Atlas-brightgreen)
![Package Manager](https://img.shields.io/badge/package%20manager-pnpm-orange)

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Tech Stack](#-tech-stack)
3. [Project Structure](#-project-structure)
4. [How Frontend & Backend Are Integrated](#-how-frontend--backend-are-integrated)
5. [Application Workflow](#-application-workflow)
6. [Getting Started](#-getting-started)
7. [Environment Variables](#-environment-variables)
8. [API Reference](#-api-reference)
9. [Authentication Flow](#-authentication-flow)
10. [File & Media Uploads](#-file--media-uploads)
11. [Available Scripts](#-available-scripts)
12. [Testing with Postman](#-testing-with-postman)
13. [Troubleshooting](#-troubleshooting)
14. [Contact](#-contact)

---

## 🔭 Overview

The project is split into **two independent applications** living side-by-side in one parent folder. They communicate **only over HTTP** (REST API) — the frontend never imports backend code directly.

```
yatriko/
├── yatriko-frontend/   → Customer-facing website (React SPA)
└── yatriko-backend/    → REST API server (Express + MongoDB)
```

| App | Dev URL | Purpose |
|---|---|---|
| Frontend | `http://localhost:5173` | Public site: gear catalogue, packages, destinations, portfolio, contact/booking forms |
| Backend | `http://localhost:9005` | REST API: auth, CRUD for all content, image uploads, Cloudinary video signatures, email |

---

## 🛠 Tech Stack

### Frontend (`yatriko-frontend/`)

| Concern | Technology |
|---|---|
| Build tool | Vite |
| UI library | React 18 + TypeScript (strict) |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Form & API validation | Zod |
| HTTP client | Axios (single typed wrapper) |
| Package manager | pnpm |

### Backend (`yatriko-backend/`)

| Concern | Technology |
|---|---|
| Runtime / framework | Node.js + Express 4 + TypeScript (strict) |
| Database | MongoDB Atlas via Mongoose |
| Validation | Zod DTOs |
| Authentication | JWT (access + refresh) with revocable DB sessions |
| Password hashing | bcryptjs (cost 12) |
| Image uploads | Multer (disk storage → served at `/images`) |
| Video hosting | Cloudinary (signed direct uploads) |
| Email | Nodemailer (Gmail SMTP) |
| Security | Helmet, CORS allowlist, express-rate-limit |
| Package manager | pnpm |

---

## 📂 Project Structure

### Frontend

```
yatriko-frontend/
├── index.html
├── vite.config.ts          # "@" alias → src, dev proxy /api → localhost:9005
├── tailwind.config.js
├── package.json
└── src/
    ├── main.tsx            # React root (wraps App in AuthProvider)
    ├── App.tsx             # All routes declared here
    ├── assets/             # Local images (gear, spots, brands, heroes)
    ├── types/              # Zod schemas: domain models, forms, auth
    ├── lib/
    │   ├── api.ts          # Axios instance + typed request wrapper
    │   └── fallbackData.ts # Offline fallback so the site renders without API
    ├── api/                # One file per backend module (gear, forms, auth)
    ├── context/            # AuthContext (session state)
    ├── hooks/              # usePageMeta etc.
    ├── components/
    │   ├── layout/         # Header, Footer, Layout, WhatsAppFloat
    │   ├── home/           # Hero, GearGrid, PackageBand, SpotsSection…
    │   ├── gear/           # GearCard
    │   └── modal/          # LeadCaptureModal (15% off email capture)
    └── pages/              # HomePage, GearPage, PortfolioPage, ContactPage…
```

### Backend (feature-module architecture)

```
yatriko-backend/
├── package.json
├── nodemon.json
├── .env                    # NEVER commit — see .env-sample
├── postman/                # Postman collection for API testing
├── public/uploads/         # Multer image storage (served at /images)
└── src/
    ├── server.ts           # Boots HTTP listener only
    ├── app.ts              # Express app: helmet → cors → rate-limit → routes
    ├── seed.ts             # Idempotent seeder (admin, categories, 21 gear items…)
    ├── config/             # AppConfig (all env reads), mongodb, smtp, cloudinary
    ├── router/router.ts    # Central /api/v1 router
    ├── middlewares/        # Auth(roles), bodyValidator(dto), uploader(dir), errors
    ├── modules/            # ONE FOLDER PER FEATURE:
    │   ├── auth/           #   XxxRoute.ts, XxxController.ts,
    │   ├── user/           #   XxxDto.ts, XxxModel.ts
    │   ├── category/
    │   ├── gear/
    │   ├── package/
    │   ├── destination/
    │   ├── video/          # Cloudinary signed-upload flow
    │   ├── contact/
    │   └── subscriber/
    ├── services/           # EmailService (nodemailer)
    └── utilities/          # commonSchema, helpers (slug, pagination, mapImage)
```

---

## 🔗 How Frontend & Backend Are Integrated

### 1. Dev-time proxy (no CORS pain in development)

The frontend never hardcodes the backend URL. Vite's dev server **proxies** API calls:

```ts
// yatriko-frontend/vite.config.ts
server: {
  port: 5173,
  proxy: {
    "/api":    { target: "http://localhost:9005", changeOrigin: true },
    "/health": { target: "http://localhost:9005", changeOrigin: true },
  },
}
```

So a browser request to `http://localhost:5173/api/v1/gear` is transparently forwarded to `http://localhost:9005/api/v1/gear`.

### 2. Single HTTP layer on the frontend

All network calls flow through **one file**: `src/lib/api.ts` — an Axios instance that:

- Prefixes every request with `/api/v1`
- Attaches `Authorization: Bearer <token>` automatically (from `localStorage`)
- Validates every response against a **Zod schema** before it reaches UI code
- Converts errors into a typed `ApiRequestError` (`status`, `code`, `message`, `detail`)

Feature files in `src/api/` (e.g. `gear.ts`, `forms.ts`, `auth.ts`) call this wrapper — **components never call axios/fetch directly.**

### 3. Shared response contract

Every backend response — success or error — uses one envelope, and the frontend's Zod schemas mirror it exactly:

```json
{
  "data":    "<payload or null>",
  "message": "Human-readable message",
  "meta":    "<pagination { page, limit, total } or null>"
}
```

If a backend field changes, the matching Zod schema in `src/types/` must be updated too — otherwise the frontend throws a validation error instead of silently rendering wrong data.

### 4. Graceful degradation

Public list endpoints (gear, etc.) fall back to bundled data in `src/lib/fallbackData.ts` if the API is unreachable — the site still renders during backend downtime. **Note:** this can mask connection problems during development; check the browser Network tab if data looks stale.

---

## 🔁 Application Workflow

### Customer journey (public)

```
Visitor → Home page (hero, gear grid, packages, camping spots)
        → Gear page (browse, filter by category, search)
        → Gear detail (prices: real vs discounted)
        → Portfolio (Cloudinary-hosted videos)
        → Contact / Booking form  ──POST /contact──▶  Stored in DB + email notification
        → Newsletter modal (15% off) ──POST /subscriber──▶ Lead stored
```

### Admin journey (currently via Postman; admin UI planned)

```
Admin → POST /auth/login (seeded admin account)
      → Receives accessToken (1 h) + refreshToken (1 d)
      → CRUD gear / categories / packages / destinations (multipart image uploads)
      → Video publishing:
          1. POST /video/upload-signature   (server signs with Cloudinary secret)
          2. Browser/Postman uploads video DIRECTLY to Cloudinary
          3. POST /video saves { title, category, cloudinaryUrl, publicId }
      → Review contact leads & subscribers
```

### Request lifecycle (backend)

```
Request → helmet → CORS → rate-limit → JSON/urlencoded parser
        → /api/v1 router → Auth([roles]) → uploader(dir) → bodyValidator(DTO)
        → Controller (throws {code,message,detail} on failure)
        → ErrorHandlingMiddleware (single, registered last)
        → Response envelope { data, message, meta }
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9 (`npm install -g pnpm`) — *this project uses pnpm only; do not use npm/yarn*
- **MongoDB Atlas** account (or local MongoDB)
- **Cloudinary** account (for video uploads)
- **Gmail app password** (for SMTP email)

### 1. Clone & install

```bash
git clone <repository-url> yatriko
cd yatriko

# Backend
cd yatriko-backend
pnpm install
cp .env-sample .env       # then fill in real values (see below)

# Frontend
cd ../yatriko-frontend
pnpm install
```

### 2. Seed the database

```bash
cd yatriko-backend
pnpm seed
# Creates: admin user, 5 categories, 21 gear items, 5 destinations, combo package
```

### 3. Run both apps (two terminals)

```bash
# Terminal 1 — backend (http://localhost:9005)
cd yatriko-backend && pnpm dev

# Terminal 2 — frontend (http://localhost:5173)
cd yatriko-frontend && pnpm dev
```

Open **http://localhost:5173** 🎉

---

## 🔐 Environment Variables

Create `yatriko-backend/.env` from `.env-sample`:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend port | `9005` |
| `DB_NAME` | MongoDB database name | `yatriko-gears` |
| `MONGODB_URL` | Atlas connection string (SRV) | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/` |
| `IMAGE_BASE_PATH` | Public base URL for uploaded images | `http://localhost:9005/images/` |
| `JWT_SECRET` | Access-token secret (required, no default) | *random long string* |
| `JWT_REFRESH_SECRET` | Refresh-token secret (required) | *random long string* |
| `SMTP_SERVICE` / `SMTP_HOST` / `SMTP_PORT` | Email transport | `gmail` / `smtp.gmail.com` / `587` |
| `SMTP_USER` / `SMTP_PASSWORD` | Gmail + app password | — |
| `FROM_ADDRESS` | Sender email | — |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials | — |
| `ALLOWED_ORIGINS` | CORS allowlist (comma-separated) | `http://localhost:5173` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_PHONE` | Seeded admin account | — |

> ⚠️ **Security:** `.env` is git-ignored. Never commit real credentials. Rotate any secret that has ever been shared in chat, email, or screenshots before going to production.

---

## 📡 API Reference

Base URL: `http://localhost:9005/api/v1`

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register (role always `customer`) |
| POST | `/auth/login` | Public | Returns `{ accessToken, refreshToken, user }` |
| GET | `/auth/me` | Bearer | Current user profile |
| POST | `/auth/logout` | Bearer | Revokes current session |
| POST | `/auth/refresh-token` | Public | Rotates token pair |
| POST | `/auth/forgot-password` | Public | Sends reset email |
| POST | `/auth/reset-password` | Public | Resets password, revokes all sessions |

### Content (same CRUD pattern for `gear`, `category`, `package`, `destination`)

| Method | Endpoint | Access | Body type |
|---|---|---|---|
| GET | `/gear?search=&category=&page=&limit=` | Public | — |
| GET | `/gear/:slug` | Public | — |
| POST | `/gear` | Admin | `multipart/form-data` (image field: `image`) |
| PUT | `/gear/:slug` | Admin | multipart **or** raw JSON |
| DELETE | `/gear/:slug` | Admin | — |

### Video (Cloudinary)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/video?category=` | Public | List videos |
| POST | `/video/upload-signature` | Admin | Returns signed upload payload |
| POST | `/video` | Admin | Save `{ title, category, cloudinaryUrl, publicId }` |
| DELETE | `/video/:id` | Admin | Deletes DB record **and** Cloudinary asset |

### Leads & users

| Method | Endpoint | Access |
|---|---|---|
| POST | `/contact` | Public |
| GET / PATCH / DELETE | `/contact` | Admin |
| POST | `/subscriber` | Public |
| GET / DELETE | `/subscriber` | Admin |
| GET / DELETE | `/user` | Admin |

**Pagination:** all list endpoints accept `page` & `limit` (max 100) and return `meta: { page, limit, total }`.

---

## 🔑 Authentication Flow

```
┌──────────┐   POST /auth/login    ┌──────────┐
│ Frontend │ ────────────────────▶ │ Backend  │
│          │ ◀──────────────────── │          │
└──────────┘  accessToken (1 h)    └──────────┘
              refreshToken (1 d)
              + DB session record (revocable)

Every protected request:  Authorization: Bearer <accessToken>
Token expired (401)?   →  POST /auth/refresh-token → new pair
Logout                 →  revokes that session only
Password reset         →  revokes ALL sessions of the user
```

- Tokens are stored in `localStorage` (`yatriko.accessToken`); the Axios interceptor attaches them automatically.
- Sessions are checked in the database **before** JWT verification, so a stolen token dies the moment its session is revoked.
- Self-registration can never create an `admin` — admin exists only via the seeder.

---

## 🖼 File & Media Uploads

### Images (gear/category/package/destination) — Multer

- Field name: `image`, sent as `multipart/form-data`
- Allowlisted extensions, **3 MB** limit
- Stored at `public/uploads/<module>/`, served at `http://localhost:9005/images/<module>/<filename>`
- API responses expose the image as a **plain URL string**

### Videos — Cloudinary (never touch the Express server)

1. Admin requests `POST /video/upload-signature` → server signs payload with the Cloudinary API secret
2. Browser uploads the video **directly to Cloudinary** with that signature
3. Cloudinary returns `{ secure_url, public_id }`
4. Admin saves the record via `POST /video`
5. Deleting a video also destroys the Cloudinary asset

> Cloudinary offers **no OAuth** for uploads — only signed uploads (API key/secret) or unsigned presets. This project uses signed uploads; the secret never leaves the server.

---

## 📜 Available Scripts

### Backend

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with hot reload (nodemon + tsx) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled production build |
| `pnpm seed` | Seed admin + baseline content (idempotent — safe to re-run) |

### Frontend

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server (port 5173) |
| `pnpm build` | Type-check + production build to `dist/` |
| `pnpm preview` | Preview the production build locally |

---

## 🧪 Testing with Postman

1. Import `yatriko-backend/postman/yatriko-api.postman_collection.json`
2. Confirm collection variable `baseUrl` = `http://localhost:9005/api/v1`
3. Run **Auth → Login** with the seeded admin credentials — the test script auto-saves `accessToken` / `refreshToken` into collection variables
4. All admin requests then authenticate automatically via `{{accessToken}}`

> 💡 For raw JSON requests, make sure the body dropdown is set to **JSON** (not *Text*) — otherwise Express receives an empty body and updates silently do nothing.
> 💡 For image uploads, use **form-data** and set the `image` row's type to **File**.

---

## 🩺 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Frontend shows old/stale data | API unreachable → fallback data rendered | Check Network tab; verify Vite proxy targets port `9005`; restart `pnpm dev` after proxy changes |
| `queryTxt ETIMEOUT cluster0...` | DNS can't resolve Atlas SRV record | Switch DNS to `1.1.1.1`/`8.8.8.8`, disable VPN, or use the non-SRV connection string from Atlas |
| MongoDB worked before, fails now | Your ISP rotated your public IP | Re-add your current IP (`curl ifconfig.me`) in Atlas → Network Access |
| `401 Unauthorized` in Postman | Access token expired (1 h) | Re-login or call `/auth/refresh-token` |
| `403 Forbidden` | Logged in but not admin | Login with the seeded admin account |
| Update returns 200 but nothing changes | Raw body sent as *Text* (empty `req.body`) | Set Postman raw dropdown to **JSON** |
| Image upload cast error | Schema/middleware mismatch | Ensure multipart form-data with `image` as **File** type |
| `@/...` import fails in Vite | Missing `resolve.alias` | Keep the alias block in `vite.config.ts` |

---

## 📞 Contact

**Yatriko Gears**
📍 Gabu, Khokana, Lalitpur, Nepal
📱 +977 9747672039 / 9747672040
📧 yatrikogears1234@gmail.com
🚚 Delivery available: Kathmandu • Lalitpur • Bhaktapur

---

<p align="center">Made with ❤️ in Nepal 🇳🇵</p>
