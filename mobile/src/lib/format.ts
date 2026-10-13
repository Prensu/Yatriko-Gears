/** Rs. 1,250 (Nepali rupees, whole numbers like the web site). */
export function formatRs(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-US")}`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase() || "?"
}

/** Safe string for a category that may be a populated object, an id, or null. */
export function categoryName(category: unknown): string {
  if (category && typeof category === "object" && "name" in category) {
    const name = (category as { name?: unknown }).name
    return typeof name === "string" ? name : ""
  }
  return ""
}
