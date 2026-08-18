# Yatriko Gears — Admin Panel (CMS)

The third app in the repo, alongside `frontend/` (public site) and `backend/` (REST API).
It is a standalone Vite + React SPA that consumes the existing API — it shares no code
with the other two apps and talks to the backend only over HTTP.

| | |
|---|---|
| Dev URL | **`http://localhost:5173/admin`** — same origin as the public site |
| Dev server | Vite on port 5174, proxied to `/admin` by the public site's dev server |
| API | `http://localhost:9005/api/v1`, reached through the Vite proxy in dev |
| Stack | Vite · React 18 · TypeScript (strict) · Tailwind · react-router-dom v6 · Zod · axios |
| Package manager | **pnpm only** — never npm or yarn |

---

## Setup

```bash
pnpm install
pnpm dev            # http://localhost:5174/admin/  (standalone)
```

The CMS is mounted at the **`/admin`** path rather than its own port. That needs
both dev servers running — the public site's Vite server proxies `/admin` (and its
hot-reload socket) through to this one:

```bash
make dev-all        # backend + public site + admin
```

Then open **http://localhost:5173/admin**. Port 5174 still works on its own
(`http://localhost:5174/admin/`, note the trailing slash) if you'd rather run the
CMS without the public site.

From the repo root:

```bash
make install-admin
make dev-admin      # alias: make admin-dev — this server alone
```

The backend must be running on port **9005** (`make dev-backend`), seeded with an admin
account (`make seed`). Sign in at `/login` with the seeded `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from `backend/.env`. Accounts whose role is not `admin` are rejected with "Access denied".

### Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Vite dev server on port 5174 (fails fast if the port is taken) |
| `pnpm build` | `tsc -b` type-check + production bundle to `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm typecheck` | Type-check only, no emit |

---

## Environment

One variable, documented in `.env.example` (copy it to `.env`, which is git-ignored):

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Full API base URL **including** the `/api/v1` suffix. Leave empty in dev. |
| `VITE_PUBLIC_SITE_URL` | Origin of the public site, used by the "View public site" link. Defaults to `http://localhost:5173`. |

- **Development** — leave it empty. The app falls back to the relative path `/api/v1`, and
  `vite.config.ts` proxies `/api`, `/images` and `/health` to `http://localhost:9005`.
  Because requests are same-origin, no CORS configuration is needed.
- **Production** — set it to the deployed API, e.g.
  `VITE_API_BASE_URL=https://api.yatrikogears.com/api/v1`, and add the admin panel's origin
  to `ALLOWED_ORIGINS` in `backend/.env`.

The backend URL is never hardcoded anywhere in `src/`.

### Serving at /admin

Three pieces keep the CMS on the `/admin` path:

| Where | What |
|---|---|
| `admin/vite.config.ts` | `base: "/admin/"` — every asset URL is prefixed |
| `admin/src/main.tsx` | `<BrowserRouter basename="/admin">` — every route is prefixed |
| `frontend/vite.config.ts` | dev-only proxy: `/admin` → `localhost:5174`, `ws: true` for hot reload, plus a rewrite so a bare `/admin` picks up its trailing slash |

**In production** there is no proxy — `pnpm build` emits a `dist/` whose assets already
point at `/admin/...`, so deploy it to an `/admin/` subdirectory of whatever serves the
public site (e.g. copy `admin/dist` to `frontend/dist/admin`). The host must also serve
`index.html` for unknown paths under `/admin/` so deep links like `/admin/gear` work.

---

## How it is wired

```text
admin/
├── vite.config.ts        # "@" alias → src (also in tsconfig), base "/admin/", port 5174, /api proxy → :9005
└── src/
    ├── lib/
    │   ├── api.ts        # THE http layer: axios instance + Zod envelope + ApiRequestError
    │   ├── session.ts    # token/user storage + "session expired" broadcast
    │   ├── formData.ts   # multipart encoding that matches the backend DTOs
    │   ├── csv.ts        # client-side CSV export
    │   └── format.ts     # date / price / initials helpers
    ├── api/              # one file per backend module — components never call axios
    ├── types/            # Zod schemas: domain (index.ts), auth.ts, forms.ts
    ├── context/          # AuthContext (session) + ToastContext (notifications)
    ├── hooks/            # useListResource (search/filter/pagination), useDeleteConfirm, …
    ├── components/
    │   ├── layout/       # Sidebar, Topbar, AdminLayout, RequireAdmin (route guard)
    │   ├── common/       # DataTable, StatusBadge, ConfirmModal, Pagination, KpiCard, …
    │   └── form/         # FormField, TagInput, SpecsEditor, ImageDropzone, Toggle, …
    └── pages/            # one screen per route
```

**Rules this app follows** (same as the public site):

- Every network call goes through `src/lib/api.ts` via a function in `src/api/*.ts`.
  Components never import axios.
