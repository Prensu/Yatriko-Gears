import { z } from "zod"

export const EsewaInitiateDTO = z.object({
  bookingId: z.string().min(1, "bookingId is compulsory"),
})

/** The base64 `data` blob eSewa appends to success_url. */
export const EsewaVerifyDTO = z.object({
  data: z.string().min(1, "Missing eSewa response payload"),
})
