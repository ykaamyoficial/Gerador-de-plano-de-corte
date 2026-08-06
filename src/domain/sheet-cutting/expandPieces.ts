import type { ExpandedSheetPiece, SheetCutItem } from './types'

/** Turns each measure's quantity into that many individually-tracked piece instances. */
export function expandPieces(items: readonly SheetCutItem[]): ExpandedSheetPiece[] {
  const pieces: ExpandedSheetPiece[] = []
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      pieces.push({
        instanceId: `${item.id}#${i}`,
        itemId: item.id,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        originalWidthMm: item.widthMm,
        originalHeightMm: item.heightMm,
        allowRotation: item.allowRotation,
      })
    }
  }
  return pieces
}
