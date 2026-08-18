# AGENTS.md — Yatriko Gears (Full-Stack Project)


---

## 0. Project overview

**Yatriko Gears** — "Rent the Best, Trek with Confidence." A camping/trekking gear
rental + sales business in Gabu, Khokana, Lalitpur, Nepal. This is a full-stack
web app with a public marketing/e-commerce-style site (browse gear, packages,
destinations, portfolio videos, contact/lead forms) and an admin CMS to manage
all of that content, including Cloudinary-hosted videos.

Both projects live side by side in one parent folder:

```text
<project-root>/
├── yatriko-frontend/     # React + Vite + TypeScript
└── yatriko-backend/      # Express + TypeScript + MongoDB
```

They are two separate pnpm projects (separate package.json, separate
node_modules) — NOT a monorepo/workspace. Run each with its own `pnpm dev` in
its own terminal. The frontend talks to the backend only over HTTP
(`/api/v1/...`), never by importing backend code directly.

---

## 1. Tech stack

### Frontend (`yatriko-frontend/`)

| Concern | Choice |
|---|---|
| Build tool | Vite |
| Language | TypeScript (strict) |
| UI framework | React 18 |
| Routing | react-router-dom v6 |
| Styling | Tailwind CSS |
| Animation | framer-motion |
| Forms / validation | Zod (`safeParse`, shared with backend-style DTOs) |
| HTTP client | **axios** (typed wrapper in `src/lib/api.ts`) |
| Package manager | **pnpm only** — never npm or yarn |

### Backend (`yatriko-backend/`)

| Concern | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Language | TypeScript (strict) |
| Database | MongoDB via Mongoose |
| Validation | Zod |
| Auth | JWT (`jsonwebtoken`) + revocable DB sessions |
| Password hashing | bcryptjs (cost 12) |
| File upload (images) | multer (disk storage, served at `/images`) |
| Video hosting | Cloudinary (signed uploads — API key/secret, no OAuth) |
| Email | nodemailer (Gmail SMTP) |
| Slugs | slugify |
| Security | helmet, explicit cors allowlist, express-rate-limit |
| Config | dotenv, centralized in `src/config/AppConfig.ts` |
| Dev runner | nodemon + tsx |
| Package manager | **pnpm only** — never npm or yarn |

---

## 2. Frontend file structure

```text
yatriko-frontend/
├── index.html
├── vite.config.ts          # alias "@" → src, dev proxy /api → backend port
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json           # paths: { "@/*": ["src/*"] } (type-checker only!)
├── package.json
├── .env.example
├── public/
│   └── tent.svg
└── src/
    ├── main.tsx            # ReactDOM root, wraps <App/> in <AuthProvider>
    ├── App.tsx             # <Routes> — all page routes declared here
    ├── index.css           # Tailwind directives + global styles
    ├── vite-env.d.ts
    ├── assets/             # local images (brands/, gear/, spots/, heroes)
    ├── types/
    │   ├── index.ts        # domain Zod schemas mirroring backend models + envelope/error schemas
    │   ├── forms.ts        # form Zod schemas (contact, subscriber, booking) + validateForm()
    │   └── auth.ts         # user/auth Zod schemas (login, register)
    ├── lib/
    │   ├── api.ts          # axios instance + typed request() wrapper, unwraps {data,message,meta}
    │   ├── fallbackData.ts # hardcoded data shown if the API is unreachable
    │   └── gearImages.ts / spotImages.ts
    ├── api/                # one file per backend module, calls api.get/post/...
    │   ├── gear.ts         # fetchGear, fetchGearBySlug, fetchPackages, fetchDestinations, fetchVideos
    │   ├── forms.ts        # submitContact, subscribe
    │   └── auth.ts         # login, register, logout, fetchMe, getStoredUser, hasToken
    ├── context/
    │   └── AuthContext.tsx # AuthProvider + useAuth() hook, re-validates session via /auth/me
    ├── hooks/
    │   └── usePageMeta.ts  # sets document title/meta description per page
    ├── components/
    │   ├── layout/         # Header, Footer, Layout, WhatsAppFloat
    │   ├── home/           # Hero, GearGrid, PackageBand, SpotsSection, BrandMarquee, InstaFeed, ContactSection
    │   ├── gear/           # GearCard
    │   ├── common/         # SectionHeading and other shared bits
    │   └── modal/          # LeadCaptureModal (15%-off email capture)
    └── pages/
        ├── HomePage.tsx, AboutPage.tsx, GearPage.tsx, PortfolioPage.tsx,
        │   ContactPage.tsx, LoginPage.tsx, RegisterPage.tsx, NotFoundPage.tsx
```

