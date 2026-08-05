import { describe, expect, it } from 'vitest'
import { calculateSheetCutPlan } from '../domain/sheet-cutting/calculateSheetCutPlan'
import { validateSheetCuttingResult } from '../domain/sheet-cutting/resultValidator'
import type { CalculateSheetCutInput, SheetCuttingResult } from '../domain/sheet-cutting/types'

describe('validateSheetCuttingResult', () => {
  const input: CalculateSheetCutInput = {
    sheetWidthMm: 1200,
    sheetLengthMm: 3000,
    pieceWidthMm: 300,
    pieceLengthMm: 300,
    quantity: 45,
    kerfMm: 3,
    allowRotation: false,
  }

  it('aprova um resultado real gerado pelo calculador', () => {
    const result = calculateSheetCutPlan(input)
    const validation = validateSheetCuttingResult(input, result)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('reprova quando uma peça é adicionada a mais do que a quantidade solicitada', () => {
    const result = calculateSheetCutPlan(input)
    const lastLayout = result.layouts[result.layouts.length - 1]
    expect(lastLayout).toBeDefined()

    const tampered: SheetCuttingResult = {
      ...result,
      layouts: [
        ...result.layouts.slice(0, -1),
        {
          ...lastLayout!,
          placedPieceCount: lastLayout!.placedPieceCount + 1,
          placements: [
            ...lastLayout!.placements,
            { index: lastLayout!.placements.length, row: 99, column: 99, xMm: 0, yMm: 0, widthMm: 300, lengthMm: 300 },
          ],
        },
      ],
    }

    const validation = validateSheetCuttingResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando uma peça ultrapassa os limites da chapa', () => {
    const result = calculateSheetCutPlan(input)
    const firstLayout = result.layouts[0]
    const firstPlacement = firstLayout?.placements[0]
    expect(firstLayout).toBeDefined()
    expect(firstPlacement).toBeDefined()

    const tampered: SheetCuttingResult = {
      ...result,
      layouts: [
        {
          ...firstLayout!,
          placements: [
            { ...firstPlacement!, xMm: result.sheetWidthMm - 10 },
            ...firstLayout!.placements.slice(1),
          ],
        },
        ...result.layouts.slice(1),
      ],
    }

    const validation = validateSheetCuttingResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando duas peças ocupam a mesma célula da grade', () => {
    const result = calculateSheetCutPlan(input)
    const firstLayout = result.layouts[0]
    const [first, second] = firstLayout?.placements ?? []
    expect(first).toBeDefined()
    expect(second).toBeDefined()

    const tampered: SheetCuttingResult = {
      ...result,
      layouts: [
        {
          ...firstLayout!,
          placements: [
            first!,
            { ...second!, row: first!.row, column: first!.column, xMm: first!.xMm, yMm: first!.yMm },
            ...firstLayout!.placements.slice(2),
          ],
        },
        ...result.layouts.slice(1),
      ],
    }

    const validation = validateSheetCuttingResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando a área informada está incorreta', () => {
    const result = calculateSheetCutPlan(input)
    const tampered: SheetCuttingResult = { ...result, sheetAreaM2: result.sheetAreaM2 + 1 }
    const validation = validateSheetCuttingResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })
})
