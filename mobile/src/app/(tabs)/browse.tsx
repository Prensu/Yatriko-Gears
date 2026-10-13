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
  const debouncedSearch = useDebouncedValue(search.trim())

  const categories = useCategories()
  const query = useGearInfinite({ category, search: debouncedSearch })

  const items = useMemo<Gear[]>(() => query.data?.pages.flatMap((p) => p.gear) ?? [], [query.data])

  const onEnd = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage()
  }, [query])

  return (
    <Screen>
      <View style={styles.top}>
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
              <GearCard gear={item} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyView
              icon="search-outline"
              title="No gear found"
              message={debouncedSearch ? `Nothing matches "${debouncedSearch}".` : "Nothing in this category yet."}
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
