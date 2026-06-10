import { Loader2 } from 'lucide-react'

const variants = {
  primary:   'bg-gradient-cyber text-white shadow-sm focus:ring-cyber-cyan/30 hover:opacity-90 active:scale-[0.98]',
  secondary: 'bg-cyber-card hover:bg-slate-100 text-cyber-text border border-cyber-border hover:border-cyber-cyan/30 shadow-sm focus:ring-cyber-cyan/20',
  danger:    'bg-cyber-red/10 hover:bg-cyber-red/20 text-cyber-red border border-cyber-red/30 shadow-sm focus:ring-cyber-red/30',
  ghost:     'hover:bg-slate-100 text-cyber-muted hover:text-cyber-text focus:ring-cyber-cyan/20',
  success:   'bg-cyber-green/10 hover:bg-cyber-green/20 text-cyber-green border border-cyber-green/30 shadow-sm focus:ring-cyber-green/30',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1 rounded-md',
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
}

const iconSizes = { xs: 12, sm: 14, md: 15, lg: 16 }

export default function Button({
  children, variant = 'primary', size = 'md', icon, onClick,
  disabled, type = 'button', className = '', loading = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none
        disabled:opacity-40 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-cyber-bg
        ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading
        ? <Loader2 size={iconSizes[size]} className="animate-spin" />
        : <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
          </>
      }
    </button>
  )
}
