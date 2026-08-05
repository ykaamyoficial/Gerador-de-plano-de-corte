import type { CuttingBarResult } from '../../domain/cutting/types'

interface CuttingBarViewProps {
  bar: CuttingBarResult
  stockLengthMm: number
}

const PALETTE = ['#3b6ea5', '#4f8fc0', '#6aa8d8', '#8bbfe3', '#a9d0ea', '#5a83ae']

export function CuttingBarView({ bar, stockLengthMm }: CuttingBarViewProps) {
  return (
    <div className="bar-view" role="img" aria-label={`Representação da barra ${bar.barNumber}`}>
      {bar.pieces.map((piece, index) => {
        const widthPercent = (piece.lengthMm / stockLengthMm) * 100
        return (
          <div
            key={index}
            className="bar-view__segment"
            style={{ width: `${widthPercent}%`, backgroundColor: PALETTE[index % PALETTE.length] }}
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
    </div>
  )
}
