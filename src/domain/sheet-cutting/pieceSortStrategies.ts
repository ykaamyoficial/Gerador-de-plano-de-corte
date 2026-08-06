import type { ExpandedSheetPiece } from './types'

export type SheetSortStrategyName =
  | 'area-desc'
  | 'max-side-desc'
  | 'width-desc'
  | 'height-desc'
  | 'perimeter-desc'
  | 'elongation-desc'

export const SORT_STRATEGY_NAMES: SheetSortStrategyName[] = [
  'area-desc',
  'max-side-desc',
  'width-desc',
  'height-desc',
  'perimeter-desc',
  'elongation-desc',
]

function area(piece: ExpandedSheetPiece): number {
  return piece.widthMm * piece.heightMm
}
function maxSide(piece: ExpandedSheetPiece): number {
  return Math.max(piece.widthMm, piece.heightMm)
}
function minSide(piece: ExpandedSheetPiece): number {
  return Math.min(piece.widthMm, piece.heightMm)
}
function perimeter(piece: ExpandedSheetPiece): number {
  return 2 * (piece.widthMm + piece.heightMm)
}
function elongation(piece: ExpandedSheetPiece): number {
  return maxSide(piece) / minSide(piece)
}

/** Deterministic tie-break shared by every ordering: area, then longer side, then shorter side, then instance id. */
function tieBreak(a: ExpandedSheetPiece, b: ExpandedSheetPiece): number {
  if (area(b) !== area(a)) return area(b) - area(a)
  if (maxSide(b) !== maxSide(a)) return maxSide(b) - maxSide(a)
  if (minSide(b) !== minSide(a)) return minSide(b) - minSide(a)
  if (a.instanceId < b.instanceId) return -1
  if (a.instanceId > b.instanceId) return 1
  return 0
}

function byKeyDescending(
  keyFn: (piece: ExpandedSheetPiece) => number,
): (a: ExpandedSheetPiece, b: ExpandedSheetPiece) => number {
  return (a, b) => {
    const diff = keyFn(b) - keyFn(a)
    return diff !== 0 ? diff : tieBreak(a, b)
  }
}

const STRATEGY_COMPARATORS: Record<SheetSortStrategyName, (a: ExpandedSheetPiece, b: ExpandedSheetPiece) => number> = {
  'area-desc': byKeyDescending(area),
  'max-side-desc': byKeyDescending(maxSide),
  'width-desc': byKeyDescending((piece) => piece.widthMm),
  'height-desc': byKeyDescending((piece) => piece.heightMm),
  'perimeter-desc': byKeyDescending(perimeter),
  'elongation-desc': byKeyDescending(elongation),
}

export function sortPieces(
  pieces: readonly ExpandedSheetPiece[],
  strategy: SheetSortStrategyName,
): ExpandedSheetPiece[] {
  return [...pieces].sort(STRATEGY_COMPARATORS[strategy])
}
