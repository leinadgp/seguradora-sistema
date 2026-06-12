import { useState, useEffect } from 'react'
import { Download, FileText, Play, AlertCircle } from 'lucide-react'

function base64ToUrl(base64, mimeType) {
  if (!base64) return null
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: mimeType })
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

// Áudio
function AudioMsg({ mensagem, onDownload }) {
  const [url, setUrl] = useState(mensagem.mediaUrl || null)
  const [loading, setLoading] = useState(false)
  const content = mensagem.content || {}

  // Tenta usar o thumbnail base64 como waveform visual
  const waveform = content.waveform || content.streamingSidecar || null
  const duration = content.seconds ? `${content.seconds}s` : ''

  async function handleLoad() {
    if (url) return
    setLoading(true)
    const downloaded = await onDownload(mensagem)
    if (downloaded) setUrl(downloaded)
    setLoading(false)
  }

  useEffect(() => {
    if (!url && mensagem.mediaUrl) setUrl(mensagem.mediaUrl)
  }, [mensagem.mediaUrl])

  if (!url) {
    return (
      <button
        onClick={handleLoad}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors min-w-[160px]"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Play size={16} />
        )}
        <span className="text-xs">{loading ? 'Carregando...' : `🎵 Áudio${duration ? ` · ${duration}` : ''}`}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1 min-w-[200px]">
      <audio controls src={url} className="w-full h-8" style={{ maxWidth: 240 }} />
      {duration && <span className="text-[10px] opacity-70">{duration}</span>}
    </div>
  )
}

// Imagem
function ImageMsg({ mensagem, onDownload }) {
  const [url, setUrl] = useState(mensagem.mediaUrl || null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const content = mensagem.content || {}

  // Usa thumbnail JPEGThumbnail como preview imediato
  const thumbnail = content.JPEGThumbnail
    ? base64ToUrl(content.JPEGThumbnail, 'image/jpeg')
    : null

  const caption = content.caption || mensagem.text || ''

  async function handleClick() {
    if (!url) {
      setLoading(true)
      const downloaded = await onDownload(mensagem)
      if (downloaded) setUrl(downloaded)
      setLoading(false)
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!url && mensagem.mediaUrl) setUrl(mensagem.mediaUrl)
  }, [mensagem.mediaUrl])

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        style={{ maxWidth: 220 }}
      >
        {thumbnail && !url ? (
          <img src={thumbnail} alt="Imagem" className="w-full rounded-lg" style={{ filter: 'blur(2px)' }} />
        ) : url ? (
          <img src={url} alt="Imagem" className="w-full rounded-lg" />
        ) : (
          <div className="w-[220px] h-[140px] bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-[11px] opacity-70">📷 Imagem</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!url && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
            <Download size={18} className="text-white" />
          </div>
        )}
      </button>
      {caption && <p className="text-xs opacity-90 mt-0.5">{caption}</p>}

      {/* Lightbox */}
      {open && url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <img src={url} alt="Imagem" className="max-w-[90vw] max-h-[90vh] rounded-lg" />
        </div>
      )}
    </div>
  )
}

// Vídeo
function VideoMsg({ mensagem, onDownload }) {
  const [url, setUrl] = useState(mensagem.mediaUrl || null)
  const [loading, setLoading] = useState(false)
  const content = mensagem.content || {}
  const thumbnail = content.JPEGThumbnail
    ? base64ToUrl(content.JPEGThumbnail, 'image/jpeg')
    : null
  const duration = content.seconds ? `${content.seconds}s` : ''
  const caption = content.caption || mensagem.text || ''

  async function handleLoad() {
    if (url) return
    setLoading(true)
    const downloaded = await onDownload(mensagem)
    if (downloaded) setUrl(downloaded)
    setLoading(false)
  }

  useEffect(() => {
    if (!url && mensagem.mediaUrl) setUrl(mensagem.mediaUrl)
  }, [mensagem.mediaUrl])

  return (
    <div className="flex flex-col gap-1">
      {url ? (
        <video
          controls
          poster={thumbnail || undefined}
          src={url}
          className="rounded-lg"
          style={{ maxWidth: 280, maxHeight: 200 }}
        />
      ) : (
        <button
          onClick={handleLoad}
          disabled={loading}
          className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          style={{ width: 220, height: 140 }}
        >
          {thumbnail ? (
            <img src={thumbnail} alt="Vídeo" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="w-full h-full bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-[11px] opacity-70">🎥 Vídeo</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
            {loading ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                <Play size={18} className="text-white ml-0.5" />
              </div>
            )}
          </div>
          {duration && (
            <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/50 px-1 rounded">
              {duration}
            </span>
          )}
        </button>
      )}
      {caption && <p className="text-xs opacity-90 mt-0.5">{caption}</p>}
    </div>
  )
}

// Documento
function DocumentMsg({ mensagem, onDownload }) {
  const [url, setUrl] = useState(mensagem.mediaUrl || null)
  const [loading, setLoading] = useState(false)
  const content = mensagem.content || {}
  const fileName = content.fileName || content.title || 'Documento'
  const mimeType = content.mimetype || 'application/octet-stream'

  async function handleDownload() {
    setLoading(true)
    const downloaded = await onDownload(mensagem)
    if (downloaded) {
      setUrl(downloaded)
      const a = document.createElement('a')
      a.href = downloaded
      a.download = fileName
      a.click()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors min-w-[180px] max-w-[260px]"
    >
      <FileText size={20} className="shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium truncate">{fileName}</p>
        <p className="text-[10px] opacity-70">{mimeType.split('/')[1]?.toUpperCase() || 'Arquivo'}</p>
      </div>
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        <Download size={14} className="shrink-0 opacity-70" />
      )}
    </button>
  )
}

export default function MediaMessage({ mensagem, onDownload }) {
  const { mediaType } = mensagem

  if (mediaType === 'audio') return <AudioMsg mensagem={mensagem} onDownload={onDownload} />
  if (mediaType === 'image') return <ImageMsg mensagem={mensagem} onDownload={onDownload} />
  if (mediaType === 'video') return <VideoMsg mensagem={mensagem} onDownload={onDownload} />
  if (mediaType === 'media') return <DocumentMsg mensagem={mensagem} onDownload={onDownload} />

  return (
    <div className="flex items-center gap-2 text-xs opacity-70">
      <AlertCircle size={13} />
      <span>Tipo de mídia não suportado: {mediaType}</span>
    </div>
  )
}
