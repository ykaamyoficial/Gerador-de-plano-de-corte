import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { CuttingPlanCard } from '../features/cutting-order/CuttingPlanCard'
import { CuttingReportModal } from '../features/cutting-order/CuttingReportModal'
import { OrderHeader } from '../features/cutting-order/OrderHeader'
import { useCuttingOrder } from '../features/cutting-order/useCuttingOrder'
import { SheetCuttingPlanCard } from '../features/sheet-cutting/SheetCuttingPlanCard'
import { SheetCuttingReportModal } from '../features/sheet-cutting/SheetCuttingReportModal'
import { useSheetCuttingOrder } from '../features/sheet-cutting/useSheetCuttingOrder'
import '../styles/tokens.css'
import '../styles/global.css'
import '../styles/components.css'
import '../styles/animations.css'
import '../styles/print.css'

type PlanType = 'linear' | 'sheet'

const PLAN_TYPE_OPTIONS: Array<{ value: PlanType; label: string }> = [
  { value: 'linear', label: 'Corte linear' },
  { value: 'sheet', label: 'Corte de chapas' },
]

function App() {
  const linear = useCuttingOrder()
  const sheet = useSheetCuttingOrder()

  const [orderName, setOrderName] = useState('')
  const [activeTab, setActiveTab] = useState<PlanType>('linear')
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
  }, [focusPlanId, linear.order.plans, sheet.order.plans])

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
    const newPlanId = activeTab === 'linear' ? linear.addPlan() : sheet.addPlan()
    setFocusPlanId(newPlanId)
  }

  const hasCalculatedLinearPlan = linear.order.plans.some((plan) => plan.calculationStatus === 'calculated')
  const hasCalculatedSheetPlan = sheet.order.plans.some((plan) => plan.calculationStatus === 'calculated')
  const hasCalculatedPlan = activeTab === 'linear' ? hasCalculatedLinearPlan : hasCalculatedSheetPlan

  const linearOrderForReport = { ...linear.order, name: orderName }
  const sheetOrderForReport = { ...sheet.order, name: orderName }

  return (
    <div className="app-shell">
      <OrderHeader
        orderName={orderName}
        onOrderNameChange={setOrderName}
        canGenerateReport={hasCalculatedPlan}
        onGenerateReport={() => setIsReportOpen(true)}
      />

      <div className="plan-type-switcher">
        <SegmentedControl value={activeTab} options={PLAN_TYPE_OPTIONS} onChange={setActiveTab} ariaLabel="Tipo de plano" />
      </div>

      <main className="plan-list">
        {activeTab === 'linear' &&
          linear.order.plans.map((plan, index) => (
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
              onUpdateMaterial={(value) => linear.setMaterialName(plan.id, value)}
              onUpdateStockLength={(value) => linear.setStockLength(plan.id, value)}
              onUpdateKerf={(value) => linear.setKerf(plan.id, value)}
              onAddItem={() => linear.addItem(plan.id)}
              onUpdateItem={(itemId, partial) => linear.updateItem(plan.id, itemId, partial)}
              onRemoveItem={(itemId) => linear.removeItem(plan.id, itemId)}
              onCalculate={() => linear.calculatePlan(plan.id)}
              onRemovePlan={() => linear.removePlan(plan.id)}
            />
          ))}

        {activeTab === 'sheet' &&
          sheet.order.plans.map((plan, index) => (
            <SheetCuttingPlanCard
              key={plan.id}
              ref={(element) => {
                if (element) planElementsRef.current.set(plan.id, element)
                else planElementsRef.current.delete(plan.id)
              }}
              plan={plan}
              planNumber={index + 1}
              isExpanded={!collapsedPlanIds.has(plan.id)}
              onToggleExpand={() => toggleExpand(plan.id)}
              onUpdateMaterial={(value) => sheet.setMaterialName(plan.id, value)}
              onUpdateSheetWidth={(value) => sheet.setSheetWidth(plan.id, value)}
              onUpdateSheetLength={(value) => sheet.setSheetLength(plan.id, value)}
              onUpdateKerf={(value) => sheet.setKerf(plan.id, value)}
              onUpdateAllowRotation={(value) => sheet.setAllowRotation(plan.id, value)}
              onAddItem={() => sheet.addItem(plan.id)}
              onUpdateItem={(itemId, partial) => sheet.updateItem(plan.id, itemId, partial)}
              onRemoveItem={(itemId) => sheet.removeItem(plan.id, itemId)}
              onCalculate={() => sheet.calculatePlan(plan.id)}
              onRemovePlan={() => sheet.removePlan(plan.id)}
            />
          ))}

        <button type="button" className="add-plan-card" onClick={handleAddPlan}>
          <Plus size={20} />
          <span>
            <strong>
              {activeTab === 'linear' ? 'Adicionar outro plano de corte' : 'Adicionar outro plano de chapa'}
            </strong>
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
            {activeTab === 'linear' ? 'Gerar relatório de corte' : 'Gerar relatório de chapas'}
          </Button>
        </div>
      </main>

      {activeTab === 'linear' ? (
        <CuttingReportModal open={isReportOpen} order={linearOrderForReport} onClose={() => setIsReportOpen(false)} />
      ) : (
        <SheetCuttingReportModal open={isReportOpen} order={sheetOrderForReport} onClose={() => setIsReportOpen(false)} />
      )}
    </div>
  )
}

export default App
