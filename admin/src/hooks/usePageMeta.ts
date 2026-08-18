import { useEffect } from "react"

/** Keeps the browser tab honest about which CMS screen is open. */
export function usePageMeta(title: string): void {
  useEffect(() => {
    document.title = `${title} · Yatriko Admin`
  }, [title])
}
