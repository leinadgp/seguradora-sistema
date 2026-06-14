import { useEffect } from 'react'
import { X } from 'lucide-react'

const sizes = {
  sm:   'max-w-md',
  md:   'max-w-2xl',
  lg:   'max-w-4xl',
  xl:   'max-w-6xl',
  full: 'max-w-[95vw]',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer, layer = 50 }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" style={{ zIndex: layer }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass border border-cyber-cyan/10 rounded-t-2xl sm:rounded-2xl shadow-modal w-full ${sizes[size]} max-h-[95vh] flex flex-col animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-cyan/10 shrink-0">
          <h2 className="text-sm font-display font-bold text-cyber-text tracking-wide uppercase">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-cyber-cyan/10 active:bg-cyber-cyan/20 transition-colors text-cyber-muted hover:text-cyber-cyan cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-cyber-cyan/10 bg-cyber-surface/50 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
