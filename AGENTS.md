# AGENTS.md — Yatriko Gears (Full-Stack Project)

---

## 0. Project overview

**Yatriko Gears** — "Rent the Best, Trek with Confidence." A camping/trekking gear
rental + sales business in Gabu, Khokana, Lalitpur, Nepal.

**Three applications live side by side in this repo:**

```text
yatriko-gears/
├── frontend/   # public customer site   (React + Vite + TS)  :5173
├── admin/      # admin CMS              (React + Vite + TS)  :5174, served at :5173/admin
└── backend/    # REST API               (Express + TS + MongoDB)  :9005
```

They are three **separate pnpm projects** — separate `package.json`, separate
`node_modules`, NOT a workspace. The two React apps talk to the backend only
over HTTP (`/api/v1/...`), never by importing backend code.

Run everything with `make dev-all` from the repo root.

---

## 1. Tech stack

### frontend/ — public site

| Concern | Choice |
|---|---|
| Build / language | Vite, React 18, TypeScript (strict) |
| Routing | react-router-dom v6 |
| Styling | Tailwind CSS |
| Animation | framer-motion |
| Validation | Zod (`safeParse`, `validateForm()`) |
| HTTP | axios, wrapped in `src/lib/api.ts` |
| Lint | ESLint flat config (`eslint.config.js`) |

### admin/ — CMS

Same stack as `frontend/`, **plus**:

- `base: "/admin/"` in `vite.config.ts` and `<BrowserRouter basename="/admin">`,
  because the CMS is served from the `/admin` path, not its own port. In dev the
  public site's Vite server proxies `/admin` → `:5174`.
- No framer-motion. Its own storage keys (`yatriko.admin.*`) so both apps can be
  signed in at once.

### backend/ — API

| Concern | Choice |
|---|---|
| Runtime | Node 22, Express 4, TypeScript (strict) |
| Database | MongoDB Atlas via Mongoose |
| Validation | Zod DTOs + `bodyValidator` middleware |
| Auth | JWT access (1h) + refresh (1d) + revocable DB sessions; bcryptjs cost 12 |
| Google auth | Google Identity Services, ID token verified locally against Google's JWKS |
| Payments | eSewa ePay v2 (HMAC-SHA256 signed, server-to-server verified) |
| Images | multer disk storage, served at `/images` |
| Video | Cloudinary signed direct uploads |
| Chatbot | Google Gemini, history persisted in MongoDB with a TTL |
| Email | nodemailer (Gmail SMTP) |
| Tests | Vitest (`pnpm test`) — pure unit tests, no DB needed |

**Package manager: pnpm only.** Never npm or yarn, in any of the three apps.

---

## 2. Backend structure (feature-module architecture)

```text
backend/src/
├── server.ts               # boots the listener ONLY
├── app.ts                  # builds + exports the express app, never listens
├── seed.ts                 # idempotent seeder (admin user, categories, gear, …)
├── config/                 # AppConfig (ALL process.env reads), mongodb, smtp, cloudinary
├── router/router.ts        # mounts every module under /api/v1
├── middlewares/            # Auth(roles), bodyValidator(dto), uploader(dir), error handler
├── modules/
│   ├── auth/               # login, register, me, logout, refresh, google, profile
│   │   └── GoogleVerifier.ts   # verifies Google ID tokens against Google's JWKS
│   ├── user/ category/ gear/ package/ destination/ video/ contact/ subscriber/
│   ├── booking/            # BookingModel/Dto/Controller/Route
│   │   ├── AvailabilityService.ts  # stock + date-overlap checks
│   │   └── BookingPricing.ts       # pure rental maths (unit tested)
│   ├── payment/            # EsewaService (signing/verification), Controller, Route
│   └── chat/               # Gemini chatbot, ChatModel holds history with a TTL
├── services/EmailService.ts
├── utilities/              # commonSchema, helpers (slug, pagination, mapImage)
└── __tests__/              # Vitest specs
```

### Backend conventions (do not deviate)

