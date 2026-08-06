import { motion } from 'motion/react'
import type { SheetPiecePlacement } from '../../domain/sheet-cutting/types'

interface SheetLayoutViewProps {
  sheetWidthMm: number
  sheetHeightMm: number
  placements: SheetPiecePlacement[]
  colorMap: Map<string, string>
  ariaLabel: string
  delaySeconds?: number
  animate?: boolean
}

const MAX_LABELED_PIECES = 80

export function SheetLayoutView({
  sheetWidthMm,
  sheetHeightMm,
  placements,
  colorMap,
  ariaLabel,
  delaySeconds = 0,
  animate = true,
}: SheetLayoutViewProps) {
  const usedLengthMm = placements.reduce((max, p) => Math.max(max, p.yMm + p.heightMm), 0)
  const hasBottomLeftover = usedLengthMm < sheetHeightMm
  const canShowLabels = placements.length <= MAX_LABELED_PIECES

  return (
    <motion.svg
      viewBox={`0 0 ${sheetWidthMm} ${sheetHeightMm}`}
      preserveAspectRatio="xMidYMid meet"
      className="sheet-layout-view"
      style={{ aspectRatio: `${sheetWidthMm} / ${sheetHeightMm}` }}
      role="img"
      aria-label={ariaLabel}
      initial={animate ? { opacity: 0 } : undefined}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: delaySeconds }}
    >
      <rect x={0} y={0} width={sheetWidthMm} height={sheetHeightMm} className="sheet-layout-view__sheet" />

      {hasBottomLeftover && (
        <rect
          x={0}
          y={usedLengthMm}
          width={sheetWidthMm}
          height={sheetHeightMm - usedLengthMm}
          className="sheet-layout-view__leftover"
        />
      )}

      {placements.map((placement) => {
        const fontSizeMm = Math.max(6, Math.min(placement.widthMm, placement.heightMm) * 0.2)
        const labelFits = placement.widthMm > fontSizeMm * 3.2 && placement.heightMm > fontSizeMm * 1.5

        return (
          <g key={placement.instanceId}>
            <rect
              x={placement.xMm}
              y={placement.yMm}
              width={placement.widthMm}
              height={placement.heightMm}
              className="sheet-layout-view__piece"
              style={{ fill: colorMap.get(placement.itemId) }}
              opacity={animate ? undefined : 1}
            >
              <title>
                {placement.originalWidthMm} × {placement.originalHeightMm} mm{placement.rotated ? ' (girada)' : ''}
              </title>
            </rect>
            {canShowLabels && labelFits && (
              <text
                x={placement.xMm + placement.widthMm / 2}
                y={placement.yMm + placement.heightMm / 2}
                fontSize={fontSizeMm}
                className="sheet-layout-view__label"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {placement.originalWidthMm} × {placement.originalHeightMm}
              </text>
            )}
          </g>
        )
      })}
    </motion.svg>
  )
}
