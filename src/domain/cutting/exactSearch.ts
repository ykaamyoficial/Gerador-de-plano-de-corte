import { computeBarMetrics, pieceFitsInBar } from './calculations'

export type ExactSearchStatus = 'found' | 'infeasible' | 'timeout'

export interface ExactSearchResult {
  status: ExactSearchStatus
  bars: number[][] | null
}

/**
 * Exact backtracking search: tries to pack all pieces into exactly
 * `binCount` bars. Bins with equal remaining capacity are treated as
 * interchangeable (symmetry breaking) and visited states are memoized
 * to avoid repeating failed branches (spec section 14.6).
 */
export function exactSearchForBinCount(
  pieces: readonly number[],
  stockLengthMm: number,
  kerfMm: number,
  binCount: number,
  deadline: number,
): ExactSearchResult {
  const sortedPieces = [...pieces].sort((a, b) => b - a)
  const bins: number[][] = Array.from({ length: binCount }, () => [] as number[])
  const visited = new Set<string>()
  let timedOut = false

  function remainingCapacity(bin: number[]): number {
    return computeBarMetrics(bin, stockLengthMm, kerfMm).leftoverMm
  }

  function stateKey(pieceIndex: number): string {
    const capacities = bins.map(remainingCapacity).sort((a, b) => a - b)
    return `${pieceIndex}|${capacities.join(',')}`
  }

  function backtrack(pieceIndex: number): boolean {
    if (Date.now() > deadline) {
      timedOut = true
      return false
    }
    if (pieceIndex >= sortedPieces.length) {
      return true
    }

    const piece = sortedPieces[pieceIndex]
    if (piece === undefined) return true

    const key = stateKey(pieceIndex)
    if (visited.has(key)) return false

    const remainingTotal = sortedPieces.slice(pieceIndex).reduce((sum, length) => sum + length, 0)
    const totalCapacity = bins.reduce((sum, bin) => sum + remainingCapacity(bin), 0)
    if (remainingTotal > totalCapacity) {
      visited.add(key)
      return false
    }

    const candidates: Array<{ index: number; leftover: number }> = []
    const seenCapacities = new Set<number>()
    for (let i = 0; i < bins.length; i++) {
      const bin = bins[i]
      if (!bin) continue
      const capacity = remainingCapacity(bin)
      if (seenCapacities.has(capacity)) continue
      seenCapacities.add(capacity)
      if (!pieceFitsInBar(bin, piece, stockLengthMm, kerfMm)) continue
      const metrics = computeBarMetrics([...bin, piece], stockLengthMm, kerfMm)
      candidates.push({ index: i, leftover: metrics.leftoverMm })
    }
    candidates.sort((a, b) => a.leftover - b.leftover)

    for (const candidate of candidates) {
      const bin = bins[candidate.index]
      if (!bin) continue
      bin.push(piece)
      if (backtrack(pieceIndex + 1)) return true
      bin.pop()
      if (timedOut) return false
    }

    visited.add(key)
    return false
  }

  const success = backtrack(0)

  if (timedOut) {
    return { status: 'timeout', bars: null }
  }

  return success ? { status: 'found', bars: bins } : { status: 'infeasible', bars: null }
}
