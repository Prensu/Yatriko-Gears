import { AppState, Platform, type AppStateStatus } from "react-native"
import { focusManager, QueryClient } from "@tanstack/react-query"

/**
 * staleTime 60s: the catalogue rarely changes, and mobile data is slow and
 * metered in Nepal. retry 1: a free-tier cold start is handled by the 60s
 * axios timeout, so more retries would only hide real errors.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 10 * 60_000, retry: 1 },
  },
})

/** React Native has no window focus: treat "app came to foreground" as focus. */
export function subscribeAppFocus(): () => void {
  const onChange = (state: AppStateStatus) => {
    if (Platform.OS !== "web") focusManager.setFocused(state === "active")
  }
  const sub = AppState.addEventListener("change", onChange)
  return () => sub.remove()
}
