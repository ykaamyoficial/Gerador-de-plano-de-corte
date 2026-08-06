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

// ---------------------------------------------------------------------------
// Optimizer contract (optimizeSheetCut) — pure geometry, no UI concerns.
// ---------------------------------------------------------------------------

export interface SheetCutItem {
  id: string
  widthMm: number
  heightMm: number
  quantity: number
  allowRotation: boolean
}

export interface ExpandedSheetPiece {
  instanceId: string
  itemId: string
  widthMm: number
  heightMm: number
  originalWidthMm: number
  originalHeightMm: number
  allowRotation: boolean
}

export interface FreeRectangle {
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
}

/** One placed piece on one sheet, in real (non-kerf-inflated) coordinates. */
export interface SheetPiecePlacement {
  instanceId: string
  itemId: string
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  originalWidthMm: number
  originalHeightMm: number
  rotated: boolean
}

export interface OptimizedSheetLayout {
  sheetNumber: number
  placements: SheetPiecePlacement[]
  usedAreaMm2: number
  utilizationPercentage: number
  freeRectangles: FreeRectangle[]
}

/** Per requested measure (grouped by width×height), how many were requested vs. actually placed. */
export interface SheetItemSummary {
  itemId: string
  widthMm: number
  heightMm: number
  requestedQuantity: number
  placedQuantity: number
}

export interface OptimizeSheetCutInput {
  sheetWidthMm: number
  sheetHeightMm: number
  kerfMm: number
  items: SheetCutItem[]
}

export interface OptimizeSheetCutOutput {
  requiredSheetCount: number
  sheets: OptimizedSheetLayout[]
  requestedPieceCount: number
  placedPieceCount: number
  items: SheetItemSummary[]
  totalPieceAreaM2: number
  totalSheetAreaM2: number
  utilizationPercentage: number
}

/** Kept as an alias so existing UI code (result display) reads naturally. */
export type SheetCuttingResult = OptimizeSheetCutOutput
