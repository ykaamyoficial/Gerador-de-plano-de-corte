import { Printer, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { Modal } from '../../components/ui/Modal'
import type { SheetCuttingOrder } from '../../domain/sheet-cutting/types'
import { SheetCuttingReport } from './SheetCuttingReport'

interface SheetCuttingReportModalProps {
  open: boolean
  order: SheetCuttingOrder
  onClose: () => void
}

export function SheetCuttingReportModal({ open, order, onClose }: SheetCuttingReportModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="sheet-cutting-report-title" variant="sheet">
      <div className="report-modal">
        <div className="report-modal__toolbar no-print">
          <h2 id="sheet-cutting-report-title" className="report-modal__toolbar-title">
            Relatório de corte de chapas
          </h2>
          <div className="report-modal__toolbar-actions">
            <Button variant="primary" icon={<Printer size={16} />} onClick={() => window.print()}>
              Imprimir / Salvar PDF
            </Button>
            <IconButton icon={<X size={18} />} label="Fechar relatório" onClick={onClose} />
          </div>
        </div>
        <div className="report-modal__scroll-area">
          <SheetCuttingReport order={order} />
        </div>
      </div>
    </Modal>
  )
}
