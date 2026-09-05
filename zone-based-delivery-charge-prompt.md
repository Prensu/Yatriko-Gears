# Task: Zone-Based Delivery Charge (Inside vs. Outside Kathmandu Valley)

## Context

This is the **Yatriko Gears** repo. Read `AGENTS.md` at the repo root before
writing any code.

Delivery charge is currently hardcoded to `0` everywhere —
`backend/src/modules/booking/BookingPricing.ts` has:

```ts
/** Delivery is free inside the valley; a field so it can change later. */
export const DELIVERY_CHARGE = 0;
```

The cart/checkout UI (`frontend/src/pages/CartPage.tsx`) shows a static
"Free" delivery line for every order, regardless of where the customer is.

Real delivery cost differs: **free inside Kathmandu Valley, a flat charge
outside it.** The customer will explicitly choose their zone at checkout —
do not attempt to infer it from the free-text delivery address; that's
unreliable and out of scope here.

## Backend changes

### 1. `BookingPricing.ts`

Replace the single constant with a zone-keyed one:

```ts
export const DELIVERY_CHARGES = {
  insideValley: 85,
  outsideValley: 250, // placeholder — confirm the real number with the business owner before shipping
} as const;

export type DeliveryZone = keyof typeof DELIVERY_CHARGES;
```

Update `calculateTotal` (and any other function referencing the old
`DELIVERY_CHARGE` constant) to accept a `DeliveryZone` and look up the charge
from `DELIVERY_CHARGES`, rather than taking a raw number with a default of 0.

### 2. `BookingModel.ts`

Add a `deliveryZone: { type: String, enum: ["insideValley", "outsideValley"],
required: true }` field alongside the existing `deliveryAddress` and
`deliveryCharge` fields. Keep `deliveryCharge` as-is (still stores the
resolved number for that specific booking, for historical accuracy even if
the rate changes later) — it just now gets its value from
`DELIVERY_CHARGES[deliveryZone]` instead of always being `0`.

### 3. `BookingDto.ts`

Add `deliveryZone: z.enum(["insideValley", "outsideValley"])` as a required
field on the booking-create schema.

### 4. `BookingController.ts`

- Read `body.deliveryZone` from the request.
- Compute `deliveryCharge` from `DELIVERY_CHARGES[body.deliveryZone]` instead
  of the old flat import.
- Store `deliveryZone` on the created booking.
- Update the confirmation email/receipt text to mention the delivery charge
  when it's non-zero (currently the email template only mentions
  `deliveryAddress` — add the charge/zone into that message so the shop
  owner sees it when confirming by phone, and so the customer's email/receipt
  is accurate).

## Frontend changes

### 1. `CartPage.tsx`

- Add a required zone selector at checkout — a simple two-option control
  (radio buttons or a segmented toggle, matching the existing form styling)
  labeled something like "Inside Kathmandu Valley" / "Outside Kathmandu
  Valley".
- Replace the hardcoded "Free" delivery line in the order summary with the
  actual computed charge based on the selected zone — `Rs. 0` for inside,
  the real charge for outside. Recompute the total live as the customer
  toggles the option, same as it already does when quantities/dates change.
- Include `deliveryZone` in the payload sent to `createBooking()`.
- Add client-side validation: booking can't be submitted without a zone
  selected (should be trivial if you default it to `insideValley` and just
  let the customer change it, rather than defaulting to nothing).

### 2. `types/index.ts` (frontend) and the corresponding Zod schema

Add `deliveryZone` to the booking type/schema so it round-trips correctly
through validation.

### 3. `MyBookingsPage.tsx`

Currently shows a static "Payment is collected in cash on delivery" line (see
screenshot context: no delivery charge is shown at all right now). Add a
delivery line showing the actual `deliveryCharge` for that booking — `Free`
when 0, `Rs. X (Outside Valley)` otherwise — so customers can see what they
were actually charged, consistent with how each gear line item already shows
its own price.

### 4. Admin — `BookingsPage.tsx`

Confirm the booking detail view shows `deliveryZone`/`deliveryCharge` per
booking so staff can see it without opening the raw database. Add if missing.

## Constraints

- pnpm only.
- Don't touch anything about the eSewa/payment cleanup work already in
  progress — this is unrelated. If `make check` was already failing before
  you start (from the incomplete eSewa removal), that's a separate, already-
  known issue — fix or work around it only if it blocks you from running the
  checks needed for this task, and mention it rather than silently leaving it.
- Keep the response envelope (`{ data, message, meta }`) and existing route
  pipeline conventions.
- Run `make check` (or at least `backend`'s and `frontend`'s relevant checks)
  before declaring done.

## Deliverable

At checkout, the customer picks Inside/Outside Kathmandu Valley, sees the
correct delivery charge (free vs. the flat outside-valley fee) reflected
live in the order total, and that same charge is visible afterward on their
"My Bookings" page and in the admin booking detail view.
