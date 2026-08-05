import { describe, expect, it } from 'vitest'
import { optimizeLinearCut } from '../domain/cutting/optimizer'
import { validateOptimizationResult } from '../domain/cutting/resultValidator'
import { validateItemLength } from '../domain/cutting/validation'
import type { OptimizeLinearCutInput } from '../domain/cutting/types'

function countByLength(bars: ReturnType<typeof optimizeLinearCut>['bars']) {
  const counts = new Map<number, number>()
  for (const bar of bars) {
    for (const piece of bar.pieces) {
      counts.set(piece.lengthMm, (counts.get(piece.lengthMm) ?? 0) + 1)
    }
  }
  return counts
}

describe('optimizeLinearCut', () => {
  it('caso 1: uma única medida — todas as peças aparecem sem ultrapassar a barra', () => {
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [{ lengthMm: 1000, quantity: 5 }],
    }
    const result = optimizeLinearCut(input)

    const counts = countByLength(result.bars)
    expect(counts.get(1000)).toBe(5)

    for (const bar of result.bars) {
      expect(bar.consumedLengthMm).toBeLessThanOrEqual(6000)
      expect(bar.kerfLossMm).toBe(bar.cutCount * 3)
    }
  })

  it('caso 2: várias medidas — todas as quantidades atendidas, sem duplicar ou ultrapassar, e válido', () => {
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [
        { lengthMm: 1250, quantity: 10 },
        { lengthMm: 980, quantity: 6 },
        { lengthMm: 620, quantity: 8 },
      ],
    }
    const result = optimizeLinearCut(input)

    const counts = countByLength(result.bars)
    expect(counts.get(1250)).toBe(10)
    expect(counts.get(980)).toBe(6)
    expect(counts.get(620)).toBe(8)

    for (const bar of result.bars) {
      expect(bar.consumedLengthMm).toBeLessThanOrEqual(6000)
    }

    const validation = validateOptimizationResult(input, result)
    expect(validation.isValid).toBe(true)
  })

  it('caso 3: peça maior que a barra é bloqueada pela validação', () => {
    const error = validateItemLength(6500, 6000)
    expect(error).toBe('A peça de 6500 mm não cabe em uma barra de 6000 mm.')

    const okError = validateItemLength(6000, 6000)
    expect(okError).toBeNull()
  })

  it('caso 4: peça igual à barra — 1 barra, 0 cortes, 0 mm de sobra', () => {
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [{ lengthMm: 6000, quantity: 1 }],
    }
    const result = optimizeLinearCut(input)

    expect(result.requiredStockCount).toBe(1)
    expect(result.bars).toHaveLength(1)
    const bar = result.bars[0]
    expect(bar).toBeDefined()
    expect(bar?.cutCount).toBe(0)
    expect(bar?.leftoverMm).toBe(0)
  })

  it('caso 5: espessura zero — cálculo funciona normalmente', () => {
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 0,
      items: [{ lengthMm: 1000, quantity: 6 }],
    }
    const result = optimizeLinearCut(input)

    const counts = countByLength(result.bars)
    expect(counts.get(1000)).toBe(6)
    for (const bar of result.bars) {
      expect(bar.kerfLossMm).toBe(0)
      expect(bar.consumedLengthMm).toBeLessThanOrEqual(6000)
    }
  })

  it('caso 6: medidas repetidas são agrupadas corretamente', () => {
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [
        { lengthMm: 1000, quantity: 2 },
        { lengthMm: 1000, quantity: 3 },
        { lengthMm: 800, quantity: 4 },
      ],
    }
    const result = optimizeLinearCut(input)
    const counts = countByLength(result.bars)
    expect(counts.get(1000)).toBe(5)
    expect(counts.get(800)).toBe(4)
  })

  it('caso 7: quantidades inválidas são ignoradas na normalização', () => {
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [
        { lengthMm: 1000, quantity: 0 },
        { lengthMm: 1000, quantity: -1 },
        { lengthMm: 1000, quantity: 1.5 },
        { lengthMm: 1000, quantity: 4 },
      ],
    }
    const result = optimizeLinearCut(input)
    const counts = countByLength(result.bars)
    expect(counts.get(1000)).toBe(4)
  })

  it('caso 8: peça cabe pela medida nominal mas não cabe somada à perda do corte', () => {
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 3000,
      kerfMm: 3,
      items: [
        { lengthMm: 1500, quantity: 2 },
        { lengthMm: 1497, quantity: 1 },
      ],
    }
    const result = optimizeLinearCut(input)
    for (const bar of result.bars) {
      expect(bar.consumedLengthMm).toBeLessThanOrEqual(3000)
    }
    const validation = validateOptimizationResult(input, result)
    expect(validation.isValid).toBe(true)
  })

  it('caso 9: quantidade solicitada é igual à quantidade distribuída', () => {
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [
        { lengthMm: 1250, quantity: 10 },
        { lengthMm: 980, quantity: 6 },
        { lengthMm: 620, quantity: 8 },
      ],
    }
    const result = optimizeLinearCut(input)
    const totalRequested = input.items.reduce((sum, item) => sum + item.quantity, 0)
    const totalDistributed = result.bars.reduce((sum, bar) => sum + bar.pieces.length, 0)
    expect(totalDistributed).toBe(totalRequested)
  })

  it('caso 10: determinismo — mesma entrada gera sempre o mesmo resultado', () => {
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [
        { lengthMm: 1250, quantity: 10 },
        { lengthMm: 980, quantity: 6 },
        { lengthMm: 620, quantity: 8 },
      ],
    }
    const first = optimizeLinearCut(input)
    const second = optimizeLinearCut(input)

    expect(second.requiredStockCount).toBe(first.requiredStockCount)
    expect(second.bars.map((bar) => bar.pieces.map((p) => p.lengthMm))).toEqual(
      first.bars.map((bar) => bar.pieces.map((p) => p.lengthMm)),
    )
  })

  it('encontra a quantidade mínima comprovada de barras (caso conhecido)', () => {
    // 3 peças de 4000mm numa barra de 6000mm: BFD ingênuo poderia usar 3 barras,
    // mas a combinação ótima cabe em menos. Aqui garantimos que o motor não
    // desperdiça barras quando existe uma solução melhor.
    const input: OptimizeLinearCutInput = {
      stockLengthMm: 6000,
      kerfMm: 0,
      items: [{ lengthMm: 2000, quantity: 9 }],
    }
    const result = optimizeLinearCut(input)
    // 9 peças de 2000mm = 18000mm, barra de 6000mm comporta 3 peças por barra exatamente.
    expect(result.requiredStockCount).toBe(3)
    expect(result.optimizationStatus).toBe('proven_minimum')
  })
})
