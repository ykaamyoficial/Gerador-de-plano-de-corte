/**
 * How many pieces of `pieceLengthMm` fit along `availableLengthMm`, given a
 * kerf loss between each pair of adjacent pieces (n pieces need n-1 cuts
 * between them, so the extra `+ kerfMm` on both sides cancels that out).
 */
export function calculateFitCount(availableLengthMm: number, pieceLengthMm: number, kerfMm: number): number {
  return Math.floor((availableLengthMm + kerfMm) / (pieceLengthMm + kerfMm))
}

export function mm2ToM2(areaMm2: number): number {
  return areaMm2 / 1_000_000
}

export function calculateAreaM2(widthMm: number, lengthMm: number): number {
  return mm2ToM2(widthMm * lengthMm)
}

export function calculateUsedWidthMm(columns: number, placedPieceWidthMm: number, kerfMm: number): number {
  return columns * placedPieceWidthMm + Math.max(0, columns - 1) * kerfMm
}

export function calculateUsedLengthMm(rows: number, placedPieceLengthMm: number, kerfMm: number): number {
  return rows * placedPieceLengthMm + Math.max(0, rows - 1) * kerfMm
}
