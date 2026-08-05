import { useState } from 'react'
import { calculateSheetCutPlan } from '../../domain/sheet-cutting/calculateSheetCutPlan'
import { validateSheetPlan } from '../../domain/sheet-cutting/validation'
import type { SheetCuttingOrder, SheetCuttingPlan } from '../../domain/sheet-cutting/types'
import { createId } from '../../shared/utils/id'

function createEmptyPlan(): SheetCuttingPlan {
  return {
    id: createId(),
    materialName: '',
    sheetWidthMm: null,
    sheetLengthMm: null,
    pieceWidthMm: null,
    pieceLengthMm: null,
    quantity: null,
    kerfMm: null,
    allowRotation: true,
    result: null,
    calculationStatus: 'not_calculated',
  }
}

function createEmptyOrder(): SheetCuttingOrder {
  return {
    id: createId(),
    name: '',
    plans: [createEmptyPlan()],
  }
}

function invalidateIfCalculated(plan: SheetCuttingPlan): SheetCuttingPlan {
  if (plan.calculationStatus === 'calculated') {
    return { ...plan, calculationStatus: 'changed' }
  }
  return plan
}

export function useSheetCuttingOrder() {
  const [order, setOrder] = useState<SheetCuttingOrder>(createEmptyOrder)

  function updatePlan(planId: string, mutate: (plan: SheetCuttingPlan) => SheetCuttingPlan) {
    setOrder((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) => (plan.id === planId ? mutate(plan) : plan)),
    }))
  }

  function setMaterialName(planId: string, materialName: string) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, materialName }))
  }

  function setSheetWidth(planId: string, sheetWidthMm: number | null) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, sheetWidthMm }))
  }

  function setSheetLength(planId: string, sheetLengthMm: number | null) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, sheetLengthMm }))
  }

  function setPieceWidth(planId: string, pieceWidthMm: number | null) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, pieceWidthMm }))
  }

  function setPieceLength(planId: string, pieceLengthMm: number | null) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, pieceLengthMm }))
  }

  function setQuantity(planId: string, quantity: number | null) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, quantity }))
  }

  function setKerf(planId: string, kerfMm: number | null) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, kerfMm }))
  }

  function setAllowRotation(planId: string, allowRotation: boolean) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, allowRotation }))
  }

  function addPlan(): string {
    const newPlan = createEmptyPlan()
    setOrder((prev) => ({ ...prev, plans: [...prev.plans, newPlan] }))
    return newPlan.id
  }

  function removePlan(planId: string) {
    setOrder((prev) => ({ ...prev, plans: prev.plans.filter((plan) => plan.id !== planId) }))
  }

  function calculatePlan(planId: string) {
    const plan = order.plans.find((p) => p.id === planId)
    if (!plan) return

    const validation = validateSheetPlan(plan)
    if (!validation.isValid) return

    try {
      const output = calculateSheetCutPlan({
        sheetWidthMm: plan.sheetWidthMm as number,
        sheetLengthMm: plan.sheetLengthMm as number,
        pieceWidthMm: plan.pieceWidthMm as number,
        pieceLengthMm: plan.pieceLengthMm as number,
        quantity: plan.quantity as number,
        kerfMm: plan.kerfMm as number,
        allowRotation: plan.allowRotation,
      })

      updatePlan(planId, (current) => ({ ...current, result: output, calculationStatus: 'calculated' }))
    } catch (error) {
      console.error('Falha ao calcular o plano de corte de chapas:', error)
      updatePlan(planId, (current) => ({ ...current, result: null, calculationStatus: 'error' }))
    }
  }

  return {
    order,
    setMaterialName,
    setSheetWidth,
    setSheetLength,
    setPieceWidth,
    setPieceLength,
    setQuantity,
    setKerf,
    setAllowRotation,
    addPlan,
    removePlan,
    calculatePlan,
  }
}
