import { describe, expect, it } from 'vitest'
import { calculateAreaM2 } from '../domain/sheet-cutting/calculations'
import { calculateSheetCutPlan } from '../domain/sheet-cutting/calculateSheetCutPlan'
import type { CalculateSheetCutInput } from '../domain/sheet-cutting/types'

describe('calculateSheetCutPlan — single measure (matches the classic grid result)', () => {
  it('teste 1: exemplo principal — 40 peças em 1 chapa', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 0,
      allowRotation: false,
      items: [{ widthMm: 300, lengthMm: 300, quantity: 40 }],
    })

    expect(result.requiredSheetCount).toBe(1)
    expect(result.items[0]?.placedQuantity).toBe(40)
  })

  it('teste 2: duas chapas — 40 peças em cada uma', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 0,
      allowRotation: false,
      items: [{ widthMm: 300, lengthMm: 300, quantity: 80 }],
    })

    expect(result.requiredSheetCount).toBe(2)
    expect(result.layouts[0]?.placements).toHaveLength(40)
    expect(result.layouts[1]?.placements).toHaveLength(40)
  })

  it('teste 3: última chapa parcial — chapa 1 com 40, chapa 2 com 5', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 0,
      allowRotation: false,
      items: [{ widthMm: 300, lengthMm: 300, quantity: 45 }],
    })

    expect(result.requiredSheetCount).toBe(2)
    expect(result.layouts[0]?.placements).toHaveLength(40)
    expect(result.layouts[1]?.placements).toHaveLength(5)
  })

  it('teste 4: corte com espessura — 27 peças por chapa (3 colunas × 9 linhas)', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 3,
      allowRotation: false,
      items: [{ widthMm: 300, lengthMm: 300, quantity: 27 }],
    })

    expect(result.requiredSheetCount).toBe(1)
    expect(result.layouts[0]?.placements).toHaveLength(27)
  })

  it('teste 7: peça impossível — bloqueia o cálculo', () => {
    const input: CalculateSheetCutInput = {
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 0,
      allowRotation: true,
      items: [{ widthMm: 1300, lengthMm: 3100, quantity: 1 }],
    }

    expect(() => calculateSheetCutPlan(input)).toThrow()
  })

  it('teste 8: área da chapa e da peça calculadas corretamente', () => {
    expect(calculateAreaM2(1200, 3000)).toBeCloseTo(3.6, 5)
    expect(calculateAreaM2(300, 300)).toBeCloseTo(0.09, 5)
  })
})

describe('calculateSheetCutPlan — várias medidas na mesma chapa', () => {
  it('mistura 300×300 e 50×440 na mesma chapa, atendendo as duas quantidades', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 3,
      allowRotation: true,
      items: [
        { widthMm: 300, lengthMm: 300, quantity: 20 },
        { widthMm: 50, lengthMm: 440, quantity: 30 },
      ],
    })

    const big = result.items.find((item) => item.widthMm === 300)
    const small = result.items.find((item) => item.widthMm === 50)
    expect(big?.placedQuantity).toBe(20)
    expect(small?.placedQuantity).toBe(30)
    expect(result.totalPlacedPieces).toBe(50)
  })

  it('nenhuma peça ultrapassa os limites da chapa quando há tamanhos diferentes', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 3,
      allowRotation: true,
      items: [
        { widthMm: 300, lengthMm: 300, quantity: 15 },
        { widthMm: 50, lengthMm: 440, quantity: 25 },
        { widthMm: 700, lengthMm: 200, quantity: 4 },
      ],
    })

    for (const layout of result.layouts) {
      for (const placement of layout.placements) {
        expect(placement.xMm).toBeGreaterThanOrEqual(0)
        expect(placement.yMm).toBeGreaterThanOrEqual(0)
        expect(placement.xMm + placement.placedWidthMm).toBeLessThanOrEqual(result.sheetWidthMm)
        expect(placement.yMm + placement.placedLengthMm).toBeLessThanOrEqual(result.sheetLengthMm)
      }
    }
  })

  it('duas peças da mesma linha nunca se sobrepõem (larguras variadas)', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 3,
      allowRotation: true,
      items: [
        { widthMm: 300, lengthMm: 300, quantity: 15 },
        { widthMm: 50, lengthMm: 440, quantity: 25 },
      ],
    })

    for (const layout of result.layouts) {
      const rows = new Map<number, typeof layout.placements>()
      for (const placement of layout.placements) {
        const row = rows.get(placement.rowIndex) ?? []
        row.push(placement)
        rows.set(placement.rowIndex, row)
      }
      for (const placements of rows.values()) {
        const sorted = [...placements].sort((a, b) => a.xMm - b.xMm)
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i]
          const next = sorted[i + 1]
          expect(current!.xMm + current!.placedWidthMm).toBeLessThanOrEqual(next!.xMm)
        }
      }
    }
  })

  it('duas medidas iguais adicionadas em linhas separadas são somadas', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 0,
      allowRotation: false,
      items: [
        { widthMm: 300, lengthMm: 300, quantity: 10 },
        { widthMm: 300, lengthMm: 300, quantity: 5 },
      ],
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.requestedQuantity).toBe(15)
    expect(result.items[0]?.placedQuantity).toBe(15)
  })

  it('bloqueia quando qualquer uma das medidas não cabe na chapa', () => {
    const input: CalculateSheetCutInput = {
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 0,
      allowRotation: false,
      items: [
        { widthMm: 300, lengthMm: 300, quantity: 5 },
        { widthMm: 1300, lengthMm: 3100, quantity: 1 },
      ],
    }

    expect(() => calculateSheetCutPlan(input)).toThrow()
  })

  it('determinismo — mesma entrada gera o mesmo desenho e a mesma distribuição', () => {
    const input: CalculateSheetCutInput = {
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 3,
      allowRotation: true,
      items: [
        { widthMm: 300, lengthMm: 300, quantity: 20 },
        { widthMm: 50, lengthMm: 440, quantity: 30 },
      ],
    }

    const first = calculateSheetCutPlan(input)
    const second = calculateSheetCutPlan(input)
    expect(second).toEqual(first)
  })

  it('rotação ajuda a encaixar peças estreitas e altas quando permitida', () => {
    const withRotation = calculateSheetCutPlan({
      sheetWidthMm: 500,
      sheetLengthMm: 1000,
      kerfMm: 0,
      allowRotation: true,
      items: [{ widthMm: 300, lengthMm: 100, quantity: 15 }],
    })
    const withoutRotation = calculateSheetCutPlan({
      sheetWidthMm: 500,
      sheetLengthMm: 1000,
      kerfMm: 0,
      allowRotation: false,
      items: [{ widthMm: 300, lengthMm: 100, quantity: 15 }],
    })

    expect(withRotation.requiredSheetCount).toBeLessThanOrEqual(withoutRotation.requiredSheetCount)
    expect(withRotation.requiredSheetCount).toBe(1)
  })

  it('área total das peças soma corretamente as diferentes medidas', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 0,
      allowRotation: false,
      items: [
        { widthMm: 300, lengthMm: 300, quantity: 10 },
        { widthMm: 50, lengthMm: 440, quantity: 20 },
      ],
    })

    const expectedArea = calculateAreaM2(300, 300) * 10 + calculateAreaM2(50, 440) * 20
    expect(result.requestedAreaM2).toBeCloseTo(expectedArea, 5)
  })
})
