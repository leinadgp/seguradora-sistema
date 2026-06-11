import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Target, Shield, FileText, ClipboardList,
  Building2, DollarSign, AlertTriangle, Folder, CheckSquare,
  RefreshCw, BarChart2, UserCog, Settings, X, ShieldCheck, FilePen, Headphones, Briefcase, MessageSquare
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const perfilNomes = { admin: 'Administrador', gestor: 'Gestor', corretor: 'Corretor', financeiro: 'Financeiro', atendimento: 'Atendimento' }

function initials(nome) {
  if (!nome) return '?'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const groups = [
  {
    id: 'principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    id: 'vendas',
    label: 'Clientes & Vendas',
    items: [
      { to: '/clientes',  icon: Users,          label: 'Clientes' },
      { to: '/leads',     icon: Target,          label: 'Leads' },
      { to: '/cotacoes',  icon: FileText,        label: 'Cotações' },
      { to: '/propostas', icon: ClipboardList,   label: 'Propostas' },
    ],
  },
  {
    id: 'carteira',
    label: 'Carteira',
    items: [
      { to: '/apolices',    icon: FileText,   label: 'Apólices' },
      { to: '/seguros',     icon: Shield,     label: 'Produtos / Catálogo' },
      { to: '/seguradoras', icon: Building2,  label: 'Seguradoras' },
      { to: '/corretoras',  icon: Briefcase,  label: 'Corretoras' },
      { to: '/renovacoes',  icon: RefreshCw,  label: 'Renovações' },
      { to: '/endossos',    icon: FilePen,    label: 'Endossos' },
    ],
  },
  {
    id: 'operacoes',
    label: 'Operações',
    items: [
      { to: '/comissoes',  icon: DollarSign,     label: 'Comissões' },
      { to: '/sinistros',    icon: AlertTriangle, label: 'Sinistros' },
      { to: '/assistencias', icon: Headphones,   label: 'Assistências' },
      { to: '/documentos',   icon: Folder,       label: 'Documentos' },
      { to: '/modelos',      icon: MessageSquare, label: 'Modelos' },
    ],
  },
  {
    id: 'gestao',
    label: 'Gestão',
    items: [
      { to: '/tarefas',       icon: CheckSquare, label: 'Tarefas' },
      { to: '/relatorios',    icon: BarChart2,   label: 'Relatórios' },
      { to: '/produtores',    icon: UserCog,     label: 'Produtores' },
      { to: '/configuracoes', icon: Settings,    label: 'Configurações' },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const displayName = user?.nome || user?.email?.split('@')[0] || '...'
  const cargoLabel = user?.cargo || perfilNomes[user?.perfil] || 'Usuário'
  const avatarInitials = initials(displayName)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-60 z-40 flex flex-col
        bg-cyber-surface border-r border-cyber-cyan/10
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex shrink-0
      `}>
        {/* Logo */}
        <div className="relative flex items-center justify-between px-4 py-4 border-b border-cyber-cyan/10">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 glow-cyan"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display text-xs font-bold text-cyber-text leading-none tracking-wide">
                SEGURO<span className="neon-text-cyan">CTRL</span>
              </p>
              <p className="text-[9px] text-cyber-muted mt-0.5 tracking-widest uppercase">Sistema v2.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-cyber-cyan/10 transition-colors text-cyber-muted hover:text-cyber-cyan cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto py-4 px-3 scrollbar-hide space-y-5">
          {groups.map(group => (
            <div key={group.id}>
              {group.label && (
                <p className="hud-label px-3 mb-2">{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {group.items.map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20'
                            : 'text-cyber-muted hover:text-cyber-text hover:bg-slate-100'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyber-cyan rounded-r-full glow-cyan" />
                          )}
                          <item.icon
                            size={15}
                            className={isActive ? 'text-cyber-cyan shrink-0' : 'shrink-0'}
                          />
                          <span className={isActive ? 'neon-text-cyan font-semibold' : ''}>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="relative px-3 py-3 border-t border-cyber-cyan/10">
          <NavLink to="/meu-perfil" onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 glow-cyan"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
              {avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-cyber-text truncate leading-none">{displayName}</p>
              <p className="text-[10px] text-cyber-muted mt-0.5 truncate tracking-wide">{cargoLabel}</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse-glow shrink-0" />
          </NavLink>
        </div>
      </aside>
    </>
  )
}
