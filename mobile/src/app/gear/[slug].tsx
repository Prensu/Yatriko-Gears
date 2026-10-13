import { useMemo, useState } from "react"
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { DateRangeField } from "@/components/DateRangeField"
import { HtmlText } from "@/components/HtmlText"
import { QuantityStepper } from "@/components/QuantityStepper"
import { Screen } from "@/components/Screen"
import { ErrorView, LoadingView } from "@/components/StateViews"
import { useCart, type CartMode } from "@/context/CartContext"
import { useToast } from "@/context/ToastContext"
import { useAvailability } from "@/hooks/useBookings"
import { useGearDetail } from "@/hooks/useCatalogue"
import { errorMessage } from "@/lib/api"
import { countDays } from "@/lib/dates"
import { categoryName, formatRs } from "@/lib/format"
import { optimizeImage } from "@/lib/image"
import { openWhatsApp } from "@/lib/links"
import { colors, radius, spacing } from "@/theme"

export default function GearDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { width } = useWindowDimensions()
  const toast = useToast()
  const { addItem } = useCart()
  const { data: gear, isLoading, isError, error, refetch } = useGearDetail(slug ?? "")

  const [chosenMode, setChosenMode] = useState<CartMode | null>(null)
  const [chosenColor, setChosenColor] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [start, setStart] = useState<string | null>(null)
  const [end, setEnd] = useState<string | null>(null)
  const [imageIndex, setImageIndex] = useState(0)

  const mode: CartMode = chosenMode ?? gear?.availableFor[0] ?? "rent"
  const color = chosenColor ?? gear?.colors[0] ?? ""

  const availability = useAvailability(mode === "rent" ? gear?._id : undefined, start, end)

  const images = useMemo(() => {
    if (!gear) return []
    return Array.from(new Set([gear.image, ...gear.images].filter(Boolean)))
  }, [gear])

  if (isLoading) {
    return (
      <Screen>
        <LoadingView label="Loading gear…" />
      </Screen>
    )
  }
  if (isError || !gear) {
    return (
      <Screen>
        <ErrorView message={isError ? errorMessage(error) : "This item could not be found."} onRetry={() => void refetch()} />
      </Screen>
    )
  }

  const rentable = gear.availableFor.includes("rent")
  const sellable = gear.availableFor.includes("sale") && typeof gear.salePrice === "number"
  const unitPrice = mode === "rent" ? gear.discountedPrice : (gear.salePrice ?? 0)
  const freeUnits = mode === "rent" && availability.data ? availability.data.quantityAvailable : null
  const maxQty = Math.max(1, Math.min(20, freeUnits ?? 20))
  const qty = Math.min(quantity, maxQty)
  const soldOutForDates = freeUnits !== null && freeUnits <= 0
  const days = start && end ? countDays(start, end) : 0
  const total = mode === "rent" ? (days > 0 ? unitPrice * qty * days : null) : unitPrice * qty

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))

  const onAdd = () => {
    addItem(gear._id, qty, mode, color || undefined)
    toast.show(`${gear.name} added to cart`, "success")
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: gear.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        {images.length > 0 ? (
          <View>
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={images}
              keyExtractor={(uri, i) => `${i}-${uri}`}
              onMomentumScrollEnd={onScroll}
              renderItem={({ item }) => (
                <Image source={{ uri: optimizeImage(item, width * 2) }} style={{ width, height: width * 0.8 }} contentFit="cover" transition={150} accessibilityLabel={gear.name} />
              )}
            />
            {images.length > 1 ? (
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.noImage, { height: width * 0.6 }]}>
            <Ionicons name="image-outline" size={48} color={colors.forest300} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.badges}>
            {categoryName(gear.category) ? <Badge label={categoryName(gear.category)} tone="blue" /> : null}
            {gear.isNew ? <Badge label="New" tone="green" /> : null}
            {rentable ? <Badge label="For rent" tone="gray" /> : null}
            {sellable ? <Badge label="For sale" tone="gray" /> : null}
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {gear.name}
          </Text>

          <View style={styles.priceBox}>
            {rentable ? (
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatRs(gear.discountedPrice)}</Text>
                <Text style={styles.unit}>per day</Text>
                {gear.discountedPrice < gear.realPrice ? <Text style={styles.strike}>{formatRs(gear.realPrice)}</Text> : null}
              </View>
            ) : null}
            {sellable ? <Text style={styles.sale}>Buy for {formatRs(gear.salePrice as number)}</Text> : null}
          </View>

          {gear.description ? <Text style={styles.desc}>{gear.description}</Text> : null}

          {rentable && sellable ? (
            <View style={styles.segment}>
              {(["rent", "sale"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setChosenMode(m)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === m }}
                  style={[styles.segBtn, mode === m && styles.segBtnActive]}
                >
                  <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m === "rent" ? "Rent" : "Buy"}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {gear.colors.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Colour</Text>
              <View style={styles.chips}>
                {gear.colors.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setChosenColor(c)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: color === c }}
                    style={[styles.chip, color === c && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, color === c && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {mode === "rent" ? (
            <View style={styles.block}>
              <DateRangeField
                label="Check availability (optional)"
                start={start}
                end={end}
                onChange={(s, e) => {
                  setStart(s)
                  setEnd(e)
                }}
              />
              {availability.isFetching ? (
                <Text style={styles.avail}>Checking stock…</Text>
              ) : availability.isError ? (
                <Text style={[styles.avail, styles.availBad]}>{errorMessage(availability.error)}</Text>
              ) : availability.data ? (
                <Text style={[styles.avail, soldOutForDates ? styles.availBad : styles.availGood]}>
                  {soldOutForDates ? "Not available for these dates." : `${availability.data.quantityAvailable} available for these dates.`}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Quantity</Text>
            <QuantityStepper value={qty} onChange={setQuantity} max={maxQty} />
          </View>

          {Object.keys(gear.specs).length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Specifications</Text>
              <View style={styles.specs}>
                {Object.entries(gear.specs).map(([key, value]) => (
                  <View key={key} style={styles.specRow}>
                    <Text style={styles.specKey}>{key}</Text>
                    <Text style={styles.specVal}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {gear.longDescription ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Details</Text>
              <HtmlText html={gear.longDescription} />
            </View>
          ) : null}

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <Text style={styles.noteText}>Pay in cash on pickup or delivery. Delivery charges are quoted separately on WhatsApp.</Text>
          </View>
          <Button
            title="Ask about this item on WhatsApp"
            variant="outline"
            icon="logo-whatsapp"
            onPress={() => void openWhatsApp(`Hi Yatriko Gears! I have a question about "${gear.name}".`)}
          />
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <View style={styles.barPrice}>
          <Text style={styles.barLabel}>{mode === "rent" ? (total === null ? "Per day" : `${days} day${days === 1 ? "" : "s"} · estimate`) : "Total"}</Text>
          <Text style={styles.barValue}>{formatRs(total ?? unitPrice * qty)}</Text>
        </View>
        <Button
          title="Add to cart"
          icon="bag-add"
          onPress={onAdd}
          disabled={soldOutForDates || (mode === "sale" && !sellable)}
          style={styles.barBtn}
        />
        <Button title="Cart" variant="secondary" onPress={() => router.push("/cart")} style={styles.cartBtn} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  dots: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.6)" },
  dotActive: { backgroundColor: colors.white, width: 18 },
  noImage: { backgroundColor: colors.forest50, alignItems: "center", justifyContent: "center" },
  body: { padding: spacing.lg, gap: spacing.lg },
  badges: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  title: { fontSize: 24, fontWeight: "800", color: colors.navy900 },
  priceBox: { gap: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap" },
  price: { fontSize: 26, fontWeight: "800", color: colors.forest700 },
  unit: { fontSize: 14, color: colors.textMuted },
  strike: { fontSize: 14, color: colors.textFaint, textDecorationLine: "line-through" },
  sale: { fontSize: 15, color: colors.textMuted },
  desc: { fontSize: 15, lineHeight: 22, color: colors.text },
  segment: { flexDirection: "row", backgroundColor: colors.forest100, borderRadius: radius.md, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm },
  segBtnActive: { backgroundColor: colors.white },
  segText: { fontWeight: "600", color: colors.forest800 },
  segTextActive: { color: colors.forest700 },
  block: { gap: spacing.sm },
  blockTitle: { fontSize: 15, fontWeight: "700", color: colors.navy900 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  chipActive: { borderColor: colors.forest600, backgroundColor: colors.forest50 },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.navy800 },
  chipTextActive: { color: colors.forest700 },
  avail: { fontSize: 13, color: colors.textMuted },
  availGood: { color: colors.success, fontWeight: "600" },
  availBad: { color: colors.danger, fontWeight: "600" },
  specs: { backgroundColor: colors.white, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  specRow: { flexDirection: "row", padding: spacing.md, gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  specKey: { flex: 1, fontSize: 14, color: colors.textMuted, textTransform: "capitalize" },
  specVal: { flex: 1.4, fontSize: 14, fontWeight: "600", color: colors.text },
  note: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.infoBg, padding: spacing.md, borderRadius: radius.md },
  noteText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 18 },
  bar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  barPrice: { flex: 1.1 },
  barLabel: { fontSize: 11, color: colors.textMuted },
  barValue: { fontSize: 18, fontWeight: "800", color: colors.navy900 },
  barBtn: { flex: 1.5, paddingHorizontal: spacing.md },
  cartBtn: { paddingHorizontal: spacing.md },
})
