import MediaMessage from './MediaMessage'
import { Link } from 'lucide-react'

function formatHora(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Mensagem de texto com link preview (ExtendedTextMessage)
function TextContent({ mensagem }) {
  const content = mensagem.content || {}
  const text = mensagem.text || content.text || ''
  const title = content.title || ''
  const description = content.description || ''
  const matchedText = content.matchedText || ''

  return (
    <div className="flex flex-col gap-1.5">
      {text && <p className="text-sm leading-snug whitespace-pre-wrap break-words">{text}</p>}
      {matchedText && (
        <div className="rounded-lg border border-white/20 overflow-hidden text-xs">
          {title && <div className="px-2 py-1 font-semibold">{title}</div>}
          {description && <div className="px-2 pb-1 opacity-80">{description}</div>}
          <div className="flex items-center gap-1 px-2 py-1 opacity-60 border-t border-white/10">
            <Link size={10} />
            <span className="truncate">{matchedText}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessageBubble({ mensagem, isGroup, onDownload }) {
  const fromMe = mensagem.fromMe
  const isMedia = ['audio', 'image', 'video', 'media'].includes(mensagem.mediaType)
  const hora = formatHora(mensagem.messageTimestamp)

  return (
    <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`relative max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
          fromMe
            ? 'bg-cyber-cyan text-white rounded-br-sm'
            : 'bg-white text-cyber-text border border-slate-100 rounded-bl-sm'
        }`}
      >
        {/* Nome do remetente — sempre exibido quando disponível */}
        {mensagem.senderName && (
          <p className={`text-[10px] font-semibold mb-1 ${
            fromMe ? 'text-right text-white/75' : 'text-left text-cyber-cyan'
          }`}>
            {mensagem.senderName}
          </p>
        )}

        {/* Conteúdo */}
        {isMedia ? (
          <MediaMessage mensagem={mensagem} onDownload={onDownload} />
        ) : (
          <TextContent mensagem={mensagem} />
        )}

        {/* Horário */}
        <div className={`flex justify-end mt-1`}>
          <span className={`text-[10px] ${fromMe ? 'text-white/70' : 'text-cyber-muted'}`}>{hora}</span>
        </div>
      </div>
    </div>
  )
}