### Frontend conventions

- **Path alias**: always import with `@/...` (e.g. `@/components/layout/Header`).
  `tsconfig.json` sets this for the type-checker; `vite.config.ts` MUST also
  set the matching `resolve.alias` (`"@": path.resolve(__dirname, "src")` or
  the ESM-safe `fileURLToPath` form) — tsconfig paths alone do NOT make Vite
  resolve `@/` imports at runtime. If you ever see "dependencies imported but
  could not be resolved" for `@/...` imports, check `vite.config.ts` first.
- **API calls**: never call `fetch`/`axios` directly inside a component. Add a
  function to the relevant file under `src/api/`, which calls the shared
  `api` object from `src/lib/api.ts`, which unwraps the `{data,message,meta}`
  envelope and validates with a Zod schema from `src/types/`.
- **Fallback data**: list-fetching functions in `src/api/gear.ts` catch
  network errors and fall back to `src/lib/fallbackData.ts` so the site still
  renders during early backend development. Keep this pattern for any new
  public list endpoint.
- **Auth**: JWT access token stored at `localStorage["yatriko.accessToken"]`,
  cached user at `localStorage["yatriko.user"]`. `AuthContext` re-validates via
  `GET /auth/me` on load. Do not store the refresh token in `localStorage` in
  new code without discussing it — currently only access token is persisted.
- **Forms**: define a Zod schema in `src/types/forms.ts`, validate with
  `validateForm()`, then call the matching function in `src/api/forms.ts`.
- **Styling**: Tailwind utility classes only; no CSS modules or styled-components.
- **Package manager**: pnpm only. Never suggest or run `npm install` /
  `yarn add` in this project.

---

## 3. Backend file structure (feature-module architecture)

```text
yatriko-backend/
├── package.json            # scripts: dev (nodemon), build (tsc), start, seed
├── tsconfig.json
├── nodemon.json            # watches src, runs `tsx src/server.ts`
├── .env / .env-sample      # .env is git-ignored; only .env-sample is committed
├── postman/
│   └── yatriko-api.postman_collection.json
├── public/uploads/         # multer image destination, served at /images
└── src/
    ├── server.ts           # boots the HTTP listener ONLY (imports mongodbConfig + app)
    ├── app.ts              # builds + configures the express app, exports it (never listens)
    ├── seed.ts             # idempotent: admin user, categories, 21 gear items, 5 destinations, combo package
    ├── config/
    │   ├── AppConfig.ts        # ALL process.env access lives here, fails fast on missing secrets
    │   ├── mongodbConfig.ts    # mongoose.connect(), side-effect import, process.exit(1) on failure
    │   ├── smtpConfig.ts
    │   └── cloudinaryConfig.ts # cloudinary.config() with cloud_name/api_key/api_secret
    ├── router/
    │   └── router.ts           # central router, mounts every module + auth/form rate limiters
    ├── middlewares/
    │   ├── AuthMiddleware.ts          # Auth(roles?) — higher-order middleware, JWT + role guard
    │   ├── BodyValidationMiddleware.ts # bodyValidator(schema) — higher-order, Zod validation
    │   ├── UploaderMiddleware.ts      # uploader(dir) — higher-order, configured multer instance
    │   └── ErrorHandlingMiddleware.ts # single 4-arg error handler, registered LAST
    ├── modules/
    │   ├── auth/        # AuthRoute, AuthController, AuthDto, AuthModel (sessions), AuthContract (IAuthRequest)
    │   ├── user/        # UserRoute, UserController, UserModel
    │   ├── category/    # CategoryRoute, CategoryController, CategoryDto, CategoryModel
    │   ├── gear/        # GearRoute, GearController, GearDto, GearModel
    │   ├── package/     # PackageRoute, PackageController, PackageDto, PackageModel
    │   ├── destination/ # DestinationRoute, DestinationController, DestinationDto, DestinationModel
    │   ├── video/       # VideoRoute, VideoController, VideoDto, VideoModel (Cloudinary signed uploads)
    │   ├── contact/     # ContactRoute, ContactController, ContactDto, ContactModel
    │   └── subscriber/  # SubscriberRoute, SubscriberController, SubscriberDto, SubscriberModel
    ├── services/
    │   └── EmailService.ts     # class-based, wraps nodemailer, non-critical failures caught locally
    ├── types/
    │   └── EmailParams.ts
    └── utilities/
        ├── commonSchema.ts     # ImageSchema, UserRefSchema, StatusSchema (shared mongoose fragments)
        └── helpers.ts          # mapImage(), makeSlug(), getPagination(), parseMaybeJson()
```

