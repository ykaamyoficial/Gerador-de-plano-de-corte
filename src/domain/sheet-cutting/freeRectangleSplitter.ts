import type { FreeRectangle } from './types'

export function rectanglesIntersect(a: FreeRectangle, b: FreeRectangle): boolean {
  return a.xMm < b.xMm + b.widthMm && b.xMm < a.xMm + a.widthMm && a.yMm < b.yMm + b.heightMm && b.yMm < a.yMm + a.heightMm
}

/**
 * Classic MaxRects split: when a placed rectangle intersects a free
 * rectangle, the free rectangle is cut into up to four maximal leftover
 * bands (left, right, top, bottom) that each span the *full* original free
 * rectangle in the perpendicular axis. These bands intentionally overlap
 * each other — that overlap is what "maximal" means — pruneFreeRectangles
 * removes the ones fully contained in another afterwards.
 */
export function splitFreeRectangle(freeRect: FreeRectangle, placedRect: FreeRectangle): FreeRectangle[] {
  if (!rectanglesIntersect(freeRect, placedRect)) {
    return [freeRect]
  }

  const results: FreeRectangle[] = []
  const freeRight = freeRect.xMm + freeRect.widthMm
  const freeBottom = freeRect.yMm + freeRect.heightMm
  const placedRight = placedRect.xMm + placedRect.widthMm
  const placedBottom = placedRect.yMm + placedRect.heightMm

  if (placedRect.xMm > freeRect.xMm) {
    results.push({ xMm: freeRect.xMm, yMm: freeRect.yMm, widthMm: placedRect.xMm - freeRect.xMm, heightMm: freeRect.heightMm })
  }
  if (placedRight < freeRight) {
    results.push({ xMm: placedRight, yMm: freeRect.yMm, widthMm: freeRight - placedRight, heightMm: freeRect.heightMm })
  }
  if (placedRect.yMm > freeRect.yMm) {
    results.push({ xMm: freeRect.xMm, yMm: freeRect.yMm, widthMm: freeRect.widthMm, heightMm: placedRect.yMm - freeRect.yMm })
  }
  if (placedBottom < freeBottom) {
    results.push({ xMm: freeRect.xMm, yMm: placedBottom, widthMm: freeRect.widthMm, heightMm: freeBottom - placedBottom })
  }

  return results.filter((rect) => rect.widthMm > 0 && rect.heightMm > 0)
}
