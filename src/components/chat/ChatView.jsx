import { useEffect, useRef, useCallback } from 'react'
import { Users, User } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[10px] text-cyber-muted px-2 shrink-0">{date}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

function formatDateLabel(ts) {
  const date = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today - msgDate) / 86400000)
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function groupByDate(mensagens) {
  const groups = []
  let lastDate = null
  for (const m of mensagens) {
    const label = formatDateLabel(m.messageTimestamp)
    if (label !== lastDate) {
      groups.push({ type: 'divider', label })
      lastDate = label
    }
    groups.push({ type: 'msg', data: m })
  }
  return groups
}

export default function ChatView({ conversa, mensagens, loadingMensagens, sending, onSend, onTyping, onDownload }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  const handleSend = useCallback(async (text) => {
    await onSend(conversa.id, text)
  }, [conversa, onSend])

  const handleTyping = useCallback(() => {
    onTyping?.(conversa.id)
  }, [conversa, onTyping])

  if (!conversa) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #0891b2, #2563eb)' }}>
          <Users size={28} className="text-white" />
        </div>
        <p className="text-sm font-medium text-cyber-text mb-1">Selecione uma conversa</p>
        <p className="text-xs text-cyber-muted">Escolha uma conversa na lista ao lado para começar a conversar</p>
      </div>
    )
  }

  const items = groupByDate(mensagens)

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header da conversa */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-cyber-cyan/10 bg-cyber-surface shadow-sm">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: conversa.isGroup ? 'linear-gradient(135deg, #7c3aed, #a21caf)' : 'linear-gradient(135deg, #0891b2, #2563eb)' }}>
          {conversa.isGroup
            ? <Users size={14} />
            : (conversa.name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-cyber-text truncate">
            {conversa.isGroup ? conversa.groupName || conversa.name : conversa.name || conversa.phone}
          </p>
          <p className="text-[10px] text-cyber-muted truncate">
            {conversa.isGroup ? `Grupo · ${conversa.phone || ''}` : conversa.phone}
          </p>
        </div>
        {(conversa.clienteId || conversa.leadId) && (
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
            {conversa.clienteId ? 'Cliente' : 'Lead'}
          </span>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 scrollbar-hide" style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {loadingMensagens && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loadingMensagens && mensagens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <User size={28} className="text-cyber-muted mb-2" />
            <p className="text-xs text-cyber-muted">Nenhuma mensagem ainda</p>
            <p className="text-[11px] text-cyber-muted mt-0.5">As mensagens recebidas via WhatsApp aparecerão aqui</p>
          </div>
        )}

        {items.map((item, i) => {
          if (item.type === 'divider') {
            return <DateDivider key={`divider-${i}`} date={item.label} />
          }
          return (
            <MessageBubble
              key={item.data.id}
              mensagem={item.data}
              isGroup={conversa.isGroup}
              onDownload={onDownload}
            />
          )
        })}

        {/* Indicador de digitando */}
        {sending && (
          <div className="flex justify-end mb-1">
            <div className="bg-cyber-cyan/20 rounded-2xl rounded-br-sm px-3 py-2 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} onTyping={handleTyping} disabled={sending} />
    </div>
  )
}
