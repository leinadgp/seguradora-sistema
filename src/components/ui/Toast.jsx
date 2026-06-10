import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const config = {
  success: { Icon: CheckCircle, iconCls: 'text-cyber-green',  borderCls: 'border-l-cyber-green'  },
  error:   { Icon: XCircle,     iconCls: 'text-cyber-red',    borderCls: 'border-l-cyber-red'    },
  warning: { Icon: AlertCircle, iconCls: 'text-cyber-amber',  borderCls: 'border-l-cyber-amber'  },
  info:    { Icon: Info,        iconCls: 'text-cyber-cyan',   borderCls: 'border-l-cyber-cyan'   },
}

export default function ToastContainer() {
  const { toasts, removeToast } = useApp()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(toast => {
        const { Icon, iconCls, borderCls } = config[toast.type] || config.info
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 glass border-l-4 ${borderCls} rounded-xl px-4 py-3 shadow-toast animate-slide-in-right`}
          >
            <Icon size={15} className={`${iconCls} shrink-0 mt-0.5`} />
            <span className="text-sm text-cyber-text flex-1 leading-relaxed">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-cyber-dim hover:text-cyber-text transition-colors cursor-pointer shrink-0 mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
