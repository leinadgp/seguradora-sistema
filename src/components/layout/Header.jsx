import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, Zap, User, Settings, ChevronRight, AlertCircle, Clock, FileText, X } from 'lucide-react'
import useResource from '../../hooks/useResource'
import { useAuth } from '../../context/AuthContext'

const titles = {
  '/dashboard':     'Dashboard',
  '/clientes':      'Clientes',
  '/cotacoes':      'Cotações',
  '/leads':         'Leads',
  '/seguros':       'Produtos',
  '/apolices':      'Apólices',
  '/propostas':     'Propostas',
  '/seguradoras':   'Seguradoras',
  '/corretoras':    'Corretoras',
  '/comissoes':     'Comissões',
  '/sinistros':     'Sinistros',
  '/documentos':    'Documentos',
  '/tarefas':       'Tarefas',
  '/renovacoes':    'Renovações',
  '/relatorios':    'Relatórios',
  '/produtores':    'Produtores',
  '/equipe':        'Produtores',
  '/meu-perfil':    'Meu Perfil',
  '/configuracoes': 'Configurações',
}

const urgenciaIcon = {
  alta:  <AlertCircle size={13} className="text-cyber-red shrink-0" />,
  media: <Clock size={13} className="text-cyber-amber shrink-0" />,
  baixa: <FileText size={13} className="text-cyber-muted shrink-0" />,
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    function listener(e) {
      if (!ref.current || ref.current.contains(e.target)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

function initials(nome) {
  if (!nome) return '??'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = titles[pathname] || 'SeguroControl'

  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [lidas, setLidas] = useState(new Set())

  const { user, logout } = useAuth()
  const { data: alertas } = useResource('alertas')

  const displayName = user?.nome || user?.email?.split('@')[0] || 'Usuário'
  const avatarInitials = initials(displayName)

  const notifsRef = useRef(null)
  const profileRef = useRef(null)

  useClickOutside(notifsRef, () => setShowNotifs(false))
  useClickOutside(profileRef, () => setShowProfile(false))

  const unread = alertas.filter(a => !lidas.has(a.id)).length

  function marcarTodasLidas() {
    setLidas(new Set(alertas.map(a => a.id)))
  }

  function handleNotifClick(alerta) {
    setLidas(prev => new Set([...prev, alerta.id]))
    if (alerta.link) {
      navigate(alerta.link)
      setShowNotifs(false)
    }
  }

  return (
    <header className="h-14 bg-cyber-surface/80 backdrop-blur-md border-b border-cyber-cyan/10 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-cyber-cyan/10 active:bg-cyber-cyan/20 transition-colors text-cyber-muted hover:text-cyber-cyan cursor-pointer"
        >
          <Menu size={19} />
        </button>
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-cyber-cyan shrink-0" />
          <h1 className="text-sm font-display font-bold text-cyber-text tracking-wide">{title.toUpperCase()}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-cyber-card border border-cyber-border/60 rounded-lg text-cyber-muted hover:border-cyber-cyan/30 hover:bg-cyber-card/80 transition-all duration-150 cursor-text w-52 group">
          <Search size={12} className="shrink-0 group-hover:text-cyber-cyan transition-colors" />
          <span className="text-sm text-cyber-muted select-none flex-1">Buscar...</span>
          <kbd className="text-[10px] bg-cyber-surface border border-cyber-border rounded px-1 text-cyber-dim font-mono">⌘K</kbd>
        </div>

        {/* Notificações */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => { setShowNotifs(v => !v); setShowProfile(false) }}
            className="relative p-2 rounded-xl hover:bg-cyber-cyan/10 active:bg-cyber-cyan/20 transition-colors text-cyber-muted hover:text-cyber-cyan cursor-pointer"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-cyber-red rounded-full text-white text-[9px] font-bold flex items-center justify-center glow-red">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-cyber-card border border-cyber-cyan/15 rounded-2xl shadow-modal overflow-hidden z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-cyan/10">
                <span className="text-sm font-semibold text-cyber-text">Notificações</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={marcarTodasLidas} className="text-[10px] text-cyber-cyan hover:underline cursor-pointer">
                      Marcar todas como lidas
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="p-1 rounded-lg hover:bg-cyber-cyan/10 text-cyber-muted cursor-pointer">
                    <X size={13} />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-cyber-cyan/5">
                {alertas.length === 0 ? (
                  <div className="py-8 text-center text-sm text-cyber-muted">Sem notificações</div>
                ) : alertas.map(alerta => (
                  <button
                    key={alerta.id}
                    onClick={() => handleNotifClick(alerta)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-cyber-cyan/5 transition-colors cursor-pointer ${!lidas.has(alerta.id) ? 'bg-cyber-cyan/[0.02]' : ''}`}
                  >
                    {urgenciaIcon[alerta.urgencia] || urgenciaIcon.baixa}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-cyber-text leading-relaxed">{alerta.mensagem}</p>
                    </div>
                    {!lidas.has(alerta.id) && (
                      <span className="w-2 h-2 rounded-full bg-cyber-cyan shrink-0 mt-1" />
                    )}
                  </button>
                ))}
              </div>

              <div className="px-4 py-2.5 border-t border-cyber-cyan/10">
                <button
                  onClick={() => { navigate('/tarefas'); setShowNotifs(false) }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-cyber-cyan hover:text-cyber-cyan/80 transition-colors cursor-pointer"
                >
                  Ver todas as tarefas <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotifs(false) }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-90 active:scale-95 transition-all select-none glow-cyan"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
          >
            {avatarInitials}
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-cyber-card border border-cyber-cyan/15 rounded-2xl shadow-modal overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-4 border-b border-cyber-cyan/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
                    {avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cyber-text truncate">{displayName}</p>
                    <p className="text-xs text-cyber-muted truncate">{user?.email || ''}</p>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { navigate('/meu-perfil'); setShowProfile(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cyber-text hover:bg-cyber-cyan/5 transition-colors cursor-pointer"
                >
                  <User size={15} className="text-cyber-muted" />
                  Meu Perfil
                </button>
                <button
                  onClick={() => { navigate('/configuracoes'); setShowProfile(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cyber-text hover:bg-cyber-cyan/5 transition-colors cursor-pointer"
                >
                  <Settings size={15} className="text-cyber-muted" />
                  {(user?.perfil === 'admin' || user?.perfil === 'gestor') ? 'Configurações & Usuários' : 'Configurações'}
                </button>
              </div>

              <div className="border-t border-cyber-cyan/10 py-1">
                <button
                  onClick={() => { logout(); navigate('/login', { replace: true }) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cyber-red hover:bg-cyber-red/5 transition-colors cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
