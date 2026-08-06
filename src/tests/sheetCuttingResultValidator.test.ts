import { describe, expect, it } from 'vitest'
import { calculateSheetCutPlan } from '../domain/sheet-cutting/calculateSheetCutPlan'
import { validateSheetCuttingResult } from '../domain/sheet-cutting/resultValidator'
import type { CalculateSheetCutInput, SheetCuttingResult } from '../domain/sheet-cutting/types'

describe('validateSheetCuttingResult', () => {
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

  it('aprova um resultado real gerado pelo calculador', () => {
    const result = calculateSheetCutPlan(input)
    const validation = validateSheetCuttingResult(input, result)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('reprova quando falta uma peça de uma das medidas', () => {
    const result = calculateSheetCutPlan(input)
    const lastLayout = result.layouts[result.layouts.length - 1]
    expect(lastLayout).toBeDefined()

    const tampered: SheetCuttingResult = {
      ...result,
      totalPlacedPieces: result.totalPlacedPieces - 1,
      layouts: [...result.layouts.slice(0, -1), { ...lastLayout!, placements: lastLayout!.placements.slice(0, -1) }],
    }

    const validation = validateSheetCuttingResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando uma peça ultrapassa os limites da chapa', () => {
    const result = calculateSheetCutPlan(input)
    const firstLayout = result.layouts[0]
    const firstPlacement = firstLayout?.placements[0]
    expect(firstPlacement).toBeDefined()

    const tampered: SheetCuttingResult = {
      ...result,
      layouts: [
        { ...firstLayout!, placements: [{ ...firstPlacement!, xMm: result.sheetWidthMm - 5 }, ...firstLayout!.placements.slice(1)] },
        ...result.layouts.slice(1),
      ],
    }

    const validation = validateSheetCuttingResult(input, tampered)
    expect(validation.isValid).toBe(false)
  })

  it('reprova quando duas peças da mesma linha se sobrepõem', () => {
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
          placements: [first!, { ...second!, rowIndex: first!.rowIndex, xMm: first!.xMm, yMm: first!.yMm }, ...firstLayout!.placements.slice(2)],
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
