export interface NormalizedItem {
  lengthMm: number
  quantity: number
}

export interface RawItem {
  lengthMm: number
  quantity: number
}

export function normalizeItems(items: readonly RawItem[]): NormalizedItem[] {
  const grouped = new Map<number, number>()

  for (const item of items) {
    if (!Number.isInteger(item.lengthMm) || item.lengthMm <= 0) continue
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) continue
    grouped.set(item.lengthMm, (grouped.get(item.lengthMm) ?? 0) + item.quantity)
  }

  return Array.from(grouped.entries())
    .map(([lengthMm, quantity]) => ({ lengthMm, quantity }))
    .sort((a, b) => b.lengthMm - a.lengthMm)
}

export function expandToPieces(items: readonly NormalizedItem[]): number[] {
  const pieces: number[] = []
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      pieces.push(item.lengthMm)
    }
  }
  return pieces.sort((a, b) => b - a)
}
