import { useEffect, type ReactNode } from "react"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as SplashScreen from "expo-splash-screen"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { CartProvider } from "@/context/CartContext"
import { ToastProvider } from "@/context/ToastContext"
import { CartHeaderButton } from "@/components/HeaderButtons"
import { queryClient, subscribeAppFocus } from "@/lib/queryClient"
import { colors } from "@/theme"

void SplashScreen.preventAutoHideAsync()

/** Keeps the splash screen up until we know whether the user is signed in. */
function SplashGate({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  useEffect(() => {
    if (status !== "loading") void SplashScreen.hideAsync()
  }, [status])
  return <>{children}</>
}

export default function RootLayout() {
  useEffect(() => subscribeAppFocus(), [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <SplashGate>
                  <StatusBar style="light" />
                  <Stack
                    screenOptions={{
                      headerStyle: { backgroundColor: colors.forest900 },
                      headerTintColor: colors.white,
                      headerTitleStyle: { fontWeight: "700" },
                      contentStyle: { backgroundColor: colors.sand },
                    }}
                  >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="gear/[slug]"
                      options={{ title: "Gear", headerBackTitle: "Back", headerRight: () => <CartHeaderButton /> }}
                    />
                    <Stack.Screen name="cart" options={{ title: "Your cart" }} />
                    <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
                    <Stack.Screen
                      name="booking-success"
                      options={{ title: "Booking placed", headerBackVisible: false, gestureEnabled: false }}
                    />
                    <Stack.Screen name="contact" options={{ title: "Contact us" }} />
                    <Stack.Screen name="edit-profile" options={{ title: "Edit profile" }} />
                    <Stack.Screen name="login" options={{ title: "Sign in", presentation: "modal" }} />
                    <Stack.Screen name="register" options={{ title: "Create account" }} />
                    <Stack.Screen name="forgot-password" options={{ title: "Forgot password" }} />
                    <Stack.Screen name="reset-password" options={{ title: "Reset password" }} />
                    <Stack.Screen name="+not-found" options={{ title: "Not found" }} />
                  </Stack>
                </SplashGate>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
