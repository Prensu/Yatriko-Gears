import type { FunctionDeclaration } from "@google/genai"
import { z } from "zod"
import GearModel from "../gear/GearModel"
import CategoryModel from "../category/CategoryModel"
import PackageModel from "../package/PackageModel"
import DestinationModel from "../destination/DestinationModel"
import SettingsModel from "../settings/SettingsModel"
import { getAvailability } from "../booking/AvailabilityService"
import { calculateSubtotal, calculateTotal, type PricedItem } from "../booking/BookingPricing"
import { escapeRegex } from "../../utilities/query"

const TIME_ZONE = "Asia/Kathmandu"
const MAX_RESULTS = 8

/** Facts that are not represented in the current settings document. */
export const CHAT_STATIC_SHOP_INFO = {
  shopName: "Yatriko Gears",
  tagline: "Rent the Best, Trek with Confidence",
  location: "Gabu, Khokana, Lalitpur, Nepal",
  phone: ["+977 9747672039", "+977 9747672040"],
  email: "yatrikogears1234@gmail.com",
  socials: {
    facebook: "facebook.com/yatrikoGears",
    instagram: "@yatriko_gears",
    tiktok: "@yatrikogears",
  },
  deliveryNote: "We deliver within the valley — call or WhatsApp us to arrange it.",
  bookingInstructions: "Call or WhatsApp us, or send a DM on Instagram or Facebook.",
  openingOffer: {
    headline: "Grand Opening Offer",
    details: "on every rental gear — 21 to 31 Shrawan. Drop your email and claim the deal.",
  },
} as const

const searchGearArgs = z.object({
  query: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  mode: z.enum(["rent", "sale"]).optional(),
  maxPricePerNight: z.number().finite().min(0).max(1_000_000).optional(),
})

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  }, "Date is not valid")

export const checkAvailabilityArgs = z
  .object({
    gearSlug: z.string().trim().min(1).max(160),
    startDate: dateString,
    endDate: dateString,
    quantity: z.number().int().min(1).max(100).optional().default(1),
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "endDate must be on or after startDate" })
    }

    if (value.startDate < kathmanduToday()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "startDate cannot be in the past" })
    }
  })

const estimateRentalCostArgs = z.object({
  items: z
    .array(z.object({ gearSlug: z.string().trim().min(1).max(160), quantity: z.number().int().min(1).max(100) }))
    .min(1)
    .max(MAX_RESULTS),
  nights: z.number().int().min(1).max(365),
})

type ToolResult = Record<string, unknown>

function kathmanduToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}`
}

function asUtcDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function errorResult(error: unknown): ToolResult {
  if (error instanceof z.ZodError) {
    return { error: error.issues[0]?.message ?? "Invalid tool arguments" }
  }
  return { error: "The requested information is temporarily unavailable." }
}

function toGearResult(gear: {
  name: string
  slug: string
  discountedPrice: number
  realPrice: number
  salePrice?: number | null
  availableFor: string[]
  colors: string[]
  quantityTotal?: number
}) {
  return {
    name: gear.name,
    slug: gear.slug,
    rentalPricePerNight: gear.discountedPrice,
    ...(gear.realPrice > gear.discountedPrice ? { regularRentalPricePerNight: gear.realPrice } : {}),
    ...(typeof gear.salePrice === "number" ? { salePrice: gear.salePrice } : {}),
    availableFor: gear.availableFor,
    colors: gear.colors,
    inStock: (gear.quantityTotal ?? 0) > 0,
  }
}

export async function searchGear(rawArgs: unknown): Promise<ToolResult> {
  try {
    const args = searchGearArgs.parse(rawArgs ?? {})
    const filter: Record<string, unknown> = { status: "active" }
    if (args.mode) filter.availableFor = args.mode
    if (args.query) {
      const escaped = escapeRegex(args.query)
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ]
    }
    if (args.category) {
      const category = await CategoryModel.findOne({
        $or: [{ slug: args.category }, { name: { $regex: escapeRegex(args.category), $options: "i" } }],
        status: "active",
      })
      if (!category) return { items: [] }
      filter.category = category._id
    }

    const gear = await GearModel.find(filter)
    const items = gear
      .filter((item) => args.maxPricePerNight === undefined || item.discountedPrice <= args.maxPricePerNight)
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, MAX_RESULTS)
      .map(toGearResult)
    return { items }
  } catch (error) {
    return errorResult(error)
  }
}

export async function checkAvailability(rawArgs: unknown): Promise<ToolResult> {
  try {
    const args = checkAvailabilityArgs.parse(rawArgs ?? {})
    const gear = await GearModel.findOne({ slug: args.gearSlug, status: "active" })
    if (!gear || !gear.availableFor.includes("rent")) return { error: "That rental gear was not found." }

    const availability = await getAvailability([String(gear._id)], asUtcDate(args.startDate), asUtcDate(args.endDate))
    const info = availability.get(String(gear._id))
    if (!info) return { error: "That rental gear was not found." }

    return {
      available: info.quantityAvailable >= (args.quantity ?? 1),
      unitsFree: info.quantityAvailable,
    }
  } catch (error) {
    return errorResult(error)
  }
}

export async function getPackages(): Promise<ToolResult> {
  try {
    const packages = await PackageModel.find({ status: "active" })
    return {
      packages: packages.slice(0, MAX_RESULTS).map((item) => ({
        name: item.name,
        slug: item.slug,
        price: item.price,
        includedItems: item.items.slice(0, 20),
        description: item.description,
      })),
    }
  } catch (error) {
    return errorResult(error)
  }
}

export async function getShopInfo(): Promise<ToolResult> {
  try {
    const settings = await SettingsModel.findOne()
    return {
      ...CHAT_STATIC_SHOP_INFO,
      openingOffer: settings
        ? {
            headline: settings.leadModalHeadline,
            details: settings.leadModalBody,
          }
        : CHAT_STATIC_SHOP_INFO.openingOffer,
    }
  } catch (error) {
    return errorResult(error)
  }
}

export async function getCampingSpots(): Promise<ToolResult> {
  try {
    const destinations = await DestinationModel.find({ status: "active" })
    return {
      spots: destinations.slice(0, MAX_RESULTS).map((item) => ({ name: item.name, slug: item.slug, description: item.blurb })),
    }
  } catch (error) {
    return errorResult(error)
  }
}

export async function estimateRentalCost(rawArgs: unknown): Promise<ToolResult> {
  try {
    const args = estimateRentalCostArgs.parse(rawArgs ?? {})
    const gear = await GearModel.find({ slug: { $in: args.items.map((item) => item.gearSlug) }, status: "active" })
    const pricedItems: PricedItem[] = []
    const lines: Array<{ name: string; quantity: number; pricePerNight: number }> = []

    for (const requested of args.items) {
      const item = gear.find((candidate) => candidate.slug === requested.gearSlug)
      if (!item || !item.availableFor.includes("rent")) return { error: `Rental gear "${requested.gearSlug}" was not found.` }
      pricedItems.push({ mode: "rent", pricePerDay: item.discountedPrice, quantity: requested.quantity })
      lines.push({ name: item.name, quantity: requested.quantity, pricePerNight: item.discountedPrice })
    }

    const subtotal = calculateSubtotal(pricedItems, args.nights)
    return {
      estimate: true,
      nights: args.nights,
      items: lines,
      subtotal,
      total: calculateTotal(subtotal),
      note: "Delivery is discussed separately over WhatsApp.",
    }
  } catch (error) {
    return errorResult(error)
  }
}

export const chatFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: "searchGear",
    description: "Search the live active Yatriko Gears catalogue and return current discounted rental and sale prices.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        mode: { type: "string", enum: ["rent", "sale"] },
        maxPricePerNight: { type: "number", minimum: 0 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "checkAvailability",
    description: "Check live rental availability for one gear item and a date range.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        gearSlug: { type: "string" },
        startDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        endDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        quantity: { type: "integer", minimum: 1 },
      },
      required: ["gearSlug", "startDate", "endDate"],
      additionalProperties: false,
    },
  },
  {
    name: "getPackages",
    description: "List the live active Yatriko Gears rental bundles and their included items.",
    parametersJsonSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "getShopInfo",
    description: "Return Yatriko Gears contact, location, delivery, offer and booking information.",
    parametersJsonSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "getCampingSpots",
    description: "List active camping destinations in the Yatriko Gears catalogue.",
    parametersJsonSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "estimateRentalCost",
    description: "Estimate rental cost using live discounted gear prices; delivery is separate.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          minItems: 1,
          maxItems: MAX_RESULTS,
          items: {
            type: "object",
            properties: { gearSlug: { type: "string" }, quantity: { type: "integer", minimum: 1 } },
            required: ["gearSlug", "quantity"],
            additionalProperties: false,
          },
        },
        nights: { type: "integer", minimum: 1, maximum: 365 },
      },
      required: ["items", "nights"],
      additionalProperties: false,
    },
  },
]

const handlers: Record<string, (args: unknown) => Promise<ToolResult>> = {
  searchGear,
  checkAvailability,
  getPackages: () => getPackages(),
  getShopInfo: () => getShopInfo(),
  getCampingSpots: () => getCampingSpots(),
  estimateRentalCost,
}

export async function executeChatTool(name: string, args: unknown): Promise<ToolResult> {
  const handler = handlers[name]
  if (!handler) return { error: "That assistant tool is not available." }
  try {
    return await handler(args)
  } catch {
    return { error: "The requested information is temporarily unavailable." }
  }
}
