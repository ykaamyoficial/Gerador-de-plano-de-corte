import { Calculator, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { forwardRef, useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Menu } from '../../components/ui/Menu'
import { NumberField } from '../../components/ui/NumberField'
import { StatusChip } from '../../components/ui/StatusChip'
import type { CuttingItem, CuttingPlan } from '../../domain/cutting/types'
import { DURATION_NORMAL, EASE_EMPHASIZED } from '../../shared/motion'
import { validatePlan } from '../../domain/cutting/validation'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { CuttingItemsTable } from './CuttingItemsTable'
import { CuttingPlanResult } from './CuttingPlanResult'

interface CuttingPlanCardProps {
  plan: CuttingPlan
  planNumber: number
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdateMaterial: (value: string) => void
  onUpdateStockLength: (value: number | null) => void
  onUpdateKerf: (value: number | null) => void
  onAddItem: () => string
  onUpdateItem: (itemId: string, partial: Partial<Omit<CuttingItem, 'id'>>) => void
  onRemoveItem: (itemId: string) => void
  onCalculate: () => void
  onRemovePlan: () => void
}

function planHasData(plan: CuttingPlan): boolean {
  return (
    plan.materialName.trim() !== '' ||
    plan.stockLengthMm !== null ||
    plan.kerfMm !== null ||
    plan.items.some((item) => item.lengthMm !== null || item.quantity !== null)
  )
}

export const CuttingPlanCard = forwardRef<HTMLElement, CuttingPlanCardProps>(function CuttingPlanCard(
  {
    plan,
    planNumber,
    isExpanded,
    onToggleExpand,
    onUpdateMaterial,
    onUpdateStockLength,
    onUpdateKerf,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
    onCalculate,
    onRemovePlan,
  },
  ref,
) {
  const validation = validatePlan(plan)
  const calculateLabel = plan.calculationStatus === 'not_calculated' ? 'Calcular plano' : 'Recalcular plano'
  const [isCalculating, setIsCalculating] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [autoFocusItemId, setAutoFocusItemId] = useState<string | null>(null)

  const measureCount = plan.items.filter((item) => item.lengthMm !== null || item.quantity !== null).length

  function handleCalculateClick() {
    setIsCalculating(true)
    // defer the (synchronous, potentially slow) optimizer call by a tick so
    // the "Calculando..." state actually paints before it runs
    requestAnimationFrame(() => {
      setTimeout(() => {
        onCalculate()
        setIsCalculating(false)
      }, 0)
    })
  }

  function handleRequestRemove() {
    if (planHasData(plan)) {
      setConfirmRemoveOpen(true)
      return
    }
    onRemovePlan()
  }

  function handleAddItem() {
    const newItemId = onAddItem()
    setAutoFocusItemId(newItemId)
  }

  return (
    <section className="card plan-card" ref={ref}>
      <header className="plan-card__header">
        <button
          type="button"
          className="plan-card__toggle"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
        >
          <div className="plan-card__heading">
            <span className="plan-card__badge">Plano {planNumber}</span>
            <span className="plan-card__title">{plan.materialName || 'Novo plano de corte'}</span>
          </div>
          <span className="plan-card__subtitle">
            {measureCount > 0
              ? `${measureCount} ${measureCount === 1 ? 'medida adicionada' : 'medidas adicionadas'}`
              : 'Nenhuma medida adicionada'}
          </span>
        </button>

        <div className="plan-card__header-actions">
          <StatusChip status={plan.calculationStatus} />
          <motion.button
            type="button"
            className="plan-card__chevron"
            onClick={onToggleExpand}
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: DURATION_NORMAL, ease: EASE_EMPHASIZED }}
            aria-label={isExpanded ? 'Recolher plano' : 'Expandir plano'}
          >
            <ChevronDown size={18} />
          </motion.button>
          <Menu
            ariaLabel={`Opções do plano ${planNumber}`}
            items={[{ label: 'Remover plano', onClick: handleRequestRemove, destructive: true }]}
          />
        </div>
      </header>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            className="plan-card__body-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION_NORMAL, ease: EASE_EMPHASIZED }}
          >
            <div className="plan-card__body">
              <div className="plan-section">
                <p className="plan-section__title">Dados do material</p>
                <div className="material-grid">
                  <div className="field">
                    <span className="field__label">Material</span>
                    <div className="form-control-wrapper">
                      <input
                        type="text"
                        className="form-control"
                        placeholder='Ex.: Cantoneira 2" x 1/4"'
                        value={plan.materialName}
                        data-role="material-input"
                        onChange={(event) => onUpdateMaterial(event.target.value)}
                      />
                    </div>
                  </div>

                  <NumberField
                    label="Comprimento da barra inteira"
                    unit="mm"
                    min={1}
                    value={plan.stockLengthMm}
                    onChange={onUpdateStockLength}
                    error={validation.stockLengthError}
                  />

                  <NumberField
                    label="Espessura do corte"
                    unit="mm"
                    min={0}
                    value={plan.kerfMm}
                    onChange={onUpdateKerf}
                    error={validation.kerfError}
                  />
                </div>
              </div>

              <div className="plan-section">
                <p className="plan-section__title">Medidas para cortar</p>
                <CuttingItemsTable
                  items={plan.items}
                  itemErrors={validation.itemErrors}
                  autoFocusItemId={autoFocusItemId}
                  onAutoFocusHandled={() => setAutoFocusItemId(null)}
                  onUpdateItem={onUpdateItem}
                  onRemoveItem={onRemoveItem}
                  onAddItem={handleAddItem}
                />
                {validation.planError && <Alert tone="warning">{validation.planError}</Alert>}
              </div>

              <div className="plan-card__actions">
                <Button
                  variant="primary"
                  onClick={handleCalculateClick}
                  disabled={!validation.isValid || isCalculating}
                  loading={isCalculating}
                  loadingLabel="Calculando..."
                >
                  {calculateLabel}
                </Button>
              </div>

              {plan.calculationStatus === 'changed' && (
                <Alert tone="warning">Os dados foram alterados. Calcule novamente este plano.</Alert>
              )}

              {plan.calculationStatus === 'error' && (
                <Alert tone="danger">
                  Não foi possível gerar um plano de corte válido. Revise os dados e tente novamente.
                </Alert>
              )}

              {plan.calculationStatus === 'calculated' && plan.result && (
                <CuttingPlanResult materialName={plan.materialName} result={plan.result} />
              )}

              {plan.calculationStatus === 'not_calculated' && (
                <EmptyState
                  icon={<Calculator size={20} />}
                  title="O plano ainda não foi calculado."
                  description='Informe as medidas e clique em "Calcular plano".'
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmRemoveOpen}
        title="Remover este plano?"
        description="As medidas e o resultado deste plano serão removidos."
        confirmLabel="Remover plano"
        destructive
        onConfirm={() => {
          setConfirmRemoveOpen(false)
          onRemovePlan()
        }}
        onCancel={() => setConfirmRemoveOpen(false)}
      />
    </section>
  )
})
