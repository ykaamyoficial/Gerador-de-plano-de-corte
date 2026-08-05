import { Printer, X } from 'lucide-react'
import { IconButton } from '../../components/ui/IconButton'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import type { CuttingOrder } from '../../domain/cutting/types'
import { CuttingReport } from './CuttingReport'

interface CuttingReportModalProps {
  open: boolean
  order: CuttingOrder
  onClose: () => void
}

export function CuttingReportModal({ open, order, onClose }: CuttingReportModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="cutting-report-title" variant="sheet">
      <div className="report-modal">
        <div className="report-modal__toolbar no-print">
          <h2 id="cutting-report-title" className="report-modal__toolbar-title">
            Relatório de corte
          </h2>
          <div className="report-modal__toolbar-actions">
            <Button variant="primary" icon={<Printer size={16} />} onClick={() => window.print()}>
              Imprimir / Salvar PDF
            </Button>
            <IconButton icon={<X size={18} />} label="Fechar relatório" onClick={onClose} />
          </div>
        </div>
        <div className="report-modal__scroll-area">
          <CuttingReport order={order} />
        </div>
      </div>
    </Modal>
  )
}
