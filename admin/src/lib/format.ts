/** Small display helpers shared by the tables and cards. */

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatDate(value?: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date)
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date)
}

/** Prices are Nepali rupees, stored as plain numbers. */
export function formatPrice(value: number): string {
  return `Rs ${value.toLocaleString("en-IN")}`
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** True when the ISO timestamp falls inside the last `days` days. */
export function isWithinDays(value: string | undefined | null, days: number): boolean {
  if (!value) return false
  const date = new Date(value).getTime()
  if (Number.isNaN(date)) return false
  return Date.now() - date <= days * 24 * 60 * 60 * 1000
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
