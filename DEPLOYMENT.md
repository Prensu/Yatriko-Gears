# Deploying Yatriko Gears

Three pieces:

| Piece | Host | Why |
|---|---|---|
| `backend/` — Express API | **Render** (Singapore region) | long-running Node process |
| `frontend/` — public site | **Vercel** | static SPA on a global CDN |
| `admin/` — CMS | **Vercel** (second project) | static SPA, served at `/admin` |

---

## Image uploads

Gear, category, destination and settings images upload directly from the admin
browser to Cloudinary. The API stores the Cloudinary URL and public ID; Render's
local filesystem is not used for uploaded images.

---

## 1. Backend → Render

### Option A: blueprint (recommended)

1. Push this repo to GitHub.
2. Render dashboard → **New → Blueprint** → pick the repo. It reads `render.yaml`.
3. Fill in every variable marked `sync: false` (see below) and deploy.

### Option B: manual web service

- **Root directory:** `backend`
- **Build:** `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- **Start:** `pnpm start`
- **Health check path:** `/health`
- **Node version:** 22

### Environment variables

Copy from your local `backend/.env`, with these changed for production:

| Variable | Production value |
|---|---|
| `ALLOWED_ORIGINS` | `https://your-site.vercel.app,https://your-admin.vercel.app` (comma-separated, no spaces) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | fresh values, not the local ones |
| `MONGODB_URL` | Atlas connection string |

**Atlas:** add `0.0.0.0/0` to Network Access, or Render's outbound IPs. Render's
IPs are not static on the free plan.

### Free-plan caveat

Render free services sleep after ~15 minutes idle and take ~50s to wake. The
first customer of the day will hit that delay. Use a paid instance once you
take real payments.

---

## 2. Public site → Vercel

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory: `frontend`** (important — it is not the repo root).
3. Framework preset: Vite. `frontend/vercel.json` supplies the rest.
4. Environment variables:

```
VITE_API_BASE_URL=https://your-api.onrender.com/api/v1
VITE_GOOGLE_CLIENT_ID=<same id as the backend>
VITE_SITE_URL=https://your-site.vercel.app
VITE_WHATSAPP_NUMBER=9779747672039
```

> **Vite inlines `VITE_*` at build time.** Changing one in the dashboard does
> nothing until you redeploy. This is the single most common deployment
> surprise in this project.

---

## 3. Admin CMS → Vercel (second project)

1. **Add New → Project**, same repo, **Root Directory: `admin`**.
2. Environment variables:

```
VITE_API_BASE_URL=https://your-api.onrender.com/api/v1
VITE_PUBLIC_SITE_URL=https://your-site.vercel.app
```

3. Note the resulting URL, e.g. `https://yatriko-admin.vercel.app`.
4. Edit `frontend/vercel.json` and replace the placeholder host in the `/admin`
   rewrite with that URL, then redeploy the public site. The CMS is then reachable
   at `https://your-site.vercel.app/admin`, exactly as in development.

The admin build is emitted to `dist/admin`, matching its `base: "/admin/"`, and
`vercel.json` sends `X-Robots-Tag: noindex` so the CMS never lands in Google.

---

## 4. Google Sign-In

In Google Cloud Console → Credentials → your OAuth client, add to
**Authorized JavaScript origins**:

```
https://your-site.vercel.app
```

While the consent screen is in *Testing*, only accounts listed under **Test
users** can sign in. Publish it to open sign-in to everyone.

---

## 5. Post-deploy checklist

```
[ ] https://your-api.onrender.com/health returns {"status":"ok","db":"connected"}
[ ] Public site loads and shows live gear (not the bundled fallback list —
    check the browser console for the "rendering fallback data" warning)
[ ] Register a customer, then sign in with Google
[ ] Make a booking and confirm it appears in /admin with status pending/unpaid
[ ] Sign in to /admin, upload a gear image, confirm it renders on the public site
[ ] Redeploy the backend, then check that image STILL renders (proves the disk works)
[ ] Run the seeder once: Render Shell -> pnpm seed
```

---

## 6. Rolling back

- **Vercel:** Deployments tab → any previous build → *Promote to Production*.
- **Render:** Events tab → *Rollback* to the previous deploy.
- Neither rolls back the database. Take an Atlas snapshot before schema changes.
