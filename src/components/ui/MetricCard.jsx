import { TrendingUp, TrendingDown } from 'lucide-react'

const iconConfig = {
  blue:   { grad: 'linear-gradient(135deg,#06b6d4,#8b5cf6)', glow: 'glow-cyan'   },
  green:  { grad: 'linear-gradient(135deg,#22c55e,#06b6d4)', glow: 'glow-green'  },
  yellow: { grad: 'linear-gradient(135deg,#f59e0b,#ec4899)', glow: 'glow-amber'  },
  red:    { grad: 'linear-gradient(135deg,#ef4444,#f59e0b)', glow: 'glow-red'    },
  purple: { grad: 'linear-gradient(135deg,#8b5cf6,#ec4899)', glow: 'glow-purple' },
  orange: { grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', glow: 'glow-amber'  },
}

const valueColor = {
  blue:   'text-cyber-cyan',
  green:  'text-cyber-green',
  yellow: 'text-cyber-amber',
  red:    'text-cyber-red',
  purple: 'text-cyber-purple',
  orange: 'text-cyber-amber',
}

export default function MetricCard({ title, value, icon, trend, trendLabel, color = 'blue', subtitle }) {
  const cfg = iconConfig[color] || iconConfig.blue

  return (
    <div className="glass glass-hover rounded-2xl p-5 cursor-default group relative overflow-hidden">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none"
        style={{ background: cfg.grad, borderRadius: '0 1rem 0 100%' }} />

      <div className="flex items-start justify-between mb-4">
        <p className="hud-label leading-snug pr-2">{title}</p>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white ${cfg.glow}`}
          style={{ background: cfg.grad }}
        >
          {icon}
        </div>
      </div>

      <p className={`text-2xl font-data font-bold tracking-tight mb-1 tabular-nums ${valueColor[color]}`}>
        {value}
      </p>

      {subtitle && <p className="text-xs text-cyber-muted leading-relaxed">{subtitle}</p>}

      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span>{Math.abs(trend)}% {trendLabel}</span>
        </div>
      )}
    </div>
  )
}
