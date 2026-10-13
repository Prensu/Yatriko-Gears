import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, radius, spacing } from "@/theme"

type ToastKind = "success" | "error" | "info"
type ToastState = { id: number; message: string; kind: ToastKind }

type ToastContextValue = {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const BG: Record<ToastKind, string> = {
  success: colors.forest700,
  error: colors.danger,
  info: colors.navy800,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  const [toast, setToast] = useState<ToastState | null>(null)
  const opacity = useRef(new Animated.Value(0)).current
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(
    (message: string, kind: ToastKind = "info") => {
      if (timer.current) clearTimeout(timer.current)
      setToast({ id: Date.now(), message, kind })
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start()
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null))
      }, kind === "error" ? 4500 : 2500)
    },
    [opacity],
  )

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 88 }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[styles.toast, { backgroundColor: BG[toast.kind], opacity }]}
          >
            <Text style={styles.text}>{toast.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used inside <ToastProvider>")
  return context
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: spacing.lg, right: spacing.lg, alignItems: "center" },
  toast: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, maxWidth: 480 },
  text: { color: colors.white, fontSize: 14, fontWeight: "500" },
})
