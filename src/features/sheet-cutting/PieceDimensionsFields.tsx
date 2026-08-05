import { NumberField } from '../../components/ui/NumberField'

interface PieceDimensionsFieldsProps {
  widthMm: number | null
  lengthMm: number | null
  onWidthChange: (value: number | null) => void
  onLengthChange: (value: number | null) => void
  widthError?: string | null
  lengthError?: string | null
}

export function PieceDimensionsFields({
  widthMm,
  lengthMm,
  onWidthChange,
  onLengthChange,
  widthError,
  lengthError,
}: PieceDimensionsFieldsProps) {
  return (
    <div className="dimension-pair">
      <NumberField label="Largura da peça" unit="mm" min={1} value={widthMm} onChange={onWidthChange} error={widthError} />
      <NumberField
        label="Comprimento da peça"
        unit="mm"
        min={1}
        value={lengthMm}
        onChange={onLengthChange}
        error={lengthError}
      />
    </div>
  )
}
