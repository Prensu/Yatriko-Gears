import { Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useCart } from "@/context/CartContext"
import { colors } from "@/theme"

/** Cart icon with a live item-count badge, for screen headers. */
export function CartHeaderButton({ tint = colors.white }: { tint?: string }) {
  const { itemCount } = useCart()
  return (
    <Pressable
      onPress={() => router.push("/cart")}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      style={styles.btn}
    >
      <Ionicons name="bag-handle-outline" size={24} color={tint} />
      {itemCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 14, paddingVertical: 6 },
  badge: {
    position: "absolute",
    top: 0,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: colors.navy900 },
})
