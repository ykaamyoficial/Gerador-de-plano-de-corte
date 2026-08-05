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

export function validatePieceWidth(value: number | null): string | null {
  if (value === null) return 'Informe a largura da peça.'
  if (!Number.isInteger(value)) return 'A largura da peça deve ser um número inteiro.'
  if (value <= 0) return 'A largura da peça deve ser maior que zero.'
  return null
}

export function validatePieceLength(value: number | null): string | null {
  if (value === null) return 'Informe o comprimento da peça.'
  if (!Number.isInteger(value)) return 'O comprimento da peça deve ser um número inteiro.'
  if (value <= 0) return 'O comprimento da peça deve ser maior que zero.'
  return null
}

export function validateQuantity(value: number | null): string | null {
  if (value === null) return 'Informe a quantidade.'
  if (!Number.isInteger(value)) return 'A quantidade deve ser um número inteiro maior que zero.'
  if (value <= 0) return 'A quantidade deve ser um número inteiro maior que zero.'
  return null
}

export function validateKerf(value: number | null): string | null {
  if (value === null) return 'Informe a espessura do corte.'
  if (!Number.isInteger(value)) return 'A espessura do corte deve ser um número inteiro.'
  if (value < 0) return 'A espessura do corte não pode ser negativa.'
  return null
}

export interface SheetPlanValidationInput {
  sheetWidthMm: number | null
  sheetLengthMm: number | null
  pieceWidthMm: number | null
  pieceLengthMm: number | null
  quantity: number | null
  kerfMm: number | null
  allowRotation: boolean
}

export interface SheetPlanValidationResult {
  sheetWidthError: string | null
  sheetLengthError: string | null
  pieceWidthError: string | null
  pieceLengthError: string | null
  quantityError: string | null
  kerfError: string | null
  fitError: string | null
  isValid: boolean
}

function pieceFitsSheet(
  pieceWidthMm: number,
  pieceLengthMm: number,
  sheetWidthMm: number,
  sheetLengthMm: number,
  allowRotation: boolean,
): boolean {
  const fitsNormal = pieceWidthMm <= sheetWidthMm && pieceLengthMm <= sheetLengthMm
  const fitsRotated = pieceLengthMm <= sheetWidthMm && pieceWidthMm <= sheetLengthMm
  return fitsNormal || (allowRotation && fitsRotated)
}

export function validateSheetPlan(plan: SheetPlanValidationInput): SheetPlanValidationResult {
  const sheetWidthError = validateSheetWidth(plan.sheetWidthMm)
  const sheetLengthError = validateSheetLength(plan.sheetLengthMm)
  const pieceWidthError = validatePieceWidth(plan.pieceWidthMm)
  const pieceLengthError = validatePieceLength(plan.pieceLengthMm)
  const quantityError = validateQuantity(plan.quantity)
  const kerfError = validateKerf(plan.kerfMm)

  let fitError: string | null = null
  if (
    !sheetWidthError &&
    !sheetLengthError &&
    !pieceWidthError &&
    !pieceLengthError &&
    plan.sheetWidthMm !== null &&
    plan.sheetLengthMm !== null &&
    plan.pieceWidthMm !== null &&
    plan.pieceLengthMm !== null
  ) {
    const fits = pieceFitsSheet(
      plan.pieceWidthMm,
      plan.pieceLengthMm,
      plan.sheetWidthMm,
      plan.sheetLengthMm,
      plan.allowRotation,
    )
    if (!fits) {
      fitError = `A peça de ${plan.pieceWidthMm} × ${plan.pieceLengthMm} mm não cabe na chapa de ${plan.sheetWidthMm} × ${plan.sheetLengthMm} mm.`
    }
  }

  const isValid =
    !sheetWidthError && !sheetLengthError && !pieceWidthError && !pieceLengthError && !quantityError && !kerfError && !fitError

  return { sheetWidthError, sheetLengthError, pieceWidthError, pieceLengthError, quantityError, kerfError, fitError, isValid }
}
