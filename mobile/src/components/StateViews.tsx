import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Button } from "@/components/Button"
import { colors, spacing } from "@/theme"

export function LoadingView({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.forest600} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  )
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={44} color={colors.textFaint} />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  )
}

export function EmptyView({
  icon = "leaf-outline",
  title,
  message,
  actionTitle,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  message?: string
  actionTitle?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={48} color={colors.forest300} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.muted}>{message}</Text> : null}
      {actionTitle && onAction ? <Button title={actionTitle} onPress={onAction} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  title: { fontSize: 18, fontWeight: "700", color: colors.navy900, textAlign: "center" },
  muted: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
})
