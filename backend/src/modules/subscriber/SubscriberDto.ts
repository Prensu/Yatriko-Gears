import { z } from "zod"

export const SubscriberCreateDTO = z.object({
  email: z.string().email("Enter a valid email to claim the offer"),
  source: z.string().max(60).optional().default("lead-capture-modal"),
})
