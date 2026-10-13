import { useMemo, useState } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { Calendar, type DateData } from "react-native-calendars"
import { Ionicons } from "@expo/vector-icons"
import { Button } from "@/components/Button"
import { countDays, eachDay, formatDate, todayInNepal } from "@/lib/dates"
import { colors, radius, spacing } from "@/theme"

type Props = {
  start: string | null
  end: string | null
  onChange: (start: string | null, end: string | null) => void
  label?: string
  error?: string
}

/** Pickup and return dates in one field. A same-day rental is one day, like the web site. */
export function DateRangeField({ start, end, onChange, label = "Rental dates", error }: Props) {
  const [open, setOpen] = useState(false)
  const [draftStart, setDraftStart] = useState<string | null>(start)
  const [draftEnd, setDraftEnd] = useState<string | null>(end)
  const today = todayInNepal()

  const marked = useMemo(() => {
    const out: Record<string, { startingDay?: boolean; endingDay?: boolean; color: string; textColor: string }> = {}
    if (!draftStart) return out
    const last = draftEnd ?? draftStart
    for (const day of eachDay(draftStart, last)) {
      out[day] = {
        color: colors.forest600,
        textColor: colors.white,
        startingDay: day === draftStart,
        endingDay: day === last,
      }
    }
    return out
  }, [draftStart, draftEnd])

  const openPicker = () => {
    setDraftStart(start)
    setDraftEnd(end)
    setOpen(true)
  }

  const onDayPress = (day: DateData) => {
    const picked = day.dateString
    if (!draftStart || draftEnd) {
      setDraftStart(picked)
      setDraftEnd(null)
    } else if (picked < draftStart) {
      setDraftStart(picked)
    } else {
      setDraftEnd(picked) // tapping the start day again = a one-day rental
    }
  }

  const confirm = () => {
    if (draftStart) {
      onChange(draftStart, draftEnd ?? draftStart)
      setOpen(false)
    }
  }

  const summary =
    start && end
      ? `${formatDate(start)}${end !== start ? ` to ${formatDate(end)}` : ""}  ·  ${countDays(start, end)} day${countDays(start, end) === 1 ? "" : "s"}`
      : "Select pickup and return dates"

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${summary}`}
        style={[styles.field, Boolean(error) && styles.errored]}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.forest600} />
        <Text style={[styles.value, !start && styles.placeholder]}>{summary}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close date picker" />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Pick your dates</Text>
          <Text style={styles.sheetHint}>
            {!draftStart
              ? "Tap the pickup day"
              : !draftEnd
                ? "Now tap the return day (tap the same day for a one-day rental)"
                : `${countDays(draftStart, draftEnd)} day${countDays(draftStart, draftEnd) === 1 ? "" : "s"} selected`}
          </Text>
          <Calendar
            minDate={today}
            current={draftStart ?? today}
            markingType="period"
            markedDates={marked}
            onDayPress={onDayPress}
            enableSwipeMonths
            theme={{
              todayTextColor: colors.forest600,
              arrowColor: colors.forest600,
              selectedDayBackgroundColor: colors.forest600,
              textMonthFontWeight: "700",
            }}
          />
          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} style={styles.flex} />
            <Button title="Done" onPress={confirm} disabled={!draftStart} style={styles.flex} />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: colors.navy800 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  errored: { borderColor: colors.danger },
  value: { flex: 1, fontSize: 15, color: colors.text },
  placeholder: { color: colors.textFaint },
  error: { fontSize: 12, color: colors.danger },
  backdrop: { flex: 1, backgroundColor: "rgba(12,18,27,0.5)" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.navy900 },
  sheetHint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  flex: { flex: 1 },
})
