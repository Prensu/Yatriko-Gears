import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native"
import { router } from "expo-router"
import { requestPasswordReset } from "@/api/auth"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { TextField } from "@/components/TextField"
import { errorMessage } from "@/lib/api"
import { colors, radius, spacing } from "@/theme"
import { forgotPasswordSchema } from "@/types/auth"
import { validateForm } from "@/types/forms"

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError("")
    const result = validateForm(forgotPasswordSchema, { email: email.trim() })
    if (!result.ok) {
      setError(result.errors.email ?? "Enter a valid email")
      return
    }
    setBusy(true)
    try {
      setDone(await requestPasswordReset(result.data.email))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.sub}>Enter your email and we will send you a reset token.</Text>
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={error} />
          {done ? <Text style={styles.ok}>{done}</Text> : null}
          <Button title="Send reset email" onPress={() => void submit()} loading={busy} />
          <Button title="I have a token" variant="secondary" onPress={() => router.push("/reset-password")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: colors.navy900 },
  sub: { fontSize: 14, color: colors.textMuted },
  ok: { backgroundColor: colors.successBg, color: colors.success, padding: spacing.md, borderRadius: radius.md, fontWeight: "600" },
})
