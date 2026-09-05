# Task: Fix Render Build Failure — Finish the Incomplete eSewa/Payment Removal

## Context

This is the **Yatriko Gears** repo. Read `AGENTS.md` at the repo root if you
haven't already loaded it this session.

eSewa was supposed to be fully removed from this backend (cash on delivery
only now), but the removal was only half-applied: `esewaConfig` was deleted
from `backend/src/config/AppConfig.ts`, but the `backend/src/modules/payment/`
folder that depends on it was never actually deleted. This breaks the
TypeScript build on Render (and would break `tsc` locally too):

```
src/modules/payment/EsewaService.ts(2,10): error TS2305: Module
'"../../config/AppConfig"' has no exported member 'esewaConfig'.
src/modules/payment/PaymentController.ts(4,10): error TS2305: Module
'"../../config/AppConfig"' has no exported member 'esewaConfig'.
```

## Task

1. **Delete the entire `backend/src/modules/payment/` folder** — all four
   files: `EsewaService.ts`, `PaymentController.ts`, `PaymentRoute.ts`,
   `PaymentDto.ts`. None of this should still exist.

2. **Unmount the payment route** in `backend/src/router/router.ts` — remove
   whatever line mounts it (e.g. `router.use("/payment", paymentRoute)`) and
   its corresponding import. Confirm nothing else in `router.ts` still
   imports from the deleted `payment/` folder.

3. **Search the whole `backend/src` tree** (case-insensitive) for any other
   remaining references to `esewa`, `Esewa`, or `ESEWA` — config files,
   `.env.example`, `render.yaml`, `DEPLOYMENT.md` — and remove them. The goal
   is zero references left anywhere, not just enough to make the build pass.
   Do not remove the legitimate `paymentStatus` field on `BookingModel`/
   `BookingController` (unpaid/paid/refunded) — that's unrelated to eSewa and
   still needed for cash-on-delivery tracking.

4. **Run `pnpm build` inside `backend/` locally (or `make check` across all
   three apps) and confirm it passes clean** before considering this done —
   don't just fix the two reported errors and stop; if another file
   references something else that got removed during the original eSewa
   cleanup, catch it now rather than leaving it for the next deploy attempt.

## Constraints

- Backend-only change. Don't touch frontend/admin unless `make check` surfaces
  a real reference there too (unlikely, but check rather than assume).
- Don't reintroduce any eSewa config, types, or env vars — this is strictly
  cleanup of dead code, not a partial restoration.
- pnpm only.

## Deliverable

`pnpm build` (and ideally full `make check`) passes with zero errors, with
every trace of the `payment`/eSewa module gone from the codebase — not just
the two files the build error currently points at.
