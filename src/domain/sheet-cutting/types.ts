/**
 * Duplicated from domain/cutting/types.ts on purpose: the two cutting
 * modules stay fully isolated (see project docs), so this module never
 * imports from domain/cutting.
 */
export type CalculationStatus = 'not_calculated' | 'calculated' | 'changed' | 'error'

export type SheetOrientation = 'normal' | 'rotated'

export interface SheetCuttingOrder {
  id: string
  name: string
  plans: SheetCuttingPlan[]
}

export interface SheetCuttingPlan {
  id: string
  materialName: string
  sheetWidthMm: number | null
  sheetLengthMm: number | null
  pieceWidthMm: number | null
  pieceLengthMm: number | null
  quantity: number | null
  kerfMm: number | null
  allowRotation: boolean
  result: SheetCuttingResult | null
  calculationStatus: CalculationStatus
}

export interface SheetPiecePlacement {
  index: number
  row: number
  column: number
  xMm: number
  yMm: number
  widthMm: number
  lengthMm: number
}

export interface SheetLayoutResult {
  sheetNumber: number
  placedPieceCount: number
  isFull: boolean
  placements: SheetPiecePlacement[]
}

export interface SheetCuttingResult {
  sheetWidthMm: number
  sheetLengthMm: number
  originalPieceWidthMm: number
  originalPieceLengthMm: number
  placedPieceWidthMm: number
  placedPieceLengthMm: number
  requestedQuantity: number
  piecesPerFullSheet: number
  requiredSheetCount: number
  columns: number
  rows: number
  orientation: SheetOrientation
  kerfMm: number
  sheetAreaM2: number
  pieceAreaM2: number
  requestedAreaM2: number
  purchasedAreaM2: number
  utilizationPercentage: number
  layouts: SheetLayoutResult[]
}

export interface CalculateSheetCutInput {
  sheetWidthMm: number
  sheetLengthMm: number
  pieceWidthMm: number
  pieceLengthMm: number
  quantity: number
  kerfMm: number
  allowRotation: boolean
}
