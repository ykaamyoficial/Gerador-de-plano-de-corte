export interface PieceInstance {
  itemId: string
  index: number
  widthMm: number
  lengthMm: number
}

export interface PackedPiecePlacement {
  itemId: string
  index: number
  widthMm: number
  lengthMm: number
  placedWidthMm: number
  placedLengthMm: number
  rotated: boolean
  rowIndex: number
  xMm: number
  yMm: number
}

export interface PackedSheet {
  sheetNumber: number
  placements: PackedPiecePlacement[]
}

interface Orientation {
  widthMm: number
  heightMm: number
  rotated: boolean
}

interface Shelf {
  rowIndex: number
  yMm: number
  heightMm: number
  usedWidthMm: number
  placementCount: number
}

function candidateOrientations(piece: PieceInstance, allowRotation: boolean): Orientation[] {
  const orientations: Orientation[] = [{ widthMm: piece.widthMm, heightMm: piece.lengthMm, rotated: false }]
  if (allowRotation) {
    orientations.push({ widthMm: piece.lengthMm, heightMm: piece.widthMm, rotated: true })
  }
  return orientations
}

function estimateGridCapacity(
  widthMm: number,
  heightMm: number,
  sheetWidthMm: number,
  sheetLengthMm: number,
  kerfMm: number,
): number {
  const columns = Math.floor((sheetWidthMm + kerfMm) / (widthMm + kerfMm))
  const rows = Math.floor((sheetLengthMm + kerfMm) / (heightMm + kerfMm))
  return columns * rows
}

/**
 * Both orientations (normal first, then rotated if allowed), ranked by how
 * many copies of this piece would tile the whole sheet in that orientation
 * — highest capacity first. Used consistently everywhere a piece's
 * orientation is decided, so a piece already fit into a shelf doesn't fall
 * back to its worse orientation just because that was tried first.
 */
function rankedOrientations(
  piece: PieceInstance,
  sheetWidthMm: number,
  sheetLengthMm: number,
  kerfMm: number,
  allowRotation: boolean,
): Orientation[] {
  return candidateOrientations(piece, allowRotation)
    .filter((o) => o.widthMm <= sheetWidthMm && o.heightMm <= sheetLengthMm)
    .sort(
      (a, b) =>
        estimateGridCapacity(b.widthMm, b.heightMm, sheetWidthMm, sheetLengthMm, kerfMm) -
        estimateGridCapacity(a.widthMm, a.heightMm, sheetWidthMm, sheetLengthMm, kerfMm),
    )
}

/** Orientation used when opening a brand-new shelf: the best-ranked one that fits the sheet at all. */
function bestNewShelfOrientation(
  piece: PieceInstance,
  sheetWidthMm: number,
  sheetLengthMm: number,
  kerfMm: number,
  allowRotation: boolean,
): Orientation | null {
  return rankedOrientations(piece, sheetWidthMm, sheetLengthMm, kerfMm, allowRotation)[0] ?? null
}

/** Orientation used to slot a piece into an already-open shelf: the best-ranked candidate that also fits the shelf's remaining width and fixed height. */
function fitInShelf(
  piece: PieceInstance,
  shelf: Shelf,
  sheetWidthMm: number,
  sheetLengthMm: number,
  kerfMm: number,
  allowRotation: boolean,
): Orientation | null {
  for (const orientation of rankedOrientations(piece, sheetWidthMm, sheetLengthMm, kerfMm, allowRotation)) {
    const neededWidthMm = shelf.usedWidthMm + (shelf.placementCount > 0 ? kerfMm : 0) + orientation.widthMm
    if (neededWidthMm <= sheetWidthMm && orientation.heightMm <= shelf.heightMm) {
      return orientation
    }
  }
  return null
}

/**
 * Shelf packing (Next-Fit Decreasing Height): pieces are sorted largest-first,
 * then placed left-to-right into rows ("shelves") stacked top to bottom.
 * A piece goes into the current shelf if it fits; otherwise a new shelf is
 * opened (on the current sheet if there's room, else on a new sheet).
 * This is a well-known, deterministic heuristic for mixed-size rectangular
 * nesting — not a globally optimal packing, same "best layout found" spirit
 * as the linear module's optimizer.
 */
