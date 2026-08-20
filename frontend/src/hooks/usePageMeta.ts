import { useEffect } from "react"

const SITE_NAME = "Yatriko Gears"
const SITE_URL = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? "https://yatrikogears.com"

type PageMeta = {
  title: string
  description: string
  /** Path only, e.g. "/gear" — combined with VITE_SITE_URL for the canonical. */
  path?: string
  image?: string
  /** Keep thin or private pages (login, checkout) out of Google. */
  noIndex?: boolean
}

function setTag(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta")
    document.head.appendChild(el)
  }
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
}

/**
 * Per-route title, description, canonical and social cards.
 *
 * A single-page app serves one index.html to every URL, so without this every
 * page shares one title and Google has nothing to distinguish /gear from
 * /portfolio. For a local rental business that search traffic is the point.
 */
export function usePageMeta({ title, description, path, image, noIndex = false }: PageMeta) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
    const url = `${SITE_URL}${path ?? window.location.pathname}`
    const ogImage = image ?? `${SITE_URL}/og-image.jpg`

    document.title = fullTitle

    setTag('meta[name="description"]', { name: "description", content: description })
    setTag('link[rel="canonical"]', { rel: "canonical", href: url })
    setTag('meta[name="robots"]', {
      name: "robots",
      content: noIndex ? "noindex, nofollow" : "index, follow",
    })

    // Open Graph — what Facebook, WhatsApp and Viber show when the link is shared.
    setTag('meta[property="og:title"]', { property: "og:title", content: fullTitle })
    setTag('meta[property="og:description"]', { property: "og:description", content: description })
    setTag('meta[property="og:url"]', { property: "og:url", content: url })
    setTag('meta[property="og:image"]', { property: "og:image", content: ogImage })
    setTag('meta[property="og:type"]', { property: "og:type", content: "website" })
    setTag('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME })

    setTag('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" })
    setTag('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle })
    setTag('meta[name="twitter:description"]', { name: "twitter:description", content: description })
    setTag('meta[name="twitter:image"]', { name: "twitter:image", content: ogImage })
  }, [title, description, path, image, noIndex])
}
