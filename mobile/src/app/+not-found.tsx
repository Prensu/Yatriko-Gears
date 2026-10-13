import { router } from "expo-router"
import { Screen } from "@/components/Screen"
import { EmptyView } from "@/components/StateViews"

export default function NotFound() {
  return (
    <Screen>
      <EmptyView
        icon="compass-outline"
        title="Page not found"
        message="That link doesn't lead anywhere in the app."
        actionTitle="Go to home"
        onAction={() => router.replace("/")}
      />
    </Screen>
  )
}
