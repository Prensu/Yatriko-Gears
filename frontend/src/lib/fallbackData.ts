import type { Gear } from "@/types"

/**
 * Official Yatriko Gears price list (Rs.) — used as fallback until the
 * backend gear API is live, and as the seed data reference.
 */
export const FALLBACK_GEAR: Gear[] = [
  { _id: "1", name: "Tent — 3 Person", slug: "tent-3-person", realPrice: 800, discountedPrice: 650, availableFor: ["rent"], colors: [], specs: { capacity: "3 person" }, image: "tent-3-person.jpg", description: "Roomy 3-person dome tent.", isNew: false },
  { _id: "2", name: "Tent — 4 Person", slug: "tent-4-person", realPrice: 1000, discountedPrice: 800, availableFor: ["rent"], colors: [], specs: { capacity: "4 person" }, image: "tent-4-person.jpg", description: "Spacious 4-person dome tent.", isNew: false },
  { _id: "3", name: "Sleeping Bag", slug: "sleeping-bag", realPrice: 250, discountedPrice: 200, availableFor: ["rent"], colors: [], specs: {}, image: "sleeping-bag-himalaya.jpg", description: "Warm sleeping bag, Himalaya tested.", isNew: false },
  { _id: "4", name: "Multipurpose Stove with Gas", slug: "multipurpose-stove-with-gas", realPrice: 850, discountedPrice: 700, availableFor: ["rent"], colors: [], specs: {}, image: "max-gas.jpg", description: "", isNew: false },
  { _id: "5", name: "Multipurpose Stove", slug: "multipurpose-stove", realPrice: 400, discountedPrice: 350, availableFor: ["rent"], colors: [], specs: {}, image: "portable-super-stove.jpg", description: "", isNew: false },
  { _id: "6", name: "Large Gas (Yak Everest)", slug: "large-gas", realPrice: 400, discountedPrice: 350, availableFor: ["rent"], colors: [], specs: {}, image: "max-gas.jpg", description: "", isNew: false },
  { _id: "7", name: "Portable Super Stove with 1 Gas", slug: "portable-super-stove-with-gas", realPrice: 1000, discountedPrice: 900, availableFor: ["rent"], colors: [], specs: {}, image: "portable-super-stove.jpg", description: "Model BDZ-155-A.", isNew: false },
  { _id: "8", name: "Portable Super Stove", slug: "portable-super-stove", realPrice: 250, discountedPrice: 200, availableFor: ["rent"], colors: [], specs: {}, image: "portable-super-stove.jpg", description: "", isNew: false },
  { _id: "9", name: "Max Gas", slug: "max-gas", realPrice: 850, discountedPrice: 750, availableFor: ["rent"], colors: [], specs: {}, image: "max-gas.jpg", description: "", isNew: false },
  { _id: "10", name: "Hammock", slug: "hammock", realPrice: 300, discountedPrice: 250, availableFor: ["rent"], colors: [], specs: {}, image: "hammock.jpg", description: "Find your escape.", isNew: false },
  { _id: "11", name: "Tent Light", slug: "tent-light", realPrice: 200, discountedPrice: 150, availableFor: ["rent"], colors: [], specs: {}, image: "tent-light.png", description: "", isNew: false },
  { _id: "12", name: "Trekking Bag", slug: "trekking-bag", realPrice: 250, discountedPrice: 200, availableFor: ["rent"], colors: [], specs: {}, image: "trekking-bag.png", description: "", isNew: false },
  { _id: "13", name: "Mattress", slug: "mattress", realPrice: 70, discountedPrice: 50, availableFor: ["rent"], colors: [], specs: {}, image: "mattress.jpg", description: "", isNew: false },
  { _id: "14", name: "Camp Cookware Set (5 items)", slug: "camp-cookware", realPrice: 300, discountedPrice: 250, availableFor: ["rent"], colors: [], specs: {}, image: "camp-cookware.jpg", description: "", isNew: false },
  { _id: "15", name: "Foldable Chair", slug: "foldable-chair", realPrice: 300, discountedPrice: 200, availableFor: ["rent", "sale"], colors: ["Forest Green", "Navy", "Black", "Red"], specs: {}, image: "foldable-chair.jpg", description: "", isNew: false },
  { _id: "16", name: "Foldable Table", slug: "foldable-table", realPrice: 350, discountedPrice: 250, availableFor: ["rent", "sale"], colors: [], specs: { size: "68 × 47 × 45 cm" }, image: "foldable-table.jpg", description: "", isNew: false },
  { _id: "17", name: "PowerBank", slug: "powerbank", realPrice: 450, discountedPrice: 350, availableFor: ["rent"], colors: [], specs: {}, image: "powerbank.jpg", description: "", isNew: false },
  { _id: "18", name: "Head Light", slug: "head-light", realPrice: 200, discountedPrice: 150, availableFor: ["rent"], colors: [], specs: {}, image: "head-light.jpg", description: "Rechargeable.", isNew: false },
  { _id: "19", name: "BBQ Stand", slug: "bbq-stand", realPrice: 300, discountedPrice: 250, availableFor: ["rent", "sale"], colors: [], specs: {}, image: "bbq-stand.jpg", description: "", isNew: false },
  { _id: "20", name: "Trekking Poles (Pair)", slug: "trekking-poles", realPrice: 900, discountedPrice: 900, availableFor: ["sale"], colors: ["Red"], specs: { length: 'Retractable 24"–55"' }, image: "trekking-poles.jpg", description: "Uphill strength. Downhill support.", isNew: true },
  { _id: "21", name: "Canopy Tent", slug: "canopy-tent", realPrice: 0, discountedPrice: 0, availableFor: ["rent"], colors: [], specs: {}, image: "canopy-tent.jpg", description: "For events & markets — price on request.", isNew: true },
]

export const SPOTS = [
  { name: "Jati Pokhari", blurb: "Alpine pond camp above the valley", image: "jati-pokhari.png" },
  { name: "Hattiban", blurb: "Pine forest ridge, sunrise views", image: "hattiban.jpg" },
  { name: "Champadevi", blurb: "Classic day-hike & overnight camp", image: "champadevi.jpg" },
  { name: "Bhundole", blurb: "Quiet lakeside escape", image: "bhundole.png" },
  { name: "Pharping", blurb: "Culture + camping combo", image: "pharping.jpg" },
]

export const CONTACTS = {
  phones: ["+977 9747672039", "+977 9747672040"],
  email: "yatrikogears1234@gmail.com",
  address: "Gabu, Khokana, Lalitpur, Nepal",
  facebook: "https://www.facebook.com/yatrikoGears",
  instagram: "https://www.instagram.com/yatriko_gears",
  tiktok: "https://www.tiktok.com/@yatrikogears",
}