- **Naming**: `XxxRoute.ts`, `XxxController.ts`, `XxxDto.ts`, `XxxModel.ts`, each
  inside `modules/<feature>/`.
- **`server.ts` vs `app.ts`**: `app.ts` exports the app and never calls `.listen()`.
- **Middleware order in `app.ts`** (never reorder): helmet → cors → rateLimit →
  body parsers → `/images` static → `/api/v1` router → 404 → error handler (last).
- **Route pipeline reads left-to-right**: `Auth(["admin"]) → uploader(...).single("image")
  → bodyValidator(Dto) → controller`. **`uploader()` must come before `bodyValidator()`**
  — multer parses the body before Zod can validate it.
- **Controllers**: classes with arrow-function methods. Wrap in try/catch, throw plain
  `{ code, message, detail? }` objects, always `next(exception)`. Never send status
  codes locally.
- **Response envelope** — every response, success or error:
  `{ "data": <payload|null>, "message": "<string>", "meta": <pagination|null> }`
- **DTOs**: multipart routes must use `z.coerce.number()` and
  `z.preprocess(parseMaybeJson, ...)`, because multipart sends everything as strings.
  Booleans are the trap: `z.coerce.boolean()` reads the string `"false"` as **true**,
  so clients must send `""` for false.
- **Slugs**: user-facing resources are routed by `slug`, not `_id`. Never overwrite an
  existing slug on update.
- **Pagination**: every list endpoint uses `getPagination()` and returns
  `meta: { page, limit, total }`.
- **Status filtering**: list endpoints default to `status: "active"` (the public view)
  and accept `?status=inactive` or `?status=all` so the CMS can see everything.
- **Money is computed server-side.** Booking totals come from stored gear prices; a
  client-supplied total is ignored. Never trust a price from the browser.
- **Config**: all `process.env` reads happen ONLY in `config/AppConfig.ts`, which throws
  at boot on missing required secrets. No silent fallback secrets.

---

## 3. Frontend structure (`frontend/`)

```text
frontend/src/
├── main.tsx                # wraps <App/> in <AuthProvider>
├── App.tsx                 # all routes
├── types/                  # index.ts (domain + envelope), auth.ts, forms.ts
├── lib/api.ts              # axios instance + typed request(), unwraps the envelope
├── lib/fallbackData.ts     # bundled data shown if the API is unreachable
├── api/                    # auth.ts, booking.ts, gear.ts, forms.ts, chat.ts
├── context/AuthContext.tsx # customer session
├── components/
│   ├── layout/             # Header, Footer, AccountMenu, RequireAuth
│   ├── auth/               # GoogleSignInButton
│   ├── home/ gear/ common/ modal/ chat/
└── pages/                  # Home, Gear, Portfolio, Contact, Login, Register,
                            # Book, MyBookings, PaymentResult, NotFound
```

### Frontend conventions

- **Path alias**: import with `@/...`. It must be declared in **both**
  `tsconfig.json` *and* `vite.config.ts` — tsconfig paths alone do not work at runtime.
- **API calls**: never call axios/fetch inside a component. Add a function under
  `src/api/`, which uses `src/lib/api.ts`, validated by a Zod schema in `src/types/`.
- **The fallback trap**: `src/api/gear.ts` falls back to `fallbackData.ts` when a request
  throws — *including* a Zod error. If you add a backend field without updating the
  matching schema, the site silently serves stale bundled data. It logs a console
  warning when this happens; do not remove it.
- **Auth**: access token at `localStorage["yatriko.accessToken"]`, user at
  `yatriko.user`. `AuthContext` re-validates via `GET /auth/me` on load.
- **Styling**: Tailwind utility classes only.
- **Images**: assets are pre-compressed. Keep new ones under ~200 KB; the whole
  `src/assets` folder should stay near 2–3 MB, not 11 MB.

---

## 4. Admin CMS structure (`admin/`)

Mirrors the frontend's layering (`lib/api.ts` → `api/*.ts` → `types/*`), plus:

