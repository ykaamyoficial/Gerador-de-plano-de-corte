import { describe, expect, it } from 'vitest'
import {
  validateItemLength,
  validateItemQuantity,
  validateKerf,
  validatePlan,
  validateStockLength,
} from '../domain/cutting/validation'

describe('validateStockLength', () => {
  it('exige um valor informado', () => {
    expect(validateStockLength(null)).toBe('Informe o comprimento da barra.')
  })

  it('exige número inteiro maior que zero', () => {
    expect(validateStockLength(0)).not.toBeNull()
    expect(validateStockLength(-100)).not.toBeNull()
    expect(validateStockLength(1000.5)).not.toBeNull()
    expect(validateStockLength(6000)).toBeNull()
  })
})

describe('validateKerf', () => {
  it('exige um valor informado', () => {
    expect(validateKerf(null)).toBe('Informe a espessura do corte.')
  })

  it('aceita zero, rejeita negativo e decimal', () => {
    expect(validateKerf(0)).toBeNull()
    expect(validateKerf(-1)).not.toBeNull()
    expect(validateKerf(1.2)).not.toBeNull()
    expect(validateKerf(3)).toBeNull()
  })
})

describe('validateItemLength', () => {
  it('bloqueia peça maior que a barra', () => {
    expect(validateItemLength(6500, 6000)).toBe(
      'A peça de 6500 mm não cabe em uma barra de 6000 mm.',
    )
  })

  it('aceita peça igual à barra', () => {
    expect(validateItemLength(6000, 6000)).toBeNull()
  })

  it('rejeita valores nulos, zero, negativos e decimais', () => {
    expect(validateItemLength(null, 6000)).not.toBeNull()
    expect(validateItemLength(0, 6000)).not.toBeNull()
    expect(validateItemLength(-10, 6000)).not.toBeNull()
    expect(validateItemLength(10.5, 6000)).not.toBeNull()
  })
})

describe('validateItemQuantity', () => {
  it('caso 7: zero, negativo, decimal e vazio são inválidos', () => {
    expect(validateItemQuantity(0)).not.toBeNull()
    expect(validateItemQuantity(-3)).not.toBeNull()
    expect(validateItemQuantity(2.5)).not.toBeNull()
    expect(validateItemQuantity(null)).not.toBeNull()
  })

  it('aceita inteiro positivo', () => {
    expect(validateItemQuantity(5)).toBeNull()
  })
})

describe('validatePlan', () => {
  it('caso 11.5: não permite calcular um plano sem nenhuma medida válida', () => {
    const result = validatePlan({
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [],
    })
    expect(result.isValid).toBe(false)
    expect(result.planError).not.toBeNull()
  })

  it('é válido quando barra, corte e todas as medidas estão corretas', () => {
    const result = validatePlan({
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [
        { id: 'a', lengthMm: 1250, quantity: 10 },
        { id: 'b', lengthMm: 980, quantity: 6 },
      ],
    })
    expect(result.isValid).toBe(true)
  })

  it('fica inválido quando qualquer medida da tabela tem erro', () => {
    const result = validatePlan({
      stockLengthMm: 6000,
      kerfMm: 3,
      items: [
        { id: 'a', lengthMm: 1250, quantity: 10 },
        { id: 'b', lengthMm: 6500, quantity: 1 },
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.itemErrors.get('b')?.lengthError).not.toBeNull()
  })
})
