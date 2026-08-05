import { calculateAreaM2, calculateFitCount } from './calculations'
import { createSheetLayouts } from './createSheetLayouts'
import { validateSheetCuttingResult } from './resultValidator'
import type { CalculateSheetCutInput, SheetCuttingResult, SheetOrientation } from './types'

/**
 * Finds the best axis-aligned grid packing of identical rectangular pieces
 * into rectangular sheets, comparing the normal orientation against the
 * piece rotated 90° (when allowed) and keeping whichever grid fits more
 * pieces per sheet. This is a "best grid found" search, not a general
 * nesting solver: every sheet uses a single orientation for every piece,
 * mixed orientations within one sheet are out of scope (spec section 11).
 */
export function calculateSheetCutPlan(input: CalculateSheetCutInput): SheetCuttingResult {
  const { sheetWidthMm, sheetLengthMm, pieceWidthMm, pieceLengthMm, quantity, kerfMm, allowRotation } = input

  const normalColumns = calculateFitCount(sheetWidthMm, pieceWidthMm, kerfMm)
  const normalRows = calculateFitCount(sheetLengthMm, pieceLengthMm, kerfMm)
  const normalCapacity = normalColumns * normalRows

  let rotatedColumns = 0
  let rotatedRows = 0
  let rotatedCapacity = 0
  if (allowRotation) {
    rotatedColumns = calculateFitCount(sheetWidthMm, pieceLengthMm, kerfMm)
    rotatedRows = calculateFitCount(sheetLengthMm, pieceWidthMm, kerfMm)
    rotatedCapacity = rotatedColumns * rotatedRows
  }

  let orientation: SheetOrientation = 'normal'
  let columns = normalColumns
  let rows = normalRows
  let placedPieceWidthMm = pieceWidthMm
  let placedPieceLengthMm = pieceLengthMm

  // Ties keep the normal orientation so the result stays deterministic.
  if (allowRotation && rotatedCapacity > normalCapacity) {
    orientation = 'rotated'
    columns = rotatedColumns
    rows = rotatedRows
    placedPieceWidthMm = pieceLengthMm
    placedPieceLengthMm = pieceWidthMm
  }

  const piecesPerFullSheet = columns * rows
  if (piecesPerFullSheet <= 0) {
    throw new Error('sheet_cut_no_capacity')
  }

  const requiredSheetCount = Math.ceil(quantity / piecesPerFullSheet)

  const layouts = createSheetLayouts({
    quantity,
    piecesPerFullSheet,
    columns,
    placedPieceWidthMm,
    placedPieceLengthMm,
    kerfMm,
  })

  const sheetAreaM2 = calculateAreaM2(sheetWidthMm, sheetLengthMm)
  const pieceAreaM2 = calculateAreaM2(pieceWidthMm, pieceLengthMm)
  const requestedAreaM2 = pieceAreaM2 * quantity
  const purchasedAreaM2 = sheetAreaM2 * requiredSheetCount
  const utilizationPercentage = purchasedAreaM2 > 0 ? (requestedAreaM2 / purchasedAreaM2) * 100 : 0

  const result: SheetCuttingResult = {
    sheetWidthMm,
    sheetLengthMm,
    originalPieceWidthMm: pieceWidthMm,
    originalPieceLengthMm: pieceLengthMm,
    placedPieceWidthMm,
    placedPieceLengthMm,
    requestedQuantity: quantity,
    piecesPerFullSheet,
    requiredSheetCount,
    columns,
    rows,
    orientation,
    kerfMm,
    sheetAreaM2,
    pieceAreaM2,
    requestedAreaM2,
    purchasedAreaM2,
    utilizationPercentage,
    layouts,
  }

  const validation = validateSheetCuttingResult(input, result)
  if (!validation.isValid) {
    console.error('Resultado do corte de chapas reprovado na validação:', validation.errors)
    throw new Error('invalid_sheet_cutting_result')
  }

  return result
}
