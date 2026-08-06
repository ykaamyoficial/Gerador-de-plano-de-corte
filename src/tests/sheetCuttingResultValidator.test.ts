import { describe, expect, it } from 'vitest'
import { optimizeSheetCut } from '../domain/sheet-cutting/optimizeSheetCut'
import { validateSheetCutResult } from '../domain/sheet-cutting/resultValidator'
import type { OptimizeSheetCutInput, OptimizeSheetCutOutput } from '../domain/sheet-cutting/types'

describe('validateSheetCutResult', () => {
  const input: OptimizeSheetCutInput = {
    sheetWidthMm: 1200,
    sheetHeightMm: 3000,
    kerfMm: 3,
    items: [
      { id: 'a', widthMm: 500, heightMm: 500, quantity: 10, allowRotation: true },
      { id: 'b', widthMm: 100, heightMm: 500, quantity: 20, allowRotation: true },
    ],
  }

  it('aprova um resultado real gerado pelo otimizador', () => {
    const result = optimizeSheetCut(input)
    const validation = validateSheetCutResult(input, result)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('reprova quando uma peça é removida do resultado', () => {
    const result = optimizeSheetCut(input)
    const firstSheet = result.sheets[0]
    expect(firstSheet).toBeDefined()

    const tampered: OptimizeSheetCutOutput = {
      ...result,
      placedPieceCount: result.placedPieceCount - 1,
      sheets: [{ ...firstSheet!, placements: firstSheet!.placements.slice(0, -1) }, ...result.sheets.slice(1)],
    }

    const validation = validateSheetCutResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando uma peça ultrapassa os limites da chapa', () => {
    const result = optimizeSheetCut(input)
    const firstSheet = result.sheets[0]
    const firstPlacement = firstSheet?.placements[0]
    expect(firstPlacement).toBeDefined()

    const tampered: OptimizeSheetCutOutput = {
      ...result,
      sheets: [
        { ...firstSheet!, placements: [{ ...firstPlacement!, xMm: input.sheetWidthMm - 5 }, ...firstSheet!.placements.slice(1)] },
        ...result.sheets.slice(1),
      ],
    }

    const validation = validateSheetCutResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando duas peças se sobrepõem', () => {
    const result = optimizeSheetCut(input)
    const firstSheet = result.sheets[0]
    const [first, second] = firstSheet?.placements ?? []
    expect(first).toBeDefined()
    expect(second).toBeDefined()

    const tampered: OptimizeSheetCutOutput = {
      ...result,
      sheets: [
        {
          ...firstSheet!,
          placements: [first!, { ...second!, xMm: first!.xMm, yMm: first!.yMm }, ...firstSheet!.placements.slice(2)],
        },
        ...result.sheets.slice(1),
      ],
    }

    const validation = validateSheetCutResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando uma peça é girada mesmo com rotação desativada', () => {
    const noRotationInput: OptimizeSheetCutInput = {
      ...input,
      items: input.items.map((item) => ({ ...item, allowRotation: false })),
    }
    const result = optimizeSheetCut(noRotationInput)
    const firstSheet = result.sheets[0]
    const firstPlacement = firstSheet?.placements[0]
    expect(firstPlacement).toBeDefined()

    const tampered: OptimizeSheetCutOutput = {
      ...result,
      sheets: [
        {
          ...firstSheet!,
          placements: [
            { ...firstPlacement!, rotated: true, widthMm: firstPlacement!.heightMm, heightMm: firstPlacement!.widthMm },
            ...firstSheet!.placements.slice(1),
          ],
        },
        ...result.sheets.slice(1),
      ],
    }

    const validation = validateSheetCutResult(noRotationInput, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando a área total das peças está incorreta', () => {
    const result = optimizeSheetCut(input)
    const tampered: OptimizeSheetCutOutput = { ...result, totalPieceAreaM2: result.totalPieceAreaM2 + 1 }
    const validation = validateSheetCutResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })
})
