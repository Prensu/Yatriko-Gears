/**
 * Cloudinary can resize and re-encode on the fly. Asking for a width that
 * matches the screen (and f_auto/q_auto) keeps list screens light on mobile
 * data. Non-Cloudinary URLs pass through untouched.
 */
export function optimizeImage(url: string | null | undefined, width: number): string | undefined {
  if (!url) return undefined
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/") || /\/upload\/[^/]*(f_auto|q_auto|w_\d+)/.test(url)) {
    return url
  }
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${Math.round(width)}/`)
}
