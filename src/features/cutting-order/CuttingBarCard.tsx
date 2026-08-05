import { motion } from 'motion/react'
import type { CuttingBarResult } from '../../domain/cutting/types'
import { formatMm } from '../../shared/formatters/formatMm'
import { detailedSequenceLabel, groupedSequenceLabel } from '../../shared/formatters/sequence'
import { DURATION_NORMAL } from '../../shared/motion'
import { CuttingBarView } from './CuttingBarView'

interface CuttingBarCardProps {
  bar: CuttingBarResult
  stockLengthMm: number
  colorMap: Map<number, string>
  animationDelaySeconds?: number
}

export function CuttingBarCard({ bar, stockLengthMm, colorMap, animationDelaySeconds = 0 }: CuttingBarCardProps) {
  return (
    <motion.div
      className="bar-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION_NORMAL, delay: animationDelaySeconds }}
    >
      <div className="bar-card__header">
        <span className="bar-card__number">BARRA {String(bar.barNumber).padStart(2, '0')}</span>
        <span className="bar-card__leftover">Sobra: {formatMm(bar.leftoverMm)}</span>
      </div>
      <CuttingBarView bar={bar} stockLengthMm={stockLengthMm} colorMap={colorMap} delaySeconds={animationDelaySeconds} />
      <p className="bar-card__sequence-label">Sequência de corte</p>
      <p className="bar-card__sequence">{groupedSequenceLabel(bar.pieces)}</p>
      <p className="bar-card__sequence-detail">{detailedSequenceLabel(bar.pieces)}</p>
      <p className="bar-card__meta">
        Comprimento das peças: {formatMm(bar.piecesLengthMm)} · Perda nos cortes: {formatMm(bar.kerfLossMm)}
      </p>
    </motion.div>
  )
}
