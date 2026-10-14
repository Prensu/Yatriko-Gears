import { useCallback, useMemo, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { FlashList } from "@shopify/flash-list"
import { Ionicons } from "@expo/vector-icons"
import { GearCard } from "@/components/GearCard"
import { Screen } from "@/components/Screen"
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews"
import { useCategories, useGearInfinite } from "@/hooks/useCatalogue"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { errorMessage } from "@/lib/api"
import { colors, radius, spacing } from "@/theme"
import type { Gear } from "@/types"

export default function BrowseScreen() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [mode, setMode] = useState<"rent" | "sale">("rent")
  const debouncedSearch = useDebouncedValue(search.trim())

  const categories = useCategories()
  const query = useGearInfinite({ category, search: debouncedSearch })

  const allItems = useMemo<Gear[]>(() => query.data?.pages.flatMap((p) => p.gear) ?? [], [query.data])

  // Filter client-side by the selected mode (rent / sale)
  const items = useMemo<Gear[]>(
    () => allItems.filter((g) => g.availableFor.includes(mode)),
    [allItems, mode],
  )

  const onEnd = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage()
  }, [query])

  return (
    <Screen>
      <View style={styles.top}>
        {/* ── Rent / Buy mode toggle ── */}
        <View style={styles.modeRow}>
          <View style={styles.segment}>
            {(["rent", "sale"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === m }}
                style={[styles.segBtn, mode === m && styles.segBtnActive]}
              >
                <Text style={[styles.segText, mode === m && styles.segTextActive]}>
                  {m === "rent" ? "🏕️  Rent" : "🛒  Buy"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search tents, jackets, sleeping bags…"
            placeholderTextColor={colors.textFaint}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search gear"
            style={styles.searchInput}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={category === ""} onPress={() => setCategory("")} />
          {(categories.data ?? []).map((c) =>
            c.slug ? <Chip key={c._id} label={c.name ?? c.slug} active={category === c.slug} onPress={() => setCategory(c.slug as string)} /> : null,
          )}
        </ScrollView>
      </View>

      {query.isLoading ? (
        <LoadingView label="Loading gear…" />
      ) : query.isError && items.length === 0 ? (
        <ErrorView message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(g) => g._id}
          numColumns={2}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReached={onEnd}
          onEndReachedThreshold={0.6}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => void query.refetch()}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <GearCard gear={item} mode={mode} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyView
              icon={mode === "rent" ? "calendar-outline" : "bag-handle-outline"}
              title={mode === "rent" ? "No rental gear found" : "No gear for sale found"}
              message={
                debouncedSearch
                  ? `Nothing matches "${debouncedSearch}".`
                  : `Nothing in this category is available for ${mode === "rent" ? "rent" : "sale"} yet.`
              }
            />
          }
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={colors.forest600} /> : null}
        />
      )}
    </Screen>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  top: { paddingTop: spacing.md, gap: spacing.md },
  modeRow: { paddingHorizontal: spacing.lg },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.forest100,
    borderRadius: radius.md,
    padding: 4,
  },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm },
  segBtnActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segText: { fontSize: 14, fontWeight: "700", color: colors.forest800 },
  segTextActive: { color: colors.forest700 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, minHeight: 46, fontSize: 15, color: colors.text },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.forest600, borderColor: colors.forest600 },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.navy800 },
  chipTextActive: { color: colors.white },
  list: { padding: spacing.sm, paddingTop: spacing.md },
  cell: { flex: 1, padding: spacing.xs },
  footer: { padding: spacing.lg },
})
