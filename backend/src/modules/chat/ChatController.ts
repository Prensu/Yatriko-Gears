import { GoogleGenAI } from "@google/genai"
import type { NextFunction, Response } from "express"
import type { IAuthRequest } from "../auth/AuthContract"
import { geminiConfig } from "../../config/AppConfig"

/**
 * System prompt that gives Gemini full context about Yatriko Gears.
 * This makes the chatbot a knowledgeable assistant about the business.
 */
const SYSTEM_PROMPT = `You are "Yatriko", the friendly AI assistant for Yatriko Gears — a camping gear rental & sales shop in Gabu, Khokana, Lalitpur, Nepal.

## Response Formatting Rules (CRITICAL)
- ALWAYS format your responses in plain HTML tags (e.g. <p>, <strong>, <em>, <ul>, <li>, <br/>, <a>).
- Do NOT use Markdown syntax (such as **, *, #, -, or markdown tables). Return clean HTML strings.

## Your personality
- Warm, helpful, and enthusiastic about the outdoors 🏕️
- You speak in a casual-friendly tone, like a knowledgeable friend
- Keep responses concise (2-4 sentences max unless the user asks for detail)
- Use emojis sparingly to stay friendly but professional
- If a question is outside camping/gear/Nepal trekking, politely redirect

## Business info
- Shop name: Yatriko Gears
- Tagline: "Rent the Best, Trek with Confidence"
- Location: Gabu, Khokana, Lalitpur, Nepal
- Phone: +977 9747672039, +977 9747672040
- Email: yatrikogears1234@gmail.com
- Socials: Facebook: facebook.com/yatrikoGears | Instagram: @yatriko_gears | TikTok: @yatrikogears
- How to book: DM on Instagram/Facebook, call, or WhatsApp

## Gear & pricing (all prices in Nepali Rupees per day for rentals)
- Tent — 3 Person: Rs.650 (Regular: Rs.800) [Rent]
- Tent — 4 Person: Rs.800 (Regular: Rs.1000) [Rent]
- Sleeping Bag: Rs.200 (Regular: Rs.250) [Rent]
- Multipurpose Stove with Gas: Rs.700 (Regular: Rs.850) [Rent]
- Multipurpose Stove (only): Rs.350 (Regular: Rs.400) [Rent]
- Large Gas (Yak Everest): Rs.350 (Regular: Rs.400) [Rent]
- Portable Super Stove with 1 Gas: Rs.900 (Regular: Rs.1000) [Rent]
- Portable Super Stove (only): Rs.200 (Regular: Rs.250) [Rent]
- Max Gas: Rs.750 (Regular: Rs.850) [Rent]
- Hammock: Rs.250 (Regular: Rs.300) [Rent]
- Tent Light: Rs.150 (Regular: Rs.200) [Rent]
- Trekking Bag: Rs.200 (Regular: Rs.250) [Rent]
- Mattress: Rs.50 (Regular: Rs.70) [Rent]
- Camp Cookware Set (5 items): Rs.250 (Regular: Rs.300) [Rent]
- Foldable Chair: Rs.200 (Regular: Rs.300) [Rent & Sale]
- Foldable Table (68×47×45 cm): Rs.250 (Regular: Rs.350) [Rent & Sale]
- PowerBank: Rs.350 (Regular: Rs.450) [Rent]
- Head Light (Rechargeable): Rs.150 (Regular: Rs.200) [Rent]
- BBQ Stand: Rs.250 (Regular: Rs.300) [Rent & Sale]
- Trekking Poles (Pair): Rs.900 [Sale only]
- Canopy Tent: Price on request [Rent]

## Special package
The Complete Camp Package — Rs.4,300 per trip (worth Rs.5,000+ individually):
Includes: 2-Person Tent, Gas Stove, 2 Butane Gas, Sleeping Bag, Tent Light, Foldable Chair

## Grand Opening Offer
15% off all rental gear! Customers can claim via the website popup.

## Popular camping spots near Kathmandu
- Jati Pokhari — Alpine pond camp above the valley
- Hattiban — Pine forest ridge, sunrise views
- Champadevi — Classic day-hike & overnight camp
- Bhundole — Quiet lakeside escape
- Pharping — Culture + camping combo

## Rules
1. ALWAYS quote the DISCOUNTED price, mention the regular price only if asked
2. If asked about booking, direct them to call/WhatsApp (+977 9747672039) or DM on Instagram
3. If asked about delivery, say "We deliver within the valley — just call us to arrange"
4. Do NOT make up gear that's not in the list above
5. For canopy tent pricing, say "Price varies by event — please call us for a quote"
6. If asked something unrelated, gently steer back: "I'm best at helping with camping gear & trips! 🏕️"`

