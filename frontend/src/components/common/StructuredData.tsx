import { CONTACTS } from "@/lib/fallbackData"

/**
 * JSON-LD structured data.
 *
 * Keep business facts here tied to CONTACTS. Do not add hours, coordinates or
 * service areas unless the business source data is updated first.
 */
const SITE_URL = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? "https://www.yatrikogears.com.np"

const LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "SportingGoodsStore"],
  name: "Yatriko Gears",
  url: SITE_URL,
  telephone: CONTACTS.phones,
  email: CONTACTS.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACTS.address,
  },
  areaServed: "Nepal",
  sameAs: [
    CONTACTS.facebook,
    CONTACTS.instagram,
    CONTACTS.tiktok,
  ],
}

export default function StructuredData({ data }: { data?: Record<string, unknown> }) {
  const payload = data ?? LOCAL_BUSINESS
  // Avoid a data value closing the script element before the JSON is parsed.
  const json = JSON.stringify(payload).replace(/</g, "\\u003c")

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
