import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../modules/gear/GearModel", () => ({ default: { find: vi.fn(), findOne: vi.fn() } }))
vi.mock("../modules/category/CategoryModel", () => ({ default: { findOne: vi.fn() } }))
vi.mock("../modules/package/PackageModel", () => ({ default: { find: vi.fn() } }))
vi.mock("../modules/destination/DestinationModel", () => ({ default: { find: vi.fn() } }))
vi.mock("../modules/settings/SettingsModel", () => ({ default: { findOne: vi.fn() } }))
vi.mock("../modules/booking/AvailabilityService", () => ({ getAvailability: vi.fn() }))

import GearModel from "../modules/gear/GearModel"
import PackageModel from "../modules/package/PackageModel"
import DestinationModel from "../modules/destination/DestinationModel"
import SettingsModel from "../modules/settings/SettingsModel"
import { getAvailability } from "../modules/booking/AvailabilityService"
import {
  checkAvailability,
  estimateRentalCost,
  executeChatTool,
  getCampingSpots,
  getPackages,
  getShopInfo,
  searchGear,
} from "../modules/chat/chatTools"

const gearFind = vi.mocked(GearModel.find)
const gearFindOne = vi.mocked(GearModel.findOne)
const packageFind = vi.mocked(PackageModel.find)
const destinationFind = vi.mocked(DestinationModel.find)
const settingsFindOne = vi.mocked(SettingsModel.findOne)
const availability = vi.mocked(getAvailability)

function gear(index: number) {
  return {
    _id: `gear-${index}`,
    name: `Gear ${index}`,
    slug: `gear-${index}`,
    discountedPrice: 100 + index,
    realPrice: 150 + index,
    salePrice: null,
    availableFor: ["rent"],
    colors: ["green"],
    quantityTotal: 2,
  }
}

describe("chat tools", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    gearFind.mockResolvedValue([])
    gearFindOne.mockResolvedValue(null)
    packageFind.mockResolvedValue([])
    destinationFind.mockResolvedValue([])
    settingsFindOne.mockResolvedValue(null)
    availability.mockResolvedValue(new Map())
  })

  it("returns live gear with a result cap and no internal fields", async () => {
    gearFind.mockResolvedValue(Array.from({ length: 10 }, (_, index) => gear(index)))
    const result = await searchGear({ mode: "rent" })
    const items = result.items as Array<Record<string, unknown>>

    expect(items).toHaveLength(8)
    expect(items[0]).toMatchObject({ name: "Gear 0", rentalPricePerNight: 100, inStock: true })
    expect(items[0]).not.toHaveProperty("_id")
    expect(gearFind).toHaveBeenCalledWith({ status: "active", availableFor: "rent" })
  })

  it("returns empty search results and safe validation errors", async () => {
    expect(await searchGear({ query: "not stocked" })).toEqual({ items: [] })
    expect(await searchGear({ maxPricePerNight: -1 })).toEqual({ error: "Number must be greater than or equal to 0" })
  })

  it("uses the real availability service and Kathmandu date validation", async () => {
    const item = gear(1)
    gearFindOne.mockResolvedValue(item)
    availability.mockResolvedValue(
      new Map([["gear-1", { gearId: "gear-1", name: item.name, quantityTotal: 2, quantityBooked: 2, quantityAvailable: 0 }]]),
    )

    await expect(checkAvailability({ gearSlug: item.slug, startDate: "2099-01-05", endDate: "2099-01-06", quantity: 1 })).resolves.toEqual({ available: false, unitsFree: 0 })
    expect(availability).toHaveBeenCalledWith(["gear-1"], expect.any(Date), expect.any(Date))
    await expect(checkAvailability({ gearSlug: item.slug, startDate: "2000-01-05", endDate: "2000-01-06" })).resolves.toEqual({ error: "startDate cannot be in the past" })
    await expect(checkAvailability({ gearSlug: item.slug, startDate: "2099-01-06", endDate: "2099-01-05" })).resolves.toEqual({ error: "endDate must be on or after startDate" })
  })

  it("caps package and camping spot results", async () => {
    packageFind.mockResolvedValue(Array.from({ length: 10 }, (_, index) => ({ name: `Package ${index}`, slug: `package-${index}`, price: index, items: [], description: "" })))
    destinationFind.mockResolvedValue(Array.from({ length: 10 }, (_, index) => ({ name: `Spot ${index}`, slug: `spot-${index}`, blurb: "" })))
    expect((await getPackages()).packages).toHaveLength(8)
    expect((await getCampingSpots()).spots).toHaveLength(8)
  })

  it("returns settings-backed shop info and estimates with booking pricing", async () => {
    settingsFindOne.mockResolvedValue({ leadModalHeadline: "Current offer", leadModalBody: "Ask us today." })
    gearFind.mockResolvedValue([gear(1)])
    const shop = await getShopInfo()
    expect(shop.openingOffer).toEqual({ headline: "Current offer", details: "Ask us today." })

    const estimate = await estimateRentalCost({ items: [{ gearSlug: "gear-1", quantity: 2 }], nights: 3 })
    expect(estimate).toMatchObject({ estimate: true, subtotal: 606, total: 606 })
  })

  it("returns tool failures as JSON instead of throwing", async () => {
    expect(await executeChatTool("missingTool", {})).toEqual({ error: "That assistant tool is not available." })
    gearFind.mockRejectedValue(new Error("database offline"))
    expect(await executeChatTool("searchGear", {})).toEqual({ error: "The requested information is temporarily unavailable." })
  })
})
