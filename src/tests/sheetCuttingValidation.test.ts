import { describe, expect, it } from 'vitest'
import {
  validateKerf,
  validatePieceLength,
  validatePieceWidth,
  validateQuantity,
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

describe('validatePieceWidth / validatePieceLength', () => {
  it('exige valores informados, inteiros e maiores que zero', () => {
    expect(validatePieceWidth(null)).toBe('Informe a largura da peça.')
    expect(validatePieceWidth(300)).toBeNull()
    expect(validatePieceLength(null)).toBe('Informe o comprimento da peça.')
    expect(validatePieceLength(300)).toBeNull()
  })
})

describe('validateQuantity', () => {
  it('rejeita zero, negativo, decimal e vazio', () => {
    expect(validateQuantity(0)).not.toBeNull()
    expect(validateQuantity(-3)).not.toBeNull()
    expect(validateQuantity(2.5)).not.toBeNull()
    expect(validateQuantity(null)).not.toBeNull()
    expect(validateQuantity(40)).toBeNull()
  })
})

describe('validateKerf', () => {
  it('aceita zero, rejeita negativo', () => {
    expect(validateKerf(0)).toBeNull()
    expect(validateKerf(-1)).not.toBeNull()
    expect(validateKerf(3)).toBeNull()
  })
})

describe('validateSheetPlan', () => {
  it('teste 7: bloqueia peça que não cabe na chapa em nenhuma orientação', () => {
    const result = validateSheetPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 1300,
      pieceLengthMm: 3100,
      quantity: 1,
      kerfMm: 0,
      allowRotation: true,
    })

    expect(result.isValid).toBe(false)
    expect(result.fitError).toContain('não cabe na chapa')
  })

  it('aceita peça que só cabe girada quando allowRotation é verdadeiro', () => {
    const result = validateSheetPlan({
      sheetWidthMm: 500,
      sheetLengthMm: 1000,
      pieceWidthMm: 700,
      pieceLengthMm: 400,
      quantity: 1,
      kerfMm: 0,
      allowRotation: true,
    })

    expect(result.fitError).toBeNull()
    expect(result.isValid).toBe(true)
  })

  it('bloqueia peça que só cabe girada quando allowRotation é falso', () => {
    const result = validateSheetPlan({
      sheetWidthMm: 500,
      sheetLengthMm: 1000,
      pieceWidthMm: 700,
      pieceLengthMm: 400,
      quantity: 1,
      kerfMm: 0,
      allowRotation: false,
    })

    expect(result.fitError).not.toBeNull()
    expect(result.isValid).toBe(false)
  })

  it('é válido para o exemplo principal', () => {
    const result = validateSheetPlan({
      sheetWidthMm: 1200,
      sheetLengthMm: 3000,
      pieceWidthMm: 300,
      pieceLengthMm: 300,
      quantity: 40,
      kerfMm: 0,
      allowRotation: true,
    })

    expect(result.isValid).toBe(true)
  })
})
