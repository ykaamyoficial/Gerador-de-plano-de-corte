import type { CalculateSheetCutInput, SheetCuttingResult, SheetPiecePlacement } from './types'

export interface SheetResultValidation {
  isValid: boolean
  errors: string[]
}

/**
 * Independently re-checks a calculateSheetCutPlan result: every requested
 * piece is accounted for, no piece falls outside the sheet, and no two
 * pieces overlap (checked row-by-row, then row-band by row-band, which is
 * safe and fast even for sheets with thousands of small pieces since it
 * never compares every pair).
 */
export function validateSheetCuttingResult(
  input: CalculateSheetCutInput,
  result: SheetCuttingResult,
): SheetResultValidation {
  const errors: string[] = []

  if (result.requiredSheetCount <= 0) {
    errors.push('A quantidade de chapas deve ser maior que zero.')
  }
  if (result.layouts.length !== result.requiredSheetCount) {
    errors.push('O número de desenhos de chapa não corresponde à quantidade de chapas necessárias.')
  }
  if (result.totalPlacedPieces !== result.totalRequestedPieces) {
    errors.push('A quantidade total de peças distribuídas não corresponde ao total solicitado.')
  }

  for (const item of result.items) {
    if (item.placedQuantity !== item.requestedQuantity) {
      errors.push(
        `A medida de ${item.widthMm} × ${item.lengthMm} mm não foi totalmente atendida (${item.placedQuantity}/${item.requestedQuantity}).`,
      )
    }
  }

  const requestedTotalFromInput = input.items
    .filter((item) => Number.isInteger(item.widthMm) && item.widthMm > 0)
    .filter((item) => Number.isInteger(item.lengthMm) && item.lengthMm > 0)
    .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0)
    .reduce((sum, item) => sum + item.quantity, 0)
  if (requestedTotalFromInput !== result.totalRequestedPieces) {
    errors.push('A quantidade total solicitada não corresponde à entrada original.')
  }

  for (const layout of result.layouts) {
    const rows = new Map<number, SheetPiecePlacement[]>()

    for (const placement of layout.placements) {
      if (placement.xMm < 0 || placement.yMm < 0) {
        errors.push(`A peça ${placement.index + 1} da chapa ${layout.sheetNumber} tem posição inválida.`)
      }
      if (placement.xMm + placement.placedWidthMm > result.sheetWidthMm) {
        errors.push(`A peça ${placement.index + 1} da chapa ${layout.sheetNumber} ultrapassa a largura da chapa.`)
      }
      if (placement.yMm + placement.placedLengthMm > result.sheetLengthMm) {
        errors.push(`A peça ${placement.index + 1} da chapa ${layout.sheetNumber} ultrapassa o comprimento da chapa.`)
      }
      const rowPlacements = rows.get(placement.rowIndex) ?? []
      rowPlacements.push(placement)
      rows.set(placement.rowIndex, rowPlacements)
    }

    for (const [rowIndex, placements] of rows) {
      const sorted = [...placements].sort((a, b) => a.xMm - b.xMm)
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i]
        const next = sorted[i + 1]
        if (current && next && current.xMm + current.placedWidthMm > next.xMm) {
          errors.push(`Duas peças da linha ${rowIndex} da chapa ${layout.sheetNumber} se sobrepõem.`)
        }
      }
    }

    const rowBands = Array.from(rows.entries())
      .map(([rowIndex, placements]) => ({
        rowIndex,
        yStart: Math.min(...placements.map((p) => p.yMm)),
        yEnd: Math.max(...placements.map((p) => p.yMm + p.placedLengthMm)),
      }))
      .sort((a, b) => a.yStart - b.yStart)

    for (let i = 0; i < rowBands.length - 1; i++) {
      const current = rowBands[i]
      const next = rowBands[i + 1]
      if (current && next && current.yEnd > next.yStart) {
        errors.push(`Duas linhas de peças da chapa ${layout.sheetNumber} se sobrepõem.`)
      }
    }
  }

  const expectedSheetAreaM2 = (result.sheetWidthMm * result.sheetLengthMm) / 1_000_000
  if (Math.abs(expectedSheetAreaM2 - result.sheetAreaM2) > 1e-9) {
    errors.push('A área da chapa foi calculada incorretamente.')
  }

  const expectedPurchasedAreaM2 = expectedSheetAreaM2 * result.requiredSheetCount
  if (Math.abs(expectedPurchasedAreaM2 - result.purchasedAreaM2) > 1e-9) {
    errors.push('A área total das chapas utilizadas foi calculada incorretamente.')
  }

  return { isValid: errors.length === 0, errors }
}
