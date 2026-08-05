export function validateStockLength(value: number | null): string | null {
  if (value === null) return 'Informe o comprimento da barra.'
  if (!Number.isInteger(value)) return 'O comprimento da barra deve ser um número inteiro.'
  if (value <= 0) return 'O comprimento da barra deve ser maior que zero.'
  return null
}

export function validateKerf(value: number | null): string | null {
  if (value === null) return 'Informe a espessura do corte.'
  if (!Number.isInteger(value)) return 'A espessura do corte deve ser um número inteiro.'
  if (value < 0) return 'A espessura do corte deve ser maior ou igual a zero.'
  return null
}

export function validateItemLength(value: number | null, stockLengthMm: number | null): string | null {
  if (value === null) return 'Informe o comprimento da peça.'
  if (!Number.isInteger(value)) return 'O comprimento da peça deve ser um número inteiro.'
  if (value <= 0) return 'O comprimento da peça deve ser maior que zero.'
  if (stockLengthMm !== null && value > stockLengthMm) {
    return `A peça de ${value} mm não cabe em uma barra de ${stockLengthMm} mm.`
  }
  return null
}

export function validateItemQuantity(value: number | null): string | null {
  if (value === null) return 'Informe a quantidade.'
  if (!Number.isInteger(value)) return 'A quantidade deve ser um número inteiro maior que zero.'
  if (value <= 0) return 'A quantidade deve ser um número inteiro maior que zero.'
  return null
}

export interface ItemValidation {
  lengthError: string | null
  quantityError: string | null
}

export interface PlanValidationResult {
  stockLengthError: string | null
  kerfError: string | null
  itemErrors: Map<string, ItemValidation>
  planError: string | null
  isValid: boolean
}

export interface PlanValidationInput {
  stockLengthMm: number | null
  kerfMm: number | null
  items: Array<{ id: string; lengthMm: number | null; quantity: number | null }>
}

export function validatePlan(plan: PlanValidationInput): PlanValidationResult {
  const stockLengthError = validateStockLength(plan.stockLengthMm)
  const kerfError = validateKerf(plan.kerfMm)

  const itemErrors = new Map<string, ItemValidation>()
  let validItemCount = 0

  for (const item of plan.items) {
    const lengthError = validateItemLength(item.lengthMm, plan.stockLengthMm)
    const quantityError = validateItemQuantity(item.quantity)
    itemErrors.set(item.id, { lengthError, quantityError })
    if (!lengthError && !quantityError) validItemCount++
  }

  const hasAtLeastOneValidItem = validItemCount > 0
  const allItemsValid = Array.from(itemErrors.values()).every(
    (error) => !error.lengthError && !error.quantityError,
  )

  const planError = hasAtLeastOneValidItem
    ? null
    : 'Adicione ao menos uma medida válida para calcular o plano.'

  const isValid = !stockLengthError && !kerfError && hasAtLeastOneValidItem && allItemsValid

  return { stockLengthError, kerfError, itemErrors, planError, isValid }
}
