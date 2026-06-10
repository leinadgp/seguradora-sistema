export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-cyber-cyan/5 border border-cyber-cyan/20 flex items-center justify-center text-cyber-cyan mb-4 glow-cyan">
        {icon}
      </div>
      <h3 className="text-sm font-display font-bold text-cyber-text mb-1.5 tracking-wide uppercase">{title}</h3>
      <p className="text-sm text-cyber-muted max-w-xs mb-5 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
