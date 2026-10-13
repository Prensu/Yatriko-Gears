import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import { sendChatMessage } from "@/api/chat"
import { Button } from "@/components/Button"
import { HtmlText } from "@/components/HtmlText"
import { Screen } from "@/components/Screen"
import { ApiRequestError, errorMessage } from "@/lib/api"
import { openWhatsApp } from "@/lib/links"
import { colors, radius, spacing } from "@/theme"

const SESSION_KEY = "yatriko.chatSessionId"
const MAX_LENGTH = 1000 // backend limit
const SUGGESTIONS = ["What can I rent?", "Sleeping bag prices", "Do you deliver?", "How do I book?"]

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "bot"; html: string }
  | { id: string; role: "error"; text: string; retryText: string; showWhatsApp: boolean }

const WELCOME: Message = {
  id: "welcome",
  role: "bot",
  html: "<p>Namaste! 👋 I'm the Yatriko Gears assistant. Ask me about gear, prices, availability or how to book.</p>",
}

let counter = 0
const nextId = () => `m${Date.now()}-${counter++}`

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const sessionId = useRef<string | undefined>(undefined)
  const listRef = useRef<FlatList<Message>>(null)

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((id) => {
        if (id) sessionId.current = id
      })
      .catch(() => undefined)
  }, [])

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
  }, [])

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_LENGTH)
      if (!text || sending) return
      setInput("")
      setSending(true)
      // Drop an old error bubble so a retry does not leave stale ones behind.
      setMessages((prev) => [...prev.filter((m) => m.role !== "error"), { id: nextId(), role: "user", text }])
      scrollToEnd()
      try {
        const res = await sendChatMessage(text, sessionId.current)
        sessionId.current = res.sessionId
        AsyncStorage.setItem(SESSION_KEY, res.sessionId).catch(() => undefined)
        setMessages((prev) => [...prev, { id: nextId(), role: "bot", html: res.reply }])
      } catch (err) {
        // Busy/rate-limited/offline: friendly text with a WhatsApp way out. Never raw provider errors.
        const status = err instanceof ApiRequestError ? err.status : 0
        const busy = status === 429 || status === 502 || status === 503
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "error",
            text: busy
              ? "Our assistant is busy right now. Please try again in a moment, or message us on WhatsApp."
              : errorMessage(err, "I couldn't send that. Please try again."),
            retryText: text,
            showWhatsApp: busy || status >= 500,
          },
        ])
      } finally {
        setSending(false)
        scrollToEnd()
      }
    },
    [scrollToEnd, sending],
  )

  const newChat = () => {
    sessionId.current = undefined
    AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined)
    setMessages([WELCOME])
  }

  const onlyWelcome = messages.length === 1

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => {
            if (item.role === "user") {
              return (
                <View style={[styles.bubble, styles.user]}>
                  <Text selectable style={styles.userText}>
                    {item.text}
                  </Text>
                </View>
              )
            }
            if (item.role === "bot") {
              return (
                <View style={[styles.bubble, styles.bot]}>
                  <HtmlText html={item.html} />
                </View>
              )
            }
            return (
              <View style={[styles.bubble, styles.error]}>
                <Text style={styles.errorText}>{item.text}</Text>
                <View style={styles.errorActions}>
                  <Button title="Retry" small variant="secondary" onPress={() => void send(item.retryText)} />
                  {item.showWhatsApp ? <Button title="WhatsApp" small variant="whatsapp" icon="logo-whatsapp" onPress={() => void openWhatsApp()} /> : null}
                </View>
              </View>
            )
          }}
          ListFooterComponent={
            sending ? (
              <View style={[styles.bubble, styles.bot, styles.typing]} accessibilityLabel="Assistant is typing">
                <ActivityIndicator size="small" color={colors.forest600} />
                <Text style={styles.typingText}>Typing…</Text>
              </View>
            ) : null
          }
        />

        {onlyWelcome ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} onPress={() => void send(s)} accessibilityRole="button" style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.composer}>
          {!onlyWelcome ? (
            <Pressable onPress={newChat} hitSlop={8} accessibilityRole="button" accessibilityLabel="Start a new chat" style={styles.iconBtn}>
              <Ionicons name="refresh" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about gear, prices, dates…"
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={MAX_LENGTH}
            accessibilityLabel="Message"
            style={styles.input}
          />
          <Pressable
            onPress={() => void send(input)}
            disabled={sending || !input.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            style={[styles.send, (sending || !input.trim()) && styles.sendOff]}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, flexGrow: 1, justifyContent: "flex-end" },
  bubble: { maxWidth: "88%", borderRadius: radius.lg, padding: spacing.md },
  user: { alignSelf: "flex-end", backgroundColor: colors.forest600, borderBottomRightRadius: 4 },
  userText: { color: colors.white, fontSize: 15, lineHeight: 21 },
  bot: { alignSelf: "flex-start", backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  error: { alignSelf: "flex-start", backgroundColor: colors.dangerBg, gap: spacing.sm },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  errorActions: { flexDirection: "row", gap: spacing.sm },
  typing: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  typingText: { color: colors.textMuted, fontSize: 13 },
  chips: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.forest100 },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.forest800 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  iconBtn: { height: 44, width: 36, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, maxHeight: 120, minHeight: 44, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 12, borderRadius: radius.lg, backgroundColor: colors.sand, fontSize: 15, color: colors.text },
  send: { height: 44, width: 44, borderRadius: 22, backgroundColor: colors.forest600, alignItems: "center", justifyContent: "center" },
  sendOff: { opacity: 0.4 },
})
