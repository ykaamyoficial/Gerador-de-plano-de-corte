import { describe, expect, it } from 'vitest'
import { optimizeSheetCut } from '../domain/sheet-cutting/optimizeSheetCut'
import type { OptimizeSheetCutInput } from '../domain/sheet-cutting/types'

function item(id: string, widthMm: number, heightMm: number, quantity: number, allowRotation = true) {
  return { id, widthMm, heightMm, quantity, allowRotation }
}

describe('optimizeSheetCut', () => {
  it('caso de referência: peças estreitas preenchem o espaço deixado pelas grandes — 1 chapa, ~97,22%', () => {
    const result = optimizeSheetCut({
      sheetWidthMm: 1200,
      sheetHeightMm: 3000,
      kerfMm: 0,
      items: [item('a', 500, 500, 10), item('b', 100, 500, 20)],
    })

    expect(result.requiredSheetCount).toBe(1)
    expect(result.placedPieceCount).toBe(30)
    expect(result.requestedPieceCount).toBe(30)
    expect(result.utilizationPercentage).toBeCloseTo(97.22, 1)
  })

  it('teste 1: uma única medida — 40 peças em 1 chapa', () => {
    const result = optimizeSheetCut({
      sheetWidthMm: 1200,
      sheetHeightMm: 3000,
      kerfMm: 0,
      items: [item('a', 300, 300, 40)],
    })

    expect(result.requiredSheetCount).toBe(1)
    expect(result.placedPieceCount).toBe(40)
  })

  it('teste 2: peças grandes e pequenas juntas — as pequenas ocupam a sobra das grandes', () => {
    const result = optimizeSheetCut({
      sheetWidthMm: 1000,
      sheetHeightMm: 1000,
      kerfMm: 0,
      items: [item('big', 600, 600, 1), item('small', 200, 200, 12)],
    })

    // 600x600 num canto + até 12 quadrados de 200x200 no L restante (1.000.000 - 360.000 = 640.000mm² / 40.000mm² = 16 possíveis)
    expect(result.requiredSheetCount).toBe(1)
    expect(result.placedPieceCount).toBe(13)
  })

  it('teste 3: rotação necessária — peça só cabe girada', () => {
    const result = optimizeSheetCut({
      sheetWidthMm: 500,
      sheetHeightMm: 1000,
      kerfMm: 0,
      items: [item('a', 800, 300, 1, true)],
    })

    expect(result.placedPieceCount).toBe(1)
    expect(result.sheets[0]?.placements[0]?.rotated).toBe(true)
  })

  it('teste 4: rotação desativada não gira a peça mesmo quando ajudaria', () => {
    const result = optimizeSheetCut({
      sheetWidthMm: 1200,
      sheetHeightMm: 3000,
      kerfMm: 0,
      items: [item('a', 300, 100, 6, false)],
    })

    for (const sheet of result.sheets) {
      for (const placement of sheet.placements) {
        expect(placement.rotated).toBe(false)
      }
    }
  })

  it('teste 5: espessura do corte recusa peças que caberiam nominalmente', () => {
    // 4 peças de 300mm cabem em 1200mm sem corte, mas não com 3mm de corte entre elas.
    const withoutKerf = optimizeSheetCut({
      sheetWidthMm: 1200,
      sheetHeightMm: 300,
      kerfMm: 0,
      items: [item('a', 300, 300, 4, false)],
    })
    expect(withoutKerf.requiredSheetCount).toBe(1)

    const withKerf = optimizeSheetCut({
      sheetWidthMm: 1200,
      sheetHeightMm: 300,
      kerfMm: 3,
      items: [item('a', 300, 300, 4, false)],
    })
    expect(withKerf.requiredSheetCount).toBe(2)
  })

  it('teste 6: peça maior que a chapa nas duas orientações bloqueia o cálculo', () => {
    const input: OptimizeSheetCutInput = {
      sheetWidthMm: 1200,
      sheetHeightMm: 3000,
      kerfMm: 0,
      items: [item('a', 1300, 3100, 1, true)],
    }
    expect(() => optimizeSheetCut(input)).toThrow()
  })

  it('teste 7: quantidade solicitada === quantidade posicionada', () => {
    const result = optimizeSheetCut({
      sheetWidthMm: 1200,
      sheetHeightMm: 3000,
      kerfMm: 3,
      items: [item('a', 500, 500, 10), item('b', 100, 500, 20)],
    })
    expect(result.placedPieceCount).toBe(result.requestedPieceCount)
    for (const summary of result.items) {
      expect(summary.placedQuantity).toBe(summary.requestedQuantity)
    }
  })

  it('teste 8: nenhuma peça se sobrepõe em nenhuma chapa', () => {
    const result = optimizeSheetCut({
      sheetWidthMm: 1200,
      sheetHeightMm: 3000,
      kerfMm: 3,
      items: [item('a', 500, 500, 10), item('b', 100, 500, 20), item('c', 700, 200, 4)],
    })

    for (const sheet of result.sheets) {
      const placements = sheet.placements
      for (let i = 0; i < placements.length; i++) {
        for (let j = i + 1; j < placements.length; j++) {
          const a = placements[i]!
          const b = placements[j]!
          const noOverlap =
            a.xMm + a.widthMm + 3 <= b.xMm ||
            b.xMm + b.widthMm + 3 <= a.xMm ||
            a.yMm + a.heightMm + 3 <= b.yMm ||
            b.yMm + b.heightMm + 3 <= a.yMm
          expect(noOverlap).toBe(true)
        }
      }
    }
  })

  it('teste 9: nenhuma coordenada é negativa ou ultrapassa a chapa', () => {
    const result = optimizeSheetCut({
      sheetWidthMm: 1200,
      sheetHeightMm: 3000,
      kerfMm: 3,
      items: [item('a', 500, 500, 10), item('b', 100, 500, 20)],
    })

    for (const sheet of result.sheets) {
      for (const placement of sheet.placements) {
        expect(placement.xMm).toBeGreaterThanOrEqual(0)
        expect(placement.yMm).toBeGreaterThanOrEqual(0)
        expect(placement.xMm + placement.widthMm).toBeLessThanOrEqual(1200)
        expect(placement.yMm + placement.heightMm).toBeLessThanOrEqual(3000)
      }
    }
  })

  it('teste 10: determinismo — mesma entrada gera a mesma quantidade de chapas, coordenadas e orientações', () => {
    const input: OptimizeSheetCutInput = {
      sheetWidthMm: 1200,
      sheetHeightMm: 3000,
      kerfMm: 3,
      items: [item('a', 500, 500, 10), item('b', 100, 500, 20)],
    }

    const first = optimizeSheetCut(input)
    const second = optimizeSheetCut(input)
    expect(second).toEqual(first)
  })
})
