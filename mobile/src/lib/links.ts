import { Alert, Linking } from "react-native"
import { BUSINESS, config } from "@/config"

const ALLOWED_SCHEMES = ["http:", "https:", "tel:", "mailto:"]

/** Opens a URL only if it is web, phone or mail. Used for links inside bot replies. */
export async function openSafeUrl(url: string): Promise<void> {
  const scheme = /^[a-z][a-z0-9+.-]*:/i.exec(url)?.[0]?.toLowerCase()
  if (!scheme || !ALLOWED_SCHEMES.includes(scheme)) return
  try {
    await Linking.openURL(url)
  } catch {
    Alert.alert("Can't open link", url)
  }
}

export function openWhatsApp(text = "Hi Yatriko Gears! I want to rent camping gear."): Promise<void> {
  return openSafeUrl(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(text)}`)
}

export function callShop(phone: string = config.supportPhone || BUSINESS.phones[0]): Promise<void> {
  return openSafeUrl(`tel:${phone.replace(/\s/g, "")}`)
}

export function emailShop(): Promise<void> {
  return openSafeUrl(`mailto:${BUSINESS.email}`)
}
