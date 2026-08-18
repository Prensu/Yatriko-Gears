import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { sendChatMessage } from "@/api/chat"

type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  timestamp: Date
}

const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  text: "Namaste! 🏕️ I'm Yatriko, your camping gear assistant. Ask me about gear, prices, camping spots, or anything about Yatriko Gears!",
  timestamp: new Date(),
}

/** Quick-reply chips shown before the first user message */
const QUICK_REPLIES = [
  "What gear do you have?",
  "Best camping spot?",
  "How do I book?",
  "Camp package details",
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setInput("")
      setLoading(true)

      try {
        const res = await sendChatMessage(text.trim(), sessionId)
        setSessionId(res.sessionId)

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: res.reply,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMsg])

        // Notify via bubble badge if panel is closed
        if (!open) setHasNewMessage(true)
      } catch (err) {
        console.error("Chat API error:", err)
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Oops, I couldn't reach the server. Please try again or call us at +977 9747672039! 📞",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setLoading(false)
      }
    },
    [loading, sessionId, open],
  )

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    send(input)
  }

  function handleQuickReply(text: string) {
    send(text)
  }

  function toggleOpen() {
    setOpen((v) => !v)
    setHasNewMessage(false)
  }

  const userHasSent = messages.some((m) => m.role === "user")

  return (
    <>
      {/* Floating chat bubble */}
      <button
        onClick={toggleOpen}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        className="fixed bottom-6 right-24 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:ring-offset-2"
        style={{
          background: "linear-gradient(135deg, #2d653e 0%, #3e7f50 100%)",
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="text-2xl text-white"
            >
              ✕
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-2xl"
            >
              🤖
            </motion.span>
          )}
        </AnimatePresence>
        {/* Unread badge */}
        {hasNewMessage && !open && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            !
          </span>
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{ height: "min(520px, calc(100vh - 8rem))" }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{
                background: "linear-gradient(135deg, #1e412a 0%, #2d653e 50%, #3e7f50 100%)",
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">
                🏕️
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-bold text-white">Yatriko Assistant</h3>
                <p className="flex items-center gap-1.5 text-xs text-forest-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                  Online — Ask me anything
                </p>
              </div>
              <button
                onClick={toggleOpen}
                aria-label="Close chat"
                className="text-lg text-white/60 transition hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-[#f7f8fa] px-4 py-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-md bg-forest-600 text-white"
                        : "rounded-bl-md bg-white text-navy-900 shadow-sm ring-1 ring-slate-100"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div
                        className="space-y-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1 [&_p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: msg.text }}
                      />
                    ) : (
                      msg.text.split("\n").map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < msg.text.split("\n").length - 1 && <br />}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-forest-400" style={{ animationDelay: "0ms" }} />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-forest-400" style={{ animationDelay: "150ms" }} />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-forest-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {/* Quick reply chips — shown before first user message */}
              {!userHasSent && !loading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => handleQuickReply(qr)}
                      className="rounded-full border border-forest-200 bg-white px-3 py-1.5 text-xs font-medium text-forest-700 shadow-sm transition hover:bg-forest-50 hover:border-forest-400"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input area */}
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about gear, prices, spots..."
                maxLength={1000}
                disabled={loading}
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-forest-400 focus:bg-white disabled:opacity-50"
                aria-label="Type your message"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-forest-600 text-white transition hover:bg-forest-700 disabled:opacity-40"
                aria-label="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95l14.095-5.156a.75.75 0 0 0 0-1.412L3.105 2.288Z" />
                </svg>
              </button>
            </form>

            {/* Footer branding */}
            <div className="bg-slate-50 px-4 py-1.5 text-center text-[10px] text-slate-400">
              Powered by Yatriko Gears × Gemini AI
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
