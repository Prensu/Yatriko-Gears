export function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") }
export function getSearchTerm(query: Record<string, unknown>, key = "search", max = 100): string | undefined { const value = query[key]; return typeof value === "string" ? value.trim().slice(0, max) || undefined : undefined }
export function getStringParam(query: Record<string, unknown>, key: string): string | undefined { return typeof query[key] === "string" ? query[key] as string : undefined }
