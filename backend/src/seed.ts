/**
 * Seed script — run once with: pnpm seed
 * - Creates the admin user (from ADMIN_* env vars)
 * - Creates gear categories
 * - Upserts the full Yatriko price list (21 items)
 * - Upserts 5 popular camping destinations around Kathmandu
 * - Upserts the combo package
 * Safe to re-run: everything is upserted by slug/email.
 */
import "./config/mongodbConfig"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import UserModel from "./modules/user/UserModel"
import CategoryModel from "./modules/category/CategoryModel"
import GearModel from "./modules/gear/GearModel"
import DestinationModel from "./modules/destination/DestinationModel"
import PackageModel from "./modules/package/PackageModel"
import { adminSeedConfig } from "./config/AppConfig"
import { makeSlug } from "./utilities/helpers"
import { loggerFor } from "./config/logger"

const log = loggerFor("seed")

type SeedGear = {
  name: string
  realPrice: number
  discountedPrice: number
  category: string
  isNewArrival?: boolean
  availableFor?: Array<"rent" | "sale">
}

const GEAR: SeedGear[] = [
  { name: "Tent (3 Person)", realPrice: 800, discountedPrice: 650, category: "Tents & Shelter" },
  { name: "Tent (4 Person)", realPrice: 1000, discountedPrice: 800, category: "Tents & Shelter" },
  { name: "Canopy Tent", realPrice: 0, discountedPrice: 0, category: "Tents & Shelter", isNewArrival: true },
  { name: "Sleeping Bag", realPrice: 250, discountedPrice: 200, category: "Sleep & Comfort" },
  { name: "Mattress", realPrice: 70, discountedPrice: 50, category: "Sleep & Comfort" },
  { name: "Hammock", realPrice: 300, discountedPrice: 250, category: "Sleep & Comfort" },
  { name: "Multipurpose Stove with Gas", realPrice: 850, discountedPrice: 700, category: "Cooking & Stoves" },
  { name: "Multipurpose Stove", realPrice: 400, discountedPrice: 350, category: "Cooking & Stoves" },
  { name: "Large Gas", realPrice: 400, discountedPrice: 350, category: "Cooking & Stoves" },
  { name: "Portable Super Stove with Gas", realPrice: 1000, discountedPrice: 900, category: "Cooking & Stoves" },
  { name: "Portable Super Stove", realPrice: 250, discountedPrice: 200, category: "Cooking & Stoves" },
  { name: "Max Gas", realPrice: 850, discountedPrice: 750, category: "Cooking & Stoves" },
  { name: "Cookware (5 Items)", realPrice: 300, discountedPrice: 250, category: "Cooking & Stoves" },
  { name: "BBQ Stand", realPrice: 300, discountedPrice: 250, category: "Cooking & Stoves" },
  { name: "Foldable Chair", realPrice: 300, discountedPrice: 200, category: "Camp Furniture" },
  { name: "Foldable Table", realPrice: 350, discountedPrice: 250, category: "Camp Furniture" },
  { name: "Trekking Bag", realPrice: 250, discountedPrice: 200, category: "Trekking & Lighting" },
  { name: "Trekking Poles", realPrice: 900, discountedPrice: 900, category: "Trekking & Lighting", isNewArrival: true, availableFor: ["sale"] },
  { name: "Tent Light", realPrice: 200, discountedPrice: 150, category: "Trekking & Lighting" },
  { name: "Head Light", realPrice: 200, discountedPrice: 150, category: "Trekking & Lighting" },
  { name: "PowerBank", realPrice: 450, discountedPrice: 350, category: "Trekking & Lighting" },
]

const DESTINATIONS = [
  { name: "Jati Pokhari", blurb: "Serene highland pond \u2014 a hidden gem for overnight camps." },
  { name: "Hattiban", blurb: "Pine forest ridge with valley views, minutes from the city." },
  { name: "Champadevi", blurb: "Popular hiking peak on the valley rim \u2014 sunrise heaven." },
  { name: "Bhumdole", blurb: "Quiet countryside escape for starry-night campfires." },
  { name: "Pharping", blurb: "Culture, cliffs and camp spots on the valley's south edge." },
]

async function seed() {
  // Wait for the side-effect mongoose connection to be ready.
  await mongoose.connection.asPromise()

  // 1. Admin user
  if (!adminSeedConfig.password) {
    throw new Error("ADMIN_PASSWORD is not set in .env \u2014 cannot seed admin user")
  }
  const admin = await UserModel.findOneAndUpdate(
    { email: adminSeedConfig.email },
    {
      $setOnInsert: {
        name: adminSeedConfig.name,
        email: adminSeedConfig.email,
        password: bcrypt.hashSync(adminSeedConfig.password, 12),
        phone: adminSeedConfig.phone,
        role: "admin",
      },
    },
    { upsert: true, new: true },
  )
  log.info(`Admin ready: ${admin.email}`)

  // 2. Categories
  const categoryIds = new Map<string, mongoose.Types.ObjectId>()
  for (const name of new Set(GEAR.map((g) => g.category))) {
    const cat = await CategoryModel.findOneAndUpdate(
      { slug: makeSlug(name) },
      { $setOnInsert: { name, slug: makeSlug(name), status: "active", createdBy: admin._id, updatedBy: admin._id } },
      { upsert: true, new: true },
    )
    categoryIds.set(name, cat._id)
  }
  log.info(`Categories ready: ${categoryIds.size}`)

  // 3. Gear
  for (const item of GEAR) {
    await GearModel.findOneAndUpdate(
      { slug: makeSlug(item.name) },
      {
        $setOnInsert: {
          name: item.name,
          slug: makeSlug(item.name),
          realPrice: item.realPrice,
          discountedPrice: item.discountedPrice,
          availableFor: item.availableFor ?? ["rent"],
          category: categoryIds.get(item.category) ?? null,
          isNewArrival: item.isNewArrival ?? false,
          status: "active",
          createdBy: admin._id,
          updatedBy: admin._id,
        },
      },
      { upsert: true, new: true },
    )
  }
  log.info(`Gear ready: ${GEAR.length}`)

  // 4. Destinations
  for (const d of DESTINATIONS) {
    await DestinationModel.findOneAndUpdate(
      { slug: makeSlug(d.name) },
      {
        $setOnInsert: {
          name: d.name,
          slug: makeSlug(d.name),
          blurb: d.blurb,
          status: "active",
          createdBy: admin._id,
          updatedBy: admin._id,
        },
      },
      { upsert: true, new: true },
    )
  }
  log.info(`Destinations ready: ${DESTINATIONS.length}`)

  // 5. Combo package
  await PackageModel.findOneAndUpdate(
    { slug: "full-camping-combo" },
    {
      $setOnInsert: {
        name: "Full Camping Combo",
        slug: "full-camping-combo",
        price: 4300,
        items: [
          "Tent (4 Person)",
          "Sleeping Bag x2",
          "Mattress x2",
          "Multipurpose Stove with Gas",
          "Cookware (5 Items)",
          "Foldable Table",
          "Foldable Chair x2",
          "Tent Light",
        ],
        description: "Everything you need for a weekend escape \u2014 one bundle, one price.",
        status: "active",
        createdBy: admin._id,
        updatedBy: admin._id,
      },
    },
    { upsert: true, new: true },
  )
  log.info("Package ready: Full Camping Combo")

  await mongoose.disconnect()
  log.info("***** Seed complete *****")
}

seed().catch((error) => {
  log.error(error)
  process.exit(1)
})
