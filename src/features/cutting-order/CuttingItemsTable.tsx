import type { CuttingItem } from '../../domain/cutting/types'
import type { ItemValidation } from '../../domain/cutting/validation'

interface CuttingItemsTableProps {
  items: CuttingItem[]
  itemErrors: Map<string, ItemValidation>
  onUpdateItem: (itemId: string, partial: Partial<Omit<CuttingItem, 'id'>>) => void
  onRemoveItem: (itemId: string) => void
  onAddItem: () => void
}

function parseNumberInput(raw: string): number | null {
  if (raw.trim() === '') return null
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? null : parsed
}

export function CuttingItemsTable({
  items,
  itemErrors,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}: CuttingItemsTableProps) {
  return (
    <div className="items-table">
      <div className="items-table__header">
        <span>Comprimento da peça (mm)</span>
        <span>Quantidade</span>
        <span></span>
      </div>

      {items.map((item) => {
        const errors = itemErrors.get(item.id)
        return (
          <div className="items-table__row" key={item.id}>
            <div className="items-table__cell">
              <input
                type="number"
                step={1}
                min={1}
                value={item.lengthMm ?? ''}
                onChange={(event) =>
                  onUpdateItem(item.id, { lengthMm: parseNumberInput(event.target.value) })
                }
                aria-label="Comprimento da peça em milímetros"
                className={errors?.lengthError ? 'input input--error' : 'input'}
              />
              {errors?.lengthError && <p className="field-error">{errors.lengthError}</p>}
            </div>

            <div className="items-table__cell">
              <input
                type="number"
                step={1}
                min={1}
                value={item.quantity ?? ''}
                onChange={(event) =>
                  onUpdateItem(item.id, { quantity: parseNumberInput(event.target.value) })
                }
                aria-label="Quantidade"
                className={errors?.quantityError ? 'input input--error' : 'input'}
              />
              {errors?.quantityError && <p className="field-error">{errors.quantityError}</p>}
            </div>

            <div className="items-table__cell items-table__cell--action">
              <button
                type="button"
                className="button button--text"
                onClick={() => onRemoveItem(item.id)}
              >
                Remover
              </button>
            </div>
          </div>
        )
      })}

      <button type="button" className="button button--secondary" onClick={onAddItem}>
        + Adicionar outra medida
      </button>
    </div>
  )
}
