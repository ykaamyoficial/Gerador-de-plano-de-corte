import { motion } from 'motion/react'
import { DURATION_NORMAL, EASE_EMPHASIZED } from '../../shared/motion'

interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: SegmentedControlOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
}

export function SegmentedControl<T extends string>({ value, options, onChange, ariaLabel }: SegmentedControlProps<T>) {
  return (
    <div className="segmented-control" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`segmented-control__option${isActive ? ' segmented-control__option--active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {isActive && (
              <motion.span
                layoutId="segmented-control-indicator"
                className="segmented-control__indicator"
                transition={{ duration: DURATION_NORMAL, ease: EASE_EMPHASIZED }}
              />
            )}
            <span className="segmented-control__label">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
