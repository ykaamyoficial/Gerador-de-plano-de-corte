import { formatMm } from '../../shared/formatters/formatMm'
import { formatAreaM2, formatPercentage } from '../../shared/formatters/formatArea'
import type { SheetCuttingOrder } from '../../domain/sheet-cutting/types'
import { SheetLayoutView } from './SheetLayoutView'

interface SheetCuttingReportProps {
  order: SheetCuttingOrder
}

const ORIENTATION_LABEL = { normal: 'normal', rotated: 'girada 90°' } as const

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

        const fullSheetsCount = result.layouts.filter((layout) => layout.isFull).length
        const partialSheet = result.layouts.find((layout) => !layout.isFull) ?? null
        const representativeFullLayout = result.layouts.find((layout) => layout.isFull) ?? null

        return (
          <section className="report__plan" key={plan.id}>
            <h2>
              PLANO {planIndex + 1} — {(plan.materialName || 'MATERIAL SEM NOME').toUpperCase()}
            </h2>
            <div className="report__plan-meta">
              <p>Chapa inteira: {formatMm(result.sheetWidthMm)} × {formatMm(result.sheetLengthMm)}</p>
              <p>Peça: {formatMm(result.originalPieceWidthMm)} × {formatMm(result.originalPieceLengthMm)}</p>
              <p>Quantidade solicitada: {result.requestedQuantity}</p>
              <p>Espessura do corte: {formatMm(result.kerfMm)}</p>
              <p>Chapas necessárias: {result.requiredSheetCount}</p>
              <p>Peças por chapa completa: {result.piecesPerFullSheet}</p>
              <p>Distribuição: {result.columns} colunas × {result.rows} linhas</p>
              <p>Orientação: {ORIENTATION_LABEL[result.orientation]}</p>
            </div>

            <table className="report__table">
              <thead>
                <tr>
                  <th>Chapa</th>
                  <th>Quantidade de peças</th>
                  <th>Distribuição</th>
                </tr>
              </thead>
              <tbody>
                {result.layouts.map((layout) => (
                  <tr key={layout.sheetNumber} className="report__table-row">
                    <td>{String(layout.sheetNumber).padStart(2, '0')}</td>
                    <td>{layout.placedPieceCount}</td>
                    <td>{layout.isFull ? `${result.columns} × ${result.rows}` : 'parcial'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="report__sheet-area">
              <p>Área de cada chapa: {formatAreaM2(result.sheetAreaM2)}</p>
              <p>Área de cada peça: {formatAreaM2(result.pieceAreaM2)}</p>
              <p>Área total das peças: {formatAreaM2(result.requestedAreaM2)}</p>
              <p>Área total das chapas utilizadas: {formatAreaM2(result.purchasedAreaM2)}</p>
              <p>Aproveitamento da área: {formatPercentage(result.utilizationPercentage)}</p>
            </div>

            <div className="report__sheet-drawings">
              {representativeFullLayout && (
                <div className="sheet-layout-card">
                  <div className="sheet-layout-card__header">
                    <span className="sheet-layout-card__title">
                      {fullSheetsCount > 1 ? `CHAPAS 1 A ${fullSheetsCount}` : 'CHAPA 01'}
                    </span>
                    <span className="sheet-layout-card__count">{result.piecesPerFullSheet} peças por chapa</span>
                  </div>
                  <SheetLayoutView
                    sheetWidthMm={result.sheetWidthMm}
                    sheetLengthMm={result.sheetLengthMm}
                    placedPieceWidthMm={result.placedPieceWidthMm}
                    placedPieceLengthMm={result.placedPieceLengthMm}
                    kerfMm={result.kerfMm}
                    columns={result.columns}
                    rows={result.rows}
                    placements={representativeFullLayout.placements}
                    ariaLabel="Desenho das chapas completas"
                    animate={false}
                  />
                </div>
              )}
              {partialSheet && (
                <div className="sheet-layout-card">
                  <div className="sheet-layout-card__header">
                    <span className="sheet-layout-card__title">
                      CHAPA {String(partialSheet.sheetNumber).padStart(2, '0')} — PARCIAL
                    </span>
                    <span className="sheet-layout-card__count">{partialSheet.placedPieceCount} peças</span>
                  </div>
                  <SheetLayoutView
                    sheetWidthMm={result.sheetWidthMm}
                    sheetLengthMm={result.sheetLengthMm}
                    placedPieceWidthMm={result.placedPieceWidthMm}
                    placedPieceLengthMm={result.placedPieceLengthMm}
                    kerfMm={result.kerfMm}
                    columns={result.columns}
                    rows={result.rows}
                    placements={partialSheet.placements}
                    ariaLabel="Desenho da última chapa, parcial"
                    animate={false}
                  />
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
