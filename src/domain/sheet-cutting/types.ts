/**
 * Duplicated from domain/cutting/types.ts on purpose: the two cutting
 * modules stay fully isolated (see project docs), so this module never
 * imports from domain/cutting.
 */
export type CalculationStatus = 'not_calculated' | 'calculated' | 'changed' | 'error'

export interface SheetCuttingOrder {
  id: string
  name: string
  plans: SheetCuttingPlan[]
}

export interface SheetCuttingItem {
  id: string
  widthMm: number | null
  lengthMm: number | null
  quantity: number | null
}

export interface SheetCuttingPlan {
  id: string
  materialName: string
  sheetWidthMm: number | null
  sheetLengthMm: number | null
  kerfMm: number | null
  allowRotation: boolean
  items: SheetCuttingItem[]
  result: SheetCuttingResult | null
  calculationStatus: CalculationStatus
}

/** One placed piece on one sheet. `rowIndex` groups pieces placed in the same shelf/row. */
export interface SheetPiecePlacement {
  index: number
  itemId: string
  widthMm: number
  lengthMm: number
  placedWidthMm: number
  placedLengthMm: number
  rotated: boolean
  rowIndex: number
  xMm: number
  yMm: number
}

export interface SheetLayoutResult {
  sheetNumber: number
  placements: SheetPiecePlacement[]
}

/** Per requested measure (grouped by width×length), how many were requested vs. actually placed. */
export interface SheetItemSummary {
  itemId: string
  widthMm: number
  lengthMm: number
  requestedQuantity: number
  placedQuantity: number
}

export interface SheetCuttingResult {
  sheetWidthMm: number
  sheetLengthMm: number
  kerfMm: number
  allowRotation: boolean
  requiredSheetCount: number
  totalRequestedPieces: number
  totalPlacedPieces: number
  items: SheetItemSummary[]
  layouts: SheetLayoutResult[]
  sheetAreaM2: number
  requestedAreaM2: number
  purchasedAreaM2: number
  utilizationPercentage: number
}

export interface CalculateSheetCutInput {
  sheetWidthMm: number
  sheetLengthMm: number
  kerfMm: number
  allowRotation: boolean
  items: Array<{
    widthMm: number
    lengthMm: number
    quantity: number
  }>
}
