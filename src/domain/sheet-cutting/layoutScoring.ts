import type { WorkingSheet } from './maxRects'
import type { FreeRectangle } from './types'

export interface LayoutScore {
  sheetCount: number
  usedAreaPerSheetMm2: number[]
  freeRectangleCount: number
  largestFreeRectangleAreaMm2: number
  fragmentationScore: number
}

function placedAreaMm2(sheet: WorkingSheet): number {
  return sheet.placements.reduce((sum, placement) => sum + placement.widthMm * placement.heightMm, 0)
}

function freeRectAreaMm2(rect: FreeRectangle): number {
  return rect.widthMm * rect.heightMm
}

export function scoreLayout(sheets: readonly WorkingSheet[]): LayoutScore {
  const usedAreaPerSheetMm2 = sheets.map(placedAreaMm2)
  const allFreeRects = sheets.flatMap((sheet) => sheet.freeRects)
  const freeRectangleCount = allFreeRects.length
  const largestFreeRectangleAreaMm2 = allFreeRects.reduce((max, rect) => Math.max(max, freeRectAreaMm2(rect)), 0)
  const totalFreeAreaMm2 = allFreeRects.reduce((sum, rect) => sum + freeRectAreaMm2(rect), 0)
  const fragmentationScore = totalFreeAreaMm2 > 0 ? (totalFreeAreaMm2 - largestFreeRectangleAreaMm2) / totalFreeAreaMm2 : 0

  return { sheetCount: sheets.length, usedAreaPerSheetMm2, freeRectangleCount, largestFreeRectangleAreaMm2, fragmentationScore }
}

/**
 * Ranks two candidate layouts, negative meaning `a` wins. Sheet count is
 * always decisive first (spec section 11) — nothing below it can override
 * that. Ties are broken by preferring the layout that packs earlier sheets
 * fuller (concentrates leftover space instead of spreading it thin), then
 * by fewer/larger contiguous free regions.
 */
export function compareLayoutScores(a: LayoutScore, b: LayoutScore): number {
  if (a.sheetCount !== b.sheetCount) return a.sheetCount - b.sheetCount

  const length = Math.max(a.usedAreaPerSheetMm2.length, b.usedAreaPerSheetMm2.length)
  for (let i = 0; i < length; i++) {
    const aValue = a.usedAreaPerSheetMm2[i] ?? 0
    const bValue = b.usedAreaPerSheetMm2[i] ?? 0
    if (aValue !== bValue) return bValue - aValue
  }

  if (a.freeRectangleCount !== b.freeRectangleCount) return a.freeRectangleCount - b.freeRectangleCount
  if (a.largestFreeRectangleAreaMm2 !== b.largestFreeRectangleAreaMm2) {
    return b.largestFreeRectangleAreaMm2 - a.largestFreeRectangleAreaMm2
  }
  return a.fragmentationScore - b.fragmentationScore
}
