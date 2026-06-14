import { useState, useEffect } from 'react'
import { Link2, CheckCircle, Plus, X, Send } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { input as inputCls } from '../../lib/styles'

const DOCS_POR_TIPO = {
  'Auto':        ['CNH do condutor principal', 'CRLV (Documento do Veículo)', 'CPF', 'Comprovante de Residência'],
  'Moto':        ['CNH do condutor principal', 'CRLV (Documento da Moto)', 'CPF', 'Comprovante de Residência'],
  'Residencial': ['CPF', 'RG', 'Comprovante de Residência', 'Matrícula do Imóvel ou Escritura'],
  'Empresarial': ['CNPJ', 'Contrato Social', 'Comprovante de Endereço Comercial', 'Relação de Bens'],
  'Vida':        ['CPF', 'RG', 'Comprovante de Residência'],
  'Saúde':       ['CPF', 'RG', 'Comprovante de Residência', 'Carteirinha do Plano Atual (se houver)'],
  'Frota':       ['CNPJ', 'Contrato Social', 'Relação de Veículos com RENAVAM e Placa'],
  'Rural':       ['CPF ou CNPJ', 'CCIR', 'CAR', 'Matrícula do Imóvel Rural'],
  'Viagem':      ['CPF', 'RG ou Passaporte', 'Passagem ou Roteiro de Viagem'],
  'RC':          ['CNPJ', 'Contrato Social', 'Descrição Detalhada da Atividade'],
  'Garantia':    ['CNPJ', 'Contrato Social', 'Balanço Patrimonial', 'Contrato ou Edital a Garantir'],
}

function docsParaTipo(tipo) {
  if (!tipo) return ['CPF', 'RG', 'Comprovante de Residência']
  for (const [k, v] of Object.entries(DOCS_POR_TIPO)) {
    if ((tipo || '').toLowerCase().includes(k.toLowerCase())) return v
  }
  return ['CPF', 'RG', 'Comprovante de Residência']
}