### Backend conventions (do not deviate)

- **Naming**: `PascalCase` files matching role — `XxxRoute.ts`, `XxxController.ts`,
  `XxxDto.ts`, `XxxModel.ts`. Keep every file of a module inside its own
  `modules/<feature>/` folder. Never place a model, controller, etc. outside
  its module folder.
- **`server.ts` vs `app.ts`**: `app.ts` builds and exports the Express app,
  never calls `.listen()`. `server.ts` imports `./config/mongodbConfig` (side
  effect) then `app` and calls `app.listen()`. Keep this split for testability.
- **Middleware order in `app.ts`** (never reorder):
  `helmet → cors → rateLimit → express.json/urlencoded → /images static →
  /api/v1 router → 404 handler → ErrorHandlingMiddleware (always last)`.
- **Higher-order middleware pattern**: `Auth(roles?)`, `bodyValidator(schema)`,
  and `uploader(dir)` are all *functions that return* the actual middleware.
  Reuse this pattern for any new configurable middleware.
- **Route pipeline reads left-to-right**: `Auth(["admin"]) → uploader(...).single("image")
  → bodyValidator(Dto) → controller.method`. **`uploader()` must always come
  before `bodyValidator()`** on multipart routes — multer parses the body
  before Zod can validate it.
- **Controllers**: classes with arrow-function methods (so they can be passed
  directly as route handlers without `.bind()`). Every method: wrap in
  try/catch, throw plain `{ code, message, detail? }` objects (never
  `new Error()` for business errors), always `next(exception)` in catch,
  never handle errors or send status codes locally.
- **Response envelope** — every response, success or error, is exactly:
  ```json
  { "data": <payload|null>, "message": "<string>", "meta": <pagination|null> }
  ```
- **Auth**: JWT access token (1h) + refresh token (1d), separate secrets, PLUS
  a DB session record (`AuthModel`) so tokens are revocable (checked before
  `jwt.verify`). `POST /auth/refresh-token` rotates both tokens. Logout
  revokes just that session; password reset revokes ALL of a user's sessions.
  Self-registration can never set `role: "admin"`. Forgot-password always
  returns the same message whether or not the email exists (no enumeration).
- **DTOs**: Zod schemas in `XxxDto.ts`. `bodyValidator` replaces `req.body`
  with the *parsed* (defaulted/coerced) result. Derive update DTOs with
  `.partial()` instead of duplicating fields. Multipart routes must coerce
  numbers (`z.coerce.number()`) and JSON-encode arrays/objects
  (`z.preprocess(parseMaybeJson, ...)`) since multipart sends everything as strings.
- **Slugs**: user-facing resources are routed by `slug`, not `_id`. Generate
  with `makeSlug()`, enforce uniqueness by appending `-${Date.now()}` on
  collision, and never overwrite an existing slug on update (`delete data.slug`).
- **Pagination**: every list endpoint uses `getPagination()` —
  `{ page, limit (capped at 100), skip }` — and returns `meta: { page, limit, total }`.
- **File uploads (images)**: multer disk storage via `uploader(dir)`, allowlist
  of extensions, 3 MB limit matching the `express.json({ limit: "3mb" })`
  body-parser limit, stored/served under `public/uploads/<dir>/` → `/images/<dir>/`.
  Always build the stored URL from `image.filename`, never `image.fieldname`.
- **Video uploads (Cloudinary)**: videos never touch the Express server.
  Flow: `POST /video/upload-signature` (admin) generates a short-lived signed
  payload using the Cloudinary API secret (server-only) → the CMS browser
  uploads the file directly to Cloudinary's API using that signature →
  Cloudinary returns `{ secure_url, public_id }` → CMS calls `POST /video`
  to persist `{ title, category, cloudinaryUrl, publicId }`. `DELETE /video/:id`
  also calls `cloudinary.uploader.destroy(publicId)`. Cloudinary has **no
  OAuth** — only API key/secret (signed) or unsigned upload presets. Do not
  attempt to implement an OAuth flow for Cloudinary.
