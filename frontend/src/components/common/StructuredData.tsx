import { useEffect } from "react"

/**
 * JSON-LD structured data.
 *
 * LocalBusiness markup is what puts a shop in Google's local pack with its
 * address, phone and opening hours — disproportionately valuable for a
 * business whose customers search "tent rental kathmandu".
 */
const SITE_URL = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? "https://yatrikogears.com"

const LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Yatriko Gears",
  description:
    "Camping and trekking gear rental and sales in Lalitpur, Nepal. Tents, sleeping bags, stoves and more, delivered across Kathmandu, Lalitpur and Bhaktapur.",
  url: SITE_URL,
  telephone: "+977-9747672039",
  email: "yatrikogears1234@gmail.com",
  priceRange: "Rs. 50 - Rs. 1000",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Gabu, Khokana",
    addressLocality: "Lalitpur",
    addressRegion: "Bagmati",
    addressCountry: "NP",
  },
  geo: { "@type": "GeoCoordinates", latitude: 27.6417, longitude: 85.2917 },
  areaServed: ["Kathmandu", "Lalitpur", "Bhaktapur"],
  sameAs: [
    "https://www.facebook.com/yatrikoGears",
    "https://www.instagram.com/yatriko_gears",
    "https://www.tiktok.com/@yatrikogears",
  ],
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "07:00",
    closes: "20:00",
  },
}

export default function StructuredData({ data }: { data?: Record<string, unknown> }) {
  const payload = data ?? LOCAL_BUSINESS

  useEffect(() => {
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.text = JSON.stringify(payload)
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [payload])

  return null
}
