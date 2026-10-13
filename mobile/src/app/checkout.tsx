import { useEffect, useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import { useQueries, useQueryClient } from "@tanstack/react-query"
import { fetchAvailability, createBooking } from "@/api/booking"
import { Button } from "@/components/Button"
import { DateRangeField } from "@/components/DateRangeField"
import { Screen } from "@/components/Screen"
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { useToast } from "@/context/ToastContext"
import { bookingKeys } from "@/hooks/useBookings"
import { useGearIndex } from "@/hooks/useCatalogue"
import { errorMessage } from "@/lib/api"
import { countDays } from "@/lib/dates"
import { formatRs } from "@/lib/format"
import { colors, radius, spacing } from "@/theme"
import { cartCheckoutSchema, validateForm } from "@/types/forms"

export default function CheckoutScreen() {
  const { user, status } = useAuth()
  const { items, ready, clearCart } = useCart()
  const { byId, isLoading, isError, error, refetch } = useGearIndex()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [note, setNote] = useState("")
  const [start, setStart] = useState<string | null>(null)
  const [end, setEnd] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")

  // Pre-fill once from the signed-in profile; never overwrite what the user typed.
  useEffect(() => {
    if (!user) return
    setName((v) => v || user.name)
    setPhone((v) => v || (user.phone ?? ""))
    setAddress((v) => v || user.address)
  }, [user])

  const rentLines = useMemo(() => items.filter((i) => i.mode === "rent"), [items])
  const hasRent = rentLines.length > 0
  const days = start && end ? countDays(start, end) : 0

  // Total units wanted per gear (the same gear can appear in several colour lines).
  const wantedByGear = useMemo(() => {
    const map = new Map<string, number>()
    for (const line of rentLines) map.set(line.gearId, (map.get(line.gearId) ?? 0) + line.quantity)
    return map
  }, [rentLines])

  const availabilityQueries = useQueries({
    queries: [...wantedByGear.keys()].map((gearId) => ({
      queryKey: bookingKeys.availability(gearId, start ?? "", end ?? ""),
      queryFn: () => fetchAvailability(gearId, start as string, end as string),
      enabled: Boolean(start && end),
      staleTime: 30_000,
    })),
  })

  const shortages = useMemo(() => {
    const out: { name: string; wanted: number; free: number }[] = []
    ;[...wantedByGear.entries()].forEach(([gearId, wanted], i) => {
      const data = availabilityQueries[i]?.data
      if (data && data.quantityAvailable < wanted) {
        out.push({ name: byId.get(gearId)?.name ?? data.name, wanted, free: data.quantityAvailable })
      }
    })
    return out
  }, [availabilityQueries, wantedByGear, byId])
  const checkingStock = availabilityQueries.some((q) => q.isFetching)

  const { rentPerDay, buyTotal, unavailable } = useMemo(() => {
    let rent = 0
    let buy = 0
    let missing = 0
    for (const item of items) {
      const gear = byId.get(item.gearId)
      const price = !gear ? null : item.mode === "sale" ? (gear.salePrice ?? null) : gear.discountedPrice
      if (price === null) {
        missing += 1
        continue
      }
      if (item.mode === "rent") rent += price * item.quantity
      else buy += price * item.quantity
    }
    return { rentPerDay: rent, buyTotal: buy, unavailable: missing }
  }, [items, byId])

  const estimate = rentPerDay * days + buyTotal

  if (status === "loading" || !ready || (isLoading && items.length > 0)) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    )
  }
  if (status === "guest") {
    return (
      <Screen>
        <EmptyView
          icon="person-circle-outline"
          title="Sign in to book"
          message="We need an account to keep track of your booking and contact you."
          actionTitle="Sign in"
          onAction={() => router.push("/login")}
        />
      </Screen>
    )
  }
  if (items.length === 0) {
    return (
      <Screen>
        <EmptyView icon="bag-handle-outline" title="Your cart is empty" actionTitle="Browse gear" onAction={() => router.replace("/browse")} />
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

  const submit = async () => {
    setServerError("")
    const values = {
      name,
      phone,
      deliveryAddress: address,
      note,
      startDate: hasRent ? (start ?? "") : "",
      endDate: hasRent ? (end ?? "") : "",
    }
    const result = validateForm(cartCheckoutSchema, values)
    const nextErrors = result.ok ? {} : { ...result.errors }
    if (hasRent && !start) nextErrors.startDate = "Pick your pickup and return dates"
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    if (shortages.length > 0) {
      setServerError("Some items are not available in the quantity you chose for these dates.")
      return
    }

    setSubmitting(true)
    try {
      const booking = await createBooking({
        items: items.map((i) => ({ gear: i.gearId, quantity: i.quantity, mode: i.mode, ...(i.color ? { color: i.color } : {}) })),
        name: name.trim(),
        phone: phone.trim(),
        deliveryAddress: address.trim(),
        note: note.trim(),
        ...(hasRent && start && end ? { startDate: start, endDate: end } : {}),
      })
      clearCart()
      void queryClient.invalidateQueries({ queryKey: bookingKeys.my })
      toast.show("Booking placed", "success")
      router.replace({ pathname: "/booking-success", params: { code: booking.code } })
    } catch (err) {
      setServerError(errorMessage(err, "We could not place your booking."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {hasRent ? (
            <View style={styles.card}>
              <Text style={styles.heading}>When do you need it?</Text>
              <DateRangeField
                start={start}
                end={end}
                onChange={(s, e) => {
                  setStart(s)
                  setEnd(e)
                  setErrors((prev) => ({ ...prev, startDate: "" }))
                }}
                error={errors.startDate || errors.endDate}
              />
              {checkingStock ? <Text style={styles.muted}>Checking stock…</Text> : null}
              {shortages.map((s) => (
                <Text key={s.name} style={styles.bad}>
                  {s.name}: you want {s.wanted}, only {s.free} free on these dates.
                </Text>
              ))}
              {start && end && !checkingStock && shortages.length === 0 ? <Text style={styles.good}>Everything is available for these dates.</Text> : null}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.heading}>Delivery details</Text>
            <TextField label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" error={errors.name} />
            <TextField
              label="Mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              placeholder="98XXXXXXXX"
              error={errors.phone}
            />
            <TextField
              label="Delivery address"
              value={address}
              onChangeText={setAddress}
              autoComplete="street-address"
              textContentType="fullStreetAddress"
              error={errors.deliveryAddress}
            />
            <TextField label="Note (optional)" value={note} onChangeText={setNote} multiline maxLength={500} error={errors.note} />
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Summary</Text>
            {hasRent ? (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>
                  Rentals {formatRs(rentPerDay)} × {days || "?"} day{days === 1 ? "" : "s"}
                </Text>
                <Text style={styles.sumValue}>{days ? formatRs(rentPerDay * days) : "-"}</Text>
              </View>
            ) : null}
            {buyTotal > 0 ? (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Purchases</Text>
                <Text style={styles.sumValue}>{formatRs(buyTotal)}</Text>
              </View>
            ) : null}
            <View style={[styles.sumRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Estimated total</Text>
              <Text style={styles.totalValue}>{hasRent && !days ? "Pick dates" : formatRs(estimate)}</Text>
            </View>
            <Text style={styles.muted}>The final price is calculated by our server. Pay cash on pickup or delivery. Delivery is quoted separately on WhatsApp.</Text>
          </View>

          {serverError ? (
            <Text accessibilityLiveRegion="polite" style={styles.serverError}>
              {serverError}
            </Text>
          ) : null}
          <Button
            title="Place booking"
            icon="checkmark-circle"
            onPress={() => void submit()}
            loading={submitting}
            disabled={unavailable > 0 || shortages.length > 0}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  heading: { fontSize: 17, fontWeight: "700", color: colors.navy900 },
  muted: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  good: { fontSize: 13, color: colors.success, fontWeight: "600" },
  bad: { fontSize: 13, color: colors.danger, fontWeight: "600" },
  sumRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  sumLabel: { flex: 1, fontSize: 14, color: colors.textMuted },
  sumValue: { fontSize: 14, fontWeight: "700", color: colors.navy900 },
  totalRow: { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.navy900 },
  totalValue: { fontSize: 18, fontWeight: "800", color: colors.forest700 },
  serverError: { backgroundColor: colors.dangerBg, color: colors.danger, padding: spacing.md, borderRadius: radius.md, fontSize: 14, fontWeight: "600" },
})
