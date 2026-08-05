import { motion } from 'motion/react'
import type { CuttingBarResult } from '../../domain/cutting/types'
import { EASE_EMPHASIZED } from '../../shared/motion'

interface CuttingBarViewProps {
  bar: CuttingBarResult
  stockLengthMm: number
  colorMap: Map<number, string>
  delaySeconds?: number
}

export function CuttingBarView({ bar, stockLengthMm, colorMap, delaySeconds = 0 }: CuttingBarViewProps) {
  return (
    <motion.div
      className="bar-view"
      role="img"
      aria-label={`Representação da barra ${bar.barNumber}`}
      style={{ transformOrigin: 'left' }}
      initial={{ scaleX: 0.02, opacity: 0.5 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: delaySeconds, ease: EASE_EMPHASIZED }}
    >
      {bar.pieces.map((piece, index) => {
        const widthPercent = (piece.lengthMm / stockLengthMm) * 100
        return (
          <div
            key={index}
            className="bar-view__segment"
            style={{ width: `${widthPercent}%`, backgroundColor: colorMap.get(piece.lengthMm) }}
            title={`${piece.lengthMm} mm`}
          >
            {widthPercent > 6 ? piece.lengthMm : ''}
          </div>
        )
      })}
      {bar.leftoverMm > 0 && (
        <div
          className="bar-view__segment bar-view__segment--leftover"
          style={{ width: `${(bar.leftoverMm / stockLengthMm) * 100}%` }}
          title={`Sobra: ${bar.leftoverMm} mm`}
        >
          {(bar.leftoverMm / stockLengthMm) * 100 > 8 ? 'SOBRA' : ''}
        </div>
      )}
    </motion.div>
  )
}
