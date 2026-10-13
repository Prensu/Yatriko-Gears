# Yatriko Gears — mobile app (Expo / React Native)

Customer app for Android and iOS. It talks **directly to the existing backend**
(`/api/v1`) and changes nothing on the server. Same rules as the web app:
prices are computed server-side, bookings are cash-on-delivery, every response
is Zod-validated.

Separate pnpm project, like `frontend/`, `admin/` and `backend/`. Not a workspace.

## Run it

```bash
cd mobile
pnpm install
cp .env.sample .env        # then edit EXPO_PUBLIC_API_BASE_URL
pnpm start                 # scan the QR code with Expo Go
```

`localhost` does not work on a real phone. Use your PC's LAN IP, for example
`http://192.168.1.10:9005`, with phone and PC on the same Wi-Fi. Android
emulator: `http://10.0.2.2:9005`. Or point it at the deployed Render API.

Backend CORS does not apply to native apps, so no backend change is needed.

## What works in Expo Go vs a dev build

| Feature | Expo Go | Dev build |
|---|---|---|
| Browse, gear detail, cart, booking, bookings, chat, contact | yes | yes |
| Email sign-in / register / reset | yes | yes |
| Google sign-in | no (button hidden) | yes |

Dev/test builds: `npx eas-cli@latest build --profile development --platform android`.

## Google sign-in setup

1. Use the **same Web OAuth client id** as backend `GOOGLE_CLIENT_ID` in
   `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (the backend checks the token audience).
2. In Google Cloud, create an **Android** OAuth client (package name + SHA-1 of
   your build) and, for iOS, an iOS client; put the reversed iOS client id in
   `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`.
3. Rebuild the dev/production build (config plugin runs at build time).

## Structure

```
src/app/        Expo Router screens (tabs: Home, Browse, Assistant, Bookings, Account)
src/api/        one function per endpoint, Zod-validated (same as frontend/src/api)
src/types/      copied from frontend/src/types: keep in sync with the backend
src/lib/api.ts  axios + envelope unwrapping + silent token refresh
src/lib/session.ts  tokens in expo-secure-store (keychain/keystore)
src/context/    Auth, Cart (AsyncStorage), Toast
src/hooks/      TanStack Query hooks (catalogue, bookings with optimistic cancel)
```

## Rules

- pnpm only. Add native libs with `npx expo install <pkg>`, not `pnpm add`.
- Add a backend field -> update `src/types/` (and the web types) or parsing fails.
- Env vars are read only in `src/config.ts` / `app.config.ts`. Everything
  `EXPO_PUBLIC_*` ships inside the app: never put secrets there.
- Before finishing: `pnpm typecheck` and `npx expo-doctor`.

## Not in v1

Online payment (backend is cash-only), push notifications (no backend endpoint
yet), blog, rental-terms page, admin (stays on the web).
