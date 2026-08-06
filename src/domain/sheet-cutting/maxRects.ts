import { rectanglesIntersect, splitFreeRectangle } from './freeRectangleSplitter'
import { pruneFreeRectangles } from './pruneFreeRectangles'
import type { ExpandedSheetPiece, FreeRectangle, SheetPiecePlacement } from './types'

export type Heuristic = 'best-short-side' | 'best-long-side' | 'best-area' | 'bottom-left'

export const HEURISTICS: Heuristic[] = ['best-short-side', 'best-long-side', 'best-area', 'bottom-left']

export interface WorkingSheet {
  freeRects: FreeRectangle[]
  placements: SheetPiecePlacement[]
}

interface CandidatePlacement {
  freeRectIndex: number
  orientationWidthMm: number
  orientationHeightMm: number
  rotated: boolean
}

function scoreForHeuristic(
  heuristic: Heuristic,
  freeRect: FreeRectangle,
  orientationWidthMm: number,
  orientationHeightMm: number,
): [number, number] {
  const leftoverWidthMm = freeRect.widthMm - orientationWidthMm
  const leftoverHeightMm = freeRect.heightMm - orientationHeightMm

  switch (heuristic) {
    case 'best-short-side':
      return [Math.min(leftoverWidthMm, leftoverHeightMm), Math.max(leftoverWidthMm, leftoverHeightMm)]
    case 'best-long-side':
      return [Math.max(leftoverWidthMm, leftoverHeightMm), Math.min(leftoverWidthMm, leftoverHeightMm)]
    case 'best-area':
      return [
        freeRect.widthMm * freeRect.heightMm - orientationWidthMm * orientationHeightMm,
        Math.min(leftoverWidthMm, leftoverHeightMm),
      ]
    case 'bottom-left':
      return [freeRect.yMm, freeRect.xMm]
  }
}

function isBetterScore(candidate: [number, number], current: [number, number]): boolean {
  if (candidate[0] !== current[0]) return candidate[0] < current[0]
  return candidate[1] < current[1]
}

/** Both orientations to try for a piece, deduped when the piece is square (rotating it would be a no-op). */
function candidateOrientations(
  piece: ExpandedSheetPiece,
  kerfMm: number,
): Array<{ widthMm: number; heightMm: number; rotated: boolean }> {
  const virtualWidthMm = piece.widthMm + kerfMm
  const virtualHeightMm = piece.heightMm + kerfMm
  const orientations = [{ widthMm: virtualWidthMm, heightMm: virtualHeightMm, rotated: false }]
  if (piece.allowRotation && piece.widthMm !== piece.heightMm) {
    orientations.push({ widthMm: virtualHeightMm, heightMm: virtualWidthMm, rotated: true })
  }
  return orientations
}

function findBestPlacement(
  piece: ExpandedSheetPiece,
  freeRects: readonly FreeRectangle[],
  kerfMm: number,
  heuristic: Heuristic,
): CandidatePlacement | null {
  let best: CandidatePlacement | null = null
  let bestScore: [number, number] | null = null

  for (let index = 0; index < freeRects.length; index++) {
    const freeRect = freeRects[index]
    if (!freeRect) continue

    for (const orientation of candidateOrientations(piece, kerfMm)) {
      if (orientation.widthMm > freeRect.widthMm || orientation.heightMm > freeRect.heightMm) continue

      const score = scoreForHeuristic(heuristic, freeRect, orientation.widthMm, orientation.heightMm)
      if (!bestScore || isBetterScore(score, bestScore)) {
        bestScore = score
        best = {
          freeRectIndex: index,
          orientationWidthMm: orientation.widthMm,
          orientationHeightMm: orientation.heightMm,
          rotated: orientation.rotated,
        }
      }
    }
  }

  return best
}

function applyPlacement(sheet: WorkingSheet, piece: ExpandedSheetPiece, placement: CandidatePlacement, kerfMm: number): void {
  const target = sheet.freeRects[placement.freeRectIndex]
  if (!target) return

  const placedVirtualRect: FreeRectangle = {
    xMm: target.xMm,
    yMm: target.yMm,
    widthMm: placement.orientationWidthMm,
    heightMm: placement.orientationHeightMm,
  }

  const nextFreeRects: FreeRectangle[] = []
  for (const freeRect of sheet.freeRects) {
    if (rectanglesIntersect(freeRect, placedVirtualRect)) {
      nextFreeRects.push(...splitFreeRectangle(freeRect, placedVirtualRect))
    } else {
      nextFreeRects.push(freeRect)
    }
  }
  sheet.freeRects = pruneFreeRectangles(nextFreeRects)

  sheet.placements.push({
    instanceId: piece.instanceId,
    itemId: piece.itemId,
    xMm: placedVirtualRect.xMm,
    yMm: placedVirtualRect.yMm,
    widthMm: placedVirtualRect.widthMm - kerfMm,
    heightMm: placedVirtualRect.heightMm - kerfMm,
    originalWidthMm: piece.originalWidthMm,
    originalHeightMm: piece.originalHeightMm,
    rotated: placement.rotated,
  })
}

function createEmptySheet(sheetWidthMm: number, sheetHeightMm: number, kerfMm: number): WorkingSheet {
  return {
    freeRects: [{ xMm: 0, yMm: 0, widthMm: sheetWidthMm + kerfMm, heightMm: sheetHeightMm + kerfMm }],
    placements: [],
  }
}

/** Tries to place a piece into any of the given sheets (in order) without opening a new one. */
export function tryPlaceInExistingSheets(
  sheets: WorkingSheet[],
  piece: ExpandedSheetPiece,
  kerfMm: number,
  heuristic: Heuristic,
): boolean {
  for (const sheet of sheets) {
    const placement = findBestPlacement(piece, sheet.freeRects, kerfMm, heuristic)
    if (placement) {
      applyPlacement(sheet, piece, placement, kerfMm)
      return true
    }
  }
  return false
}

export function cloneWorkingSheets(sheets: readonly WorkingSheet[]): WorkingSheet[] {
  return sheets.map((sheet) => ({
    freeRects: sheet.freeRects.map((rect) => ({ ...rect })),
    placements: sheet.placements.map((placement) => ({ ...placement })),
  }))
}

/**
 * MaxRects multi-sheet packer: for each piece (already sorted by the
 * caller), tries every currently open sheet first — not just the most
 * recent one — before opening a new sheet. Each free rectangle tracks the
 * true maximal leftover space, so a piece can land in a gap left behind by
 * an earlier, larger piece instead of only ever stacking into new rows.
 */
export function packAllPieces(
  orderedPieces: readonly ExpandedSheetPiece[],
  sheetWidthMm: number,
  sheetHeightMm: number,
  kerfMm: number,
  heuristic: Heuristic,
): WorkingSheet[] {
  const sheets: WorkingSheet[] = []

  for (const piece of orderedPieces) {
    if (tryPlaceInExistingSheets(sheets, piece, kerfMm, heuristic)) continue

    const newSheet = createEmptySheet(sheetWidthMm, sheetHeightMm, kerfMm)
    const placement = findBestPlacement(piece, newSheet.freeRects, kerfMm, heuristic)
    if (!placement) {
      throw new Error('sheet_cut_piece_does_not_fit')
    }
    applyPlacement(newSheet, piece, placement, kerfMm)
    sheets.push(newSheet)
  }

  return sheets
}
