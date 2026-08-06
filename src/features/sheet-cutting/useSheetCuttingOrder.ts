import { useState } from 'react'
import { optimizeSheetCut } from '../../domain/sheet-cutting/optimizeSheetCut'
import { validateSheetPlan } from '../../domain/sheet-cutting/validation'
import type { SheetCutItem, SheetCuttingItem, SheetCuttingOrder, SheetCuttingPlan } from '../../domain/sheet-cutting/types'
import { createId } from '../../shared/utils/id'

/** Merges rows that share the same width×height into one measure with a summed quantity, same as the linear module's item normalization. */
function normalizeItems(
  items: readonly { widthMm: number; heightMm: number; quantity: number; allowRotation: boolean }[],
): SheetCutItem[] {
  const grouped = new Map<string, SheetCutItem>()
  for (const item of items) {
    const id = `${item.widthMm}x${item.heightMm}`
    const existing = grouped.get(id)
    grouped.set(id, {
      id,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      quantity: (existing?.quantity ?? 0) + item.quantity,
      allowRotation: item.allowRotation,
    })
  }
  return Array.from(grouped.values())
}

function createEmptyItem(): SheetCuttingItem {
  return { id: createId(), widthMm: null, lengthMm: null, quantity: null }
}

function createEmptyPlan(): SheetCuttingPlan {
  return {
    id: createId(),
    materialName: '',
    sheetWidthMm: null,
    sheetLengthMm: null,
    kerfMm: null,
    allowRotation: true,
    items: [createEmptyItem()],
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

  function setKerf(planId: string, kerfMm: number | null) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, kerfMm }))
  }

  function setAllowRotation(planId: string, allowRotation: boolean) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, allowRotation }))
  }

  function addItem(planId: string): string {
    const newItem = createEmptyItem()
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, items: [...plan.items, newItem] }))
    return newItem.id
  }

  function updateItem(planId: string, itemId: string, partial: Partial<Omit<SheetCuttingItem, 'id'>>) {
    updatePlan(planId, (plan) =>
      invalidateIfCalculated({
        ...plan,
        items: plan.items.map((item) => (item.id === itemId ? { ...item, ...partial } : item)),
      }),
    )
  }

  function removeItem(planId: string, itemId: string) {
    updatePlan(planId, (plan) =>
      invalidateIfCalculated({ ...plan, items: plan.items.filter((item) => item.id !== itemId) }),
    )
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

    const validItems = plan.items.filter((item) => {
      const errors = validation.itemErrors.get(item.id)
      return errors && !errors.widthError && !errors.lengthError && !errors.quantityError && !errors.fitError
    })

    try {
      const output = optimizeSheetCut({
        sheetWidthMm: plan.sheetWidthMm as number,
        sheetHeightMm: plan.sheetLengthMm as number,
        kerfMm: plan.kerfMm as number,
        items: normalizeItems(
          validItems.map((item) => ({
            widthMm: item.widthMm as number,
            heightMm: item.lengthMm as number,
            quantity: item.quantity as number,
            allowRotation: plan.allowRotation,
          })),
        ),
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
    setKerf,
    setAllowRotation,
    addItem,
    updateItem,
    removeItem,
    addPlan,
    removePlan,
    calculatePlan,
  }
}
