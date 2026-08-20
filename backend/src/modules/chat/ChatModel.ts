import mongoose from "mongoose"

/**
 * Chatbot conversation history.
 *
 * Previously an in-memory Map that was wiped wholesale every 30 minutes, so a
 * customer mid-conversation could lose context at an arbitrary boundary — and
 * every restart erased everything. Mongo gives per-session expiry instead.
 */
const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "model"], required: true },
    text: { type: String, required: true },
  },
  { _id: false },
)

const ChatSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    messages: { type: [ChatMessageSchema], default: [] },
  },
  { autoCreate: true, autoIndex: true, timestamps: true },
)

/**
 * TTL index: a conversation expires two hours after its LAST message, so an
 * active chat is never cut off mid-flow. Mongo's TTL monitor sweeps ~every
 * 60s, which is why this needs no setInterval in application code.
 */
ChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 2 })

export default mongoose.model("ChatSession", ChatSessionSchema)