- Every response is parsed with a Zod schema mirroring the `{ data, message, meta }`
  envelope. A response that does not match throws instead of rendering wrong data.
- Failures are normalized to `ApiRequestError` (`status`, `code`, `message`, `detail`), and
  every failed mutation raises a red toast carrying the API's own message. When the backend
  returns a per-field `detail` map, those messages are shown inline on the form.
- Imports use the `@/…` alias, declared in **both** `tsconfig.json` and `vite.config.ts`.

### Auth & session

- `POST /auth/login` → the role is checked client-side; a non-admin is immediately logged
  back out (`POST /auth/logout`) and shown "Access denied".
- Access token → `localStorage["yatriko.admin.accessToken"]` (namespaced away from the
  public site's `yatriko.accessToken`, so both apps can be open at once).
- Refresh token → `sessionStorage["yatriko.admin.refreshToken"]`. AGENTS.md asks that
  refresh tokens stay out of `localStorage`; sessionStorage is the narrower option that
  still survives a page reload, which the retry-once rule needs.
- Every route except `/login` sits behind `RequireAdmin`, which re-validates the session
  against `GET /auth/me` on app load.
- A mid-session `401` triggers exactly one `POST /auth/refresh-token` (single-flight, so
  parallel 401s share one attempt). Success replays the original request; failure clears
  storage and bounces to `/login`.

### Uploads

- **Images** (gear, category, destination) — `multipart/form-data`, file field exactly
  `image`, max 3 MB, matching the backend's multer allowlist. Numbers are sent as strings,
  arrays/objects JSON-stringified, `null` as the literal `"null"` — and booleans are sent as
  `"true"` / `""`, because the backend's `z.coerce.boolean()` would read the string
  `"false"` as **true**.
- **Videos** — never touch Express: `POST /video/upload-signature` → the browser uploads
  straight to Cloudinary with the signed fields (progress bar, cancellable) → `POST /video`
  stores `{ title, category, cloudinaryUrl, publicId }`.

---

## Screens

Routes are listed below without the `/admin` prefix that `basename` adds — `/gear`
is reached at `http://localhost:5173/admin/gear`.

| Route | What it does |
|---|---|
| `/login` | Admin sign-in, with the role check described above |
| `/` | Dashboard: KPI cards from each list endpoint's `meta.total`, recent leads, quick actions |
| `/gear` · `/gear/new` · `/gear/:slug/edit` | Table (search, category filter, pagination, bulk delete) + full form |
| `/categories`, `/packages`, `/destinations` | Same table + form pattern |
| `/videos` | Cloudinary upload flow, list, delete (also destroys the Cloudinary asset) |
| `/leads` | Contact inbox: detail modal, mark read / handled, delete |
| `/subscribers` | List, delete, **Export CSV** (walks every page, not just the visible one) |
| `/customers` | Registered accounts, delete (your own row cannot be deleted) |
| `/settings` | Admin profile, session info, logout |

---

## Known API constraints

These are properties of the existing backend, not bugs in the CMS. The backend was left
untouched; each one is surfaced in the UI where it matters.

1. **Inactive records disappear from list screens.** `GET /gear`, `/package` and
   `/destination` are the public catalogue endpoints and hard-filter `status: "active"`
   (only `/category` honours `?status=`). Setting an item to *inactive* therefore removes it
   from its table — `GET /gear/:slug` still works, so a bookmarked edit URL keeps working.
   A one-line backend change (accepting an optional `status` query param, as the category
   module already does) would fix this.
2. **Packages have no image.** `PackageRoute` has no `uploader()` middleware and
   `PackageModel` has no image field, so the package form submits JSON, not multipart.
   Posting multipart to that route fails validation (multer never parses the body).
3. **`specs` may come back empty.** Gear `specs` is a Mongoose `Map` serialized through
   `toObject()`, which JSON-encodes as `{}`. The editor saves specs correctly, but they may
   not be echoed back until the backend flattens the map (`toObject({ flattenMaps: true })`).
4. **Videos and leads have no admin-only list.** `GET /video` is public and returns active
   videos only.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `@/...` import fails at runtime | The alias must exist in `vite.config.ts` too, not just `tsconfig.json` |
| All requests fail with "Cannot reach the API" | Start the backend: `make dev-backend` (port 9005) |
| Login says "Access denied" | The account is not an admin — use the seeded `ADMIN_EMAIL` |
| Signed out after ~1 hour of idling | Access tokens last 1 h; the refresh token lives in `sessionStorage`, so closing the tab ends the session |
| An item vanished after saving it as *inactive* | Expected — see "Known API constraints" #1 |
| Port 5174 already in use | `strictPort` is on so the clash is loud; stop the other process |
| `/admin` 404s or shows the public site's 404 | The admin dev server isn't running — `/admin` is proxied to port 5174. Use `make dev-all`. |
| Admin loads but is unstyled / blank | Assets are resolving off the base path; check `base: "/admin/"` survived any `vite.config.ts` edit |
