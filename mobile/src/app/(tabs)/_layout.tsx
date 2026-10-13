import type { ColorValue } from "react-native"
import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { CartHeaderButton } from "@/components/HeaderButtons"
import { colors } from "@/theme"

type IconName = keyof typeof Ionicons.glyphMap

const tab = (title: string, active: IconName, inactive: IconName) => ({
  title,
  tabBarIcon: ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  ),
})

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.forest900 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
        headerRight: () => <CartHeaderButton />,
        tabBarActiveTintColor: colors.forest600,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.sand },
      }}
    >
      <Tabs.Screen name="index" options={{ ...tab("Home", "home", "home-outline"), title: "Yatriko Gears", tabBarLabel: "Home" }} />
      <Tabs.Screen name="browse" options={{ ...tab("Browse", "search", "search-outline"), title: "Browse gear" }} />
      <Tabs.Screen name="chat" options={{ ...tab("Assistant", "chatbubbles", "chatbubbles-outline"), title: "Gear assistant" }} />
      <Tabs.Screen name="bookings" options={{ ...tab("Bookings", "calendar", "calendar-outline"), title: "My bookings" }} />
      <Tabs.Screen name="account" options={{ ...tab("Account", "person", "person-outline"), title: "Account", headerRight: () => null }} />
    </Tabs>
  )
}
