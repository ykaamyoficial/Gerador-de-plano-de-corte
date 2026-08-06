import { describe, expect, it } from 'vitest'
import {
  validateItemFit,
  validateItemLength,
  validateItemQuantity,
  validateItemWidth,
  validateKerf,
  validateSheetLength,
  validateSheetPlan,
  validateSheetWidth,
} from '../domain/sheet-cutting/validation'

describe('validateSheetWidth / validateSheetLength', () => {
  it('exige valores informados, inteiros e maiores que zero', () => {
    expect(validateSheetWidth(null)).toBe('Informe a largura da chapa.')
    expect(validateSheetWidth(0)).not.toBeNull()
    expect(validateSheetWidth(-5)).not.toBeNull()
    expect(validateSheetWidth(10.5)).not.toBeNull()
    expect(validateSheetWidth(1200)).toBeNull()

    expect(validateSheetLength(null)).toBe('Informe o comprimento da chapa.')
    expect(validateSheetLength(3000)).toBeNull()
  })
})

describe('validateItemWidth / validateItemLength', () => {
  it('exige valores informados, inteiros e maiores que zero', () => {
    expect(validateItemWidth(null)).toBe('Informe a largura da peça.')
    expect(validateItemWidth(300)).toBeNull()
    expect(validateItemLength(null)).toBe('Informe o comprimento da peça.')
    expect(validateItemLength(300)).toBeNull()
  })
})

describe('validateItemQuantity', () => {
  it('rejeita zero, negativo, decimal e vazio', () => {
    expect(validateItemQuantity(0)).not.toBeNull()
    expect(validateItemQuantity(-3)).not.toBeNull()
    expect(validateItemQuantity(2.5)).not.toBeNull()
    expect(validateItemQuantity(null)).not.toBeNull()
    expect(validateItemQuantity(40)).toBeNull()
  })
})

describe('validateKerf', () => {
  it('aceita zero, rejeita negativo', () => {
    expect(validateKerf(0)).toBeNull()
    expect(validateKerf(-1)).not.toBeNull()
    expect(validateKerf(3)).toBeNull()
  })
})

describe('validateItemFit', () => {
  it('bloqueia peça que não cabe na chapa em nenhuma orientação', () => {
    const error = validateItemFit(1300, 3100, 1200, 3000, true)
    expect(error).toContain('não cabe na chapa')
  })

  it('aceita peça que só cabe girada quando allowRotation é verdadeiro', () => {
    expect(validateItemFit(700, 400, 500, 1000, true)).toBeNull()
  })

  it('bloqueia peça que só cabe girada quando allowRotation é falso', () => {
    expect(validateItemFit(700, 400, 500, 1000, false)).not.toBeNull()
  })
})

describe('validateSheetPlan', () => {
  it('é válido para uma lista de medidas que cabem na chapa', () => {
    const result = validateSheetPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 3,
      allowRotation: true,
      items: [
        { id: 'a', widthMm: 300, lengthMm: 300, quantity: 20 },
        { id: 'b', widthMm: 50, lengthMm: 440, quantity: 30 },
      ],
    })

    expect(result.isValid).toBe(true)
  })

  it('fica inválido quando qualquer medida da lista não cabe', () => {
    const result = validateSheetPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 0,
      allowRotation: false,
      items: [
        { id: 'a', widthMm: 300, lengthMm: 300, quantity: 20 },
        { id: 'b', widthMm: 1300, lengthMm: 3100, quantity: 1 },
      ],
    })

    expect(result.isValid).toBe(false)
    expect(result.itemErrors.get('b')?.fitError).not.toBeNull()
    expect(result.itemErrors.get('a')?.fitError).toBeNull()
  })

  it('não permite calcular sem nenhuma medida válida', () => {
    const result = validateSheetPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      kerfMm: 0,
      allowRotation: true,
      items: [],
    })

    expect(result.isValid).toBe(false)
    expect(result.planError).not.toBeNull()
  })
})
