/** Resolve against the catalogue so bookings cannot silently lose a required choice. */
export function resolveBookingColor(gear: { name: string; colors: string[] }, color?: string): string | undefined {
  const selected = color?.trim() || undefined
  if (gear.colors.length === 0 && !selected) return undefined
  if (!selected || !gear.colors.includes(selected)) {
    throw { code: 422, message: `Please select an available color for ${gear.name}` }
  }
  return selected
}

/** Colors share the gear's stock pool; check their combined quantity. */
export function sumGearQuantities(items: Array<{ gear: string; quantity: number }>): Array<{ gear: string; quantity: number }> {
  const quantities = new Map<string, number>()
  for (const item of items) quantities.set(item.gear, (quantities.get(item.gear) ?? 0) + item.quantity)
  return Array.from(quantities, ([gear, quantity]) => ({ gear, quantity }))
}
