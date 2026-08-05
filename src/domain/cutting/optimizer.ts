import { buildBarResult } from './calculations'
import { exactSearchForBinCount } from './exactSearch'
import { bestFitDecreasing } from './initialSolution'
import { expandToPieces, normalizeItems } from './normalize'
import { validateOptimizationResult } from './resultValidator'
import type { OptimizeLinearCutInput, OptimizeLinearCutOutput } from './types'

const DEFAULT_TIME_LIMIT_MS = 5000

/**
 * Finds the minimum number of whole bars needed to produce every requested
 * piece, distributes the pieces across those bars, and returns the cutting
 * sequence and leftover for each one. Pure function: no React, no DOM,
 * no side effects — safe to call from anywhere and to unit test in isolation.
 */
export function optimizeLinearCut(input: OptimizeLinearCutInput): OptimizeLinearCutOutput {
  const startTime = Date.now()
  const deadline = startTime + (input.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS)
  const { stockLengthMm, kerfMm } = input

  const normalized = normalizeItems(input.items)
  const allPieces = expandToPieces(normalized)

  // A piece exactly as long as the stock bar always occupies its own bar,
  // uncut (spec section 12 exception). Isolating it keeps the packing
  // search below correct and simple: it only ever sees pieces shorter
  // than the stock length.
  const exactFitPieces = allPieces.filter((length) => length === stockLengthMm)
  const regularPieces = allPieces.filter((length) => length !== stockLengthMm)
  const dedicatedBars: number[][] = exactFitPieces.map((length) => [length])

  let regularBars: number[][] = []
  let provenMinimal = true

  if (regularPieces.length > 0) {
    const bfdBars = bestFitDecreasing(regularPieces, stockLengthMm, kerfMm)
    let bestBars = bfdBars
    const upperBound = bfdBars.length

    const totalLength = regularPieces.reduce((sum, length) => sum + length, 0)
    const estimatedKerfLoss = regularPieces.length * kerfMm
    const lowerBound = Math.max(1, Math.ceil((totalLength + estimatedKerfLoss) / stockLengthMm))

    if (upperBound <= lowerBound) {
      provenMinimal = true
    } else {
      let timedOut = false

      for (let binCount = lowerBound; binCount < upperBound; binCount++) {
        const result = exactSearchForBinCount(regularPieces, stockLengthMm, kerfMm, binCount, deadline)

        if (result.status === 'timeout') {
          timedOut = true
          break
        }
        if (result.status === 'found' && result.bars) {
          bestBars = result.bars
          break
        }
        // infeasible: a smaller bin count cannot hold every piece, keep searching upward
      }

      provenMinimal = !timedOut
    }

    regularBars = bestBars
  }

  const allBars = [...dedicatedBars, ...regularBars]
  const bars = allBars.map((pieces, index) => buildBarResult(index + 1, pieces, stockLengthMm, kerfMm))

  const output: OptimizeLinearCutOutput = {
    requiredStockCount: bars.length,
    bars,
    optimizationStatus: provenMinimal ? 'proven_minimum' : 'best_found',
    calculationTimeMs: Date.now() - startTime,
  }

  const validation = validateOptimizationResult(input, output)
  if (!validation.isValid) {
    console.error('Resultado do otimizador reprovado na validação:', validation.errors)
    throw new Error('invalid_optimization_result')
  }

  return output
}
