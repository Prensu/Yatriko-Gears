import { StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { openWhatsApp } from "@/lib/links"
import { colors, radius, spacing } from "@/theme"

export default function BookingSuccessScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>()
  return (
    <Screen>
      <View style={styles.wrap}>
        <Ionicons name="checkmark-circle" size={84} color={colors.forest500} />
        <Text accessibilityRole="header" style={styles.title}>
          Booking placed!
        </Text>
        {code ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Your booking code</Text>
            <Text selectable style={styles.code}>
              {code}
            </Text>
          </View>
        ) : null}
        <Text style={styles.body}>
          We will call or message you to confirm. Payment is in cash on pickup or delivery, and any delivery charge is quoted on WhatsApp.
        </Text>
        <View style={styles.actions}>
          <Button
            title="Message us on WhatsApp"
            variant="whatsapp"
            icon="logo-whatsapp"
            onPress={() => void openWhatsApp(`Hi Yatriko Gears! My booking code is ${code ?? ""}. Please confirm delivery.`)}
          />
          <Button title="View my bookings" variant="secondary" onPress={() => router.replace("/bookings")} />
          <Button title="Back to home" variant="ghost" onPress={() => router.replace("/")} />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: 26, fontWeight: "800", color: colors.navy900 },
  codeBox: { alignItems: "center", backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, gap: 4, borderWidth: 1, borderColor: colors.border },
  codeLabel: { fontSize: 12, color: colors.textMuted },
  code: { fontSize: 24, fontWeight: "800", letterSpacing: 2, color: colors.forest700 },
  body: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: "center" },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.md },
})
