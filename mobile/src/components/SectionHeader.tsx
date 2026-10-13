import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors, spacing } from "@/theme"

export function SectionHeader({ title, actionTitle, onAction }: { title: string; actionTitle?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {actionTitle && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link">
          <Text style={styles.action}>{actionTitle}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: spacing.lg },
  title: { fontSize: 20, fontWeight: "700", color: colors.navy900 },
  action: { fontSize: 14, fontWeight: "600", color: colors.forest600 },
})
