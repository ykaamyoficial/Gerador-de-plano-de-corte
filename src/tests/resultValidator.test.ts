import { describe, expect, it } from 'vitest'
import { optimizeLinearCut } from '../domain/cutting/optimizer'
import { validateOptimizationResult } from '../domain/cutting/resultValidator'
import type { OptimizeLinearCutInput, OptimizeLinearCutOutput } from '../domain/cutting/types'

describe('validateOptimizationResult', () => {
  const input: OptimizeLinearCutInput = {
    stockLengthMm: 6000,
    kerfMm: 3,
    items: [
      { lengthMm: 1250, quantity: 10 },
      { lengthMm: 980, quantity: 6 },
      { lengthMm: 620, quantity: 8 },
    ],
  }

  it('aprova um resultado real gerado pelo otimizador', () => {
    const result = optimizeLinearCut(input)
    const validation = validateOptimizationResult(input, result)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('reprova quando falta uma peça solicitada', () => {
    const result = optimizeLinearCut(input)
    const tampered: OptimizeLinearCutOutput = {
      ...result,
      bars: result.bars.slice(0, -1),
      requiredStockCount: result.bars.length - 1,
    }
    const validation = validateOptimizationResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando uma barra ultrapassa o comprimento disponível', () => {
    const tampered: OptimizeLinearCutOutput = {
      requiredStockCount: 1,
      optimizationStatus: 'proven_minimum',
      calculationTimeMs: 0,
      bars: [
        {
          barNumber: 1,
          pieces: [{ lengthMm: 1250 }, { lengthMm: 1250 }, { lengthMm: 1250 }, { lengthMm: 1250 }, { lengthMm: 1250 }],
          piecesLengthMm: 6250,
          cutCount: 5,
          kerfLossMm: 15,
          consumedLengthMm: 6265,
          leftoverMm: -265,
        },
      ],
    }
    const singleItemInput: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [{ lengthMm: 1250, quantity: 5 }],
    }
    const validation = validateOptimizationResult(singleItemInput, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando uma peça extra não solicitada aparece no resultado', () => {
    const result = optimizeLinearCut(input)
    const firstBar = result.bars[0]
    expect(firstBar).toBeDefined()
    const tampered: OptimizeLinearCutOutput = {
      ...result,
      bars: [
        {
          ...firstBar!,
          pieces: [...firstBar!.pieces, { lengthMm: 111 }],
        },
        ...result.bars.slice(1),
      ],
    }
    const validation = validateOptimizationResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })
})
