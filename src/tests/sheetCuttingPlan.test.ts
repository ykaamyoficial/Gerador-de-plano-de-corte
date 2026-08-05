import { describe, expect, it } from 'vitest'
import { calculateAreaM2, calculateUsedLengthMm, calculateUsedWidthMm } from '../domain/sheet-cutting/calculations'
import { calculateSheetCutPlan } from '../domain/sheet-cutting/calculateSheetCutPlan'
import type { CalculateSheetCutInput } from '../domain/sheet-cutting/types'

describe('calculateSheetCutPlan', () => {
  it('teste 1: exemplo principal — 4 colunas, 10 linhas, 40 peças por chapa, 1 chapa', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 300,
      pieceLengthMm: 300,
      quantity: 40,
      kerfMm: 0,
      allowRotation: false,
    })

    expect(result.columns).toBe(4)
    expect(result.rows).toBe(10)
    expect(result.piecesPerFullSheet).toBe(40)
    expect(result.requiredSheetCount).toBe(1)
  })

  it('teste 2: duas chapas — 40 peças em cada uma', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 300,
      pieceLengthMm: 300,
      quantity: 80,
      kerfMm: 0,
      allowRotation: false,
    })

    expect(result.requiredSheetCount).toBe(2)
    expect(result.layouts).toHaveLength(2)
    expect(result.layouts[0]?.placedPieceCount).toBe(40)
    expect(result.layouts[1]?.placedPieceCount).toBe(40)
  })

  it('teste 3: última chapa parcial — chapa 1 com 40, chapa 2 com 5', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 300,
      pieceLengthMm: 300,
      quantity: 45,
      kerfMm: 0,
      allowRotation: false,
    })

    expect(result.requiredSheetCount).toBe(2)
    expect(result.layouts[0]?.placedPieceCount).toBe(40)
    expect(result.layouts[0]?.isFull).toBe(true)
    expect(result.layouts[1]?.placedPieceCount).toBe(5)
    expect(result.layouts[1]?.isFull).toBe(false)
  })

  it('teste 4: corte com espessura — 3 colunas, 9 linhas, 27 peças por chapa', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 300,
      pieceLengthMm: 300,
      quantity: 27,
      kerfMm: 3,
      allowRotation: false,
    })

    expect(result.columns).toBe(3)
    expect(result.rows).toBe(9)
    expect(result.piecesPerFullSheet).toBe(27)
  })

  it('teste 5: rotação vantajosa — sistema escolhe a orientação girada', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 500,
      sheetLengthMm: 1000,
      pieceWidthMm: 300,
      pieceLengthMm: 100,
      quantity: 15,
      kerfMm: 0,
      allowRotation: true,
    })

    expect(result.orientation).toBe('rotated')
    expect(result.columns).toBe(5)
    expect(result.rows).toBe(3)
    expect(result.piecesPerFullSheet).toBe(15)
    expect(result.placedPieceWidthMm).toBe(100)
    expect(result.placedPieceLengthMm).toBe(300)
  })

  it('teste 6: rotação desativada — mantém a orientação original mesmo sendo pior', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 500,
      sheetLengthMm: 1000,
      pieceWidthMm: 300,
      pieceLengthMm: 100,
      quantity: 10,
      kerfMm: 0,
      allowRotation: false,
    })

    expect(result.orientation).toBe('normal')
    expect(result.columns).toBe(1)
    expect(result.rows).toBe(10)
    expect(result.piecesPerFullSheet).toBe(10)
  })

  it('teste 7: peça impossível — bloqueia o cálculo', () => {
    const input: CalculateSheetCutInput = {
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 1300,
      pieceLengthMm: 3100,
      quantity: 1,
      kerfMm: 0,
      allowRotation: true,
    }

    expect(() => calculateSheetCutPlan(input)).toThrow()
  })

  it('teste 8: área da chapa e da peça calculadas corretamente', () => {
    expect(calculateAreaM2(1200, 3000)).toBeCloseTo(3.6, 5)
    expect(calculateAreaM2(300, 300)).toBeCloseTo(0.09, 5)
  })

  it('sobra lateral e no comprimento consideram a espessura do corte', () => {
    // 3 colunas de 300mm com 3mm de corte entre elas: 3*300 + 2*3 = 906mm ocupados de 1200mm.
    expect(calculateUsedWidthMm(3, 300, 3)).toBe(906)
    expect(calculateUsedLengthMm(9, 300, 3)).toBe(2724)
  })

  it('teste 9: nenhuma peça ultrapassa os limites da chapa', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 300,
      pieceLengthMm: 300,
      quantity: 45,
      kerfMm: 3,
      allowRotation: false,
    })

    for (const layout of result.layouts) {
      for (const placement of layout.placements) {
        expect(placement.xMm).toBeGreaterThanOrEqual(0)
        expect(placement.yMm).toBeGreaterThanOrEqual(0)
        expect(placement.xMm + placement.widthMm).toBeLessThanOrEqual(result.sheetWidthMm)
        expect(placement.yMm + placement.lengthMm).toBeLessThanOrEqual(result.sheetLengthMm)
      }
    }
  })

  it('teste 10: determinismo — mesma entrada gera o mesmo desenho e a mesma distribuição', () => {
    const input: CalculateSheetCutInput = {
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 300,
      pieceLengthMm: 300,
      quantity: 85,
      kerfMm: 3,
      allowRotation: true,
    }

    const first = calculateSheetCutPlan(input)
    const second = calculateSheetCutPlan(input)

    expect(second).toEqual(first)
  })

  it('peça igual à chapa cabe em uma única chapa sem corte', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 1200,
      pieceLengthMm: 3000,
      quantity: 1,
      kerfMm: 5,
      allowRotation: false,
    })

    expect(result.requiredSheetCount).toBe(1)
    expect(result.piecesPerFullSheet).toBe(1)
  })

  it('aproveitamento reflete a área não utilizada na última chapa parcial', () => {
    const result = calculateSheetCutPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 300,
      pieceLengthMm: 300,
      quantity: 45,
      kerfMm: 0,
      allowRotation: false,
    })

    expect(result.sheetAreaM2).toBeCloseTo(3.6, 5)
    expect(result.pieceAreaM2).toBeCloseTo(0.09, 5)
    expect(result.requestedAreaM2).toBeCloseTo(0.09 * 45, 5)
    expect(result.purchasedAreaM2).toBeCloseTo(3.6 * 2, 5)
    expect(result.utilizationPercentage).toBeLessThan(100)
  })
})
