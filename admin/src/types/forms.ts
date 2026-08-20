import { z } from "zod"
import { statusSchema, type Status } from "@/types"

/**
 * Form schemas mirroring the backend DTOs (GearDto, CategoryDto, …) so the
 * CMS catches bad input before it costs a round-trip. Numeric inputs are held
 * as strings in React state and coerced here.
 */

/** Number input: "" is missing (not 0), and non-numeric text is a real error. */
function numberField(label: string) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return value
      const trimmed = value.trim()
      return trimmed === "" ? undefined : Number(trimmed)
    },
    z
      .number({
        required_error: `${label} is required`,
        invalid_type_error: `${label} must be a number`,
      })
      .min(0, `${label} cannot be negative`),
  )
}

/* ------------------------------------------------------------------ */
/* Gear — POST/PUT /gear (multipart, file field: image)                 */
/* ------------------------------------------------------------------ */

export const gearFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must have atleast 2 character").max(120, "Name is too long"),
    description: z.string().max(2000, "Description is too long"),
    realPrice: numberField("Real price"),
    discountedPrice: numberField("Discounted price"),
    availableFor: z
      .array(z.enum(["rent", "sale"]))
      .min(1, "Choose at least one of rent / sale"),
    colors: z.array(z.string()),
    specs: z.record(z.string()),
    // "" in the dropdown means "no category" — the API expects null.
    category: z
      .string()
      .transform((value) => (value.trim() === "" ? null : value)),
    quantityTotal: numberField("Stock"),
    isNew: z.boolean(),
    status: statusSchema,
  })
  .refine((values) => values.discountedPrice <= values.realPrice, {
    path: ["discountedPrice"],
    message: "Discounted price cannot exceed the real price",
  })

export type GearFormValues = z.infer<typeof gearFormSchema>

export type GearFormState = {
  name: string
  description: string
  realPrice: string
  discountedPrice: string
  availableFor: Array<"rent" | "sale">
  colors: string[]
  specs: Record<string, string>
  category: string
  quantityTotal: string
  isNew: boolean
  status: Status
}

export const emptyGearForm: GearFormState = {
  name: "",
  description: "",
  realPrice: "",
  discountedPrice: "",
  availableFor: ["rent"],
  colors: [],
  specs: {},
  category: "",
  quantityTotal: "1",
  isNew: false,
  status: "active",
}

/* ------------------------------------------------------------------ */
/* Category — POST/PUT /category (multipart, file field: image)         */
/* ------------------------------------------------------------------ */

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name must have atleast 2 character").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long"),
  status: statusSchema,
})
export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export type CategoryFormState = {
  name: string
  description: string
  status: Status
}

export const emptyCategoryForm: CategoryFormState = {
  name: "",
  description: "",
  status: "active",
}

/* ------------------------------------------------------------------ */
/* Package — POST/PUT /package (JSON: the route has no uploader)        */
/* ------------------------------------------------------------------ */

export const packageFormSchema = z.object({
  name: z.string().trim().min(2, "Name must have atleast 2 character").max(120, "Name is too long"),
  price: numberField("Price"),
  items: z.array(z.string()).min(1, "Add at least one item"),
  description: z.string().max(2000, "Description is too long"),
  status: statusSchema,
})
export type PackageFormValues = z.infer<typeof packageFormSchema>

export type PackageFormState = {
  name: string
  price: string
  items: string[]
  description: string
  status: Status
}

export const emptyPackageForm: PackageFormState = {
  name: "",
  price: "",
  items: [],
  description: "",
  status: "active",
}

/* ------------------------------------------------------------------ */
/* Destination — POST/PUT /destination (multipart, file field: image)   */
/* ------------------------------------------------------------------ */

export const destinationFormSchema = z.object({
  name: z.string().trim().min(2, "Name must have atleast 2 character").max(120, "Name is too long"),
  blurb: z.string().max(500, "Blurb is too long"),
  status: statusSchema,
})
export type DestinationFormValues = z.infer<typeof destinationFormSchema>

export type DestinationFormState = {
  name: string
  blurb: string
  status: Status
}

export const emptyDestinationForm: DestinationFormState = {
  name: "",
  blurb: "",
  status: "active",
}

/* ------------------------------------------------------------------ */
/* Video — POST /video (JSON, after the direct Cloudinary upload)       */
/* ------------------------------------------------------------------ */

export const videoFormSchema = z.object({
  title: z.string().trim().min(2, "Title must have atleast 2 character").max(160, "Title is too long"),
  category: z.string().trim().max(60, "Category is too long"),
})
export type VideoFormValues = z.infer<typeof videoFormSchema>

/* ------------------------------------------------------------------ */
/* Profile — PATCH /auth/me (multipart, file field: image)              */
/* ------------------------------------------------------------------ */

export const profileFormSchema = z.object({
  name: z.string().trim().min(2, "Name must have atleast 2 character").max(50, "Name is too long"),
  // Blank is allowed — not every account has a phone stored, and a missing
  // one must not block something unrelated like uploading an avatar.
  phone: z
    .string()
    .trim()
    .regex(/^(\+977[- ]?)?9\d{9}$/, "Enter a valid Nepali mobile number")
    .or(z.literal("")),
  address: z.string().max(200, "Address is too long"),
})
export type ProfileFormValues = z.infer<typeof profileFormSchema>

export type ProfileFormState = {
  name: string
  phone: string
  address: string
}

/* ------------------------------------------------------------------ */
/* Generic helper: validate + flatten Zod errors for form UIs           */
/* ------------------------------------------------------------------ */

export function validateForm<S extends z.ZodTypeAny>(
  schema: S,
  values: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; errors: Record<string, string> } {
  const parsed = schema.safeParse(values)
  if (parsed.success) return { ok: true, data: parsed.data }
  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "_form"
    if (!errors[key]) errors[key] = issue.message
  }
  return { ok: false, errors }
}
