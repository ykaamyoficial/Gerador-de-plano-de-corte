import { AlertCircle, AlertTriangle } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface AlertProps {
  tone: 'warning' | 'danger'
  children: ReactNode
}

export function Alert({ tone, children }: AlertProps) {
  const Icon = tone === 'danger' ? AlertCircle : AlertTriangle

  return (
    <motion.div
      className={`alert alert--${tone}`}
      role={tone === 'danger' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Icon size={16} aria-hidden="true" className="alert__icon" />
      <span>{children}</span>
    </motion.div>
  )
}
