import { flushSync } from "react-dom"
import type { NavigateFunction, NavigateOptions, To } from "react-router-dom"
import { loadGearDetailPage, loadGearPage } from "@/lib/routes"

export type PreloadRouteName = "gear" | "gearDetail"

type TransitionOptions = NavigateOptions & {
  sharedElement?: HTMLElement | null
}

const routeLoaders: Record<PreloadRouteName, () => Promise<unknown>> = {
  gear: loadGearPage,
  gearDetail: loadGearDetailPage,
}

export function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function" &&
    !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  )
}

export function preloadRoute(name: PreloadRouteName): void {
  void routeLoaders[name]()
}

export function navigateWithTransition(
  navigate: NavigateFunction,
  to: To,
  options: TransitionOptions = {},
) {
  const { sharedElement, ...navigateOptions } = options

  if (!supportsViewTransitions()) {
    navigate(to, navigateOptions)
    return undefined
  }

  if (sharedElement) sharedElement.style.viewTransitionName = "gear-image"

  const transition = document.startViewTransition!(() => {
    flushSync(() => navigate(to, navigateOptions))
  })

  void transition.finished
    .catch(() => undefined)
    .finally(() => {
      if (sharedElement) sharedElement.style.viewTransitionName = ""
    })

  return transition
}
