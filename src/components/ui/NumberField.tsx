import { AlertCircle } from 'lucide-react'
import { forwardRef } from 'react'

interface NumberFieldProps {
  label?: string
  value: number | null
  onChange: (value: number | null) => void
  unit?: string
  error?: string | null
  placeholder?: string
  min?: number
  ariaLabel?: string
  id?: string
}

function parseNumberInput(raw: string): number | null {
  if (raw.trim() === '') return null
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? null : parsed
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { label, value, onChange, unit, error, placeholder, min, ariaLabel, id },
  ref,
) {
  const input = (
    <div className={`form-control-wrapper${unit ? ' form-control-wrapper--unit' : ''}${error ? ' form-control-wrapper--error' : ''}`}>
      <input
        ref={ref}
        id={id}
        type="number"
        inputMode="numeric"
        step={1}
        min={min}
        value={value ?? ''}
        placeholder={placeholder}
        aria-label={ariaLabel ?? label}
        aria-invalid={error ? 'true' : undefined}
        className="form-control"
        onChange={(event) => onChange(parseNumberInput(event.target.value))}
      />
      {unit && <span className="form-control-unit">{unit}</span>}
    </div>
  )

  const errorMessage = error && (
    <p className="field-error">
      <AlertCircle size={13} aria-hidden="true" />
      <span>{error}</span>
    </p>
  )

  if (!label) {
    return (
      <div className="field">
        {input}
        {errorMessage}
      </div>
    )
  }

  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">{label}</span>
      {input}
      {errorMessage}
    </label>
  )
})
