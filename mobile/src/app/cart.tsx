import { Alert, FlatList, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Button } from "@/components/Button"
import { QuantityStepper } from "@/components/QuantityStepper"
import { Screen } from "@/components/Screen"
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews"
import { useCart, type CartItem } from "@/context/CartContext"
import { useGearIndex } from "@/hooks/useCatalogue"
import { errorMessage } from "@/lib/api"
import { formatRs } from "@/lib/format"
import { optimizeImage } from "@/lib/image"
import { colors, radius, shadow, spacing } from "@/theme"
import type { Gear } from "@/types"

function unitPriceOf(item: CartItem, gear: Gear | undefined): number | null {
  if (!gear) return null
  if (item.mode === "sale") return typeof gear.salePrice === "number" ? gear.salePrice : null
  return gear.discountedPrice
}

export default function CartScreen() {
  const { items, ready, updateQuantity, removeItem, clearCart } = useCart()
  const { byId, isLoading, isError, error, refetch } = useGearIndex()

  if (!ready || (isLoading && items.length > 0)) {
    return (
      <Screen>
        <LoadingView label="Loading your cart…" />
      </Screen>
    )
  }
  if (items.length === 0) {
    return (
      <Screen>
        <EmptyView
          icon="bag-handle-outline"
          title="Your cart is empty"
          message="Browse our gear and add what you need for the trip."
          actionTitle="Browse gear"
          onAction={() => router.replace("/browse")}
        />
      </Screen>
    )
  }
  if (isError && byId.size === 0) {
    return (
      <Screen>
        <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} />
      </Screen>
    )
  }

  let rentPerDay = 0
  let buyTotal = 0
  let problems = 0
  for (const item of items) {
    const price = unitPriceOf(item, byId.get(item.gearId))
    if (price === null) {
      problems += 1
      continue
    }
    if (item.mode === "rent") rentPerDay += price * item.quantity
    else buyTotal += price * item.quantity
  }

  const confirmClear = () =>
    Alert.alert("Clear cart?", "All items will be removed.", [
      { text: "Keep items", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearCart },
    ])

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.gearId}-${item.mode}-${item.color ?? ""}`}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => {
          const gear = byId.get(item.gearId)
          const price = unitPriceOf(item, gear)
          return (
            <View style={styles.row}>
              <Image source={{ uri: optimizeImage(gear?.image, 200) }} style={styles.thumb} contentFit="cover" />
              <View style={styles.info}>
                <Text numberOfLines={2} style={styles.name}>
                  {gear?.name ?? "Item no longer available"}
                </Text>
                <Text style={styles.meta}>
                  {item.mode === "rent" ? "Rent" : "Buy"}
                  {item.color ? ` · ${item.color}` : ""}
                </Text>
                {price !== null ? (
                  <Text style={styles.price}>
                    {formatRs(price)}
                    {item.mode === "rent" ? " / day" : ""}
                  </Text>
                ) : (
                  <Text style={styles.problem}>Remove this item to continue</Text>
                )}
                <View style={styles.actions}>
                  <QuantityStepper value={item.quantity} onChange={(q) => updateQuantity(item.gearId, item.mode, q, item.color)} />
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={colors.danger}
                    onPress={() => removeItem(item.gearId, item.mode, item.color)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${gear?.name ?? "item"}`}
                    suppressHighlighting
                  />
                </View>
              </View>
            </View>
          )
        }}
        ListFooterComponent={<Button title="Clear cart" variant="ghost" small onPress={confirmClear} style={styles.clear} />}
      />

      <View style={styles.summary}>
        {rentPerDay > 0 ? (
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Rentals, per day</Text>
            <Text style={styles.sumValue}>{formatRs(rentPerDay)}</Text>
          </View>
        ) : null}
        {buyTotal > 0 ? (
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Purchases</Text>
            <Text style={styles.sumValue}>{formatRs(buyTotal)}</Text>
          </View>
        ) : null}
        <Text style={styles.hint}>Rental dates and the final total are confirmed at checkout. Delivery is quoted separately on WhatsApp.</Text>
        <Button title="Continue to checkout" icon="arrow-forward" onPress={() => router.push("/checkout")} disabled={problems > 0} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  row: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.forest50 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "600", color: colors.navy900 },
  meta: { fontSize: 12, color: colors.textMuted },
  price: { fontSize: 14, fontWeight: "700", color: colors.forest700 },
  problem: { fontSize: 13, color: colors.danger, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  clear: { alignSelf: "center", marginTop: spacing.md },
  summary: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  sumRow: { flexDirection: "row", justifyContent: "space-between" },
  sumLabel: { fontSize: 15, color: colors.textMuted },
  sumValue: { fontSize: 15, fontWeight: "700", color: colors.navy900 },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
})
