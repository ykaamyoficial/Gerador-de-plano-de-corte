import { Calculator, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { forwardRef, useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Menu } from '../../components/ui/Menu'
import { NumberField } from '../../components/ui/NumberField'
import { StatusChip } from '../../components/ui/StatusChip'
import { Switch } from '../../components/ui/Switch'
import type { SheetCuttingItem, SheetCuttingPlan } from '../../domain/sheet-cutting/types'
import { validateSheetPlan } from '../../domain/sheet-cutting/validation'
import { DURATION_NORMAL, EASE_EMPHASIZED } from '../../shared/motion'
import { SheetCuttingResult } from './SheetCuttingResult'
import { SheetDimensionsFields } from './SheetDimensionsFields'
import { SheetItemsTable } from './SheetItemsTable'

interface SheetCuttingPlanCardProps {
  plan: SheetCuttingPlan
  planNumber: number
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdateMaterial: (value: string) => void
  onUpdateSheetWidth: (value: number | null) => void
  onUpdateSheetLength: (value: number | null) => void
  onUpdateKerf: (value: number | null) => void
  onUpdateAllowRotation: (value: boolean) => void
  onAddItem: () => string
  onUpdateItem: (itemId: string, partial: Partial<Omit<SheetCuttingItem, 'id'>>) => void
  onRemoveItem: (itemId: string) => void
  onCalculate: () => void
  onRemovePlan: () => void
}

function planHasData(plan: SheetCuttingPlan): boolean {
  return (
    plan.materialName.trim() !== '' ||
    plan.sheetWidthMm !== null ||
    plan.sheetLengthMm !== null ||
    plan.kerfMm !== null ||
    plan.items.some((item) => item.widthMm !== null || item.lengthMm !== null || item.quantity !== null)
  )
}

export const SheetCuttingPlanCard = forwardRef<HTMLElement, SheetCuttingPlanCardProps>(function SheetCuttingPlanCard(
  {
    plan,
    planNumber,
    isExpanded,
    onToggleExpand,
    onUpdateMaterial,
    onUpdateSheetWidth,
    onUpdateSheetLength,
    onUpdateKerf,
    onUpdateAllowRotation,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
    onCalculate,
    onRemovePlan,
  },
  ref,
) {
  const validation = validateSheetPlan(plan)
  const calculateLabel = plan.calculationStatus === 'not_calculated' ? 'Calcular plano de chapa' : 'Recalcular plano de chapa'
  const [isCalculating, setIsCalculating] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [autoFocusItemId, setAutoFocusItemId] = useState<string | null>(null)

  const measureCount = plan.items.filter(
    (item) => item.widthMm !== null || item.lengthMm !== null || item.quantity !== null,
  ).length

  function handleCalculateClick() {
    setIsCalculating(true)
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
        <button type="button" className="plan-card__toggle" onClick={onToggleExpand} aria-expanded={isExpanded}>
          <div className="plan-card__heading">
            <span className="plan-card__badge">Plano {planNumber}</span>
            <span className="plan-card__title">{plan.materialName || 'Novo plano de chapa'}</span>
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
                <p className="plan-section__title">Material</p>
                <div className="field">
                  <div className="form-control-wrapper">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex.: Chapa galvanizada 3 mm"
                      value={plan.materialName}
                      data-role="material-input"
                      onChange={(event) => onUpdateMaterial(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="plan-section">
                <p className="plan-section__title">Tamanho da chapa inteira</p>
                <SheetDimensionsFields
                  widthMm={plan.sheetWidthMm}
                  lengthMm={plan.sheetLengthMm}
                  onWidthChange={onUpdateSheetWidth}
                  onLengthChange={onUpdateSheetLength}
                  widthError={validation.sheetWidthError}
                  lengthError={validation.sheetLengthError}
                />
                <NumberField
                  label="Espessura do corte"
                  unit="mm"
                  min={0}
                  value={plan.kerfMm}
                  onChange={onUpdateKerf}
                  error={validation.kerfError}
                />
                <Switch
                  id={`allow-rotation-${plan.id}`}
                  checked={plan.allowRotation}
                  onChange={onUpdateAllowRotation}
                  label="Permitir girar as peças em 90°"
                />
              </div>

              <div className="plan-section">
                <p className="plan-section__title">Medidas das peças</p>
                <SheetItemsTable
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

              {plan.calculationStatus === 'calculated' && plan.result && plan.sheetWidthMm && plan.sheetLengthMm && (
                <SheetCuttingResult
                  materialName={plan.materialName}
                  result={plan.result}
                  sheetWidthMm={plan.sheetWidthMm}
                  sheetHeightMm={plan.sheetLengthMm}
                />
              )}

              {plan.calculationStatus === 'not_calculated' && (
                <EmptyState
                  icon={<Calculator size={20} />}
                  title="O plano ainda não foi calculado."
                  description='Informe as medidas e clique em "Calcular plano de chapa".'
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
