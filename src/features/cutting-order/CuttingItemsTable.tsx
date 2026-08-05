import { Plus, Ruler, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconButton } from '../../components/ui/IconButton'
import { NumberField } from '../../components/ui/NumberField'
import type { CuttingItem } from '../../domain/cutting/types'
import type { ItemValidation } from '../../domain/cutting/validation'
import { DURATION_FAST } from '../../shared/motion'

interface CuttingItemsTableProps {
  items: CuttingItem[]
  itemErrors: Map<string, ItemValidation>
  autoFocusItemId: string | null
  onAutoFocusHandled: () => void
  onUpdateItem: (itemId: string, partial: Partial<Omit<CuttingItem, 'id'>>) => void
  onRemoveItem: (itemId: string) => void
  onAddItem: () => void
}

interface CuttingItemRowProps {
  item: CuttingItem
  errors?: ItemValidation
  autoFocus: boolean
  onFocused: () => void
  onUpdateItem: (partial: Partial<Omit<CuttingItem, 'id'>>) => void
  onRemoveItem: () => void
}

function CuttingItemRow({ item, errors, autoFocus, onFocused, onUpdateItem, onRemoveItem }: CuttingItemRowProps) {
  const lengthInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      lengthInputRef.current?.focus()
      onFocused()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus])

  return (
    <motion.div
      className="item-row"
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 6, height: 0, marginBottom: 0 }}
      transition={{ duration: DURATION_FAST + 0.08 }}
    >
      <NumberField
        ref={lengthInputRef}
        value={item.lengthMm}
        onChange={(value) => onUpdateItem({ lengthMm: value })}
        placeholder="0"
        min={1}
        unit="mm"
        ariaLabel="Comprimento da peça em milímetros"
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
      <IconButton
        icon={<Trash2 size={16} />}
        label="Remover medida"
        variant="danger"
        onClick={onRemoveItem}
      />
    </motion.div>
  )
}

export function CuttingItemsTable({
  items,
  itemErrors,
  autoFocusItemId,
  onAutoFocusHandled,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}: CuttingItemsTableProps) {
  return (
    <div className="items-table">
      {items.length > 0 && (
        <div className="items-table__header">
          <span>Comprimento da peça</span>
          <span>Quantidade</span>
          <span aria-hidden="true"></span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Ruler size={20} />}
          title="Nenhuma medida adicionada."
          description="Adicione o primeiro comprimento que precisa cortar."
        />
      ) : (
        <div className="items-table__rows">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <CuttingItemRow
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
