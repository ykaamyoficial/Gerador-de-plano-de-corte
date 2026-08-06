export function validateSheetWidth(value: number | null): string | null {
  if (value === null) return 'Informe a largura da chapa.'
  if (!Number.isInteger(value)) return 'A largura da chapa deve ser um número inteiro.'
  if (value <= 0) return 'A largura da chapa deve ser maior que zero.'
  return null
}

export function validateSheetLength(value: number | null): string | null {
  if (value === null) return 'Informe o comprimento da chapa.'
  if (!Number.isInteger(value)) return 'O comprimento da chapa deve ser um número inteiro.'
  if (value <= 0) return 'O comprimento da chapa deve ser maior que zero.'
  return null
}

export function validateKerf(value: number | null): string | null {
  if (value === null) return 'Informe a espessura do corte.'
  if (!Number.isInteger(value)) return 'A espessura do corte deve ser um número inteiro.'
  if (value < 0) return 'A espessura do corte não pode ser negativa.'
  return null
}

export function validateItemWidth(value: number | null): string | null {
  if (value === null) return 'Informe a largura da peça.'
  if (!Number.isInteger(value)) return 'A largura da peça deve ser um número inteiro.'
  if (value <= 0) return 'A largura da peça deve ser maior que zero.'
  return null
}

export function validateItemLength(value: number | null): string | null {
  if (value === null) return 'Informe o comprimento da peça.'
  if (!Number.isInteger(value)) return 'O comprimento da peça deve ser um número inteiro.'
  if (value <= 0) return 'O comprimento da peça deve ser maior que zero.'
  return null
}

export function validateItemQuantity(value: number | null): string | null {
  if (value === null) return 'Informe a quantidade.'
  if (!Number.isInteger(value)) return 'A quantidade deve ser um número inteiro maior que zero.'
  if (value <= 0) return 'A quantidade deve ser um número inteiro maior que zero.'
  return null
}

function pieceFitsSheet(
  widthMm: number,
  lengthMm: number,
  sheetWidthMm: number,
  sheetLengthMm: number,
  allowRotation: boolean,
): boolean {
  const fitsNormal = widthMm <= sheetWidthMm && lengthMm <= sheetLengthMm
  const fitsRotated = lengthMm <= sheetWidthMm && widthMm <= sheetLengthMm
  return fitsNormal || (allowRotation && fitsRotated)
}

export function validateItemFit(
  widthMm: number | null,
  lengthMm: number | null,
  sheetWidthMm: number | null,
  sheetLengthMm: number | null,
  allowRotation: boolean,
): string | null {
  if (widthMm === null || lengthMm === null || sheetWidthMm === null || sheetLengthMm === null) return null
  if (!pieceFitsSheet(widthMm, lengthMm, sheetWidthMm, sheetLengthMm, allowRotation)) {
    return `A peça de ${widthMm} × ${lengthMm} mm não cabe na chapa de ${sheetWidthMm} × ${sheetLengthMm} mm.`
  }
  return null
}

export interface SheetItemValidation {
  widthError: string | null
  lengthError: string | null
  quantityError: string | null
  fitError: string | null
}

export interface SheetPlanValidationInput {
  sheetWidthMm: number | null
  sheetLengthMm: number | null
  kerfMm: number | null
  allowRotation: boolean
  items: Array<{ id: string; widthMm: number | null; lengthMm: number | null; quantity: number | null }>
}

export interface SheetPlanValidationResult {
  sheetWidthError: string | null
  sheetLengthError: string | null
  kerfError: string | null
  itemErrors: Map<string, SheetItemValidation>
  planError: string | null
  isValid: boolean
}

export function validateSheetPlan(plan: SheetPlanValidationInput): SheetPlanValidationResult {
  const sheetWidthError = validateSheetWidth(plan.sheetWidthMm)
  const sheetLengthError = validateSheetLength(plan.sheetLengthMm)
  const kerfError = validateKerf(plan.kerfMm)

  const itemErrors = new Map<string, SheetItemValidation>()
  let validItemCount = 0

  for (const item of plan.items) {
    const widthError = validateItemWidth(item.widthMm)
    const lengthError = validateItemLength(item.lengthMm)
    const quantityError = validateItemQuantity(item.quantity)
    const fitError =
      !widthError && !lengthError && !sheetWidthError && !sheetLengthError
        ? validateItemFit(item.widthMm, item.lengthMm, plan.sheetWidthMm, plan.sheetLengthMm, plan.allowRotation)
        : null

    itemErrors.set(item.id, { widthError, lengthError, quantityError, fitError })
    if (!widthError && !lengthError && !quantityError && !fitError) validItemCount++
  }

  const hasAtLeastOneValidItem = validItemCount > 0
  const allItemsValid = Array.from(itemErrors.values()).every(
    (error) => !error.widthError && !error.lengthError && !error.quantityError && !error.fitError,
  )

  const planError = hasAtLeastOneValidItem ? null : 'Adicione ao menos uma medida válida para calcular o plano.'
  const isValid = !sheetWidthError && !sheetLengthError && !kerfError && hasAtLeastOneValidItem && allItemsValid

  return { sheetWidthError, sheetLengthError, kerfError, itemErrors, planError, isValid }
}
