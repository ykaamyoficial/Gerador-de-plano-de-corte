import { computeBarMetrics, pieceFitsInBar } from './calculations'

/**
 * Best Fit Decreasing: places each piece (largest first) into the open bar
 * that leaves the smallest valid leftover, opening a new bar otherwise.
 * Used as the initial upper-bound solution before the exact search.
 */
export function bestFitDecreasing(
  pieces: readonly number[],
  stockLengthMm: number,
  kerfMm: number,
): number[][] {
  const bars: number[][] = []

  for (const piece of pieces) {
    let bestBarIndex = -1
    let bestLeftover = Infinity

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]
      if (!bar) continue
      if (!pieceFitsInBar(bar, piece, stockLengthMm, kerfMm)) continue
      const metrics = computeBarMetrics([...bar, piece], stockLengthMm, kerfMm)
      if (metrics.leftoverMm < bestLeftover) {
        bestLeftover = metrics.leftoverMm
        bestBarIndex = i
      }
    }

    if (bestBarIndex === -1) {
      bars.push([piece])
    } else {
      const bar = bars[bestBarIndex]
      if (bar) bar.push(piece)
    }
  }

  return bars
}
