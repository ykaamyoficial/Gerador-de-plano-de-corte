import { expandPieces } from './expandPieces'
import { tryEliminateLeastUsedSheets } from './layoutImprovement'
import { compareLayoutScores, scoreLayout, type LayoutScore } from './layoutScoring'
import { HEURISTICS, packAllPieces, type Heuristic, type WorkingSheet } from './maxRects'
import { SORT_STRATEGY_NAMES, sortPieces, type SheetSortStrategyName } from './pieceSortStrategies'
import { validateSheetCutResult } from './resultValidator'
import type {
  ExpandedSheetPiece,
  OptimizeSheetCutInput,
  OptimizeSheetCutOutput,
  OptimizedSheetLayout,
  SheetItemSummary,
} from './types'

const LARGE_INPUT_PIECE_THRESHOLD = 250
const REDUCED_SORT_STRATEGIES: SheetSortStrategyName[] = ['area-desc', 'max-side-desc']
const REDUCED_HEURISTICS: Heuristic[] = ['best-area', 'best-short-side']

function pieceFitsSheet(piece: ExpandedSheetPiece, sheetWidthMm: number, sheetHeightMm: number, kerfMm: number): boolean {
  const virtualSheetWidthMm = sheetWidthMm + kerfMm
  const virtualSheetHeightMm = sheetHeightMm + kerfMm
  const widthMm = piece.widthMm + kerfMm
  const heightMm = piece.heightMm + kerfMm
  const fitsNormal = widthMm <= virtualSheetWidthMm && heightMm <= virtualSheetHeightMm
  const fitsRotated = piece.allowRotation && heightMm <= virtualSheetWidthMm && widthMm <= virtualSheetHeightMm
  return fitsNormal || fitsRotated
}

function buildOutput(
  sheets: readonly WorkingSheet[],
  input: OptimizeSheetCutInput,
  requestedPieceCount: number,
): OptimizeSheetCutOutput {
  const sheetAreaMm2 = input.sheetWidthMm * input.sheetHeightMm

  const layouts: OptimizedSheetLayout[] = sheets.map((sheet, index) => {
    const usedAreaMm2 = sheet.placements.reduce((sum, p) => sum + p.widthMm * p.heightMm, 0)
    const freeRectangles = sheet.freeRects
      .map((rect) => ({
        xMm: rect.xMm,
        yMm: rect.yMm,
        widthMm: Math.max(0, Math.min(rect.widthMm, input.sheetWidthMm - rect.xMm)),
        heightMm: Math.max(0, Math.min(rect.heightMm, input.sheetHeightMm - rect.yMm)),
      }))
      .filter((rect) => rect.widthMm > 0 && rect.heightMm > 0)

    return {
      sheetNumber: index + 1,
      placements: sheet.placements,
      usedAreaMm2,
      utilizationPercentage: sheetAreaMm2 > 0 ? (usedAreaMm2 / sheetAreaMm2) * 100 : 0,
      freeRectangles,
    }
  })

  const itemSummaries = new Map<string, SheetItemSummary>()
  for (const item of input.items) {
    itemSummaries.set(item.id, {
      itemId: item.id,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      requestedQuantity: item.quantity,
      placedQuantity: 0,
    })
  }
  for (const layout of layouts) {
    for (const placement of layout.placements) {
      const summary = itemSummaries.get(placement.itemId)
      if (summary) summary.placedQuantity += 1
    }
  }

  const placedPieceCount = layouts.reduce((sum, layout) => sum + layout.placements.length, 0)
  const totalPieceAreaM2 = input.items.reduce(
    (sum, item) => sum + (item.widthMm * item.heightMm * item.quantity) / 1_000_000,
    0,
  )
  const totalSheetAreaM2 = (sheetAreaMm2 * layouts.length) / 1_000_000
  const utilizationPercentage = totalSheetAreaM2 > 0 ? (totalPieceAreaM2 / totalSheetAreaM2) * 100 : 0

  return {
    requiredSheetCount: layouts.length,
    sheets: layouts,
    requestedPieceCount,
    placedPieceCount,
    items: Array.from(itemSummaries.values()),
    totalPieceAreaM2,
    totalSheetAreaM2,
    utilizationPercentage,
  }
}

/**
 * Rectangle-packs one or more measures (each with its own quantity) into
 * the fewest whole sheets, mixing different sizes on the same sheet and
 * deciding each piece's orientation individually. Runs a MaxRects pack for
 * every (sort order × heuristic) combination, scores each candidate layout,
 * keeps the best, then tries to drop its least-used sheet by re-packing
 * that sheet's pieces into the others. This is a "best layout found" search
 * over a fixed set of strategies — not a proof of global optimality — same
 * honesty as the linear module's optimizer.
 */
export function optimizeSheetCut(input: OptimizeSheetCutInput): OptimizeSheetCutOutput {
  const { sheetWidthMm, sheetHeightMm, kerfMm } = input

  const pieces = expandPieces(input.items)
  if (pieces.length === 0) {
    throw new Error('sheet_cut_no_pieces')
  }

  for (const piece of pieces) {
    if (!pieceFitsSheet(piece, sheetWidthMm, sheetHeightMm, kerfMm)) {
      throw new Error('sheet_cut_piece_does_not_fit')
    }
  }

  const useReducedCandidates = pieces.length > LARGE_INPUT_PIECE_THRESHOLD
  const sortStrategies = useReducedCandidates ? REDUCED_SORT_STRATEGIES : SORT_STRATEGY_NAMES
  const heuristics = useReducedCandidates ? REDUCED_HEURISTICS : HEURISTICS

  let bestSheets: WorkingSheet[] | null = null
  let bestScore: LayoutScore | null = null

  for (const sortStrategy of sortStrategies) {
    const ordered = sortPieces(pieces, sortStrategy)
    for (const heuristic of heuristics) {
      const sheets = packAllPieces(ordered, sheetWidthMm, sheetHeightMm, kerfMm, heuristic)
      const score = scoreLayout(sheets)
      if (!bestScore || compareLayoutScores(score, bestScore) < 0) {
        bestScore = score
        bestSheets = sheets
      }
    }
  }

  if (!bestSheets) {
    throw new Error('sheet_cut_no_capacity')
  }

  const piecesByInstanceId = new Map(pieces.map((piece) => [piece.instanceId, piece]))
  const improvedSheets = tryEliminateLeastUsedSheets(bestSheets, piecesByInstanceId, kerfMm)
  const finalSheets = improvedSheets.length < bestSheets.length ? improvedSheets : bestSheets

  const output = buildOutput(finalSheets, input, pieces.length)

  const validation = validateSheetCutResult(input, output)
  if (!validation.isValid) {
    console.error('Resultado do corte de chapas reprovado na validação:', validation.errors)
    throw new Error('invalid_sheet_cutting_result')
  }

  return output
}
