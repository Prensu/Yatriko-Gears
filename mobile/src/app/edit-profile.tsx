import { useEffect, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native"
import { router } from "expo-router"
import { updateProfile } from "@/api/auth"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { errorMessage } from "@/lib/api"
import { colors, radius, spacing } from "@/theme"
import { validateForm } from "@/types/forms"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must have at least 2 characters").max(50),
  phone: z.string().trim().regex(/^(\+977[- ]?)?9\d{9}$/, "Enter a valid Nepali mobile number"),
  address: z.string().trim().max(200),
})

export default function EditProfileScreen() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [v, setV] = useState({ name: "", phone: "", address: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) setV({ name: user.name, phone: user.phone ?? "", address: user.address })
  }, [user])

  const submit = async () => {
    setFormError("")
    const result = validateForm(profileSchema, v)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      setUser(await updateProfile(result.data))
      toast.show("Profile updated", "success")
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
          <TextField label="Full name" value={v.name} onChangeText={(t) => setV((p) => ({ ...p, name: t }))} error={errors.name} />
          <TextField label="Mobile number" value={v.phone} onChangeText={(t) => setV((p) => ({ ...p, phone: t }))} keyboardType="phone-pad" error={errors.phone} />
          <TextField label="Address" value={v.address} onChangeText={(t) => setV((p) => ({ ...p, address: t }))} error={errors.address} />
          <TextField label="Email" value={user?.email ?? ""} editable={false} hint="Email cannot be changed here." />
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          <Button title="Save changes" onPress={() => void submit()} loading={busy} />
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
