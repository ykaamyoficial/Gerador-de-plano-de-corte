import type { CuttingPlanResult as CuttingPlanResultData } from '../../domain/cutting/types'
import { formatMm } from '../../shared/formatters/formatMm'
import { detailedSequenceLabel, groupedSequenceLabel } from '../../shared/formatters/sequence'
import { CuttingBarView } from './CuttingBarView'

interface CuttingPlanResultProps {
  materialName: string
  result: CuttingPlanResultData
}

export function CuttingPlanResult({ materialName, result }: CuttingPlanResultProps) {
  return (
    <div className="plan-result">
      <div className="plan-result__summary">
        <h4>{materialName || 'Material sem nome'}</h4>
        <p>
          Barras inteiras necessárias: <strong>{result.requiredStockCount}</strong>
        </p>
        <p>Comprimento de cada barra: {formatMm(result.stockLengthMm)}</p>
        <p>Total de peças: {result.totalRequestedPieces}</p>
        {result.optimizationStatus === 'best_found' && (
          <p className="plan-result__note">
            Foi gerado o melhor plano encontrado dentro do tempo de cálculo.
          </p>
        )}
      </div>

      <div className="plan-result__bars">
        {result.bars.map((bar) => (
          <div className="bar-card" key={bar.barNumber}>
            <div className="bar-card__header">
              <span className="bar-card__number">BARRA {String(bar.barNumber).padStart(2, '0')}</span>
              <span className="bar-card__leftover">Sobra: {formatMm(bar.leftoverMm)}</span>
            </div>
            <CuttingBarView bar={bar} stockLengthMm={result.stockLengthMm} />
            <p className="bar-card__sequence-label">Sequência:</p>
            <p className="bar-card__sequence">{groupedSequenceLabel(bar.pieces)}</p>
            <p className="bar-card__sequence-detail">{detailedSequenceLabel(bar.pieces)}</p>
            <p className="bar-card__meta">
              Comprimento das peças: {formatMm(bar.piecesLengthMm)} · Perda nos cortes:{' '}
              {formatMm(bar.kerfLossMm)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
