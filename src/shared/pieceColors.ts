const PIECE_COLORS = [
  'var(--piece-color-1)',
  'var(--piece-color-2)',
  'var(--piece-color-3)',
  'var(--piece-color-4)',
  'var(--piece-color-5)',
  'var(--piece-color-6)',
  'var(--piece-color-7)',
  'var(--piece-color-8)',
]

interface PieceLike {
  lengthMm: number
}

interface BarLike {
  pieces: readonly PieceLike[]
}

/** Assigns a stable color per distinct piece length so the same measure keeps the same color across every bar in a plan. */
export function buildPieceColorMap(bars: readonly BarLike[]): Map<number, string> {
  const map = new Map<number, string>()
  for (const bar of bars) {
    for (const piece of bar.pieces) {
      if (!map.has(piece.lengthMm)) {
        map.set(piece.lengthMm, PIECE_COLORS[map.size % PIECE_COLORS.length] as string)
      }
    }
  }
  return map
}
