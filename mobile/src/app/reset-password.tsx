import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native"
import { router } from "expo-router"
import { resetPassword } from "@/api/auth"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { TextField } from "@/components/TextField"
import { useToast } from "@/context/ToastContext"
import { errorMessage } from "@/lib/api"
import { colors, radius, spacing } from "@/theme"
import { resetPasswordSchema } from "@/types/auth"
import { validateForm } from "@/types/forms"

export default function ResetPasswordScreen() {
  const toast = useToast()
  const [values, setValues] = useState({ resetToken: "", password: "", confirmPassword: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof values) => (t: string) => setValues((v) => ({ ...v, [k]: t }))

  const submit = async () => {
    setFormError("")
    const result = validateForm(resetPasswordSchema, { ...values, resetToken: values.resetToken.trim() })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      await resetPassword(result.data)
      toast.show("Password updated. Please sign in.", "success")
      router.replace("/login")
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
          <Text style={styles.title}>Choose a new password</Text>
          <TextField label="Token from your email" value={values.resetToken} onChangeText={set("resetToken")} autoCapitalize="none" autoCorrect={false} error={errors.resetToken} />
          <TextField label="New password" value={values.password} onChangeText={set("password")} secureTextEntry autoCapitalize="none" error={errors.password} />
          <TextField label="Confirm password" value={values.confirmPassword} onChangeText={set("confirmPassword")} secureTextEntry autoCapitalize="none" error={errors.confirmPassword} />
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          <Button title="Update password" onPress={() => void submit()} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: colors.navy900 },
  formError: { backgroundColor: colors.dangerBg, color: colors.danger, padding: spacing.md, borderRadius: radius.md, fontWeight: "600" },
})
