import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import api from '../api/client'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabaseClient = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

export default function useChat() {
  const [conversas, setConversas] = useState([])
  const [mensagens, setMensagens] = useState([]) // mensagens da conversa ativa
  const [conversaAtiva, setConversaAtiva] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMensagens, setLoadingMensagens] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingMap, setTypingMap] = useState({}) // { [conversaId]: boolean }
  const typingTimers = useRef({})
  const channelRef = useRef(null)

  // Carrega lista de conversas
  const loadConversas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getAll('conversas')
      const sorted = [...data].sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp)
      setConversas(sorted)
    } catch (err) {
      console.error('[useChat] loadConversas:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carrega mensagens de uma conversa
  const loadMensagens = useCallback(async (conversaId) => {
    if (!conversaId) return
    setLoadingMensagens(true)
    try {
      const res = await fetch(`/api/conversas/${encodeURIComponent(conversaId)}/mensagens`)
      const data = await res.json()
      setMensagens(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[useChat] loadMensagens:', err.message)
    } finally {
      setLoadingMensagens(false)
    }
  }, [])

  // Seleciona conversa ativa
  const selecionarConversa = useCallback(async (conversa) => {
    setConversaAtiva(conversa)
    await loadMensagens(conversa.id)
    // Marca como lida
    if (conversa.unreadCount > 0) {
      markAsRead(conversa.id)
    }
  }, [loadMensagens])

  // Supabase Realtime — escuta novos inserts em mensagens
  useEffect(() => {
    if (!supabaseClient) return

    const channel = supabaseClient
      .channel('chat-mensagens')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens',
      }, (payload) => {
        const novaMensagem = payload.new?.data
        if (!novaMensagem) return

        // Atualiza lista de mensagens se for da conversa ativa
        setConversaAtiva(prev => {
          if (prev && novaMensagem.conversaId === prev.id) {
            setMensagens(msgs => {
              const existe = msgs.some(m => m.id === novaMensagem.id)
              if (existe) return msgs
              // Remove mensagens optimistic (temp_*) quando a mensagem real de "mim" chega
              const base = novaMensagem.fromMe
                ? msgs.filter(m => !String(m.id).startsWith('temp_'))
                : msgs
              return [...base, novaMensagem]
            })
          }
          return prev
        })

        // Atualiza preview na lista de conversas
        setConversas(prev => prev.map(c => {
          if (c.id !== novaMensagem.conversaId) return c
          const unread = novaMensagem.fromMe ? c.unreadCount : (c.unreadCount || 0) + 1
          return {
            ...c,
            lastMessage: novaMensagem.text || labelMidia(novaMensagem.mediaType),
            lastMessageType: novaMensagem.mediaType || 'text',
            lastMessageTimestamp: novaMensagem.messageTimestamp,
            unreadCount: unread,
          }
        }).sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp))
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversas',
      }, (payload) => {
        const updated = payload.new?.data
        if (!updated) return
        setConversas(prev => prev.map(c => c.id === updated.id ? updated : c)
          .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp))
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [])

  // Polling fallback: se não tiver Realtime, recarrega mensagens a cada 5s
  useEffect(() => {
    if (supabaseClient) return // Realtime ativo, não precisa de polling
    if (!conversaAtiva) return
    const interval = setInterval(() => loadMensagens(conversaAtiva.id), 5000)
    return () => clearInterval(interval)
  }, [conversaAtiva, loadMensagens])

  // Enviar mensagem de texto
  const sendMessage = useCallback(async (conversaId, text) => {
    if (!conversaId || !text?.trim()) return
    setSending(true)

    // Optimistic update: exibe a mensagem imediatamente antes de confirmar o envio
    const tempId = `temp_${Date.now()}`
    const tempMsg = {
      id: tempId,
      messageid: '',
      conversaId,
      mediaType: 'text',
      text: text.trim(),
      fromMe: true,
      messageTimestamp: Date.now(),
      content: {},
      senderName: '',
      isGroup: false,
    }
    setMensagens(prev => [...prev, tempMsg])

    try {
      const res = await fetch('/api/uazapi/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversaId, text: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Remove mensagem optimistic se falhou
        setMensagens(prev => prev.filter(m => m.id !== tempId))
        throw new Error(data.error || 'Erro ao enviar')
      }
      return data
    } catch (err) {
      setMensagens(prev => prev.filter(m => m.id !== tempId))
      console.error('[useChat] sendMessage:', err.message)
      throw err
    } finally {
      setSending(false)
    }
  }, [])

  // Enviar mídia
  const sendMedia = useCallback(async (conversaId, { mediaType, mediaUrl, fileName, caption }) => {
    if (!conversaId || !mediaUrl) return
    setSending(true)
    try {
      const res = await fetch('/api/uazapi/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversaId, mediaType, mediaUrl, fileName, caption }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar mídia')
      return data
    } catch (err) {
      console.error('[useChat] sendMedia:', err.message)
      throw err
    } finally {
      setSending(false)
    }
  }, [])

  // Download de mídia — UAZAPI retorna { base64Data, mimetype } ou { url }
  const downloadMedia = useCallback(async (mensagem) => {
    try {
      // Usa messageid curto se disponível (ex: "3EB0..."), senão usa id completo e o backend extrai
      const msgId = mensagem.messageid || mensagem.id
      const res = await fetch('/api/uazapi/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageid: msgId, conversaId: mensagem.conversaId }),
      })
      if (!res.ok) return null
      const data = await res.json()

      // Se veio URL pública, usa direto
      if (data.url) return data.url

      // Se veio base64Data, converte para blob URL
      if (data.base64Data) {
        try {
          const binary = atob(data.base64Data)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          const blob = new Blob([bytes], { type: data.mimetype || 'application/octet-stream' })
          return URL.createObjectURL(blob)
        } catch (e) {
          console.error('[useChat] base64 decode error:', e.message)
          return null
        }
      }
      return null
    } catch (err) {
      console.error('[useChat] downloadMedia:', err.message)
      return null
    }
  }, [])

  // Marcar conversa como lida
  const markAsRead = useCallback(async (conversaId) => {
    try {
      await fetch('/api/uazapi/markread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversaId }),
      })
      setConversas(prev => prev.map(c => c.id === conversaId ? { ...c, unreadCount: 0 } : c))
    } catch (err) {
      console.error('[useChat] markAsRead:', err.message)
    }
  }, [])

  // Indicador de digitando (debounce 2s)
  const setTyping = useCallback((conversaId) => {
    setTypingMap(prev => ({ ...prev, [conversaId]: true }))
    clearTimeout(typingTimers.current[conversaId])
    typingTimers.current[conversaId] = setTimeout(() => {
      setTypingMap(prev => ({ ...prev, [conversaId]: false }))
    }, 2000)
  }, [])

  const totalNaoLidas = conversas.reduce((acc, c) => acc + (c.unreadCount || 0), 0)

  useEffect(() => {
    loadConversas()
  }, [loadConversas])

  return {
    conversas,
    mensagens,
    conversaAtiva,
    loading,
    loadingMensagens,
    sending,
    typingMap,
    totalNaoLidas,
    selecionarConversa,
    loadConversas,
    loadMensagens,
    sendMessage,
    sendMedia,
    downloadMedia,
    markAsRead,
    setTyping,
  }
}

function labelMidia(mediaType) {
  if (mediaType === 'audio') return '🎵 Áudio'
  if (mediaType === 'image') return '📷 Imagem'
  if (mediaType === 'video') return '🎥 Vídeo'
  if (mediaType === 'media') return '📄 Documento'
  return '💬 Mensagem'
}
