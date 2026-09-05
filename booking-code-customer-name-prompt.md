# Task: Include Customer Name in the Booking Reference Code

## Context

This is the **Yatriko Gears** repo. Read `AGENTS.md` at the repo root if not
already loaded this session.

Booking codes are currently generated in
`backend/src/modules/booking/BookingController.ts`:

```ts
/** YG-250819-4F2A — short enough to read out on the phone. */
function makeBookingCode(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "")
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `YG-${stamp}-${random}`
}
```

Goal: change this so the code includes the customer's name, e.g.
`PRASHNA-260905-51F9` instead of `YG-260905-4F2A`.

`code` has a **unique** constraint in `BookingModel.ts` — the random suffix
must stay to guarantee uniqueness even when multiple bookings share a first
name or the same customer books more than once. Do not remove or shorten the
random component to make room for the name.

## Task

1. Update `makeBookingCode()` to accept the customer's name as a parameter:
   ```ts
   function makeBookingCode(customerName: string): string {
     const namePart = customerName
       .trim()
       .split(/\s+/)[0] // first name only — keeps codes short and readable on the phone
       .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents/diacritics
       .replace(/[^a-zA-Z]/g, "") // letters only — no numbers, spaces, punctuation
       .toUpperCase()
       .slice(0, 10) // cap length so the code doesn't get unwieldy for long names

     const fallback = "GUEST" // used if the name has no usable characters at all (e.g. empty, or entirely non-Latin script)
     const prefix = namePart.length > 0 ? namePart : fallback

     const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "")
     const random = Math.random().toString(36).slice(2, 6).toUpperCase()
     return `${prefix}-${stamp}-${random}`
   }
   ```
   (Adjust exact formatting/length limits if you think a different tradeoff
   reads better — the important constraints are: keep the random suffix,
   handle empty/non-Latin names gracefully with a fallback, and don't let a
   very long name produce an ugly, hard-to-read-aloud code.)

2. Update the call site in `createBooking` to pass the customer's name:
   ```ts
   code: makeBookingCode(body.customerName),
   ```
   (Confirm the exact field name the DTO uses for the customer's name —
   likely `customerName`, matching `BookingModel.customerName` — and use
   that.)

3. **Search the codebase for anywhere that assumes the old `YG-` prefix
   format** — e.g. a regex validating booking codes, a display format check,
   or (if the earlier Instagram DM confirmation work has been implemented)
   the reference-code-matching regex in the Instagram webhook handler. Update
   any such pattern to match the new name-prefixed format instead of
   assuming a fixed `YG-` prefix. If nothing currently validates the code's
   shape beyond storing/displaying it as an opaque string, no further changes
   are needed.

4. Update the doc comment above the function to reflect the new example
   format, e.g.:
   ```ts
   /** PRASHNA-260905-4F2A — first name + date + random, short enough to read out on the phone. */
   ```

## Constraints

- Backend-only change, single function plus its one call site (plus the
  regex-search step above if applicable).
- Do not change the `code` field's type or the unique index in
  `BookingModel.ts` — this only changes what string gets generated.
- pnpm only.
- Run relevant backend tests/typecheck (`make check` or at least the backend
  portion) when done.

## Deliverable

New bookings get a reference code like `PRASHNA-260905-51F9` instead of
`YG-260905-4F2A`, remains globally unique, and degrades gracefully (falls
back to something like `GUEST-260905-51F9`) for names with no usable Latin
characters.
