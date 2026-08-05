import type { CalculateSheetCutInput, SheetCuttingResult } from './types'

export interface SheetResultValidation {
  isValid: boolean
  errors: string[]
}

/**
 * Independently re-checks a calculateSheetCutPlan result. A result must
 * pass this validation before it is shown to the user (mirrors the linear
 * module's resultValidator).
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

  const totalPlaced = result.layouts.reduce((sum, layout) => sum + layout.placedPieceCount, 0)
  if (totalPlaced !== result.requestedQuantity) {
    errors.push('A quantidade de peças distribuídas não corresponde à quantidade solicitada.')
  }
  if (totalPlaced !== input.quantity) {
    errors.push('A quantidade de peças distribuídas não corresponde à quantidade informada.')
  }

  for (const layout of result.layouts) {
    if (layout.placedPieceCount > result.piecesPerFullSheet) {
      errors.push(`A chapa ${layout.sheetNumber} possui mais peças do que a capacidade da chapa.`)
    }
    if (layout.placedPieceCount === 0) {
      errors.push(`A chapa ${layout.sheetNumber} não possui nenhuma peça.`)
    }
    if (layout.isFull !== (layout.placedPieceCount === result.piecesPerFullSheet)) {
      errors.push(`O indicador de chapa completa da chapa ${layout.sheetNumber} está incorreto.`)
    }

    const seenCells = new Set<string>()
    for (const placement of layout.placements) {
      const expectedX = placement.column * (result.placedPieceWidthMm + result.kerfMm)
      const expectedY = placement.row * (result.placedPieceLengthMm + result.kerfMm)
      if (placement.xMm !== expectedX || placement.yMm !== expectedY) {
        errors.push(`A peça ${placement.index + 1} da chapa ${layout.sheetNumber} está em uma posição incorreta.`)
      }
      if (placement.widthMm !== result.placedPieceWidthMm || placement.lengthMm !== result.placedPieceLengthMm) {
        errors.push(`A peça ${placement.index + 1} da chapa ${layout.sheetNumber} tem dimensões incorretas.`)
      }

      const rightEdgeMm = placement.xMm + placement.widthMm
      const bottomEdgeMm = placement.yMm + placement.lengthMm
      if (placement.xMm < 0 || placement.yMm < 0 || rightEdgeMm > result.sheetWidthMm || bottomEdgeMm > result.sheetLengthMm) {
        errors.push(`A peça ${placement.index + 1} da chapa ${layout.sheetNumber} ultrapassa os limites da chapa.`)
      }
      if (placement.column < 0 || placement.column >= result.columns || placement.row < 0 || placement.row >= result.rows) {
        errors.push(`A peça ${placement.index + 1} da chapa ${layout.sheetNumber} está fora da grade calculada.`)
      }

      const cellKey = `${placement.row}:${placement.column}`
      if (seenCells.has(cellKey)) {
        errors.push(`Duas peças da chapa ${layout.sheetNumber} ocupam a mesma posição na grade.`)
      }
      seenCells.add(cellKey)
    }
  }

  if (result.orientation !== 'normal' && result.orientation !== 'rotated') {
    errors.push('A orientação calculada é inválida.')
  }
  if (result.orientation === 'rotated' && !input.allowRotation) {
    errors.push('A orientação girada foi usada mesmo com a rotação desativada.')
  }

  const expectedSheetAreaM2 = (result.sheetWidthMm * result.sheetLengthMm) / 1_000_000
  if (Math.abs(expectedSheetAreaM2 - result.sheetAreaM2) > 1e-9) {
    errors.push('A área da chapa foi calculada incorretamente.')
  }

  const expectedPieceAreaM2 = (result.originalPieceWidthMm * result.originalPieceLengthMm) / 1_000_000
  if (Math.abs(expectedPieceAreaM2 - result.pieceAreaM2) > 1e-9) {
    errors.push('A área da peça foi calculada incorretamente.')
  }

  const expectedRequestedAreaM2 = expectedPieceAreaM2 * result.requestedQuantity
  if (Math.abs(expectedRequestedAreaM2 - result.requestedAreaM2) > 1e-9) {
    errors.push('A área total das peças foi calculada incorretamente.')
  }

  const expectedPurchasedAreaM2 = expectedSheetAreaM2 * result.requiredSheetCount
  if (Math.abs(expectedPurchasedAreaM2 - result.purchasedAreaM2) > 1e-9) {
    errors.push('A área total das chapas utilizadas foi calculada incorretamente.')
  }

  return { isValid: errors.length === 0, errors }
}
