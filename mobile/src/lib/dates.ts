/**
 * Dates travel to the backend as plain "YYYY-MM-DD" strings. Nepal is UTC+05:45
 * with no daylight saving, so "today" is computed with a fixed offset instead
 * of the phone's time zone (a visitor's phone may be set anywhere).
 */
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000

export function todayInNepal(now: Date = new Date()): string {
  return new Date(now.getTime() + NEPAL_OFFSET_MS).toISOString().slice(0, 10)
}

function toUtcDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number)
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

/** Inclusive day count, the same rule as backend countDays(): same-day = 1. */
export function countDays(start: string, end: string): number {
  return Math.max(1, Math.floor((toUtcDay(end) - toUtcDay(start)) / 86_400_000) + 1)
}

/** Every date from start to end inclusive, as YYYY-MM-DD. */
export function eachDay(start: string, end: string): string[] {
  const out: string[] = []
  for (let t = toUtcDay(start); t <= toUtcDay(end); t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10))
  }
  return out
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-10-13" -> "13 Oct 2026". Accepts full ISO timestamps too. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return ""
  const [y, m, d] = value.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return value
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return ""
  if (start && (!end || end.slice(0, 10) === start.slice(0, 10))) return formatDate(start)
  return `${formatDate(start)} to ${formatDate(end)}`
}
