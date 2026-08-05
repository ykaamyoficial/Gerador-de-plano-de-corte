import { NumberField } from '../../components/ui/NumberField'

interface SheetDimensionsFieldsProps {
  widthMm: number | null
  lengthMm: number | null
  onWidthChange: (value: number | null) => void
  onLengthChange: (value: number | null) => void
  widthError?: string | null
  lengthError?: string | null
}

export function SheetDimensionsFields({
  widthMm,
  lengthMm,
  onWidthChange,
  onLengthChange,
  widthError,
  lengthError,
}: SheetDimensionsFieldsProps) {
  return (
    <div className="dimension-pair">
      <NumberField
        label="Largura da chapa inteira"
        unit="mm"
        min={1}
        value={widthMm}
        onChange={onWidthChange}
        error={widthError}
      />
      <NumberField
        label="Comprimento da chapa inteira"
        unit="mm"
        min={1}
        value={lengthMm}
        onChange={onLengthChange}
        error={lengthError}
      />
    </div>
  )
}
