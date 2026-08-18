import { z } from "zod"
import { api } from "@/lib/api"

const chatResponseSchema = z.object({
  reply: z.string(),
  sessionId: z.string(),
})

export type ChatResponse = z.infer<typeof chatResponseSchema>

/** POST /api/v1/chat — send a message to the AI chatbot */
export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const { data } = await api.post("/chat", chatResponseSchema, { message, sessionId })
  return data
}