- `components/common/` — `DataTable` (search, filters, pagination, bulk select),
  `StatusBadge`, `ConfirmModal`, `Pagination`, `KpiCard`
- `components/form/` — `FormField`, `TagInput`, `SpecsEditor`, `ImageDropzone`, `Toggle`
- `context/` — `AuthContext` (admin session), `ToastContext` (every mutation toasts)
- `hooks/` — `useListResource` (list state), `useDeleteConfirm`
- Pages: Dashboard, Gear, Categories, Packages, Destinations, Videos, **Bookings**,
  Leads, Subscribers, Customers, Settings

Storage keys are namespaced `yatriko.admin.*`. The refresh token lives in
`sessionStorage`, not `localStorage`.

---

## 5. API contract

Base URL: `<origin>/api/v1` (dev: `http://localhost:9005/api/v1`, proxied from `:5173`).

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /auth/register | public | role forced to `customer` |
| POST | /auth/login | public | → `{ accessToken, refreshToken, user }` |
| POST | /auth/google | public | body `{ credential }` — Google ID token |
| GET / PATCH | /auth/me | Bearer | PATCH is multipart (avatar field: `image`) |
| POST | /auth/logout, /auth/refresh-token | mixed | |
| POST | /auth/forgot-password, /auth/reset-password | public | |
| GET/POST/PUT/DELETE | /gear, /category, /destination | writes = admin | multipart, image field `image` |
| GET/POST/PUT/DELETE | /package | writes = admin | **JSON only** — no uploader on this route |
| GET | /video, POST /video/upload-signature, POST/PUT/DELETE /video | writes = admin | Cloudinary |
| POST | /booking | Bearer | server prices it; stock + date overlap enforced |
| GET | /booking/my, /booking/availability | Bearer / public | |
| PATCH | /booking/:id/cancel | Bearer (owner) | pending + unpaid only |
| GET | /booking, PATCH /booking/:id/status, DELETE | admin | |
| POST | /payment/esewa/initiate | Bearer | → signed form fields |
| POST | /payment/esewa/verify | public | verified server-to-server before settling |
| POST /contact, GET/PATCH/DELETE /contact | mixed | | |
| POST /subscriber, GET/DELETE /subscriber | mixed | | |
| GET / DELETE | /user | admin | |
| POST | /chat | public | rate limited |

---

## 6. Running it

```bash
make install     # all three apps
make env         # .env files from samples
make seed        # admin user + baseline content
make dev-all     # backend :9005 + site :5173 + admin :5174
make check       # typecheck (backend + admin) + lint (frontend) + tests
```

- Public site: <http://localhost:5173>
- Admin CMS: <http://localhost:5173/admin> (needs the admin dev server running too)

---

## 7. Rules for any coding agent working in this repo

1. Work inside the correct app — `frontend/`, `admin/` and `backend/` have separate
   dependencies and configs. Never import across them.
2. **pnpm only.** Never suggest or run npm/yarn.
3. Match the existing file naming and folder conventions exactly.
4. New list/detail endpoints follow the pagination, envelope, slug and error
   conventions in §2.
5. New frontend/admin data fetching goes through `lib/api.ts` + a file in `api/`,
   validated by a Zod schema in `types/`.
6. **Never trust the client for money or identity.** Prices are recomputed server-side;
   payment callbacks are verified server-to-server; roles are never read from a
   third-party token.
7. Secrets are read from `AppConfig.ts` (backend) or `import.meta.env` (frontend/admin),
   sourced from git-ignored `.env` files. Note that Vite inlines `VITE_*` at **build**
   time — changing one requires a rebuild, not just a restart.
8. Do not add new HTTP clients, state-management libraries or UI kits without being
   asked. The stack above is intentional.
9. When something "was working, then suddenly isn't", check environment causes first
   (`.env` values, Atlas IP allowlist, CORS origin, Vite alias/proxy config, a stale
   dev server holding an old Tailwind config) before rewriting application code.
10. Run `make check` before declaring work done.
