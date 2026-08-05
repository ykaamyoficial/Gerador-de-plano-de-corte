import type { CuttingBarResult, CuttingPieceResult } from './types'

export interface BarMetrics {
  piecesLengthMm: number
  cutCount: number
  kerfLossMm: number
  consumedLengthMm: number
  leftoverMm: number
}

/**
 * A single piece whose length equals the stock length uses the whole bar
 * with no cut (see spec section 12, exception rule).
 */
export function computeBarMetrics(
  pieces: readonly number[],
  stockLengthMm: number,
  kerfMm: number,
): BarMetrics {
  const piecesLengthMm = pieces.reduce((sum, length) => sum + length, 0)
  const isWholeBarException = pieces.length === 1 && pieces[0] === stockLengthMm
  const cutCount = isWholeBarException ? 0 : pieces.length
  const kerfLossMm = cutCount * kerfMm
  const consumedLengthMm = piecesLengthMm + kerfLossMm
  const leftoverMm = stockLengthMm - consumedLengthMm
  return { piecesLengthMm, cutCount, kerfLossMm, consumedLengthMm, leftoverMm }
}

export function pieceFitsInBar(
  pieces: readonly number[],
  candidateLengthMm: number,
  stockLengthMm: number,
  kerfMm: number,
): boolean {
  const metrics = computeBarMetrics([...pieces, candidateLengthMm], stockLengthMm, kerfMm)
  return metrics.consumedLengthMm <= stockLengthMm
}

export function buildBarResult(
  barNumber: number,
  pieces: readonly number[],
  stockLengthMm: number,
  kerfMm: number,
): CuttingBarResult {
  const sortedPieces = [...pieces].sort((a, b) => b - a)
  const metrics = computeBarMetrics(sortedPieces, stockLengthMm, kerfMm)
  const pieceResults: CuttingPieceResult[] = sortedPieces.map((lengthMm) => ({ lengthMm }))
  return {
    barNumber,
    pieces: pieceResults,
    piecesLengthMm: metrics.piecesLengthMm,
    cutCount: metrics.cutCount,
    kerfLossMm: metrics.kerfLossMm,
    consumedLengthMm: metrics.consumedLengthMm,
    leftoverMm: metrics.leftoverMm,
  }
}
