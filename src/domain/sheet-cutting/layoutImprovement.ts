import { cloneWorkingSheets, tryPlaceInExistingSheets, type Heuristic, type WorkingSheet } from './maxRects'
import type { ExpandedSheetPiece } from './types'

const REINSERTION_HEURISTICS: Heuristic[] = ['best-area', 'best-short-side']

function placedAreaMm2(sheet: WorkingSheet): number {
  return sheet.placements.reduce((sum, placement) => sum + placement.widthMm * placement.heightMm, 0)
}

/**
 * Repeatedly tries to drop the least-occupied sheet by re-inserting its
 * pieces into the remaining sheets. Only keeps a round's result when every
 * displaced piece found a new home — otherwise the attempt is discarded and
 * the previous layout stands, so this can only ever reduce or preserve the
 * sheet count, never lose a piece.
 */
export function tryEliminateLeastUsedSheets(
  sheets: readonly WorkingSheet[],
  piecesByInstanceId: ReadonlyMap<string, ExpandedSheetPiece>,
  kerfMm: number,
): WorkingSheet[] {
  let current = [...sheets]
  let keepTrying = true

  while (keepTrying && current.length > 1) {
    keepTrying = false

    let leastIndex = 0
    let leastAreaMm2 = Infinity
    current.forEach((sheet, index) => {
      const used = placedAreaMm2(sheet)
      if (used < leastAreaMm2) {
        leastAreaMm2 = used
        leastIndex = index
      }
    })

    const target = current[leastIndex]
    if (!target) break

    const remainingSheets = current.filter((_, index) => index !== leastIndex)
    const displacedPieces = target.placements
      .map((placement) => piecesByInstanceId.get(placement.instanceId))
      .filter((piece): piece is ExpandedSheetPiece => piece !== undefined)

    if (displacedPieces.length !== target.placements.length) break

    for (const heuristic of REINSERTION_HEURISTICS) {
      const trial = cloneWorkingSheets(remainingSheets)
      let allPlaced = true

      for (const piece of displacedPieces) {
        if (!tryPlaceInExistingSheets(trial, piece, kerfMm, heuristic)) {
          allPlaced = false
          break
        }
      }

      if (allPlaced) {
        current = trial
        keepTrying = true
        break
      }
    }
  }

  return current
}
