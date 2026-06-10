import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, CheckSquare, BarChart2 } from 'lucide-react'

const nav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Início' },
  { to: '/clientes',   icon: Users,           label: 'Clientes' },
  { to: '/apolices',   icon: FileText,        label: 'Apólices' },
  { to: '/tarefas',    icon: CheckSquare,     label: 'Tarefas' },
  { to: '/relatorios', icon: BarChart2,       label: 'Relatórios' },
]

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-cyber-surface/90 backdrop-blur-md border-t border-cyber-cyan/10 z-30 safe-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                isActive ? 'text-cyber-cyan' : 'text-cyber-muted hover:text-cyber-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-9 h-7 flex items-center justify-center rounded-lg transition-all ${isActive ? 'bg-cyber-cyan/10 glow-cyan' : ''}`}>
                  <item.icon size={18} />
                </div>
                <span className={`text-[9px] font-semibold tracking-wide uppercase ${isActive ? 'neon-text-cyan' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
