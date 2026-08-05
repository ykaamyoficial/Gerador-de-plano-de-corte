import type { CalculationStatus } from '../../domain/cutting/types'

interface StatusChipProps {
  status: CalculationStatus
}

const STATUS_CONFIG: Record<CalculationStatus, { label: string; tone: 'neutral' | 'warning' | 'success' | 'danger' }> = {
  not_calculated: { label: 'Não calculado', tone: 'neutral' },
  changed: { label: 'Alterado', tone: 'warning' },
  calculated: { label: 'Calculado', tone: 'success' },
  error: { label: 'Erro', tone: 'danger' },
}

export function StatusChip({ status }: StatusChipProps) {
  const config = STATUS_CONFIG[status]
  return <span className={`status-chip status-chip--${config.tone}`}>{config.label}</span>
}
