import type { SheetLayoutResult, SheetPiecePlacement } from './types'

export interface CreateSheetLayoutsInput {
  quantity: number
  piecesPerFullSheet: number
  columns: number
  placedPieceWidthMm: number
  placedPieceLengthMm: number
  kerfMm: number
}

/**
 * Fills sheets left-to-right, top-to-bottom, one sheet at a time, stopping
 * exactly at the requested quantity so the last sheet is only ever
 * partially filled with the pieces actually needed (spec section 13).
 */
export function createSheetLayouts(input: CreateSheetLayoutsInput): SheetLayoutResult[] {
  const { quantity, piecesPerFullSheet, columns, placedPieceWidthMm, placedPieceLengthMm, kerfMm } = input
  const sheetCount = Math.ceil(quantity / piecesPerFullSheet)
  const layouts: SheetLayoutResult[] = []

  let remaining = quantity
  for (let sheetIndex = 0; sheetIndex < sheetCount; sheetIndex++) {
    const placedPieceCount = Math.min(piecesPerFullSheet, remaining)
    const placements: SheetPiecePlacement[] = []

    for (let i = 0; i < placedPieceCount; i++) {
      const row = Math.floor(i / columns)
      const column = i % columns
      placements.push({
        index: i,
        row,
        column,
        xMm: column * (placedPieceWidthMm + kerfMm),
        yMm: row * (placedPieceLengthMm + kerfMm),
        widthMm: placedPieceWidthMm,
        lengthMm: placedPieceLengthMm,
      })
    }

    layouts.push({
      sheetNumber: sheetIndex + 1,
      placedPieceCount,
      isFull: placedPieceCount === piecesPerFullSheet,
      placements,
    })

    remaining -= placedPieceCount
  }

  return layouts
}
