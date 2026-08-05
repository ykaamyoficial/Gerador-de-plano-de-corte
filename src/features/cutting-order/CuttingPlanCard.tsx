import type { CuttingItem, CuttingPlan } from '../../domain/cutting/types'
import { validatePlan } from '../../domain/cutting/validation'
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
  onAddItem: () => void
  onUpdateItem: (itemId: string, partial: Partial<Omit<CuttingItem, 'id'>>) => void
  onRemoveItem: (itemId: string) => void
  onCalculate: () => void
  onRemovePlan: () => void
}

function parseNumberInput(raw: string): number | null {
  if (raw.trim() === '') return null
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? null : parsed
}

function planHasData(plan: CuttingPlan): boolean {
  return (
    plan.materialName.trim() !== '' ||
    plan.stockLengthMm !== null ||
    plan.kerfMm !== null ||
    plan.items.some((item) => item.lengthMm !== null || item.quantity !== null)
  )
}

export function CuttingPlanCard({
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
}: CuttingPlanCardProps) {
  const validation = validatePlan(plan)
  const calculateLabel = plan.calculationStatus === 'not_calculated' ? 'Calcular plano' : 'Recalcular plano'

  function handleRemovePlan() {
    if (planHasData(plan)) {
      const confirmed = window.confirm('Remover este plano de corte? Os dados informados serão perdidos.')
      if (!confirmed) return
    }
    onRemovePlan()
  }

  return (
    <section className="plan-card">
      <header className="plan-card__header">
        <button type="button" className="plan-card__toggle" onClick={onToggleExpand}>
          <span className="plan-card__badge">Plano {planNumber}</span>
          <span className="plan-card__title">{plan.materialName || 'Novo plano de corte'}</span>
          <span className="plan-card__chevron">{isExpanded ? '▾' : '▸'}</span>
        </button>
        <button type="button" className="button button--text button--danger" onClick={handleRemovePlan}>
          Remover plano
        </button>
      </header>

      {isExpanded && (
        <div className="plan-card__body">
          <div className="field-grid">
            <label className="field">
              <span className="field__label">Material</span>
              <input
                type="text"
                className="input"
                placeholder='Ex.: Cantoneira 2" x 1/4"'
                value={plan.materialName}
                onChange={(event) => onUpdateMaterial(event.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">Comprimento da barra inteira</span>
              <div className="field__input-with-unit">
                <input
                  type="number"
                  step={1}
                  min={1}
                  className={validation.stockLengthError ? 'input input--error' : 'input'}
                  value={plan.stockLengthMm ?? ''}
                  onChange={(event) => onUpdateStockLength(parseNumberInput(event.target.value))}
                />
                <span className="field__unit">mm</span>
              </div>
              {validation.stockLengthError && <p className="field-error">{validation.stockLengthError}</p>}
            </label>

            <label className="field">
              <span className="field__label">Espessura do corte</span>
              <div className="field__input-with-unit">
                <input
                  type="number"
                  step={1}
                  min={0}
                  className={validation.kerfError ? 'input input--error' : 'input'}
                  value={plan.kerfMm ?? ''}
                  onChange={(event) => onUpdateKerf(parseNumberInput(event.target.value))}
                />
                <span className="field__unit">mm</span>
              </div>
              {validation.kerfError && <p className="field-error">{validation.kerfError}</p>}
            </label>
          </div>

          <CuttingItemsTable
            items={plan.items}
            itemErrors={validation.itemErrors}
            onUpdateItem={onUpdateItem}
            onRemoveItem={onRemoveItem}
            onAddItem={onAddItem}
          />
          {validation.planError && <p className="field-error">{validation.planError}</p>}

          <div className="plan-card__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={onCalculate}
              disabled={!validation.isValid}
            >
              {calculateLabel}
            </button>
          </div>

          {plan.calculationStatus === 'changed' && (
            <p className="plan-card__stale-notice">Os dados foram alterados. Calcule novamente este plano.</p>
          )}

          {plan.calculationStatus === 'error' && (
            <p className="plan-card__error-notice">
              Não foi possível gerar um plano de corte válido. Revise os dados e tente novamente.
            </p>
          )}

          {plan.calculationStatus === 'calculated' && plan.result && (
            <CuttingPlanResult materialName={plan.materialName} result={plan.result} />
          )}
        </div>
      )}
    </section>
  )
}
