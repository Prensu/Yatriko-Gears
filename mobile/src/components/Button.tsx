import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, radius, spacing } from "@/theme"

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "whatsapp"

type Props = {
  title: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  small?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

const BG: Record<Variant, string> = {
  primary: colors.forest600,
  secondary: colors.forest100,
  outline: "transparent",
  danger: colors.danger,
  ghost: "transparent",
  whatsapp: colors.whatsapp,
}
const FG: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.forest800,
  outline: colors.forest700,
  danger: colors.white,
  ghost: colors.forest700,
  whatsapp: colors.white,
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  small = false,
  style,
  accessibilityLabel,
}: Props) {
  const inactive = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: BG[variant] },
        variant === "outline" && styles.outline,
        inactive && styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={FG[variant]} size="small" />
        ) : icon ? (
          <Ionicons name={icon} size={small ? 16 : 18} color={FG[variant]} />
        ) : null}
        <Text style={[styles.text, small && styles.textSmall, { color: FG[variant] }]}>{title}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  small: { minHeight: 38, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
  outline: { borderWidth: 1.5, borderColor: colors.forest600 },
  inactive: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  text: { fontSize: 16, fontWeight: "600" },
  textSmall: { fontSize: 14 },
})
