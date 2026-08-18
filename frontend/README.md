# Yatriko Gears — Frontend

Vite + React 18 + TypeScript (strict) + Tailwind CSS + Zod + pnpm.

> "Rent the Best, Trek with Confidence." — Gabu, Khokana, Lalitpur, Nepal

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm dev        # http://localhost:5173 (proxies /api -> http://localhost:8000)
pnpm build      # type-check + production build
```

## Architecture

```
src/
  api/          # one file per backend feature module (gear, forms, ...)
  lib/api.ts    # typed fetch wrapper: unwraps {data,message,meta}, Zod-validates,
                # sends Bearer token from localStorage (ready for the admin CMS)
  lib/fallbackData.ts  # official price list; renders the site before the API is live
  types/        # Zod schemas = single source of truth for models + form DTOs
  components/
    layout/     # Header, Footer (mountain silhouette), WhatsAppFloat
    home/       # Hero, GearGrid, PackageBand, SpotsSection, BrandMarquee, InstaFeed, ContactSection
    gear/       # GearCard
    modal/      # LeadCaptureModal (15% off, portal + localStorage cooldown)
  pages/        # HomePage, GearPage, PortfolioPage, ContactPage, NotFoundPage
  assets/
    gear/       # product images
    brands/     # logo marquee — drop logos here, zero code changes
    spots/      # camping spot photos
    insta/      # (optional) IG feed images
```

## Backend contract (per BACKEND_CONVENTIONS.md)

- Base path `/api/v1`, envelope `{ data, message, meta }`, errors `{ code, message, detail? }`.
- Endpoints consumed: `GET /gear`, `GET /gear/:slug`, `GET /package`, `GET /destination`,
  `GET /video`, `POST /contact`, `POST /subscriber`.
- All payloads validated client-side with the same Zod schemas you can mirror in backend DTOs.

## CMS-ready

- `lib/api.ts` already attaches `Authorization: Bearer <token>` from
  `localStorage["yatriko.accessToken"]`.
- Mount admin routes under `/admin` in `App.tsx`; reuse the Zod schemas in `types/` for forms.

## Media strategy

- **Images**: local `src/assets/**` (imported, hashed by Vite).
- **Videos**: Cloudinary URLs served from `GET /api/v1/video` (or hardcode in
  `pages/PortfolioPage.tsx` `LOCAL_VIDEOS` until the backend ships).
