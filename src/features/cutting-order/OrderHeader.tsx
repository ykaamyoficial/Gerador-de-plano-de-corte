import { FileText, Ruler } from 'lucide-react'
import { Button } from '../../components/ui/Button'

interface OrderHeaderProps {
  orderName: string
  onOrderNameChange: (value: string) => void
  canGenerateReport: boolean
  onGenerateReport: () => void
}

export function OrderHeader({ orderName, onOrderNameChange, canGenerateReport, onGenerateReport }: OrderHeaderProps) {
  return (
    <>
      <header className="app-header">
        <div className="app-header__title-group">
          <span className="app-header__icon" aria-hidden="true">
            <Ruler size={22} />
          </span>
          <div>
            <h1>Plano de Corte</h1>
            <p className="app-header__subtitle">
              Crie planos de corte rápidos, organizados e fáceis de executar.
            </p>
          </div>
        </div>

        {canGenerateReport && (
          <Button variant="primary" icon={<FileText size={18} />} onClick={onGenerateReport}>
            Gerar relatório
          </Button>
        )}
      </header>

      <div className="card order-card">
        <p className="order-card__eyebrow">Ordem de corte</p>
        <label className="field" htmlFor="order-name">
          <span className="field__label">Nome da ordem</span>
          <div className="form-control-wrapper">
            <input
              id="order-name"
              type="text"
              className="form-control"
              placeholder="Ex.: Estrutura Torre 01"
              value={orderName}
              onChange={(event) => onOrderNameChange(event.target.value)}
            />
          </div>
        </label>
        <p className="order-card__hint">Use um nome para identificar este relatório.</p>
      </div>
    </>
  )
}
