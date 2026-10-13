import { z } from "zod"
import { api } from "@/lib/api"

const chatResponseSchema = z.object({
  /** Sanitised HTML (p, br, strong, em, ul, ol, li, a, code); see HtmlText. */
  reply: z.string(),
  sessionId: z.string(),
})
export type ChatResponse = z.infer<typeof chatResponseSchema>

export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const { data } = await api.post("/chat", chatResponseSchema, { message, sessionId })
  return data
}
