import { Plus, Ruler, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconButton } from '../../components/ui/IconButton'
import { NumberField } from '../../components/ui/NumberField'
import type { SheetCuttingItem } from '../../domain/sheet-cutting/types'
import type { SheetItemValidation } from '../../domain/sheet-cutting/validation'
import { DURATION_FAST } from '../../shared/motion'

interface SheetItemsTableProps {
  items: SheetCuttingItem[]
  itemErrors: Map<string, SheetItemValidation>
  autoFocusItemId: string | null
  onAutoFocusHandled: () => void
  onUpdateItem: (itemId: string, partial: Partial<Omit<SheetCuttingItem, 'id'>>) => void
  onRemoveItem: (itemId: string) => void
  onAddItem: () => void
}

interface SheetItemRowProps {
  item: SheetCuttingItem
  errors?: SheetItemValidation
  autoFocus: boolean
  onFocused: () => void
  onUpdateItem: (partial: Partial<Omit<SheetCuttingItem, 'id'>>) => void
  onRemoveItem: () => void
}

function SheetItemRow({ item, errors, autoFocus, onFocused, onUpdateItem, onRemoveItem }: SheetItemRowProps) {
  const widthInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      widthInputRef.current?.focus()
      onFocused()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus])

  return (
    <motion.div
      className="item-row item-row--sheet"
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 6, height: 0, marginBottom: 0 }}
      transition={{ duration: DURATION_FAST + 0.08 }}
    >
      <NumberField
        ref={widthInputRef}
        value={item.widthMm}
        onChange={(value) => onUpdateItem({ widthMm: value })}
        placeholder="0"
        min={1}
        unit="mm"
        ariaLabel="Largura da peça"
        error={errors?.widthError}
      />
      <NumberField
        value={item.lengthMm}
        onChange={(value) => onUpdateItem({ lengthMm: value })}
        placeholder="0"
        min={1}
        unit="mm"
        ariaLabel="Comprimento da peça"
        error={errors?.lengthError}
      />
      <NumberField
        value={item.quantity}
        onChange={(value) => onUpdateItem({ quantity: value })}
        placeholder="0"
        min={1}
        ariaLabel="Quantidade"
        error={errors?.quantityError}
      />
      <IconButton icon={<Trash2 size={16} />} label="Remover medida" variant="danger" onClick={onRemoveItem} />
      {errors?.fitError && <p className="item-row__fit-error">{errors.fitError}</p>}
    </motion.div>
  )
}

export function SheetItemsTable({
  items,
  itemErrors,
  autoFocusItemId,
  onAutoFocusHandled,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}: SheetItemsTableProps) {
  return (
    <div className="items-table">
      {items.length > 0 && (
        <div className="items-table__header items-table__header--sheet">
          <span>Largura</span>
          <span>Comprimento</span>
          <span>Quantidade</span>
          <span aria-hidden="true"></span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Ruler size={20} />}
          title="Nenhuma medida adicionada."
          description="Adicione o primeiro tamanho de peça que precisa cortar."
        />
      ) : (
        <div className="items-table__rows">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <SheetItemRow
                key={item.id}
                item={item}
                errors={itemErrors.get(item.id)}
                autoFocus={autoFocusItemId === item.id}
                onFocused={onAutoFocusHandled}
                onUpdateItem={(partial) => onUpdateItem(item.id, partial)}
                onRemoveItem={() => onRemoveItem(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Button variant="secondary" icon={<Plus size={16} />} onClick={onAddItem} className="items-table__add">
        Adicionar medida
      </Button>
    </div>
  )
}
