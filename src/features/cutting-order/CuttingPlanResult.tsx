import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import type { CuttingPlanResult as CuttingPlanResultData } from '../../domain/cutting/types'
import { buildPieceColorMap } from '../../shared/pieceColors'
import { CuttingBarCard } from './CuttingBarCard'
import { PlanResultSummary } from './PlanResultSummary'

interface CuttingPlanResultProps {
  materialName: string
  result: CuttingPlanResultData
}

const INITIAL_VISIBLE_BARS = 20
const MAX_TOTAL_ANIMATION_DELAY_SECONDS = 0.5

export function CuttingPlanResult({ materialName, result }: CuttingPlanResultProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_BARS)
  const colorMap = useMemo(() => buildPieceColorMap(result.bars), [result.bars])
  const visibleBars = result.bars.slice(0, visibleCount)
  const remainingCount = result.bars.length - visibleBars.length
  const delayStep = result.bars.length > 0 ? Math.min(0.04, MAX_TOTAL_ANIMATION_DELAY_SECONDS / result.bars.length) : 0

  return (
    <div className="plan-result">
      <p className="plan-result__title">{materialName || 'Material sem nome'}</p>

      <PlanResultSummary
        requiredStockCount={result.requiredStockCount}
        stockLengthMm={result.stockLengthMm}
        totalRequestedPieces={result.totalRequestedPieces}
      />

      {result.optimizationStatus === 'best_found' && (
        <p className="plan-result__note">Foi gerado o melhor plano encontrado dentro do tempo de cálculo.</p>
      )}

      <div className="plan-result__bars">
        {visibleBars.map((bar, index) => (
          <CuttingBarCard
            key={bar.barNumber}
            bar={bar}
            stockLengthMm={result.stockLengthMm}
            colorMap={colorMap}
            animationDelaySeconds={index * delayStep}
          />
        ))}
      </div>

      {remainingCount > 0 && (
        <Button variant="secondary" onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_BARS)}>
          Mostrar mais barras ({remainingCount} restantes)
        </Button>
      )}
    </div>
  )
}
