import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { CuttingPlanCard } from '../features/cutting-order/CuttingPlanCard'
import { CuttingReportModal } from '../features/cutting-order/CuttingReportModal'
import { OrderHeader } from '../features/cutting-order/OrderHeader'
import { useCuttingOrder } from '../features/cutting-order/useCuttingOrder'
import '../styles/tokens.css'
import '../styles/global.css'
import '../styles/components.css'
import '../styles/animations.css'
import '../styles/print.css'

function App() {
  const {
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
  } = useCuttingOrder()

  const [collapsedPlanIds, setCollapsedPlanIds] = useState<Set<string>>(() => new Set())
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [focusPlanId, setFocusPlanId] = useState<string | null>(null)
  const planElementsRef = useRef<Map<string, HTMLElement>>(new Map())

  useEffect(() => {
    if (!focusPlanId) return
    const element = planElementsRef.current.get(focusPlanId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      element.querySelector<HTMLElement>('[data-role="material-input"]')?.focus()
    }
    setFocusPlanId(null)
  }, [focusPlanId, order.plans])

  function toggleExpand(planId: string) {
    setCollapsedPlanIds((prev) => {
      const next = new Set(prev)
      if (next.has(planId)) {
        next.delete(planId)
      } else {
        next.add(planId)
      }
      return next
    })
  }

  function handleAddPlan() {
    const newPlanId = addPlan()
    setFocusPlanId(newPlanId)
  }

  const hasCalculatedPlan = order.plans.some((plan) => plan.calculationStatus === 'calculated')

  return (
    <div className="app-shell">
      <OrderHeader
        orderName={order.name}
        onOrderNameChange={setOrderName}
        canGenerateReport={hasCalculatedPlan}
        onGenerateReport={() => setIsReportOpen(true)}
      />

      <main className="plan-list">
        {order.plans.map((plan, index) => (
          <CuttingPlanCard
            key={plan.id}
            ref={(element) => {
              if (element) planElementsRef.current.set(plan.id, element)
              else planElementsRef.current.delete(plan.id)
            }}
            plan={plan}
            planNumber={index + 1}
            isExpanded={!collapsedPlanIds.has(plan.id)}
            onToggleExpand={() => toggleExpand(plan.id)}
            onUpdateMaterial={(value) => setMaterialName(plan.id, value)}
            onUpdateStockLength={(value) => setStockLength(plan.id, value)}
            onUpdateKerf={(value) => setKerf(plan.id, value)}
            onAddItem={() => addItem(plan.id)}
            onUpdateItem={(itemId, partial) => updateItem(plan.id, itemId, partial)}
            onRemoveItem={(itemId) => removeItem(plan.id, itemId)}
            onCalculate={() => calculatePlan(plan.id)}
            onRemovePlan={() => removePlan(plan.id)}
          />
        ))}

        <button type="button" className="add-plan-card" onClick={handleAddPlan}>
          <Plus size={20} />
          <span>
            <strong>Adicionar outro plano de corte</strong>
            <small>Crie um plano separado para outro tipo de material.</small>
          </span>
        </button>

        <div className="app-actions">
          <Button
            variant="secondary"
            disabled={!hasCalculatedPlan}
            onClick={() => setIsReportOpen(true)}
            title={!hasCalculatedPlan ? 'Calcule ao menos um plano para gerar o relatório.' : undefined}
          >
            Gerar relatório de corte
          </Button>
        </div>
      </main>

      <CuttingReportModal open={isReportOpen} order={order} onClose={() => setIsReportOpen(false)} />
    </div>
  )
}

export default App
