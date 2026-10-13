import { useCallback, useState } from "react"
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { router } from "expo-router"
import { Button } from "@/components/Button"
import { GearCard } from "@/components/GearCard"
import { SectionHeader } from "@/components/SectionHeader"
import { LoadingView } from "@/components/StateViews"
import { BUSINESS } from "@/config"
import { useDestinations, useGearIndex, usePackages } from "@/hooks/useCatalogue"
import { errorMessage } from "@/lib/api"
import { formatRs } from "@/lib/format"
import { optimizeImage } from "@/lib/image"
import { callShop, emailShop, openSafeUrl, openWhatsApp } from "@/lib/links"
import { colors, radius, shadow, spacing } from "@/theme"

const FEATURED_COUNT = 8

export default function HomeScreen() {
  const gearQuery = useGearIndex()
  const packagesQuery = usePackages()
  const destinationsQuery = useDestinations()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.allSettled([gearQuery.refetch(), packagesQuery.refetch(), destinationsQuery.refetch()])
    setRefreshing(false)
  }, [gearQuery, packagesQuery, destinationsQuery])

  const featured = gearQuery.gear.slice(0, FEATURED_COUNT)
  const packages = packagesQuery.data ?? []
  const destinations = destinationsQuery.data ?? []

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest600} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>Gabu, Khokana, Lalitpur</Text>
        <Text style={styles.heroTitle}>{BUSINESS.tagline}</Text>
        <Text style={styles.heroBody}>Tents, sleeping bags, jackets and more, for your next trek or camping trip.</Text>
        <View style={styles.heroActions}>
          <Button title="Browse gear" icon="search" onPress={() => router.push("/browse")} style={styles.heroBtn} />
          <Button title="WhatsApp" variant="whatsapp" icon="logo-whatsapp" onPress={() => void openWhatsApp()} style={styles.heroBtn} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Featured gear" actionTitle="See all" onAction={() => router.push("/browse")} />
        {gearQuery.isLoading ? (
          <LoadingView label="Loading gear…" />
        ) : gearQuery.isError ? (
          <View style={styles.inlineError}>
            <Text style={styles.inlineErrorText}>{errorMessage(gearQuery.error)}</Text>
            <Button title="Retry" variant="secondary" small onPress={() => void gearQuery.refetch()} />
          </View>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featured}
            keyExtractor={(g) => g._id}
            contentContainerStyle={styles.hList}
            ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
            renderItem={({ item }) => <GearCard gear={item} width={190} />}
          />
        )}
      </View>

      {packages.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Trek packages" />
          <View style={styles.vList}>
            {packages.map((pkg) => (
              <View key={pkg._id} style={styles.pkg}>
                <View style={styles.pkgHead}>
                  <Text style={styles.pkgName}>{pkg.name}</Text>
                  <Text style={styles.pkgPrice}>{formatRs(pkg.price)}</Text>
                </View>
                {pkg.description ? <Text style={styles.pkgDesc}>{pkg.description}</Text> : null}
                {pkg.items.slice(0, 5).map((item, i) => (
                  <Text key={`${pkg._id}-${i}`} style={styles.pkgItem}>
                    •  {item}
                  </Text>
                ))}
                {pkg.items.length > 5 ? <Text style={styles.pkgMore}>+{pkg.items.length - 5} more items</Text> : null}
                <Button
                  title="Ask about this package"
                  variant="outline"
                  small
                  icon="logo-whatsapp"
                  onPress={() => void openWhatsApp(`Hi Yatriko Gears! I'm interested in the "${pkg.name}" package.`)}
                  style={styles.pkgBtn}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {destinations.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Camping spots" />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={destinations}
            keyExtractor={(d) => d._id}
            contentContainerStyle={styles.hList}
            ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
            renderItem={({ item }) => (
              <View style={styles.spot}>
                <Image source={{ uri: optimizeImage(item.image, 500) }} style={styles.spotImg} contentFit="cover" transition={150} />
                <View style={styles.spotBody}>
                  <Text style={styles.spotName}>{item.name}</Text>
                  {item.blurb ? (
                    <Text numberOfLines={2} style={styles.spotBlurb}>
                      {item.blurb}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
          />
        </View>
      ) : null}

      <View style={[styles.section, styles.contact]}>
        <SectionHeader title="Visit or contact us" />
        <View style={styles.contactCard}>
          <Text style={styles.contactLine}>{BUSINESS.address}</Text>
          <View style={styles.contactActions}>
            <Button title="Call" icon="call" small variant="secondary" onPress={() => void callShop()} />
            <Button title="Email" icon="mail" small variant="secondary" onPress={() => void emailShop()} />
            <Button title="Map" icon="location" small variant="secondary" onPress={() => void openSafeUrl(BUSINESS.mapsUrl)} />
          </View>
          <Pressable onPress={() => router.push("/contact")} accessibilityRole="link">
            <Text style={styles.link}>Send us a message</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  hero: { backgroundColor: colors.forest800, padding: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm },
  heroKicker: { color: colors.forest300, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  heroTitle: { color: colors.white, fontSize: 28, fontWeight: "800", lineHeight: 34 },
  heroBody: { color: colors.forest100, fontSize: 15, lineHeight: 21 },
  heroActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  heroBtn: { flex: 1 },
  section: { marginTop: spacing.xl, gap: spacing.md },
  hList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  vList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  inlineError: { marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.dangerBg, gap: spacing.sm, alignItems: "flex-start" },
  inlineErrorText: { color: colors.danger, fontSize: 14 },
  pkg: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, gap: 4, ...shadow.card },
  pkgHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: spacing.md },
  pkgName: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.navy900 },
  pkgPrice: { fontSize: 17, fontWeight: "800", color: colors.forest700 },
  pkgDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  pkgItem: { fontSize: 14, color: colors.text },
  pkgMore: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  pkgBtn: { marginTop: spacing.md },
  spot: { width: 240, backgroundColor: colors.white, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  spotImg: { width: "100%", height: 130, backgroundColor: colors.forest50 },
  spotBody: { padding: spacing.md, gap: 2 },
  spotName: { fontSize: 15, fontWeight: "700", color: colors.navy900 },
  spotBlurb: { fontSize: 13, color: colors.textMuted },
  contact: { marginBottom: spacing.lg },
  contactCard: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, ...shadow.card },
  contactLine: { fontSize: 15, color: colors.text },
  contactActions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  link: { color: colors.forest600, fontWeight: "600", fontSize: 14 },
})
