import { useState } from 'react'
import { CuttingPlanCard } from '../features/cutting-order/CuttingPlanCard'
import { CuttingReport } from '../features/cutting-order/CuttingReport'
import { useCuttingOrder } from '../features/cutting-order/useCuttingOrder'
import '../styles/global.css'
import '../styles/print.css'

type View = 'editor' | 'report'

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
  const [view, setView] = useState<View>('editor')

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

  const hasCalculatedPlan = order.plans.some((plan) => plan.calculationStatus === 'calculated')

  if (view === 'report') {
    return (
      <div className="app app--report">
        <div className="report-toolbar no-print">
          <button type="button" className="button button--secondary" onClick={() => setView('editor')}>
            Voltar para edição
          </button>
          <button type="button" className="button button--primary" onClick={() => window.print()}>
            Imprimir / Salvar PDF
          </button>
        </div>
        <CuttingReport order={order} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Plano de Corte</h1>
        <label className="field field--order-name">
          <span className="field__label">Nome da ordem de corte (opcional)</span>
          <input
            type="text"
            className="input"
            placeholder="Ex.: Estrutura Torre 01"
            value={order.name}
            onChange={(event) => setOrderName(event.target.value)}
          />
        </label>
      </header>

      <main className="app-content">
        {order.plans.map((plan, index) => (
          <CuttingPlanCard
            key={plan.id}
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

        <div className="app-actions">
          <button type="button" className="button button--secondary" onClick={addPlan}>
            + Adicionar outro plano de corte
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setView('report')}
            disabled={!hasCalculatedPlan}
            title={!hasCalculatedPlan ? 'Calcule ao menos um plano para gerar o relatório.' : undefined}
          >
            Gerar relatório de corte
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
