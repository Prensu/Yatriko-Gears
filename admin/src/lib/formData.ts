/**
 * Multipart helpers for the modules whose write routes run through multer
 * (gear, category, destination).
 *
 * The backend DTOs are multipart-aware: numbers go through z.coerce.number(),
 * arrays/objects through z.preprocess(parseMaybeJson, ...) and null arrives as
 * the literal string "null". This helper encodes values to match.
 */

export type FormValue =
  | string
  | number
  | boolean
  | string[]
  | Record<string, string>
  | null
  | undefined

export function encodeValue(value: Exclude<FormValue, undefined>): string {
  if (value === null) return "null" // parseMaybeJson() maps "null" back to null
  if (typeof value === "boolean") {
    // z.coerce.boolean() is Boolean(input) — the string "false" would coerce
    // to TRUE, so falsy must be sent as an empty string.
    return value ? "true" : ""
  }
  if (typeof value === "number") return String(value)
  if (typeof value === "string") return value
  return JSON.stringify(value) // arrays + records
}

/**
 * Build a multipart body. `undefined` values are skipped entirely so PUT
 * requests can send partial updates; the file is only appended when the admin
 * actually picked a new one (otherwise the stored image is left untouched).
 */
export function buildFormData(
  values: Record<string, FormValue>,
  file?: File | null,
  fileField = "image",
): FormData {
  const form = new FormData()

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue
    form.append(key, encodeValue(value))
  }

  if (file) form.append(fileField, file)

  return form
}
