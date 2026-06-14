import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Upload, AlertCircle } from 'lucide-react'

const STATUS_INFO = {
  pendente: { label: 'Aguardando envio', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle },
  enviado:  { label: 'Enviado — em análise', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Clock },
  aprovado: { label: 'Aprovado', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  recusado: { label: 'Rejeitado', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle },
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Portal() {
  const { token } = useParams()
  const [sol, setSol] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [salvoMsg, setSalvoMsg] = useState('')
  const [pendingUploads, setPendingUploads] = useState({}) // { index: true } — docs alterados não salvos
  const fileRefs = useRef({})

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setSol(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [token])

  function handleFile(e, idx) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setSol(prev => {
        const docs = [...prev.documentos]
        docs[idx] = {
          ...docs[idx],
          dataUrl: ev.target.result,
          fileType: file.type,
          fileSize: file.size,
          nome: file.name,
          status: 'enviado',
          dataEnvio: new Date().toISOString().split('T')[0],
        }
        return { ...prev, documentos: docs }
      })
      setPendingUploads(p => ({ ...p, [idx]: true }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function salvar() {
    if (!Object.keys(pendingUploads).length) return
    setSaving(true)
    setSalvoMsg('')
    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sol),
      })
      if (!res.ok) throw new Error()
      setPendingUploads({})
      setSalvoMsg('Documentos enviados com sucesso! Nossa equipe irá analisar em breve.')
    } catch {
      setSalvoMsg('Erro ao enviar. Verifique sua conexão e tente novamente.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Carregando sua solicitação...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <XCircle size={52} className="mx-auto text-red-400 mb-4" />
        <p className="text-gray-700 font-semibold text-lg mb-2">Link não encontrado</p>
        <p className="text-gray-500 text-sm">Este link pode ter expirado ou sido removido. Entre em contato com a corretora.</p>
      </div>
    </div>
  )

  const total = sol.documentos.length
  const enviados = sol.documentos.filter(d => ['enviado', 'aprovado'].includes(d.status)).length
  const aprovados = sol.documentos.filter(d => d.status === 'aprovado').length
  const tudo_aprovado = aprovados === total
  const temPendente = Object.keys(pendingUploads).length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <p className="font-bold text-gray-800 leading-tight text-sm">ATTENTI Corretora de Seguros</p>
            <p className="text-xs text-gray-400">Portal de Documentos</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4 pb-16">

        {/* Saudação */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Olá,</p>
          <p className="text-xl font-bold text-gray-800">{sol.cliente}</p>
          <p className="text-sm text-gray-500 mt-2">
            Para prosseguirmos com seu seguro de{' '}
            <strong className="text-gray-700">{sol.tipoSeguro}</strong>
            {sol.origemNumero ? ` (${sol.origemNumero})` : ''}, precisamos dos documentos listados abaixo.
          </p>
          {sol.mensagem && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-700">{sol.mensagem}</p>
            </div>
          )}
          {/* Progresso */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{enviados} de {total} documentos enviados</span>
              {aprovados > 0 && <span className="text-green-600 font-medium">{aprovados} aprovado(s) ✓</span>}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${tudo_aprovado ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${total ? (enviados / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lista de documentos */}
        {sol.documentos.map((doc, i) => {
          const st = STATUS_INFO[doc.status] || STATUS_INFO.pendente
          const Icon = st.icon
          const podeEnviar = doc.status !== 'aprovado'

          return (
            <div key={i} className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${doc.status === 'aprovado' ? 'border-green-200' : doc.status === 'recusado' ? 'border-red-200' : pendingUploads[i] ? 'border-blue-300' : 'border-gray-200'}`}>
              <input
                ref={el => fileRefs.current[i] = el}
                type="file"
                className="hidden"
                onChange={e => handleFile(e, i)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{doc.tipo}</p>
                  {doc.nome && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      📎 {doc.nome} {doc.fileSize ? `· ${formatBytes(doc.fileSize)}` : ''}
                    </p>
                  )}
                  {doc.observacoes && (
                    <p className="text-xs text-red-500 mt-1 font-medium">⚠ {doc.observacoes}</p>
                  )}
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${st.bg} ${st.color}`}>
                  <Icon size={12} />
                  {st.label}
                </span>
              </div>

              {podeEnviar && (
                <button
                  onClick={() => fileRefs.current[i]?.click()}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed rounded-xl text-sm font-medium transition-colors ${pendingUploads[i] ? 'border-blue-400 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  <Upload size={15} />
                  {doc.status === 'recusado' ? 'Reenviar documento corrigido' : doc.dataUrl ? 'Substituir arquivo' : 'Selecionar arquivo'}
                </button>
              )}
            </div>
          )
        })}

        {/* Botão salvar */}
        {!tudo_aprovado && (
          <button
            onClick={salvar}
            disabled={saving || !temPendente}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all shadow-sm ${temPendente && !saving ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            {saving ? 'Enviando documentos...' : temPendente ? 'Confirmar envio dos documentos' : 'Selecione ao menos um documento para enviar'}
          </button>
        )}

        {/* Feedback */}
        {salvoMsg && (
          <div className={`text-center text-sm font-medium py-4 px-4 rounded-2xl border ${salvoMsg.includes('Erro') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
            {salvoMsg}
          </div>
        )}

        {/* Tudo aprovado */}
        {tudo_aprovado && (
          <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-200">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
            <p className="font-bold text-green-700 text-lg">Tudo aprovado!</p>
            <p className="text-sm text-green-600 mt-2">Todos os documentos foram analisados e aprovados. Entraremos em contato em breve.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 py-2">
          ATTENTI Corretora · {sol.tipoSeguro} · {sol.origemNumero || sol.origemId}
        </p>
      </div>
    </div>
  )
}
