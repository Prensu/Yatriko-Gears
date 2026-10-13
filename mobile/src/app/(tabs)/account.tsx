import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import Constants from "expo-constants"
import { router } from "expo-router"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { LoadingView } from "@/components/StateViews"
import { BUSINESS } from "@/config"
import { useAuth } from "@/context/AuthContext"
import { initials } from "@/lib/format"
import { callShop, openSafeUrl, openWhatsApp } from "@/lib/links"
import { colors, radius, spacing } from "@/theme"

type Row = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }

export default function AccountScreen() {
  const { user, status, signOut } = useAuth()

  if (status === "loading") {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    )
  }

  const confirmSignOut = () =>
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Stay signed in", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut() },
    ])

  const help: Row[] = [
    { icon: "mail-outline", label: "Send us a message", onPress: () => router.push("/contact") },
    { icon: "logo-whatsapp", label: "Chat on WhatsApp", onPress: () => void openWhatsApp() },
    { icon: "call-outline", label: "Call the shop", onPress: () => void callShop() },
    { icon: "location-outline", label: "Find us on the map", onPress: () => void openSafeUrl(BUSINESS.mapsUrl) },
    { icon: "logo-instagram", label: "Instagram", onPress: () => void openSafeUrl(BUSINESS.instagram) },
    { icon: "logo-facebook", label: "Facebook", onPress: () => void openSafeUrl(BUSINESS.facebook) },
  ]

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {user ? (
          <View style={styles.profile}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initials(user.name)}</Text>
              </View>
            )}
            <View style={styles.flex}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.sub}>{user.email}</Text>
              {user.phone ? <Text style={styles.sub}>{user.phone}</Text> : null}
            </View>
          </View>
        ) : (
          <View style={styles.guest}>
            <Ionicons name="person-circle-outline" size={64} color={colors.forest300} />
            <Text style={styles.name}>Welcome to Yatriko Gears</Text>
            <Text style={styles.sub}>Sign in to book gear and track your bookings.</Text>
            <View style={styles.guestActions}>
              <Button title="Sign in" onPress={() => router.push("/login")} style={styles.flex} />
              <Button title="Create account" variant="outline" onPress={() => router.push("/register")} style={styles.flex} />
            </View>
          </View>
        )}

        {user ? (
          <Group
            title="Account"
            rows={[
              { icon: "create-outline", label: "Edit profile", onPress: () => router.push("/edit-profile") },
              { icon: "calendar-outline", label: "My bookings", onPress: () => router.push("/bookings") },
            ]}
          />
        ) : null}

        <Group title="Help & contact" rows={help} />

        {user ? <Group title="Session" rows={[{ icon: "log-out-outline", label: "Sign out", onPress: confirmSignOut, danger: true }]} /> : null}

        <Text style={styles.version}>
          {BUSINESS.name} · v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </ScrollView>
    </Screen>
  )
}

function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>
        {rows.map((row, i) => (
          <Pressable
            key={row.label}
            onPress={row.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.rowPressed]}
          >
            <Ionicons name={row.icon} size={22} color={row.danger ? colors.danger : colors.forest600} />
            <Text style={[styles.rowLabel, row.danger && { color: colors.danger }]}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.lg, backgroundColor: colors.white, padding: spacing.lg, borderRadius: radius.lg },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { backgroundColor: colors.forest600, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: "800" },
  guest: { alignItems: "center", gap: spacing.sm, backgroundColor: colors.white, padding: spacing.xl, borderRadius: radius.lg },
  guestActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md, alignSelf: "stretch" },
  name: { fontSize: 18, fontWeight: "700", color: colors.navy900, textAlign: "center" },
  sub: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  group: { gap: spacing.sm },
  groupTitle: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginLeft: spacing.xs },
  groupCard: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowPressed: { backgroundColor: colors.forest50 },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text },
  version: { textAlign: "center", fontSize: 12, color: colors.textFaint },
})
