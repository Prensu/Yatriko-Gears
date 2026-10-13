import { StyleSheet, Text, View } from "react-native"
import { colors, radius } from "@/theme"
import type { BookingStatus } from "@/types"

type Tone = "green" | "amber" | "red" | "blue" | "gray"

const TONES: Record<Tone, { bg: string; fg: string }> = {
  green: { bg: colors.successBg, fg: colors.success },
  amber: { bg: colors.warningBg, fg: colors.warning },
  red: { bg: colors.dangerBg, fg: colors.danger },
  blue: { bg: colors.infoBg, fg: colors.info },
  gray: { bg: "#eceae4", fg: colors.textMuted },
}

export function Badge({ label, tone = "gray" }: { label: string; tone?: Tone }) {
  const t = TONES[tone]
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  )
}

const STATUS_TONE: Record<BookingStatus, Tone> = {
  pending: "amber",
  confirmed: "blue",
  active: "green",
  completed: "gray",
  cancelled: "red",
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge label={status.charAt(0).toUpperCase() + status.slice(1)} tone={STATUS_TONE[status]} />
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  text: { fontSize: 12, fontWeight: "700" },
})