export default function SolicitarDocumentosModal({
  isOpen, onClose,
  cliente, clienteId, whatsapp,
  tipoSeguro,
  origem, origemId, origemNumero,
}) {
  const [passo, setPasso] = useState(1)
  const [docs, setDocs] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [novoDoc, setNovoDoc] = useState('')
  const [link, setLink] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDocs(docsParaTipo(tipoSeguro).map(tipo => ({ tipo, status: 'pendente' })))
      setPasso(1)
      setLink('')
      setMensagem('')
      setCopiado(false)
    }
  }, [isOpen, tipoSeguro])

  function addDoc() {
    const t = novoDoc.trim()
    if (!t) return
    setDocs(d => [...d, { tipo: t, status: 'pendente' }])
    setNovoDoc('')
  }

  function removeDoc(i) {
    setDocs(d => d.filter((_, idx) => idx !== i))
  }

  async function gerarLink() {
    if (!docs.length) return
    setSalvando(true)
    try {
      const token = Date.now().toString() + Math.random().toString(36).slice(2, 8)
      const payload = {
        id: token,
        clienteId: clienteId || '',
        cliente,
        tipoSeguro,
        origem,
        origemId,
        origemNumero,
        mensagem,
        documentos: docs,
        status: 'ativo',
        createdAt: new Date().toISOString().split('T')[0],
      }
      const res = await fetch('/api/solicitacoes_documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const base = import.meta.env.VITE_APP_URL || `${window.location.origin}${window.location.pathname}`
      const url = `${base.replace(/\/$/, '')}/#/portal/${token}`
      setLink(url)
      setPasso(2)
    } catch {
      alert('Erro ao gerar link. Verifique a conexão.')
    }
    setSalvando(false)
  }

  function copiar() {
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    })
  }

  function enviarWhatsApp() {
    const fone = (whatsapp || '').replace(/\D/g, '')
    const txt = encodeURIComponent(
      `Olá, ${cliente}! Para darmos continuidade ao seu seguro de ${tipoSeguro}, precisamos que você envie alguns documentos.\n\nAcesse o link abaixo, faça o upload dos documentos necessários e confirme o envio:\n\n${link}`
    )
    window.open(`https://wa.me/55${fone}?text=${txt}`, '_blank')
  }

  function fechar() {
    setPasso(1)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={fechar}
      title="Solicitar Documentos ao Cliente"
      size="md"
      footer={
        passo === 1
          ? (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={fechar}>Cancelar</Button>
              <Button onClick={gerarLink} disabled={salvando || !docs.length} icon={<Link2 size={14} />}>
                {salvando ? 'Gerando...' : 'Gerar Link'}
              </Button>
            </div>
          )
          : (
            <div className="flex justify-end">
              <Button onClick={fechar}>Concluir</Button>
            </div>
          )
      }
    >
      {passo === 1 ? (
        <div className="space-y-4">
          {/* Resumo */}
          <div className="p-3 bg-cyber-surface/60 border border-cyber-border/40 rounded-xl">
            <p className="text-sm font-semibold text-cyber-text">{cliente}</p>
            <p className="text-xs text-cyber-muted">{tipoSeguro}{origemNumero ? ` · ${origemNumero}` : ''}</p>
          </div>

          {/* Lista de documentos */}
          <div>
            <p className="hud-label mb-2">Documentos necessários</p>
            <div className="space-y-1.5 mb-2">
              {docs.map((d, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-cyber-surface/40 border border-cyber-border/30 rounded-lg group">
                  <span className="flex-1 text-sm text-cyber-text">{d.tipo}</span>
                  <button onClick={() => removeDoc(i)} className="text-cyber-muted hover:text-cyber-red opacity-0 group-hover:opacity-100 transition-all">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={novoDoc}
                onChange={e => setNovoDoc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDoc()}
                placeholder="Adicionar documento..."
                className={inputCls + ' flex-1 text-sm'}
              />
              <button onClick={addDoc} className="px-3 rounded-lg bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20 transition-colors">
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Mensagem */}
          <div>
            <label className="hud-label mb-1">Mensagem para o cliente (opcional)</label>
            <textarea
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              rows={3}
              placeholder="Ex: Olá! Precisamos desses documentos para finalizar sua apólice. Obrigado pela preferência!"
              className={inputCls + ' resize-none text-sm'}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Sucesso */}
          <div className="text-center pt-3 pb-1">
            <div className="w-16 h-16 bg-cyber-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} className="text-cyber-green" />
            </div>
            <p className="font-bold text-cyber-text text-base">Link gerado!</p>
            <p className="text-sm text-cyber-muted mt-1">Envie para {cliente} pelo canal de sua preferência.</p>
          </div>

          {/* Link */}
          <div className="p-3 bg-cyber-surface/60 border border-cyber-border/40 rounded-xl">
            <p className="text-xs text-cyber-muted mb-1">Link de envio de documentos</p>
            <p className="text-xs text-cyber-cyan font-mono break-all leading-relaxed">{link}</p>
          </div>

          {/* Ações */}
          <div className="space-y-2">
            <button
              onClick={copiar}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm border transition-colors ${copiado ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/30' : 'bg-cyber-surface hover:bg-cyber-surface/80 text-cyber-text border-cyber-border'}`}
            >
              {copiado ? <><CheckCircle size={15} /> Link copiado!</> : <><Link2 size={15} /> Copiar link</>}
            </button>

            {(whatsapp || '').replace(/\D/g, '').length >= 10 && (
              <button
                onClick={enviarWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <Send size={15} /> Enviar via WhatsApp para {cliente}
              </button>
            )}
          </div>

          <p className="text-xs text-cyber-muted text-center">
            O cliente verá a lista de documentos e poderá fazer upload de cada um. Após o envio, os documentos ficam disponíveis para aprovação no perfil do cliente.
          </p>
        </div>
      )}
    </Modal>
  )
}
