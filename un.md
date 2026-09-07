# Task: Move gear/category/destination/user image uploads from local disk to Cloudinary

## Context / why

This backend (Express + TypeScript + Mongoose) currently stores uploaded
images (gear, category, destination, user avatar, site settings) on **local
disk** via `multer`, then serves them at `/images/...` via
`express.static("./public/uploads/")`. Render's web service filesystem is
**ephemeral** — every deploy/restart wipes `./public/uploads/`, so every
image uploaded through the admin panel eventually 404s in production. This
already happened once and was partially fixed by a one-off DB script, but
the underlying upload pipeline still writes to local disk, so it will keep
happening on every future upload.

**Videos already solve this correctly** — `modules/video/VideoController.ts`
signs a Cloudinary upload request server-side, the **admin frontend uploads
the file directly to Cloudinary from the browser**, then calls the backend
only to register the resulting `cloudinaryUrl` + `publicId` in Mongo. Do the
same thing for images, reusing the existing Cloudinary account (already
configured — see `config/cloudinaryConfig.ts` / `AppConfig.ts`
`cloudinaryConfig`). The Cloudinary account already has folders for this at
`yatriko/images/gear/`, `yatriko/images/brands/`, `yatriko/images/spots/`,
etc. — mirror that folder structure by upload type (see mapping below).

## Current pipeline (to be replaced)

- `backend/src/middlewares/UploaderMiddleware.ts` — `multer.diskStorage`
  writing to `./public/uploads/<dir>/`, exported as `uploader(dir)`.
- `backend/src/middlewares/ImageOptimizeMiddleware.ts` —
  `optimizeImage(maxWidth)`, runs after `uploader().single("image")`,
  re-encodes the file **on disk** with `sharp` (resize + recompress),
  writing back to the same path.
- `backend/src/utilities/helpers.ts` — `mapImage(file, dir)` builds the
  stored sub-document: `{ url: appConfig.imagePath + dir + file.filename,
path: file.destination, filename: file.filename, size: file.size,
mimeType: file.mimetype }`.
- `backend/src/utilities/commonSchema.ts` — `ImageSchema` used by
  `GearModel`, `CategoryModel`, `DestinationModel`, `UserModel`,
  `SettingsModel`: `{ url, path, filename, size, mimeType }`. **Keep this
  shape unchanged** — only what populates `url`/`path`/etc. changes.
- Routes wired to `uploader(...)`:
  - `modules/gear/GearRoute.ts` — `uploader("/gear").single("image")` on
    `POST /` and `PUT /:slug`, followed by `optimizeImage(1200)`.
  - `modules/category/CategoryRoute.ts`
  - `modules/destination/DestinationRoute.ts`
  - `modules/settings/SettingsRoute.ts`
  - `modules/auth/AuthRoute.ts` (user avatar)
- `backend/src/app.ts` line ~105:
  `app.use("/images", express.static(path.resolve("./public/uploads/")))`.

## What to build

### 1. Backend: add a signed-upload endpoint per resource (mirrors `VideoController`)

Look at `modules/video/VideoController.ts`'s existing signature endpoint —
it does `cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret)`
and returns `{ timestamp, signature, cloudName, apiKey, folder, uploadUrl }`
for the frontend to POST directly to Cloudinary. Add an equivalent signed
endpoint the admin can call before uploading an image, parameterized by
folder, e.g. `GET /api/v1/uploads/sign?folder=gear` →

```json
{ "timestamp": ..., "signature": "...", "cloudName": "...", "apiKey": "...", "folder": "yatriko/images/gear", "uploadUrl": "https://api.cloudinary.com/v1_1/<cloud>/image/upload" }
```

Folder mapping (match the existing Cloudinary structure already in use):

