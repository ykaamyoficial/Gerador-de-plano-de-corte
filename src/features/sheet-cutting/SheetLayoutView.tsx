import { motion } from 'motion/react'
import { calculateUsedLengthMm, calculateUsedWidthMm } from '../../domain/sheet-cutting/calculations'
import type { SheetPiecePlacement } from '../../domain/sheet-cutting/types'

interface SheetLayoutViewProps {
  sheetWidthMm: number
  sheetLengthMm: number
  placedPieceWidthMm: number
  placedPieceLengthMm: number
  kerfMm: number
  columns: number
  rows: number
  placements: SheetPiecePlacement[]
  ariaLabel: string
  animate?: boolean
}

const MAX_LABELED_PIECES = 60

export function SheetLayoutView({
  sheetWidthMm,
  sheetLengthMm,
  placedPieceWidthMm,
  placedPieceLengthMm,
  kerfMm,
  columns,
  rows,
  placements,
  ariaLabel,
  animate = true,
}: SheetLayoutViewProps) {
  const usedWidthMm = calculateUsedWidthMm(columns, placedPieceWidthMm, kerfMm)
  const usedLengthMm = calculateUsedLengthMm(rows, placedPieceLengthMm, kerfMm)
  const hasRightLeftover = usedWidthMm < sheetWidthMm
  const hasBottomLeftover = usedLengthMm < sheetLengthMm

  const canShowLabels = placements.length <= MAX_LABELED_PIECES
  const fontSizeMm = Math.max(8, Math.min(placedPieceWidthMm, placedPieceLengthMm) * 0.18)
  const labelFits = placedPieceWidthMm > fontSizeMm * 3.5 && placedPieceLengthMm > fontSizeMm * 1.6

  return (
    <svg
      viewBox={`0 0 ${sheetWidthMm} ${sheetLengthMm}`}
      preserveAspectRatio="xMidYMid meet"
      className="sheet-layout-view"
      style={{ aspectRatio: `${sheetWidthMm} / ${sheetLengthMm}` }}
      role="img"
      aria-label={ariaLabel}
    >
      <rect x={0} y={0} width={sheetWidthMm} height={sheetLengthMm} className="sheet-layout-view__sheet" />

      {hasRightLeftover && (
        <rect
          x={usedWidthMm}
          y={0}
          width={sheetWidthMm - usedWidthMm}
          height={sheetLengthMm}
          className="sheet-layout-view__leftover"
        />
      )}
      {hasBottomLeftover && (
        <rect
          x={0}
          y={usedLengthMm}
          width={usedWidthMm}
          height={sheetLengthMm - usedLengthMm}
          className="sheet-layout-view__leftover"
        />
      )}

      {placements.map((placement, index) => (
        <motion.rect
          key={placement.index}
          x={placement.xMm}
          y={placement.yMm}
          width={placement.widthMm}
          height={placement.lengthMm}
          className="sheet-layout-view__piece"
          initial={animate ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: Math.min(index * 0.006, 0.4) }}
        >
          <title>{`${placement.widthMm} × ${placement.lengthMm} mm`}</title>
        </motion.rect>
      ))}

      {canShowLabels && labelFits &&
        placements.map((placement) => (
          <text
            key={`label-${placement.index}`}
            x={placement.xMm + placement.widthMm / 2}
            y={placement.yMm + placement.lengthMm / 2}
            fontSize={fontSizeMm}
            className="sheet-layout-view__label"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {placement.widthMm} × {placement.lengthMm}
          </text>
        ))}
    </svg>
  )
}
