import { z } from "zod"
import { parseMaybeJson } from "../../utilities/helpers"

export const PackageCreateDTO = z.object({
  name: z.string().min(2, "Name must have atleast 2 character").max(120),
  price: z.coerce.number().min(0),
  items: z.preprocess(parseMaybeJson, z.array(z.string()).min(1, "Add at least one item")),
  description: z.string().max(2000).optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
})

export const PackageUpdateDTO = PackageCreateDTO.partial()
