import type { FreeRectangle } from './types'

function containsRect(outer: FreeRectangle, inner: FreeRectangle): boolean {
  return (
    inner.xMm >= outer.xMm &&
    inner.yMm >= outer.yMm &&
    inner.xMm + inner.widthMm <= outer.xMm + outer.widthMm &&
    inner.yMm + inner.heightMm <= outer.yMm + outer.heightMm
  )
}

/** Drops zero/negative-area rectangles and any rectangle fully contained in another (keeping the first occurrence of exact duplicates). */
export function pruneFreeRectangles(rectangles: readonly FreeRectangle[]): FreeRectangle[] {
  const kept: FreeRectangle[] = []

  for (let i = 0; i < rectangles.length; i++) {
    const candidate = rectangles[i]
    if (!candidate || candidate.widthMm <= 0 || candidate.heightMm <= 0) continue

    let redundant = false
    for (let j = 0; j < rectangles.length; j++) {
      if (i === j) continue
      const other = rectangles[j]
      if (!other || other.widthMm <= 0 || other.heightMm <= 0) continue
      if (!containsRect(other, candidate)) continue

      const isDuplicate = containsRect(candidate, other)
      if (isDuplicate && i < j) continue // keep the earlier of two identical rectangles
      redundant = true
      break
    }

    if (!redundant) kept.push(candidate)
  }

  return kept
}
