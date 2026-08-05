import { motion } from 'motion/react'
import { formatMm } from '../../shared/formatters/formatMm'
import { DURATION_SLOW, EASE_EMPHASIZED } from '../../shared/motion'

interface PlanResultSummaryProps {
  requiredStockCount: number
  stockLengthMm: number
  totalRequestedPieces: number
}

export function PlanResultSummary({ requiredStockCount, stockLengthMm, totalRequestedPieces }: PlanResultSummaryProps) {
  return (
    <motion.div
      className="result-summary"
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: DURATION_SLOW, ease: EASE_EMPHASIZED }}
    >
      <div className="result-summary__stat result-summary__stat--primary">
        <span className="result-number">{requiredStockCount}</span>
        <span className="result-summary__label">Barras inteiras necessárias</span>
      </div>
      <div className="result-summary__stat">
        <span className="result-summary__value">{formatMm(stockLengthMm)}</span>
        <span className="result-summary__label">Comprimento de cada barra</span>
      </div>
      <div className="result-summary__stat">
        <span className="result-summary__value">{totalRequestedPieces}</span>
        <span className="result-summary__label">Total de peças</span>
      </div>
    </motion.div>
  )
}
