import { useState } from 'react'
import { optimizeLinearCut } from '../../domain/cutting/optimizer'
import { validatePlan } from '../../domain/cutting/validation'
import type { CuttingItem, CuttingOrder, CuttingPlan, CuttingPlanResult } from '../../domain/cutting/types'
import { createId } from '../../shared/utils/id'

function createEmptyItem(): CuttingItem {
  return { id: createId(), lengthMm: null, quantity: null }
}

function createEmptyPlan(): CuttingPlan {
  return {
    id: createId(),
    materialName: '',
    stockLengthMm: null,
    kerfMm: null,
    items: [createEmptyItem()],
    result: null,
    calculationStatus: 'not_calculated',
  }
}

function createEmptyOrder(): CuttingOrder {
  return {
    id: createId(),
    name: '',
    plans: [createEmptyPlan()],
  }
}

function invalidateIfCalculated(plan: CuttingPlan): CuttingPlan {
  if (plan.calculationStatus === 'calculated') {
    return { ...plan, calculationStatus: 'changed' }
  }
  return plan
}

export function useCuttingOrder() {
  const [order, setOrder] = useState<CuttingOrder>(createEmptyOrder)

  function updatePlan(planId: string, mutate: (plan: CuttingPlan) => CuttingPlan) {
    setOrder((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) => (plan.id === planId ? mutate(plan) : plan)),
    }))
  }

  function setOrderName(name: string) {
    setOrder((prev) => ({ ...prev, name }))
  }

  function setMaterialName(planId: string, materialName: string) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, materialName }))
  }

  function setStockLength(planId: string, stockLengthMm: number | null) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, stockLengthMm }))
  }

  function setKerf(planId: string, kerfMm: number | null) {
    updatePlan(planId, (plan) => invalidateIfCalculated({ ...plan, kerfMm }))
  }

  function addItem(planId: string): string {
    const newItem = createEmptyItem()
    updatePlan(planId, (plan) =>
      invalidateIfCalculated({ ...plan, items: [...plan.items, newItem] }),
    )
    return newItem.id
  }

  function updateItem(planId: string, itemId: string, partial: Partial<Omit<CuttingItem, 'id'>>) {
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

    const validation = validatePlan(plan)
    if (!validation.isValid) return

    const validItems = plan.items.filter((item) => {
      const errors = validation.itemErrors.get(item.id)
      return errors && !errors.lengthError && !errors.quantityError
    })

    const totalRequestedPieces = validItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0)

    try {
      const output = optimizeLinearCut({
        stockLengthMm: plan.stockLengthMm as number,
        kerfMm: plan.kerfMm as number,
        items: validItems.map((item) => ({
          lengthMm: item.lengthMm as number,
          quantity: item.quantity as number,
        })),
      })

      const result: CuttingPlanResult = {
        stockLengthMm: plan.stockLengthMm as number,
        kerfMm: plan.kerfMm as number,
        requiredStockCount: output.requiredStockCount,
        totalRequestedPieces,
        bars: output.bars,
        optimizationStatus: output.optimizationStatus,
        calculationTimeMs: output.calculationTimeMs,
      }

      updatePlan(planId, (current) => ({ ...current, result, calculationStatus: 'calculated' }))
    } catch (error) {
      console.error('Falha ao calcular o plano de corte:', error)
      updatePlan(planId, (current) => ({ ...current, result: null, calculationStatus: 'error' }))
    }
  }

  return {
    order,
    setOrderName,
    setMaterialName,
    setStockLength,
    setKerf,
    addItem,
    updateItem,
    removeItem,
    addPlan,
    removePlan,
    calculatePlan,
  }
}