export function packSheetPieces(
  pieces: readonly PieceInstance[],
  sheetWidthMm: number,
  sheetLengthMm: number,
  kerfMm: number,
  allowRotation: boolean,
): PackedSheet[] {
  const sortedPieces = [...pieces].sort((a, b) => {
    const orientationA = bestNewShelfOrientation(a, sheetWidthMm, sheetLengthMm, kerfMm, allowRotation)
    const orientationB = bestNewShelfOrientation(b, sheetWidthMm, sheetLengthMm, kerfMm, allowRotation)
    const heightA = orientationA?.heightMm ?? 0
    const heightB = orientationB?.heightMm ?? 0
    if (heightB !== heightA) return heightB - heightA
    const widthA = orientationA?.widthMm ?? 0
    const widthB = orientationB?.widthMm ?? 0
    if (widthB !== widthA) return widthB - widthA
    if (a.itemId !== b.itemId) return a.itemId < b.itemId ? -1 : 1
    return a.index - b.index
  })

  const sheets: PackedSheet[] = []
  let currentPlacements: PackedPiecePlacement[] = []
  let currentShelves: Shelf[] = []
  let currentUsedLengthMm = 0
  let currentShelf: Shelf | null = null

  function finalizeCurrentSheet() {
    if (currentPlacements.length > 0) {
      sheets.push({ sheetNumber: sheets.length + 1, placements: currentPlacements })
    }
    currentPlacements = []
    currentShelves = []
    currentUsedLengthMm = 0
    currentShelf = null
  }

  for (const piece of sortedPieces) {
    if (currentShelf) {
      const fit = fitInShelf(piece, currentShelf, sheetWidthMm, sheetLengthMm, kerfMm, allowRotation)
      if (fit) {
        const xMm = currentShelf.usedWidthMm + (currentShelf.placementCount > 0 ? kerfMm : 0)
        currentPlacements.push({
          itemId: piece.itemId,
          index: piece.index,
          widthMm: piece.widthMm,
          lengthMm: piece.lengthMm,
          placedWidthMm: fit.widthMm,
          placedLengthMm: fit.heightMm,
          rotated: fit.rotated,
          rowIndex: currentShelf.rowIndex,
          xMm,
          yMm: currentShelf.yMm,
        })
        currentShelf.usedWidthMm = xMm + fit.widthMm
        currentShelf.placementCount += 1
        continue
      }
    }

    const orientation = bestNewShelfOrientation(piece, sheetWidthMm, sheetLengthMm, kerfMm, allowRotation)
    if (!orientation) {
      throw new Error('sheet_cut_piece_does_not_fit')
    }

    const sheetHasShelves = currentShelves.length > 0
    const candidateYMm = sheetHasShelves ? currentUsedLengthMm + kerfMm : 0
    const fitsCurrentSheet = candidateYMm + orientation.heightMm <= sheetLengthMm

    if (sheetHasShelves && !fitsCurrentSheet) {
      finalizeCurrentSheet()
    }

    const yMm = currentShelves.length > 0 ? currentUsedLengthMm + kerfMm : 0
    if (yMm + orientation.heightMm > sheetLengthMm) {
      throw new Error('sheet_cut_piece_does_not_fit')
    }

    const shelf: Shelf = {
      rowIndex: currentShelves.length,
      yMm,
      heightMm: orientation.heightMm,
      usedWidthMm: orientation.widthMm,
      placementCount: 1,
    }
    currentShelves.push(shelf)
    currentUsedLengthMm = yMm + orientation.heightMm
    currentShelf = shelf

    currentPlacements.push({
      itemId: piece.itemId,
      index: piece.index,
      widthMm: piece.widthMm,
      lengthMm: piece.lengthMm,
      placedWidthMm: orientation.widthMm,
      placedLengthMm: orientation.heightMm,
      rotated: orientation.rotated,
      rowIndex: shelf.rowIndex,
      xMm: 0,
      yMm,
    })
  }

  finalizeCurrentSheet()

  return sheets
}
