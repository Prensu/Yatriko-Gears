import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native"
import { router } from "expo-router"
import { register } from "@/api/auth"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { errorMessage } from "@/lib/api"
import { colors, radius, spacing } from "@/theme"
import { registerFormSchema } from "@/types/auth"
import { validateForm } from "@/types/forms"

export default function RegisterScreen() {
  const { signIn } = useAuth()
  const toast = useToast()
  const [values, setValues] = useState({ name: "", email: "", phone: "", address: "", password: "", confirmPassword: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof values) => (text: string) => setValues((v) => ({ ...v, [key]: text }))

  const submit = async () => {
    setFormError("")
    const result = validateForm(registerFormSchema, { ...values, name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim() })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      await register(result.data)
      // Sign in straight away so the customer does not retype the password they just chose.
      const user = await signIn(result.data.email, result.data.password)
      toast.show(`Welcome, ${user.name.split(" ")[0]}!`, "success")
      router.replace("/")
    } catch (err) {
      setFormError(errorMessage(err, "Could not create your account."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>
          <TextField label="Full name" value={values.name} onChangeText={set("name")} autoComplete="name" textContentType="name" error={errors.name} />
          <TextField
            label="Email"
            value={values.email}
            onChangeText={set("email")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
          />
          <TextField
            label="Mobile number"
            value={values.phone}
            onChangeText={set("phone")}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="98XXXXXXXX"
            error={errors.phone}
          />
          <TextField label="Address (optional)" value={values.address} onChangeText={set("address")} autoComplete="street-address" error={errors.address} />
          <TextField
            label="Password"
            value={values.password}
            onChangeText={set("password")}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
            hint="At least 8 characters"
            error={errors.password}
          />
          <TextField
            label="Confirm password"
            value={values.confirmPassword}
            onChangeText={set("confirmPassword")}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
            error={errors.confirmPassword}
          />
          {formError ? (
            <Text accessibilityLiveRegion="polite" style={styles.formError}>
              {formError}
            </Text>
          ) : null}
          <Button title="Create account" onPress={() => void submit()} loading={busy} />
          <Button title="I already have an account" variant="ghost" small onPress={() => router.replace("/login")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: colors.navy900 },
  formError: { backgroundColor: colors.dangerBg, color: colors.danger, padding: spacing.md, borderRadius: radius.md, fontSize: 14, fontWeight: "600" },
})
