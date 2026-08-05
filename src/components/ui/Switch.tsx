import { motion } from 'motion/react'
import { DURATION_FAST, EASE_STANDARD } from '../../shared/motion'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
}

export function Switch({ checked, onChange, label, id }: SwitchProps) {
  return (
    <label className="switch-row" htmlFor={id}>
      <span className="switch-row__label">{label}</span>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        className={`switch${checked ? ' switch--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <motion.span className="switch__thumb" layout transition={{ duration: DURATION_FAST, ease: EASE_STANDARD }} />
      </button>
    </label>
  )
}
