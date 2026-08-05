export interface CuttingOrder {
  id: string
  name: string
  plans: CuttingPlan[]
}

export interface CuttingPlan {
  id: string
  materialName: string
  stockLengthMm: number | null
  kerfMm: number | null
  items: CuttingItem[]
  result: CuttingPlanResult | null
  calculationStatus: CalculationStatus
}

export interface CuttingItem {
  id: string
  lengthMm: number | null
  quantity: number | null
}

export type CalculationStatus = 'not_calculated' | 'calculated' | 'changed' | 'error'

export interface CuttingPlanResult {
  stockLengthMm: number
  kerfMm: number
  requiredStockCount: number
  totalRequestedPieces: number
  bars: CuttingBarResult[]
  optimizationStatus: OptimizationStatus
  calculationTimeMs: number
}

export interface CuttingBarResult {
  barNumber: number
  pieces: CuttingPieceResult[]
  piecesLengthMm: number
  cutCount: number
  kerfLossMm: number
  consumedLengthMm: number
  leftoverMm: number
}

export interface CuttingPieceResult {
  lengthMm: number
}

export type OptimizationStatus = 'proven_minimum' | 'best_found'

export interface OptimizeLinearCutInput {
  stockLengthMm: number
  kerfMm: number
  items: Array<{
    lengthMm: number
    quantity: number
  }>
  timeLimitMs?: number
}

export interface OptimizeLinearCutOutput {
  requiredStockCount: number
  bars: CuttingBarResult[]
  optimizationStatus: OptimizationStatus
  calculationTimeMs: number
}
