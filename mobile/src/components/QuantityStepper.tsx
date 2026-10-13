import { Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, radius } from "@/theme"

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
}) {
  const canDec = value > min
  const canInc = value < max
  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel="Quantity" accessibilityValue={{ now: value, min, max }}>
      <Pressable
        onPress={() => canDec && onChange(value - 1)}
        disabled={!canDec}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        style={[styles.btn, !canDec && styles.off]}
      >
        <Ionicons name="remove" size={18} color={colors.forest800} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        onPress={() => canInc && onChange(value + 1)}
        disabled={!canInc}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        style={[styles.btn, !canInc && styles.off]}
      >
        <Ionicons name="add" size={18} color={colors.forest800} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  btn: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.forest100, alignItems: "center", justifyContent: "center" },
  off: { opacity: 0.4 },
  value: { minWidth: 32, textAlign: "center", fontSize: 16, fontWeight: "700", color: colors.navy900 },
})
