import { formatMm } from '../../shared/formatters/formatMm'
import { formatAreaM2, formatPercentage } from '../../shared/formatters/formatArea'
import type { SheetCuttingResult as SheetCuttingResultData } from '../../domain/sheet-cutting/types'
import { SheetLayoutView } from './SheetLayoutView'

interface SheetCuttingResultProps {
  materialName: string
  result: SheetCuttingResultData
}

const ORIENTATION_LABEL: Record<SheetCuttingResultData['orientation'], string> = {
  normal: 'normal',
  rotated: 'girada 90°',
}

export function SheetCuttingResult({ materialName, result }: SheetCuttingResultProps) {
  const fullSheetsCount = result.layouts.filter((layout) => layout.isFull).length
  const partialSheet = result.layouts.find((layout) => !layout.isFull) ?? null
  const representativeFullLayout = result.layouts.find((layout) => layout.isFull) ?? null

  return (
    <div className="plan-result">
      <p className="plan-result__title">{materialName || 'Material sem nome'}</p>

      <div className="result-summary">
        <div className="result-summary__stat result-summary__stat--primary">
          <span className="result-number">{result.requiredSheetCount}</span>
          <span className="result-summary__label">Chapas inteiras necessárias</span>
        </div>
        <div className="result-summary__stat">
          <span className="result-summary__value">{result.piecesPerFullSheet}</span>
          <span className="result-summary__label">Peças por chapa completa</span>
        </div>
        <div className="result-summary__stat">
          <span className="result-summary__value">{result.requestedQuantity}</span>
          <span className="result-summary__label">Peças solicitadas</span>
        </div>
      </div>

      <div className="sheet-result-meta">
        <p>
          Tamanho da chapa: <strong>{formatMm(result.sheetWidthMm)} × {formatMm(result.sheetLengthMm)}</strong>
        </p>
        <p>
          Tamanho de cada peça: <strong>{formatMm(result.originalPieceWidthMm)} × {formatMm(result.originalPieceLengthMm)}</strong>
        </p>
        <p>
          Distribuição: <strong>{result.columns} colunas × {result.rows} linhas</strong>
        </p>
        <p>
          Orientação: <strong>{ORIENTATION_LABEL[result.orientation]}</strong>
        </p>
        {partialSheet && (
          <p>
            Última chapa: <strong>{partialSheet.placedPieceCount} peças</strong>
          </p>
        )}
      </div>

      <div className="plan-section">
        <p className="plan-section__title">Área e aproveitamento</p>
        <div className="area-grid">
          <div className="area-grid__item">
            <span className="area-grid__label">Área de cada chapa</span>
            <span className="area-grid__value">{formatAreaM2(result.sheetAreaM2)}</span>
          </div>
          <div className="area-grid__item">
            <span className="area-grid__label">Área de cada peça</span>
            <span className="area-grid__value">{formatAreaM2(result.pieceAreaM2)}</span>
          </div>
          <div className="area-grid__item">
            <span className="area-grid__label">Área total das peças</span>
            <span className="area-grid__value">{formatAreaM2(result.requestedAreaM2)}</span>
          </div>
          <div className="area-grid__item">
            <span className="area-grid__label">Área total das chapas utilizadas</span>
            <span className="area-grid__value">{formatAreaM2(result.purchasedAreaM2)}</span>
          </div>
          <div className="area-grid__item">
            <span className="area-grid__label">Aproveitamento da área</span>
            <span className="area-grid__value">{formatPercentage(result.utilizationPercentage)}</span>
          </div>
        </div>
      </div>

      <div className="plan-result__bars">
        {representativeFullLayout && (
          <div className="sheet-layout-card">
            <div className="sheet-layout-card__header">
              <span className="sheet-layout-card__title">
                {fullSheetsCount > 1 ? `CHAPAS 1 A ${fullSheetsCount}` : 'CHAPA 01'}
              </span>
              <span className="sheet-layout-card__count">{result.piecesPerFullSheet} peças por chapa</span>
            </div>
            {fullSheetsCount > 1 && (
              <p className="sheet-layout-card__note">
                Todas as chapas completas seguem exatamente esta mesma distribuição.
              </p>
            )}
            <SheetLayoutView
              sheetWidthMm={result.sheetWidthMm}
              sheetLengthMm={result.sheetLengthMm}
              placedPieceWidthMm={result.placedPieceWidthMm}
              placedPieceLengthMm={result.placedPieceLengthMm}
              kerfMm={result.kerfMm}
              columns={result.columns}
              rows={result.rows}
              placements={representativeFullLayout.placements}
              ariaLabel={`Desenho das chapas completas: ${result.columns} colunas por ${result.rows} linhas`}
            />
          </div>
        )}

        {partialSheet && (
          <div className="sheet-layout-card">
            <div className="sheet-layout-card__header">
              <span className="sheet-layout-card__title">CHAPA {String(partialSheet.sheetNumber).padStart(2, '0')} — PARCIAL</span>
              <span className="sheet-layout-card__count">{partialSheet.placedPieceCount} peças</span>
            </div>
            <SheetLayoutView
              sheetWidthMm={result.sheetWidthMm}
              sheetLengthMm={result.sheetLengthMm}
              placedPieceWidthMm={result.placedPieceWidthMm}
              placedPieceLengthMm={result.placedPieceLengthMm}
              kerfMm={result.kerfMm}
              columns={result.columns}
              rows={result.rows}
              placements={partialSheet.placements}
              ariaLabel={`Desenho da última chapa, parcial, com ${partialSheet.placedPieceCount} peças`}
            />
          </div>
        )}
      </div>
    </div>
  )
}
