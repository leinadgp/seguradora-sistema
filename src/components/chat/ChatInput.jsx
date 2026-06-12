import { useState, useRef, useCallback } from 'react'
import { Send, Paperclip } from 'lucide-react'

export default function ChatInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)
  const typingCooldown = useRef(null)

  const handleChange = useCallback((e) => {
    setText(e.target.value)
    // Resize automático
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
    // Dispara evento de digitação com debounce
    if (onTyping) {
      clearTimeout(typingCooldown.current)
      typingCooldown.current = setTimeout(() => onTyping(), 300)
    }
  }, [onTyping])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    try {
      await onSend(trimmed)
    } catch (err) {
      // Restaura o texto se o envio falhar
      setText(trimmed)
      alert('Erro ao enviar mensagem: ' + (err.message || 'Tente novamente.'))
    }
  }, [text, disabled, onSend])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="flex items-end gap-2 px-4 py-3 border-t border-cyber-cyan/10 bg-cyber-surface">
      <button
        title="Anexar arquivo (em breve)"
        className="p-2 rounded-lg text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors shrink-0 cursor-pointer"
        disabled
      >
        <Paperclip size={16} />
      </button>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Digite uma mensagem... (Enter para enviar, Shift+Enter para quebrar linha)"
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none bg-slate-100 border border-cyber-cyan/10 rounded-xl px-3 py-2 text-sm text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-cyan/40 disabled:opacity-50 scrollbar-hide"
        style={{ minHeight: 40, maxHeight: 120, overflowY: 'auto' }}
      />

      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        title="Enviar (Enter)"
        className="p-2 rounded-xl bg-cyber-cyan text-white disabled:opacity-40 hover:bg-cyber-cyan/90 transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
      >
        <Send size={16} />
      </button>
    </div>
  )
}
