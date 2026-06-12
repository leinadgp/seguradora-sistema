import { Search, Users, User } from 'lucide-react'
import { useState } from 'react'

function formatTimestamp(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' })
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function Avatar({ name, image, isGroup, size = 40 }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${isGroup ? 'bg-purple-600' : 'bg-cyber-cyan/80'}`}
    >
      {isGroup ? <Users size={16} /> : initials}
    </div>
  )
}

export default function ConversasList({ conversas, conversaAtiva, onSelect, loading }) {
  const [search, setSearch] = useState('')

  const filtradas = conversas.filter(c => {
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.lastMessage?.toLowerCase().includes(q) ||
      c.groupName?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col h-full border-r border-cyber-cyan/10 bg-cyber-surface">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyber-cyan/10">
        <h2 className="text-sm font-semibold text-cyber-text mb-2">Conversas</h2>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-100 border border-cyber-cyan/10 rounded-lg text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan/40"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && filtradas.length === 0 && (
          <div className="text-center py-12 px-4">
            <User size={32} className="mx-auto text-cyber-muted mb-2" />
            <p className="text-xs text-cyber-muted">
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
          </div>
        )}

        {filtradas.map(c => {
          const ativa = conversaAtiva?.id === c.id
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={`w-full flex items-start gap-3 px-4 py-3 border-b border-cyber-cyan/5 hover:bg-slate-50 transition-colors text-left ${ativa ? 'bg-cyber-cyan/5 border-l-2 border-l-cyber-cyan' : ''}`}
            >
              <div className="relative shrink-0 mt-0.5">
                <Avatar name={c.name} image={c.image || c.imagePreview} isGroup={c.isGroup} size={40} />
                {c.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-cyber-cyan text-white text-[10px] font-bold flex items-center justify-center">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-medium truncate ${ativa ? 'text-cyber-cyan' : 'text-cyber-text'}`}>
                    {c.isGroup ? c.groupName || c.name : c.name || c.phone}
                  </span>
                  <span className="text-[10px] text-cyber-muted shrink-0 ml-1">
                    {formatTimestamp(c.lastMessageTimestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {c.isGroup && (
                    <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 rounded font-medium shrink-0">Grupo</span>
                  )}
                  {(c.clienteId || c.leadId) && (
                    <span className="text-[9px] bg-green-100 text-green-600 px-1.5 rounded font-medium shrink-0">
                      {c.clienteId ? 'Cliente' : 'Lead'}
                    </span>
                  )}
                  <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-cyber-text font-medium' : 'text-cyber-muted'}`}>
                    {c.lastMessage || '...'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
