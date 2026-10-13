/**
 * The ONLY place the app reads environment variables.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, and only when the
 * property is written out literally, so do not refactor these into a loop or
 * a dynamic lookup.
 */
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "")

if (__DEV__ && !apiBaseUrl) {
  console.warn(
    "[config] EXPO_PUBLIC_API_BASE_URL is empty. Copy .env.sample to .env and set it " +
      "(a real phone cannot reach `localhost`, use your PC's LAN IP).",
  )
}

export const config = {
  /** e.g. http://192.168.1.10:9005 (no trailing slash, no /api/v1). */
  apiBaseUrl,
  apiUrl: `${apiBaseUrl}/api/v1`,
  whatsappNumber: (process.env.EXPO_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "") || "9779747672039",
  supportPhone: (process.env.EXPO_PUBLIC_SUPPORT_PHONE ?? "").trim(),
  googleWebClientId: (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "").trim(),
} as const

/** Business facts shown in the app. Mirrors CONTACTS in frontend/src/lib/fallbackData.ts. */
export const BUSINESS = {
  name: "Yatriko Gears",
  tagline: "Rent the Best, Trek with Confidence.",
  address: "Gabu, Khokana, Lalitpur, Nepal",
  email: "yatrikogears1234@gmail.com",
  phones: ["+977 9747672039", "+977 9747672040"],
  mapsUrl: "https://maps.google.com/?q=Yatriko+Gears+Khokana+Lalitpur",
  facebook: "https://www.facebook.com/yatrikoGears",
  instagram: "https://www.instagram.com/yatriko_gears",
  tiktok: "https://www.tiktok.com/@yatrikogears",
} as const
