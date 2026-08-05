import { computeBarMetrics } from './calculations'
import type { OptimizeLinearCutInput, OptimizeLinearCutOutput } from './types'

export interface ResultValidation {
  isValid: boolean
  errors: string[]
}

/**
 * Independently re-checks an optimizer result against the original request.
 * A result must pass this validation before it is shown to the user
 * (spec section 16).
 */
export function validateOptimizationResult(
  input: OptimizeLinearCutInput,
  output: OptimizeLinearCutOutput,
): ResultValidation {
  const errors: string[] = []
  const { stockLengthMm, kerfMm } = input

  const requestedCounts = new Map<number, number>()
  let totalRequestedQuantity = 0
  for (const item of input.items) {
    if (!Number.isInteger(item.lengthMm) || item.lengthMm <= 0) continue
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) continue
    requestedCounts.set(item.lengthMm, (requestedCounts.get(item.lengthMm) ?? 0) + item.quantity)
    totalRequestedQuantity += item.quantity
  }

  const producedCounts = new Map<number, number>()
  let totalProducedPieces = 0

  for (const bar of output.bars) {
    const lengths = bar.pieces.map((piece) => piece.lengthMm)
    const metrics = computeBarMetrics(lengths, stockLengthMm, kerfMm)

    if (metrics.consumedLengthMm > stockLengthMm) {
      errors.push(`A barra ${bar.barNumber} ultrapassa o comprimento disponível da barra inteira.`)
    }
    if (metrics.piecesLengthMm !== bar.piecesLengthMm) {
      errors.push(`Divergência no comprimento total das peças da barra ${bar.barNumber}.`)
    }
    if (metrics.cutCount !== bar.cutCount) {
      errors.push(`Divergência na quantidade de cortes da barra ${bar.barNumber}.`)
    }
    if (metrics.kerfLossMm !== bar.kerfLossMm) {
      errors.push(`Divergência na perda de corte da barra ${bar.barNumber}.`)
    }
    if (metrics.leftoverMm !== bar.leftoverMm) {
      errors.push(`Divergência na sobra da barra ${bar.barNumber}.`)
    }
    if (metrics.leftoverMm < 0) {
      errors.push(`A barra ${bar.barNumber} possui sobra negativa.`)
    }

    for (const length of lengths) {
      producedCounts.set(length, (producedCounts.get(length) ?? 0) + 1)
    }
    totalProducedPieces += lengths.length
  }

  for (const [length, quantity] of requestedCounts.entries()) {
    const produced = producedCounts.get(length) ?? 0
    if (produced !== quantity) {
      errors.push(`A medida de ${length} mm não foi totalmente atendida (${produced}/${quantity}).`)
    }
  }

  for (const [length] of producedCounts.entries()) {
    if (!requestedCounts.has(length)) {
      errors.push(`Foi produzida uma peça de ${length} mm que não foi solicitada.`)
    }
  }

  if (totalProducedPieces !== totalRequestedQuantity) {
    errors.push('A quantidade total de peças produzidas não corresponde ao total solicitado.')
  }

  if (output.requiredStockCount !== output.bars.length) {
    errors.push('A quantidade de barras informada não corresponde ao número de barras do resultado.')
  }

  return { isValid: errors.length === 0, errors }
}
