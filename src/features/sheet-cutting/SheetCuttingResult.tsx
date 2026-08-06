import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import type { OptimizedSheetLayout, OptimizeSheetCutOutput } from '../../domain/sheet-cutting/types'
import { formatMm } from '../../shared/formatters/formatMm'
import { formatAreaM2, formatPercentage } from '../../shared/formatters/formatArea'
import { buildColorMapByKey } from '../../shared/pieceColors'
import { SheetLayoutView } from './SheetLayoutView'

interface SheetCuttingResultProps {
  materialName: string
  result: OptimizeSheetCutOutput
  sheetWidthMm: number
  sheetHeightMm: number
}

interface LayoutGroup {
  startSheet: number
  endSheet: number
  layout: OptimizedSheetLayout
}

const INITIAL_VISIBLE_GROUPS = 10
const MAX_TOTAL_ANIMATION_DELAY_SECONDS = 0.5

function layoutSignature(layout: OptimizedSheetLayout): string {
  return layout.placements
    .map((p) => `${p.itemId}:${p.xMm}:${p.yMm}:${p.widthMm}:${p.heightMm}`)
    .sort()
    .join('|')
}

/** Groups consecutive sheets that pack out identically, so a plan with one uniform measure shows a single representative drawing instead of one per sheet. */
function groupIdenticalLayouts(layouts: readonly OptimizedSheetLayout[]): LayoutGroup[] {
  const groups: LayoutGroup[] = []
  for (const layout of layouts) {
    const signature = layoutSignature(layout)
    const last = groups[groups.length - 1]
    if (last && layoutSignature(last.layout) === signature) {
      last.endSheet = layout.sheetNumber
    } else {
      groups.push({ startSheet: layout.sheetNumber, endSheet: layout.sheetNumber, layout })
    }
  }
  return groups
}

export function SheetCuttingResult({ materialName, result, sheetWidthMm, sheetHeightMm }: SheetCuttingResultProps) {
  const [visibleGroupCount, setVisibleGroupCount] = useState(INITIAL_VISIBLE_GROUPS)

  const colorMap = useMemo(() => buildColorMapByKey(result.items, (item) => item.itemId), [result.items])
  const groups = useMemo(() => groupIdenticalLayouts(result.sheets), [result.sheets])
  const visibleGroups = groups.slice(0, visibleGroupCount)
  const remainingGroups = groups.length - visibleGroups.length
  const delayStep = groups.length > 0 ? Math.min(0.04, MAX_TOTAL_ANIMATION_DELAY_SECONDS / groups.length) : 0

  return (
    <div className="plan-result">
      <p className="plan-result__title">{materialName || 'Material sem nome'}</p>

      <div className="result-summary">
        <div className="result-summary__stat result-summary__stat--primary">
          <span className="result-number">{result.requiredSheetCount}</span>
          <span className="result-summary__label">Chapas inteiras necessárias</span>
        </div>
        <div className="result-summary__stat">
          <span className="result-summary__value">
            {formatMm(sheetWidthMm)} × {formatMm(sheetHeightMm)}
          </span>
          <span className="result-summary__label">Tamanho da chapa</span>
        </div>
        <div className="result-summary__stat">
          <span className="result-summary__value">{result.requestedPieceCount}</span>
          <span className="result-summary__label">Peças solicitadas</span>
        </div>
      </div>

      {result.utilizationPercentage < 100 && (
        <p className="plan-result__note">Plano otimizado — melhor plano encontrado entre as estratégias testadas.</p>
      )}

      <div className="plan-section">
        <p className="plan-section__title">Medidas do plano</p>
        <div className="sheet-item-summary">
          <div className="sheet-item-summary__header">
            <span aria-hidden="true"></span>
            <span>Medida</span>
            <span>Solicitadas</span>
            <span>Distribuídas</span>
          </div>
          {result.items.map((item) => (
            <div className="sheet-item-summary__row" key={item.itemId}>
              <span className="sheet-item-summary__swatch" style={{ backgroundColor: colorMap.get(item.itemId) }} />
              <span>
                {item.widthMm} × {item.heightMm} mm
              </span>
              <span>{item.requestedQuantity}</span>
              <span>{item.placedQuantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="plan-section">
        <p className="plan-section__title">Área e aproveitamento</p>
        <div className="area-grid">
          <div className="area-grid__item">
            <span className="area-grid__label">Área total das peças</span>
            <span className="area-grid__value">{formatAreaM2(result.totalPieceAreaM2)}</span>
          </div>
          <div className="area-grid__item">
            <span className="area-grid__label">Área total das chapas utilizadas</span>
            <span className="area-grid__value">{formatAreaM2(result.totalSheetAreaM2)}</span>
          </div>
          <div className="area-grid__item">
            <span className="area-grid__label">Aproveitamento da área</span>
            <span className="area-grid__value">{formatPercentage(result.utilizationPercentage)}</span>
          </div>
        </div>
      </div>

      <div className="plan-result__bars">
        {visibleGroups.map((group, index) => (
          <div className="sheet-layout-card" key={group.startSheet}>
            <div className="sheet-layout-card__header">
              <span className="sheet-layout-card__title">
                {group.startSheet === group.endSheet
                  ? `CHAPA ${String(group.startSheet).padStart(2, '0')}`
                  : `CHAPAS ${group.startSheet} A ${group.endSheet}`}
              </span>
              <span className="sheet-layout-card__count">
                {group.layout.placements.length} peças · {formatPercentage(group.layout.utilizationPercentage)}
              </span>
            </div>
            {group.startSheet !== group.endSheet && (
              <p className="sheet-layout-card__note">Todas essas chapas seguem exatamente esta mesma distribuição.</p>
            )}
            <SheetLayoutView
              sheetWidthMm={sheetWidthMm}
              sheetHeightMm={sheetHeightMm}
              placements={group.layout.placements}
              colorMap={colorMap}
              ariaLabel={`Desenho da chapa ${group.startSheet}`}
              delaySeconds={index * delayStep}
            />
          </div>
        ))}
      </div>

      {remainingGroups > 0 && (
        <Button variant="secondary" onClick={() => setVisibleGroupCount((count) => count + INITIAL_VISIBLE_GROUPS)}>
          Mostrar mais chapas ({remainingGroups} restantes)
        </Button>
      )}
    </div>
  )
}
