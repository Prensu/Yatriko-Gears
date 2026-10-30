import { whatsAppConfig } from "../config/AppConfig"
import { loggerFor } from "../config/logger"

const log = loggerFor("WhatsAppService")

/**
 * Normalise any Nepali phone number to E.164 digits-only format required by
 * the Meta Cloud API (e.g. 9779841234567).
 *
 * Accepts:
 *   9841234567         → 9779841234567
 *   +9779841234567     → 9779841234567
 *   +977 984-123-4567  → 9779841234567
 *   977 9841234567     → 9779841234567
 */
export function normaliseToE164Nepal(phone: string): string {
  // Strip everything that isn't a digit.
  const digits = phone.replace(/\D/g, "")

  // Already in full E.164 form for Nepal (977 + 10 digits = 13 digits).
  if (digits.startsWith("977") && digits.length === 13) return digits

  // Just the local 10-digit number starting with 9 (Nepali mobile prefix).
  if (digits.length === 10 && digits.startsWith("9")) return `977${digits}`

  // Fallback: return whatever we have (Meta will reject it gracefully).
  return digits
}

interface BookingWhatsAppPayload {
  customerName: string
  customerPhone: string
  bookingCode: string
  /** Comma-separated short summary of items, e.g. "Tent × 1, Sleeping bag × 2" */
  gearSummary: string
  /** Human-readable date range, e.g. "2026-11-01 to 2026-11-05" or "Purchase order" */
  dateRange: string
  /** Total amount as a number, e.g. 3500 */
  total: number
}

class WhatsAppService {
  /**
   * Send a booking-confirmation WhatsApp message via the Meta Cloud API.
   *
   * The message uses a pre-approved Utility Template with five variables:
   *   {{1}} Customer Name
   *   {{2}} Booking Code
   *   {{3}} Gear Summary
   *   {{4}} Date Range
   *   {{5}} Total (Rs.)
   *
   * This is fire-and-forget safe: catch the returned Promise in the caller.
   */
  async sendBookingConfirmation(payload: BookingWhatsAppPayload): Promise<void> {
    if (!whatsAppConfig.isConfigured) {
      log.debug("WhatsApp not configured — skipping confirmation for %s", payload.bookingCode)
      return
    }

    const to = normaliseToE164Nepal(payload.customerPhone)
    const url = `https://graph.facebook.com/v21.0/${whatsAppConfig.phoneNumberId}/messages`

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: whatsAppConfig.templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: payload.customerName },
              { type: "text", text: payload.bookingCode },
              { type: "text", text: payload.gearSummary },
              { type: "text", text: payload.dateRange },
              { type: "text", text: `Rs. ${payload.total}` },
            ],
          },
        ],
      },
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsAppConfig.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = (await response.json()) as { messages?: { id: string }[]; error?: { message: string } }

    if (!response.ok) {
      throw new Error(`WhatsApp API error (${response.status}): ${data.error?.message ?? JSON.stringify(data)}`)
    }

    log.info(
      { to, code: payload.bookingCode, messageId: data.messages?.[0]?.id },
      "WhatsApp booking confirmation sent",
    )
  }
}

export default WhatsAppService