- gear → `yatriko/images/gear`
- category → `yatriko/images/brands` (categories currently reuse the
  "brands" folder in Cloudinary — confirm with me if unsure, otherwise use
  `yatriko/images/categories` and I'll move the account structure to match)
- destination → `yatriko/images/spots`
- user avatar → `yatriko/images/users`
- settings (site logo etc.) → `yatriko/images/settings`

This can be one shared controller/route (`modules/uploads/UploadRoute.ts`)
rather than duplicating the signing logic five times — accept a `folder`
query param validated against an allow-list of the five folders above so a
client can't sign an arbitrary/malicious folder.

### 2. Backend: replace `mapImage` usage with Cloudinary response mapping

Once the frontend uploads directly to Cloudinary and gets back Cloudinary's
response (`secure_url`, `public_id`, `bytes`, `format`, etc.), the existing
`POST`/`PUT` endpoints for gear/category/destination/settings/user no
longer receive a multipart file — they receive the Cloudinary result fields
in the JSON body instead (similar to how `VideoDto.ts` requires
`cloudinaryUrl` + `publicId` in the body). Update each affected
`*Dto.ts` and controller:

- Remove `uploader(...).single("image")` and `optimizeImage(...)` from the
  five routes listed above.
- Each `*Dto.ts` (`GearCreateDTO`/`GearUpdateDTO`, category/destination/
  settings/user equivalents) should accept optional
  `imageUrl: z.string().url().optional()` and
  `imagePublicId: z.string().optional()` in the JSON body instead of a file.
- Replace `mapImage(req.file, dir)` calls with a small new helper, e.g.
  `mapCloudinaryImage({ url, publicId }) → { url, path: publicId, filename:
publicId.split("/").pop(), size: undefined, mimeType: undefined }` — keep
  it filling the same `ImageSchema` shape so nothing downstream (API
  serializers, frontend types) needs to change.
- On delete/replace, mirror what `VideoController.ts` already does on
  delete: call `cloudinary.uploader.destroy(publicId)` to clean up the old
  asset, wrapped the same non-critical way (log + continue, don't fail the
  request if Cloudinary cleanup errors).

### 3. Frontend (admin app): direct-to-Cloudinary upload, like the video uploader

Find wherever the admin's video upload flow already implements
"get a signature from our backend, then PUT/POST the file straight to
Cloudinary's REST API, then send the resulting URL to our backend" (search
`admin/src` for wherever it calls whatever endpoint your video signing
route is at, and the corresponding Cloudinary POST). Copy that pattern for
the five image upload forms (gear, category, destination, settings, user
avatar) instead of their current plain `<input type="file">` +
multipart-to-our-backend flow. After a successful Cloudinary upload, submit
the create/update form with `imageUrl` + `imagePublicId` in the JSON body
instead of a `FormData` file field.

### 4. Cleanup (only after the above is verified working)

- `middlewares/UploaderMiddleware.ts`, `middlewares/ImageOptimizeMiddleware.ts`,
  and the `mapImage` helper become unused for images. **Do not delete them
  yet** if `modules/auth` still needs local avatar upload for some other
  reason — check first. If genuinely unused everywhere, remove them and
  the `sharp`/`multer` deps if nothing else in the codebase needs them
  (grep first — don't assume).
- `app.use("/images", express.static(...))` in `app.ts` can stay for now
  (harmless, serves nothing once nothing writes there) or be removed once
  confirmed nothing depends on it.

## Constraints

- Don't touch `modules/video/*` — it's already correct, just the reference
  pattern to copy.
- Don't change `ImageSchema`'s shape (`{ url, path, filename, size,
mimeType }`) — only what populates those fields changes, so the frontend
  types (`Gear`, `Category`, etc. in `frontend/src/types` and
  `admin/src/types`) don't need schema changes, only the upload flow does.
- Keep the Cloudinary API secret server-side only (in the signing endpoint),
  same as the video flow already does — never expose
  `CLOUDINARY_API_SECRET` to the frontend.
- `pnpm typecheck` and `pnpm build` must pass in both `backend/` and
  `admin/` with zero new errors when done.

## Acceptance criteria

- Uploading a new gear image through the admin panel results in a Cloudinary
  URL (e.g. `https://res.cloudinary.com/dothc374l/image/upload/.../yatriko/images/gear/...`)
  being stored in Mongo's `gears.image.url`, not a `localhost` or
  `onrender.com/images/...` URL.
- That image survives a full backend redeploy/restart (proving it's no
  longer on local disk).
- Same behavior verified for category, destination, settings, and user
  avatar uploads.
- Deleting a gear/category/destination/user (or replacing its image) also
  removes the old asset from Cloudinary via `cloudinary.uploader.destroy`.
