import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: 'default' | 'danger'
}

export function IconButton({ icon, label, variant = 'default', className, type = 'button', ...rest }: IconButtonProps) {
  const classes = ['icon-button', variant === 'danger' ? 'icon-button--danger' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} aria-label={label} title={label} {...rest}>
      {icon}
    </button>
  )
}
