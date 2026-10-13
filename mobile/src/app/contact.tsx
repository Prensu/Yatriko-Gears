import { useEffect, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native"
import { router } from "expo-router"
import { submitContact } from "@/api/forms"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { errorMessage } from "@/lib/api"
import { colors, radius, spacing } from "@/theme"
import { contactFormSchema, validateForm } from "@/types/forms"

export default function ContactScreen() {
  const { user } = useAuth()
  const toast = useToast()
  const [v, setV] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof v) => (t: string) => setV((p) => ({ ...p, [k]: t }))

  useEffect(() => {
    if (!user) return
    setV((p) => ({ ...p, name: p.name || user.name, email: p.email || user.email, phone: p.phone || (user.phone ?? "") }))
  }, [user])

  const submit = async () => {
    setFormError("")
    const result = validateForm(contactFormSchema, { ...v, name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      await submitContact(result.data)
      toast.show("Message sent. We'll reply soon.", "success")
      router.back()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField label="Full name" value={v.name} onChangeText={set("name")} error={errors.name} />
          <TextField label="Email" value={v.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
          <TextField label="Mobile number" value={v.phone} onChangeText={set("phone")} keyboardType="phone-pad" error={errors.phone} />
          <TextField label="Subject" value={v.subject} onChangeText={set("subject")} error={errors.subject} />
          <TextField label="Message" value={v.message} onChangeText={set("message")} multiline maxLength={2000} error={errors.message} />
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          <Button title="Send message" onPress={() => void submit()} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  formError: { backgroundColor: colors.dangerBg, color: colors.danger, padding: spacing.md, borderRadius: radius.md, fontWeight: "600" },
})
