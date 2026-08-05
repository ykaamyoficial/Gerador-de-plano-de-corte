import type { CuttingOrder } from '../../domain/cutting/types'
import { formatMm } from '../../shared/formatters/formatMm'
import { detailedSequenceLabel, groupedSequenceLabel } from '../../shared/formatters/sequence'

interface CuttingReportProps {
  order: CuttingOrder
}

function formatToday(): string {
  return new Date().toLocaleDateString('pt-BR')
}

export function CuttingReport({ order }: CuttingReportProps) {
  const calculatedPlans = order.plans.filter(
    (plan) => plan.calculationStatus === 'calculated' && plan.result !== null,
  )

  return (
    <div className="report">
      <header className="report__header">
        <h1>RELATÓRIO DE CORTE</h1>
        {order.name && <p>Ordem: {order.name}</p>}
        <p>Data: {formatToday()}</p>
      </header>

      <section className="report__summary">
        <h2>RESUMO DOS MATERIAIS</h2>
        {calculatedPlans.map((plan) => (
          <div className="report__summary-item" key={plan.id}>
            <p className="report__summary-material">{plan.materialName || 'Material sem nome'}</p>
            <p>
              {plan.result?.requiredStockCount} barras inteiras de {formatMm(plan.result?.stockLengthMm ?? 0)}
            </p>
          </div>
        ))}
      </section>

      {calculatedPlans.map((plan, planIndex) => (
        <section className="report__plan" key={plan.id}>
          <h2>
            PLANO {planIndex + 1} — {(plan.materialName || 'MATERIAL SEM NOME').toUpperCase()}
          </h2>
          <div className="report__plan-meta">
            <p>Comprimento da barra: {formatMm(plan.result?.stockLengthMm ?? 0)}</p>
            <p>Espessura do corte: {formatMm(plan.result?.kerfMm ?? 0)}</p>
            <p>Barras necessárias: {plan.result?.requiredStockCount}</p>
            <p>Peças solicitadas: {plan.result?.totalRequestedPieces}</p>
          </div>

          <table className="report__table">
            <thead>
              <tr>
                <th>Barra</th>
                <th>Sequência de corte</th>
                <th>Sobra</th>
              </tr>
            </thead>
            <tbody>
              {plan.result?.bars.map((bar) => (
                <tr key={bar.barNumber} className="report__table-row">
                  <td>{String(bar.barNumber).padStart(2, '0')}</td>
                  <td>
                    <div>{groupedSequenceLabel(bar.pieces)}</div>
                    <div className="report__table-detail">{detailedSequenceLabel(bar.pieces)}</div>
                  </td>
                  <td>{formatMm(bar.leftoverMm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
