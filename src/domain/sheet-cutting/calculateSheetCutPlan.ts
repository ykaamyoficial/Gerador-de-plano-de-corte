import { calculateAreaM2 } from './calculations'
import { packSheetPieces, type PieceInstance } from './packSheetPieces'
import { validateSheetCuttingResult } from './resultValidator'
import type { CalculateSheetCutInput, SheetCuttingResult, SheetItemSummary, SheetLayoutResult } from './types'

interface NormalizedItem {
  itemId: string
  widthMm: number
  lengthMm: number
  quantity: number
}

function normalizeItems(items: CalculateSheetCutInput['items']): NormalizedItem[] {
  const grouped = new Map<string, NormalizedItem>()
  for (const item of items) {
    if (!Number.isInteger(item.widthMm) || item.widthMm <= 0) continue
    if (!Number.isInteger(item.lengthMm) || item.lengthMm <= 0) continue
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) continue
    const itemId = `${item.widthMm}x${item.lengthMm}`
    const existing = grouped.get(itemId)
    grouped.set(itemId, {
      itemId,
      widthMm: item.widthMm,
      lengthMm: item.lengthMm,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    })
  }
  return Array.from(grouped.values()).sort(
    (a, b) => b.widthMm * b.lengthMm - a.widthMm * a.lengthMm || a.itemId.localeCompare(b.itemId),
  )
}

/**
 * Packs one or more rectangular measures (each with its own quantity) into
 * whole sheets, comparing normal vs. rotated orientation per piece when
 * allowed. Pure function: no React, no DOM, deterministic, unit-testable.
 */
export function calculateSheetCutPlan(input: CalculateSheetCutInput): SheetCuttingResult {
  const { sheetWidthMm, sheetLengthMm, kerfMm, allowRotation } = input

  const normalizedItems = normalizeItems(input.items)
  if (normalizedItems.length === 0) {
    throw new Error('sheet_cut_no_pieces')
  }

  const pieces: PieceInstance[] = []
  for (const item of normalizedItems) {
    for (let i = 0; i < item.quantity; i++) {
      pieces.push({ itemId: item.itemId, index: i, widthMm: item.widthMm, lengthMm: item.lengthMm })
    }
  }

  const packedSheets = packSheetPieces(pieces, sheetWidthMm, sheetLengthMm, kerfMm, allowRotation)

  const layouts: SheetLayoutResult[] = packedSheets.map((sheet) => ({
    sheetNumber: sheet.sheetNumber,
    placements: sheet.placements.map((placement, index) => ({
      index,
      itemId: placement.itemId,
      widthMm: placement.widthMm,
      lengthMm: placement.lengthMm,
      placedWidthMm: placement.placedWidthMm,
      placedLengthMm: placement.placedLengthMm,
      rotated: placement.rotated,
      rowIndex: placement.rowIndex,
      xMm: placement.xMm,
      yMm: placement.yMm,
    })),
  }))

  const items: SheetItemSummary[] = normalizedItems.map((item) => {
    const placedQuantity = layouts.reduce(
      (sum, layout) => sum + layout.placements.filter((placement) => placement.itemId === item.itemId).length,
      0,
    )
    return {
      itemId: item.itemId,
      widthMm: item.widthMm,
      lengthMm: item.lengthMm,
      requestedQuantity: item.quantity,
      placedQuantity,
    }
  })

  const totalRequestedPieces = normalizedItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPlacedPieces = layouts.reduce((sum, layout) => sum + layout.placements.length, 0)

  const sheetAreaM2 = calculateAreaM2(sheetWidthMm, sheetLengthMm)
  const requestedAreaM2 = normalizedItems.reduce(
    (sum, item) => sum + calculateAreaM2(item.widthMm, item.lengthMm) * item.quantity,
    0,
  )
  const purchasedAreaM2 = sheetAreaM2 * layouts.length
  const utilizationPercentage = purchasedAreaM2 > 0 ? (requestedAreaM2 / purchasedAreaM2) * 100 : 0

  const result: SheetCuttingResult = {
    sheetWidthMm,
    sheetLengthMm,
    kerfMm,
    allowRotation,
    requiredSheetCount: layouts.length,
    totalRequestedPieces,
    totalPlacedPieces,
    items,
    layouts,
    sheetAreaM2,
    requestedAreaM2,
    purchasedAreaM2,
    utilizationPercentage,
  }

  const validation = validateSheetCuttingResult(input, result)
  if (!validation.isValid) {
    console.error('Resultado do corte de chapas reprovado na validação:', validation.errors)
    throw new Error('invalid_sheet_cutting_result')
  }

  return result
}
