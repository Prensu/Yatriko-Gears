import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors, radius, spacing } from "@/theme"

type Props = Omit<TextInputProps, "style"> & {
  label: string
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, secureTextEntry, multiline, ...rest }: Props) {
  const [hidden, setHidden] = useState(true)
  const [focused, setFocused] = useState(false)
  const isPassword = Boolean(secureTextEntry)

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.focused, Boolean(error) && styles.errored]}>
        <TextInput
          {...rest}
          accessibilityLabel={label}
          multiline={multiline}
          secureTextEntry={isPassword && hidden}
          placeholderTextColor={colors.textFaint}
          onFocus={(e) => {
            setFocused(true)
            rest.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            rest.onBlur?.(e)
          }}
          style={[styles.input, multiline && styles.multiline]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
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
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  focused: { borderColor: colors.forest500 },
  errored: { borderColor: colors.danger },
  input: { flex: 1, minHeight: 48, fontSize: 16, color: colors.text, paddingVertical: 10 },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  error: { fontSize: 12, color: colors.danger },
  hint: { fontSize: 12, color: colors.textMuted },
})