/**
 * Ensures the response is formatted as valid HTML.
 * Converts any remaining Markdown elements to HTML if present.
 */
function formatAsHtml(text: string): string {
  if (!text) return ""

  let html = text.trim()

  // Convert bold: **text** or __text__ -> <strong>text</strong>
  html = html.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>")

  // Convert italic: *text* or _text_ -> <em>text</em>
  html = html.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>")

  // Convert inline code: `code` -> <code>code</code>
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")

  // Convert headers: ### Header -> <h3>Header</h3>
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>")
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>")
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>")

  // Convert bullet list items: * Item or - Item -> <li>Item</li>
  html = html.replace(/^\s*[\-\*]\s+(.*)$/gim, "<li>$1</li>")

  // Wrap sequence of <li> elements into <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => {
    if (match.includes("<ul>")) return match
    return `<ul>${match}</ul>`
  })

  // If no HTML structure tags are present, wrap double newlines into <p> tags
  if (!/<(p|div|ul|ol|h[1-6]|table|blockquote)>/.test(html)) {
    const paragraphs = html.split(/\n{2,}/)
    html = paragraphs
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("")
  } else {
    // Replace remaining single newlines with <br/>
    html = html.replace(/\n/g, "<br/>")
  }

  return html
}

// In-memory session store (per conversation history)
// Key = sessionId, Value = array of {role, parts}
const sessions = new Map<string, Array<{ role: string; parts: Array<{ text: string }> }>>()

// Clean up old sessions every 30 minutes
setInterval(() => {
  sessions.clear()
}, 30 * 60 * 1000)

// Ordered newest -> oldest. If one gets retired/blocked for your account, the next still works.
const MODEL_CANDIDATES = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
]

class ChatController {
  private ai: GoogleGenAI | null = null
  private workingModel: string | null = null // cached once we find a model that works

  constructor() {
    if (geminiConfig.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: geminiConfig.apiKey })
      console.log("✓ Gemini AI chatbot initialized")
    } else {
      console.warn("⚠ GEMINI_API_KEY not set — chatbot will be disabled")
    }
  }

  /** Tries the cached working model first, then falls back through MODEL_CANDIDATES on 404s. */
  private async generateWithFallback(
    history: Array<{ role: string; parts: Array<{ text: string }> }>,
  ) {
    const modelsToTry = this.workingModel
      ? [this.workingModel, ...MODEL_CANDIDATES.filter((m) => m !== this.workingModel)]
      : MODEL_CANDIDATES

    let lastError: unknown
    for (const model of modelsToTry) {
      try {
        const response = await this.ai!.models.generateContent({
          model,
          contents: history,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 400,
            temperature: 0.5,
            thinkingConfig: { thinkingLevel: "medium" },
          },
        })
        this.workingModel = model
        return response
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status
        if (status === 404) {
          console.warn(`Model "${model}" unavailable (404), trying next candidate...`)
          lastError = err
          continue
        }
        throw err
      }
    }
    throw lastError
  }

  /** POST /api/v1/chat — public chatbot endpoint */
  sendMessage = async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!this.ai) {
        throw { code: 503, message: "Chatbot is not configured — please set GEMINI_API_KEY" }
      }

      const { message, sessionId } = req.body
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        throw { code: 400, message: "Message is required" }
      }
      if (message.length > 1000) {
        throw { code: 400, message: "Message too long (max 1000 characters)" }
      }

      const sid = typeof sessionId === "string" && sessionId ? sessionId : crypto.randomUUID()

      // Get or create conversation history
      if (!sessions.has(sid)) {
        sessions.set(sid, [])
      }
      const history = sessions.get(sid)!

      // Add user message to history
      history.push({ role: "user", parts: [{ text: message.trim() }] })

      // Keep history manageable (last 20 exchanges = 40 messages)
      if (history.length > 40) {
        history.splice(0, history.length - 40)
      }

      // Call Gemini (with automatic model fallback)
      let rawReply: string
      try {
        const response = await this.generateWithFallback(history)
        rawReply = response.text ?? "Sorry, I couldn't generate a response. Please try again!"
      } catch (geminiError: unknown) {
        // Log full error details for debugging
        console.error("Gemini API error:", geminiError)
        // Remove the failed user message from history so retry works
        history.pop()
        const errMsg =
          geminiError instanceof Error ? geminiError.message : "Gemini API call failed"
        throw { code: 502, message: `AI service error: ${errMsg}` }
      }

      // Format response as clean HTML
      const htmlReply = formatAsHtml(rawReply)

      // Add assistant response to history
      history.push({ role: "model", parts: [{ text: htmlReply }] })

      res.json({
        data: { reply: htmlReply, sessionId: sid },
        message: "Chat response",
        meta: null,
      })
    } catch (exception) {
      next(exception)
    }
  }
}

export default ChatController