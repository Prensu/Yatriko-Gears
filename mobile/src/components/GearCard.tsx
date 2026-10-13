import { memo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { router } from "expo-router"
import { Badge } from "@/components/Badge"
import { categoryName, formatRs } from "@/lib/format"
import { optimizeImage } from "@/lib/image"
import { colors, radius, shadow, spacing } from "@/theme"
import type { Gear } from "@/types"

type Props = { gear: Gear; width?: number }

function GearCardBase({ gear, width }: Props) {
  const rentable = gear.availableFor.includes("rent")
  const sellable = gear.availableFor.includes("sale") && typeof gear.salePrice === "number"
  const discounted = gear.discountedPrice < gear.realPrice
  const category = categoryName(gear.category)
  const outOfStock = typeof gear.quantityTotal === "number" && gear.quantityTotal <= 0

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${gear.name}, ${rentable ? `${formatRs(gear.discountedPrice)} per day` : ""}`}
      onPress={() => router.push(`/gear/${gear.slug}`)}
      style={({ pressed }) => [styles.card, width ? { width } : styles.flex, pressed && styles.pressed]}
    >
      <View>
        <Image
          source={{ uri: optimizeImage(gear.image || gear.images[0], 600) }}
          style={styles.image}
          contentFit="cover"
          transition={150}
          recyclingKey={gear._id}
          accessibilityLabel={gear.name}
        />
        <View style={styles.badges}>
          {gear.isNew ? <Badge label="New" tone="green" /> : null}
          {outOfStock ? <Badge label="Out of stock" tone="red" /> : null}
        </View>
      </View>
      <View style={styles.body}>
        {category ? <Text style={styles.category}>{category}</Text> : null}
        <Text numberOfLines={2} style={styles.name}>
          {gear.name}
        </Text>
        {rentable ? (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatRs(gear.discountedPrice)}</Text>
            <Text style={styles.unit}>/ day</Text>
            {discounted ? <Text style={styles.strike}>{formatRs(gear.realPrice)}</Text> : null}
          </View>
        ) : null}
        {sellable ? <Text style={styles.sale}>Buy: {formatRs(gear.salePrice as number)}</Text> : null}
      </View>
    </Pressable>
  )
}

export const GearCard = memo(GearCardBase)

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  flex: { flex: 1 },
  pressed: { opacity: 0.92 },
  image: { width: "100%", aspectRatio: 4 / 3, backgroundColor: colors.forest50 },
  badges: { position: "absolute", top: spacing.sm, left: spacing.sm, gap: 4 },
  body: { padding: spacing.md, gap: 4 },
  category: { fontSize: 11, fontWeight: "700", color: colors.forest500, textTransform: "uppercase", letterSpacing: 0.6 },
  name: { fontSize: 15, fontWeight: "600", color: colors.navy900, minHeight: 38 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4, flexWrap: "wrap" },
  price: { fontSize: 16, fontWeight: "700", color: colors.forest700 },
  unit: { fontSize: 12, color: colors.textMuted },
  strike: { fontSize: 12, color: colors.textFaint, textDecorationLine: "line-through" },
  sale: { fontSize: 12, color: colors.textMuted },
})
