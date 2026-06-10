import { Clock } from 'lucide-react'
import { fmtDateTime } from '../../lib/flow'

// events: [{ id, action, description, created_at, created_by }]
export default function Timeline({ events = [] }) {
  const ordered = [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (ordered.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-cyber-muted">
        <Clock size={20} className="mx-auto mb-2 opacity-50" />
        Nenhum evento registrado ainda.
      </div>
    )
  }

  return (
    <div className="relative pl-5">
      <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-cyber-border" />
      <div className="space-y-4">
        {ordered.map(ev => (
          <div key={ev.id} className="relative">
            <div className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full bg-cyber-cyan/20 border-2 border-cyber-cyan" />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-sm font-semibold text-cyber-text">{ev.action}</p>
              <span className="text-[11px] text-cyber-muted">{fmtDateTime(ev.created_at)}</span>
            </div>
            {ev.description && <p className="text-xs text-cyber-muted mt-0.5">{ev.description}</p>}
            {ev.created_by && <p className="text-[10px] text-cyber-dim mt-0.5">por {ev.created_by}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
