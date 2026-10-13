import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { errorMessage } from "@/lib/api"
import { getGoogleIdToken, googleSignInAvailable } from "@/lib/googleSignIn"
import { colors, radius, spacing } from "@/theme"
import { loginFormSchema } from "@/types/auth"
import { validateForm } from "@/types/forms"

function leave() {
  if (router.canGoBack()) router.back()
  else router.replace("/")
}

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const submit = async () => {
    setFormError("")
    const result = validateForm(loginFormSchema, { email: email.trim(), password })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const user = await signIn(result.data.email, result.data.password)
      toast.show(`Welcome back, ${user.name.split(" ")[0]}!`, "success")
      leave()
    } catch (err) {
      setFormError(errorMessage(err, "Could not sign in."))
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setFormError("")
    setGoogleBusy(true)
    try {
      const idToken = await getGoogleIdToken()
      if (!idToken) return // user closed the Google sheet
      const user = await signInWithGoogle(idToken)
      toast.show(`Welcome, ${user.name.split(" ")[0]}!`, "success")
      leave()
    } catch (err) {
      setFormError(errorMessage(err, "Google sign-in failed."))
    } finally {
      setGoogleBusy(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to book gear and track your bookings.</Text>

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            error={errors.password}
            onSubmitEditing={() => void submit()}
          />
          {formError ? (
            <Text accessibilityLiveRegion="polite" style={styles.formError}>
              {formError}
            </Text>
          ) : null}

          <Button title="Sign in" onPress={() => void submit()} loading={busy} disabled={googleBusy} />
          <Button title="Forgot password?" variant="ghost" small onPress={() => router.push("/forgot-password")} />

          {googleSignInAvailable ? (
            <>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.or}>or</Text>
                <View style={styles.line} />
              </View>
              <Button title="Continue with Google" variant="outline" icon="logo-google" onPress={() => void google()} loading={googleBusy} disabled={busy} />
            </>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.sub}>New here?</Text>
            <Button title="Create an account" variant="secondary" onPress={() => router.replace("/register")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: 26, fontWeight: "800", color: colors.navy900 },
  sub: { fontSize: 14, color: colors.textMuted },
  formError: { backgroundColor: colors.dangerBg, color: colors.danger, padding: spacing.md, borderRadius: radius.md, fontSize: 14, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.textMuted, fontSize: 13 },
  footer: { marginTop: spacing.lg, gap: spacing.sm },
})
