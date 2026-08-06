import { formatMm } from '../../shared/formatters/formatMm'
import { formatAreaM2, formatPercentage } from '../../shared/formatters/formatArea'
import { buildColorMapByKey } from '../../shared/pieceColors'
import type { SheetCuttingOrder, SheetLayoutResult } from '../../domain/sheet-cutting/types'
import { SheetLayoutView } from './SheetLayoutView'

interface SheetCuttingReportProps {
  order: SheetCuttingOrder
}

interface LayoutGroup {
  startSheet: number
  endSheet: number
  layout: SheetLayoutResult
}

function layoutSignature(layout: SheetLayoutResult): string {
  return layout.placements.map((p) => `${p.itemId}:${p.xMm}:${p.yMm}:${p.placedWidthMm}:${p.placedLengthMm}`).join('|')
}

function groupIdenticalLayouts(layouts: readonly SheetLayoutResult[]): LayoutGroup[] {
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

function formatToday(): string {
  return new Date().toLocaleDateString('pt-BR')
}

export function SheetCuttingReport({ order }: SheetCuttingReportProps) {
  const calculatedPlans = order.plans.filter((plan) => plan.calculationStatus === 'calculated' && plan.result !== null)

  return (
    <div className="report">
      <header className="report__header">
        <h1>RELATÓRIO DE CORTE DE CHAPAS</h1>
        {order.name && <p>Ordem: {order.name}</p>}
        <p>Data: {formatToday()}</p>
      </header>

      <section className="report__summary">
        <h2>RESUMO DOS MATERIAIS</h2>
        {calculatedPlans.map((plan) => (
          <div className="report__summary-item" key={plan.id}>
            <p className="report__summary-material">{plan.materialName || 'Material sem nome'}</p>
            <p>
              {plan.result?.requiredSheetCount} chapas inteiras de {formatMm(plan.result?.sheetWidthMm ?? 0)} ×{' '}
              {formatMm(plan.result?.sheetLengthMm ?? 0)}
            </p>
          </div>
        ))}
      </section>

      {calculatedPlans.map((plan, planIndex) => {
        const result = plan.result
        if (!result) return null

        const colorMap = buildColorMapByKey(result.items, (item) => item.itemId)
        const groups = groupIdenticalLayouts(result.layouts)

        return (
          <section className="report__plan" key={plan.id}>
            <h2>
              PLANO {planIndex + 1} — {(plan.materialName || 'MATERIAL SEM NOME').toUpperCase()}
            </h2>
            <div className="report__plan-meta">
              <p>Chapa inteira: {formatMm(result.sheetWidthMm)} × {formatMm(result.sheetLengthMm)}</p>
              <p>Espessura do corte: {formatMm(result.kerfMm)}</p>
              <p>Quantidade solicitada: {result.totalRequestedPieces}</p>
              <p>Chapas necessárias: {result.requiredSheetCount}</p>
              <p>Rotação permitida: {result.allowRotation ? 'sim' : 'não'}</p>
            </div>

            <table className="report__table">
              <thead>
                <tr>
                  <th>Medida</th>
                  <th>Solicitadas</th>
                  <th>Distribuídas</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.itemId} className="report__table-row">
                    <td>{item.widthMm} × {item.lengthMm} mm</td>
                    <td>{item.requestedQuantity}</td>
                    <td>{item.placedQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="report__table">
              <thead>
                <tr>
                  <th>Chapa</th>
                  <th>Quantidade de peças</th>
                </tr>
              </thead>
              <tbody>
                {result.layouts.map((layout) => (
                  <tr key={layout.sheetNumber} className="report__table-row">
                    <td>{String(layout.sheetNumber).padStart(2, '0')}</td>
                    <td>{layout.placements.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="report__sheet-area">
              <p>Área de cada chapa: {formatAreaM2(result.sheetAreaM2)}</p>
              <p>Área total das peças: {formatAreaM2(result.requestedAreaM2)}</p>
              <p>Área total das chapas utilizadas: {formatAreaM2(result.purchasedAreaM2)}</p>
              <p>Aproveitamento da área: {formatPercentage(result.utilizationPercentage)}</p>
            </div>

            <div className="report__sheet-drawings">
              {groups.map((group) => (
                <div className="sheet-layout-card" key={group.startSheet}>
                  <div className="sheet-layout-card__header">
                    <span className="sheet-layout-card__title">
                      {group.startSheet === group.endSheet
                        ? `CHAPA ${String(group.startSheet).padStart(2, '0')}`
                        : `CHAPAS ${group.startSheet} A ${group.endSheet}`}
                    </span>
                    <span className="sheet-layout-card__count">{group.layout.placements.length} peças</span>
                  </div>
                  <SheetLayoutView
                    sheetWidthMm={result.sheetWidthMm}
                    sheetLengthMm={result.sheetLengthMm}
                    placements={group.layout.placements}
                    colorMap={colorMap}
                    ariaLabel={`Desenho da chapa ${group.startSheet}`}
                    animate={false}
                  />
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
