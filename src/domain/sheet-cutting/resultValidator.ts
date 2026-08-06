import type { OptimizeSheetCutInput, OptimizeSheetCutOutput, SheetPiecePlacement } from './types'

export interface SheetResultValidation {
  isValid: boolean
  errors: string[]
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

function piecesOverlap(a: SheetPiecePlacement, b: SheetPiecePlacement, kerfMm: number): boolean {
  const noOverlap =
    a.xMm + a.widthMm + kerfMm <= b.xMm ||
    b.xMm + b.widthMm + kerfMm <= a.xMm ||
    a.yMm + a.heightMm + kerfMm <= b.yMm ||
    b.yMm + b.heightMm + kerfMm <= a.yMm
  return !noOverlap
}

/** Sweep by x, only comparing pieces whose x-ranges could possibly overlap — O(n log n) in the common (valid) case instead of checking every pair. */
function findOverlappingPair(
  placements: readonly SheetPiecePlacement[],
  kerfMm: number,
): [SheetPiecePlacement, SheetPiecePlacement] | null {
  const sorted = [...placements].sort((a, b) => a.xMm - b.xMm)
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i]
    if (!a) continue
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j]
      if (!b) continue
      if (b.xMm >= a.xMm + a.widthMm + kerfMm) break
      if (piecesOverlap(a, b, kerfMm)) return [a, b]
    }
  }
  return null
}

/**
 * Independently re-checks an optimizeSheetCut result. A result must pass
 * this validation before it is shown to the user.
 */
export function validateSheetCutResult(
  input: OptimizeSheetCutInput,
  output: OptimizeSheetCutOutput,
): SheetResultValidation {
  const errors: string[] = []

  if (output.requiredSheetCount <= 0) {
    errors.push('A quantidade de chapas deve ser maior que zero.')
  }
  if (output.sheets.length !== output.requiredSheetCount) {
    errors.push('O número de desenhos de chapa não corresponde à quantidade de chapas necessárias.')
  }

  const requestedTotal = input.items.reduce((sum, item) => sum + item.quantity, 0)
  if (output.requestedPieceCount !== requestedTotal) {
    errors.push('A quantidade solicitada não corresponde à entrada original.')
  }
  if (output.placedPieceCount !== output.requestedPieceCount) {
    errors.push('A quantidade total de peças distribuídas não corresponde ao total solicitado.')
  }

  for (const item of output.items) {
    if (item.placedQuantity !== item.requestedQuantity) {
      errors.push(
        `A medida de ${item.widthMm} × ${item.heightMm} mm não foi totalmente atendida (${item.placedQuantity}/${item.requestedQuantity}).`,
      )
    }
  }

  const seenInstanceIds = new Set<string>()
  let totalPlacements = 0

  for (const sheet of output.sheets) {
    totalPlacements += sheet.placements.length

    for (const placement of sheet.placements) {
      if (seenInstanceIds.has(placement.instanceId)) {
        errors.push(`A peça ${placement.instanceId} aparece duplicada no resultado.`)
      }
      seenInstanceIds.add(placement.instanceId)

      if (!isFiniteNonNegative(placement.xMm) || !isFiniteNonNegative(placement.yMm)) {
        errors.push(`A peça ${placement.instanceId} tem posição inválida.`)
      }
      if (!Number.isFinite(placement.widthMm) || placement.widthMm <= 0 || !Number.isFinite(placement.heightMm) || placement.heightMm <= 0) {
        errors.push(`A peça ${placement.instanceId} tem dimensões inválidas.`)
      }
      if (placement.xMm + placement.widthMm > input.sheetWidthMm + 1e-6) {
        errors.push(`A peça ${placement.instanceId} da chapa ${sheet.sheetNumber} ultrapassa a largura da chapa.`)
      }
      if (placement.yMm + placement.heightMm > input.sheetHeightMm + 1e-6) {
        errors.push(`A peça ${placement.instanceId} da chapa ${sheet.sheetNumber} ultrapassa o comprimento da chapa.`)
      }

      const sourceItem = input.items.find((item) => item.id === placement.itemId)
      if (!sourceItem) {
        errors.push(`A peça ${placement.instanceId} referencia uma medida desconhecida.`)
      } else {
        if (placement.rotated && !sourceItem.allowRotation) {
          errors.push(`A peça ${placement.instanceId} foi girada mesmo com a rotação desativada.`)
        }
        const expectedWidthMm = placement.rotated ? sourceItem.heightMm : sourceItem.widthMm
        const expectedHeightMm = placement.rotated ? sourceItem.widthMm : sourceItem.heightMm
        if (placement.widthMm !== expectedWidthMm || placement.heightMm !== expectedHeightMm) {
          errors.push(`A peça ${placement.instanceId} tem dimensões incompatíveis com a orientação informada.`)
        }
        if (placement.originalWidthMm !== sourceItem.widthMm || placement.originalHeightMm !== sourceItem.heightMm) {
          errors.push(`A peça ${placement.instanceId} não corresponde à medida original.`)
        }
      }
    }

    const overlap = findOverlappingPair(sheet.placements, input.kerfMm)
    if (overlap) {
      errors.push(
        `As peças ${overlap[0].instanceId} e ${overlap[1].instanceId} da chapa ${sheet.sheetNumber} se sobrepõem ou não respeitam a espessura do corte.`,
      )
    }

    const expectedUsedAreaMm2 = sheet.placements.reduce((sum, p) => sum + p.widthMm * p.heightMm, 0)
    if (Math.abs(expectedUsedAreaMm2 - sheet.usedAreaMm2) > 1e-6) {
      errors.push(`A área utilizada da chapa ${sheet.sheetNumber} foi calculada incorretamente.`)
    }
  }

  if (totalPlacements !== output.placedPieceCount) {
    errors.push('A contagem de peças distribuídas não confere com o total informado.')
  }

  const expectedTotalPieceAreaM2 = input.items.reduce(
    (sum, item) => sum + (item.widthMm * item.heightMm * item.quantity) / 1_000_000,
    0,
  )
  if (Math.abs(expectedTotalPieceAreaM2 - output.totalPieceAreaM2) > 1e-6) {
    errors.push('A área total das peças foi calculada incorretamente.')
  }

  const expectedTotalSheetAreaM2 = (input.sheetWidthMm * input.sheetHeightMm * output.requiredSheetCount) / 1_000_000
  if (Math.abs(expectedTotalSheetAreaM2 - output.totalSheetAreaM2) > 1e-6) {
    errors.push('A área total das chapas utilizadas foi calculada incorretamente.')
  }

  return { isValid: errors.length === 0, errors }
}