- **Config**: all `process.env` reads happen ONLY in `src/config/AppConfig.ts`.
  No other file should read `process.env` directly. Missing required secrets
  (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `MONGODB_URL`) must throw at boot —
  never provide a silent fallback/default secret.
- **Package manager**: pnpm only — `"packageManager": "pnpm@9.12.0"` is
  pinned in `package.json`. Never suggest or run npm/yarn commands here.

---

## 4. API contract the frontend already expects (do not change response shapes without updating both sides)

Base URL: `<backend-origin>/api/v1` (dev: `http://localhost:9005/api/v1`, proxied
by Vite from `http://localhost:5173/api`).

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /auth/register | public | role forced to `customer` |
| POST | /auth/login | public | → `{ accessToken, refreshToken, user }` |
| GET | /auth/me | Bearer | |
| POST | /auth/logout | Bearer | revokes current session |
| POST | /auth/refresh-token | public | body `{ refreshToken }` |
| POST | /auth/forgot-password | public | |
| POST | /auth/reset-password | public | |
| GET | /gear?search=&category=&page=&limit= | public | `image` is a plain URL string, `isNew` boolean |
| GET / POST / PUT / DELETE | /gear/:slug or /gear | mixed (writes = admin) | multipart on create/update (`image` field) |
| GET / POST / PUT / DELETE | /category, /package, /destination | mixed (writes = admin) | same CRUD shape as gear |
| GET | /video?category= | public | |
| POST | /video/upload-signature | admin | → `{ cloudName, apiKey, timestamp, folder, signature, uploadUrl }` |
| POST / PUT / DELETE | /video | admin | JSON body `{ title, category, cloudinaryUrl, publicId }` |
| POST | /contact | public | |
| GET / PATCH / DELETE | /contact | admin | |
| POST | /subscriber | public | idempotent (lead-capture modal) |
| GET / DELETE | /subscriber | admin | |
| GET / DELETE | /user | admin | |

Every response body: `{ "data": ..., "message": "...", "meta": ... | null }`.
Every error body: `{ "data": null | detail, "message": "...", "meta": null }`
with HTTP status 400/401/403/404/422/500 per the conventions above.

Frontend Zod schemas mirroring these live in `yatriko-frontend/src/types/index.ts`
(`gearSchema`, `packageSchema`, `destinationSchema`, `videoSchema`,
`envelopeSchema`, `apiErrorSchema`) and `.../src/types/forms.ts` /
`.../src/types/auth.ts`. If you add or change a backend field, update the
matching Zod schema too, or the frontend request will throw a validation error.

---

## 5. Running both projects together

```bash
# terminal 1
cd yatriko-backend && pnpm install && pnpm seed && pnpm dev   # http://localhost:9005

# terminal 2
cd yatriko-frontend && pnpm install && pnpm dev                # http://localhost:5173
```

`yatriko-frontend/vite.config.ts` proxies `/api` to the backend port (keep
this in sync with `yatriko-backend/.env`'s `PORT`). `ALLOWED_ORIGINS` in the
backend `.env` must include the frontend's dev origin (`http://localhost:5173`).

---

## 6. Rules for Gemini / any coding agent working in this repo

1. Always work inside the correct project (`yatriko-frontend/` vs
   `yatriko-backend/`) — they have separate `package.json`, separate
   `node_modules`, separate TypeScript configs. Do not mix imports across them.
2. Use **pnpm** exclusively for installs/scripts in both projects.
3. Match existing file naming and folder conventions above exactly when adding
   a new page, component, module, route, controller, or model — do not invent
   a different structure.
4. Any new backend list/detail endpoint must follow the pagination, envelope,
   slug, and error-handling conventions in Section 3.
5. Any new frontend data-fetching code must go through `src/lib/api.ts` +
   a file in `src/api/`, validated by a Zod schema in `src/types/`.
6. Never hardcode secrets in code; read them from `AppConfig.ts` (backend) or
   `import.meta.env` (frontend), sourced from `.env` files that stay git-ignored.
7. When something "was working, then suddenly isn't," check environment causes
   first (`.env` values, Atlas IP allowlist, DNS/network, CORS origin, Vite
   alias config) before rewriting application code.
8. Do not add axios/fetch calls, new HTTP libraries, or new state-management
   libraries without being explicitly asked — the stack above is intentional
   and final unless the user says otherwise.
