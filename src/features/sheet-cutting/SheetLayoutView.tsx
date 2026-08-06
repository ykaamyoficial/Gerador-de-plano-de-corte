import { motion } from 'motion/react'
import type { SheetPiecePlacement } from '../../domain/sheet-cutting/types'

interface SheetLayoutViewProps {
  sheetWidthMm: number
  sheetLengthMm: number
  placements: SheetPiecePlacement[]
  colorMap: Map<string, string>
  ariaLabel: string
  delaySeconds?: number
  animate?: boolean
}

const MAX_LABELED_PIECES = 80

export function SheetLayoutView({
  sheetWidthMm,
  sheetLengthMm,
  placements,
  colorMap,
  ariaLabel,
  delaySeconds = 0,
  animate = true,
}: SheetLayoutViewProps) {
  const usedLengthMm = placements.reduce((max, p) => Math.max(max, p.yMm + p.placedLengthMm), 0)
  const hasBottomLeftover = usedLengthMm < sheetLengthMm
  const canShowLabels = placements.length <= MAX_LABELED_PIECES

  return (
    <motion.svg
      viewBox={`0 0 ${sheetWidthMm} ${sheetLengthMm}`}
      preserveAspectRatio="xMidYMid meet"
      className="sheet-layout-view"
      style={{ aspectRatio: `${sheetWidthMm} / ${sheetLengthMm}` }}
      role="img"
      aria-label={ariaLabel}
      initial={animate ? { opacity: 0 } : undefined}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: delaySeconds }}
    >
      <rect x={0} y={0} width={sheetWidthMm} height={sheetLengthMm} className="sheet-layout-view__sheet" />

      {hasBottomLeftover && (
        <rect
          x={0}
          y={usedLengthMm}
          width={sheetWidthMm}
          height={sheetLengthMm - usedLengthMm}
          className="sheet-layout-view__leftover"
        />
      )}

      {placements.map((placement) => {
        const fontSizeMm = Math.max(6, Math.min(placement.placedWidthMm, placement.placedLengthMm) * 0.2)
        const labelFits = placement.placedWidthMm > fontSizeMm * 3.2 && placement.placedLengthMm > fontSizeMm * 1.5

        return (
          <g key={placement.index}>
            <rect
              x={placement.xMm}
              y={placement.yMm}
              width={placement.placedWidthMm}
              height={placement.placedLengthMm}
              className="sheet-layout-view__piece"
              style={{ fill: colorMap.get(placement.itemId) }}
              opacity={animate ? undefined : 1}
            >
              <title>
                {placement.widthMm} × {placement.lengthMm} mm{placement.rotated ? ' (girada)' : ''}
              </title>
            </rect>
            {canShowLabels && labelFits && (
              <text
                x={placement.xMm + placement.placedWidthMm / 2}
                y={placement.yMm + placement.placedLengthMm / 2}
                fontSize={fontSizeMm}
                className="sheet-layout-view__label"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {placement.widthMm} × {placement.lengthMm}
              </text>
            )}
          </g>
        )
      })}
    </motion.svg>
  )
}
