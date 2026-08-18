/** Client-side CSV export (no server round-trip, no extra dependency). */

export type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | null | undefined
}

function escapeCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value)
  // Quote when the cell could break the row, and double up inner quotes.
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((column) => escapeCell(column.header)).join(",")
  const body = rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(","))
  return [head, ...body].join("\r\n")
}

export function downloadCsv(filename: string, csv: string): void {
  // Prepend a BOM so Excel reads UTF-8 correctly.
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
