import { Alert, FlatList, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import { Button } from "@/components/Button"
import { StatusBadge } from "@/components/Badge"
import { Screen } from "@/components/Screen"
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews"
import { useAuth } from "@/context/AuthContext"
import { useCancelBooking, useMyBookings } from "@/hooks/useBookings"
import { errorMessage } from "@/lib/api"
import { formatDate, formatDateRange } from "@/lib/dates"
import { formatRs } from "@/lib/format"
import { openWhatsApp } from "@/lib/links"
import { colors, radius, shadow, spacing } from "@/theme"
import type { Booking } from "@/types"

export default function BookingsScreen() {
  const { status } = useAuth()
  const query = useMyBookings()
  const cancel = useCancelBooking()

  if (status === "loading") {
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
          icon="calendar-outline"
          title="Sign in to see your bookings"
          message="Your rentals and orders will show up here."
          actionTitle="Sign in"
          onAction={() => router.push("/login")}
        />
      </Screen>
    )
  }
  if (query.isLoading) {
    return (
      <Screen>
        <LoadingView label="Loading your bookings…" />
      </Screen>
    )
  }
  if (query.isError && !query.data) {
    return (
      <Screen>
        <ErrorView message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      </Screen>
    )
  }

  const confirmCancel = (booking: Booking) =>
    Alert.alert("Cancel this booking?", `Booking ${booking.code} will be cancelled.`, [
      { text: "Keep it", style: "cancel" },
      { text: "Cancel booking", style: "destructive", onPress: () => cancel.mutate(booking._id) },
    ])

  return (
    <Screen>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(b) => b._id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        ListEmptyComponent={
          <EmptyView
            icon="calendar-outline"
            title="No bookings yet"
            message="When you book gear it will appear here."
            actionTitle="Browse gear"
            onAction={() => router.push("/browse")}
          />
        }
        renderItem={({ item }) => {
          const canCancel = item.status === "pending" && item.paymentStatus === "unpaid"
          const cancellingThis = cancel.isPending && cancel.variables === item._id
          return (
            <View style={styles.card}>
              <View style={styles.head}>
                <View style={styles.flex}>
                  <Text style={styles.code}>{item.code}</Text>
                  <Text style={styles.date}>{item.createdAt ? `Placed ${formatDate(item.createdAt)}` : ""}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              {item.startDate ? <Text style={styles.dates}>{formatDateRange(item.startDate, item.endDate)}{item.days ? `  ·  ${item.days} day${item.days === 1 ? "" : "s"}` : ""}</Text> : null}

              <View style={styles.items}>
                {item.items.map((line, i) => (
                  <Text key={`${item._id}-${i}`} style={styles.line}>
                    {line.quantity} × {line.name}
                    {line.color ? ` (${line.color})` : ""}
                    <Text style={styles.mode}>  {line.mode === "sale" ? "buy" : "rent"}</Text>
                  </Text>
                ))}
              </View>

              <View style={styles.foot}>
                <View>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.total}>{formatRs(item.total)}</Text>
                </View>
                <Text style={[styles.pay, item.paymentStatus === "paid" && styles.paid]}>{item.paymentStatus === "paid" ? "Paid" : item.paymentStatus === "refunded" ? "Refunded" : "Pay on delivery"}</Text>
              </View>

              <View style={styles.actions}>
                <Button
                  title="WhatsApp"
                  variant="secondary"
                  small
                  icon="logo-whatsapp"
                  onPress={() => void openWhatsApp(`Hi Yatriko Gears! About my booking ${item.code}.`)}
                />
                {canCancel ? (
                  <Button title="Cancel" variant="danger" small loading={cancellingThis} onPress={() => confirmCancel(item)} />
                ) : null}
              </View>
            </View>
          )
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  flex: { flex: 1 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, ...shadow.card },
  head: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  code: { fontSize: 17, fontWeight: "800", color: colors.navy900, letterSpacing: 0.5 },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dates: { fontSize: 14, fontWeight: "600", color: colors.forest700 },
  items: { gap: 4 },
  line: { fontSize: 14, color: colors.text },
  mode: { fontSize: 12, color: colors.textFaint },
  foot: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 11, color: colors.textMuted },
  total: { fontSize: 18, fontWeight: "800", color: colors.navy900 },
  pay: { fontSize: 13, fontWeight: "600", color: colors.warning },
  paid: { color: colors.success },
  actions: { flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end" },
})
