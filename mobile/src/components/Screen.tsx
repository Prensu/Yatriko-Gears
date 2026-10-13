import type { ReactNode } from "react"
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"
import { SafeAreaView, type Edge } from "react-native-safe-area-context"
import { colors } from "@/theme"

/**
 * Screen background + safe-area handling. Tab and stack headers already cover
 * the top, so most screens only need the bottom edge.
 */
export function Screen({
  children,
  edges = ["bottom"],
  style,
}: {
  children: ReactNode
  edges?: Edge[]
  style?: StyleProp<ViewStyle>
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      <View style={styles.fill}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  fill: { flex: 1 },
})
