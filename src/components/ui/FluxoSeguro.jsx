import { FileText, ClipboardList, Shield, FilePen, ChevronRight, Check } from 'lucide-react'

const icons = { cotacao: FileText, proposta: ClipboardList, apolice: Shield, endosso: FilePen }

const stageStyles = {
  gray:  { dot: 'bg-slate-200 text-slate-400 border-slate-200', text: 'text-cyber-muted', ring: '' },
  blue:  { dot: 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/30', text: 'text-cyber-cyan', ring: 'ring-2 ring-cyber-cyan/20' },
  green: { dot: 'bg-cyber-green/15 text-cyber-green border-cyber-green/30', text: 'text-cyber-green', ring: '' },
  red:   { dot: 'bg-cyber-red/10 text-cyber-red border-cyber-red/30', text: 'text-cyber-red', ring: '' },
}

// stages: [{ key:'cotacao', label:'Cotação', stage:'green', sub:'Aprovada', onClick? }]
export default function FluxoSeguro({ stages = [] }) {
  return (
    <div className="bg-cyber-surface/60 border border-cyber-border/60 rounded-2xl p-4">
      <p className="hud-label mb-3">Fluxo do Seguro</p>
      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0">
        {stages.map((s, i) => {
          const Icon = icons[s.key] || FileText
          const st = stageStyles[s.stage] || stageStyles.gray
          const clickable = !!s.onClick
          return (
            <div key={s.key} className="flex sm:flex-1 items-center sm:flex-col sm:text-center gap-3 sm:gap-2">
              <div className="flex sm:flex-col items-center gap-3 sm:gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={s.onClick}
                  className={`relative w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all ${st.dot} ${st.ring} ${clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                  title={clickable ? `Abrir ${s.label}` : s.label}
                >
                  {s.stage === 'green' ? <Check size={17} /> : <Icon size={16} />}
                </button>
                <div className="sm:mt-0.5">
                  <p className={`text-xs font-semibold ${st.text}`}>{s.label}</p>
                  <p className="text-[10px] text-cyber-muted leading-tight">{s.sub || '—'}</p>
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className="hidden sm:flex items-center justify-center text-cyber-dim shrink-0 self-start mt-5 -mx-2">
                  <ChevronRight size={16} />
                </div>
              )}
              {i < stages.length - 1 && (
                <div className="sm:hidden w-px h-3 bg-cyber-border ml-5" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
