import { useState, useRef } from 'react'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Upload, Folder, CheckCircle, Clock, XCircle, AlertCircle, Trash2, Eye, Download, X as XIcon, Link2, ThumbsUp, ThumbsDown } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'

const tiposDoc = ['CPF', 'RG', 'CNH', 'Comprovante de endereço', 'CNPJ', 'Contrato social', 'Nota fiscal', 'Documento do veículo', 'Matrícula do imóvel', 'Boleto', 'Proposta assinada', 'Apólice', 'Comprovante de pagamento', 'Laudo Técnico', 'B.O.', 'Outros']

const emptyForm = { clienteId: '', cliente: '', apoliceId: '', apolice: '', tipo: 'CPF', nome: '', status: 'pendente', observacoes: '', dataUrl: '', fileType: '', fileSize: 0 }

const statusIcon = {
  pendente: <AlertCircle size={14} className="text-amber-500" />,
  enviado: <Clock size={14} className="text-cyber-cyan" />,
  aprovado: <CheckCircle size={14} className="text-cyber-green" />,
  recusado: <XCircle size={14} className="text-cyber-red" />,
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Documentos() {
  const { showToast } = useApp()
  const { data: docs, create, update, remove } = useResource('documentos')
  const { data: clientes } = useResource('clientes')
  const { data: solicitacoes, update: updateSolicitation } = useResource('solicitacoes_documentos')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [abaPortal, setAbaPortal] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const fileInputRef = useRef(null)

  const filtered = docs.filter(d => {
    const q = search.toLowerCase()
    const match = !q || (d.cliente || '').toLowerCase().includes(q) || (d.nome || '').toLowerCase().includes(q) || (d.tipo || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || d.status === filterStatus
    return match && matchStatus
  })

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setForm(f => ({
        ...f,
        nome: f.nome || `${f.tipo} - ${f.cliente || 'cliente'}.${file.name.split('.').pop()}`,
        dataUrl: ev.target.result,
        fileType: file.type,
        fileSize: file.size,
      }))
      showToast(`Arquivo "${file.name}" selecionado.`)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleSave() {
    if (!form.tipo || !form.cliente) { showToast('Preencha cliente e tipo.', 'error'); return }
    const novoNome = form.nome || `${form.tipo} - ${form.cliente}.pdf`
    try {
      await create({ ...form, id: Date.now().toString(), nome: novoNome, dataEnvio: new Date().toISOString().split('T')[0] })
      showToast('Documento cadastrado!')
      setShowModal(false)
      setForm(emptyForm)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Documento excluído!')
      setConfirmDelete(null)
    } catch {
      showToast('Erro ao excluir.', 'error')
    }
  }

  async function aprovar(doc) {
    try {
      await update(doc.id, { ...doc, status: 'aprovado', dataAprovacao: new Date().toISOString().split('T')[0] })
      showToast('Documento aprovado!')
    } catch {
      showToast('Erro ao aprovar.', 'error')
    }
  }

  async function rejeitar(doc) {
    try {
      await update(doc.id, { ...doc, status: 'recusado' })
      showToast('Documento rejeitado.')
    } catch {
      showToast('Erro ao rejeitar.', 'error')
    }
  }

  function downloadDoc(doc) {
    if (!doc.dataUrl) { showToast('Nenhum arquivo armazenado.', 'error'); return }
    const a = document.createElement('a')
    a.href = doc.dataUrl
    a.download = doc.nome
    a.click()
  }

  const pendentes = docs.filter(d => d.status === 'pendente').length
  const enviados = docs.filter(d => d.status === 'enviado').length
  const aprovados = docs.filter(d => d.status === 'aprovado').length
  const aguardandoPortal = solicitacoes.reduce((acc, s) => acc + (s.documentos?.filter(d => d.status === 'enviado').length || 0), 0)

  async function aprovarPortalDoc(sol, idx) {
    const nd = sol.documentos.map((d, i) => i === idx ? { ...d, status: 'aprovado', dataAprovacao: new Date().toISOString().split('T')[0] } : d)
    await updateSolicitation(sol.id, { ...sol, documentos: nd })
    showToast('Documento aprovado!')
  }
  async function rejeitarPortalDoc(sol, idx) {
    const nd = sol.documentos.map((d, i) => i === idx ? { ...d, status: 'recusado' } : d)
    await updateSolicitation(sol.id, { ...sol, documentos: nd })
    showToast('Documento rejeitado.')
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[['Pendentes', pendentes, 'bg-cyber-amber/5 text-cyber-amber border border-cyber-amber/20'], ['Enviados', enviados, 'bg-cyber-cyan/5 text-cyber-cyan border border-cyber-cyan/20'], ['Aprovados', aprovados, 'bg-cyber-green/5 text-cyber-green border border-cyber-green/20']].map(([l, v, cls]) => (
          <div key={l} className={`rounded-2xl p-4 text-center ${cls}`}>
            <p className="text-2xl font-bold">{v}</p>
            <p className="text-sm font-medium">{l}</p>
          </div>
        ))}
        <button onClick={() => setAbaPortal(v => !v)} className={`rounded-2xl p-4 text-center border transition-colors ${abaPortal ? 'bg-blue-500/10 text-blue-400 border-blue-400/30' : aguardandoPortal > 0 ? 'bg-cyber-cyan/5 text-cyber-cyan border-cyber-cyan/20 animate-pulse' : 'bg-cyber-surface text-cyber-muted border-cyber-border/30'}`}>
          <p className="text-2xl font-bold">{aguardandoPortal || solicitacoes.length}</p>
          <p className="text-sm font-medium flex items-center justify-center gap-1"><Link2 size={13} /> Portal</p>
        </button>
      </div>

      {/* Aba Portal */}
      {abaPortal && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-cyber-text flex items-center gap-2"><Link2 size={15} className="text-cyber-cyan" /> Solicitações do Portal ({solicitacoes.length})</p>
            <button onClick={() => setAbaPortal(false)} className="text-xs text-cyber-muted hover:text-cyber-text transition-colors">← Voltar aos documentos internos</button>
          </div>
          {solicitacoes.length === 0 ? (
            <EmptyState icon={<Link2 size={28} />} title="Nenhuma solicitação" description="Nenhum link de documentos foi gerado ainda." />
          ) : (
            <div className="space-y-3">
              {solicitacoes.map(sol => {
                const total = sol.documentos?.length || 0
                const enviados2 = sol.documentos?.filter(d => ['enviado', 'aprovado'].includes(d.status)).length || 0
                const aprovados2 = sol.documentos?.filter(d => d.status === 'aprovado').length || 0
                return (
                  <div key={sol.id} className="bg-cyber-card rounded-2xl border border-cyber-border/40 shadow-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border/30 bg-cyber-surface/40">
                      <div>
                        <p className="text-sm font-semibold text-cyber-text">{sol.cliente} · <span className="text-cyber-muted font-normal">{sol.tipoSeguro}</span></p>
                        <p className="text-xs text-cyber-muted">{sol.origemNumero || sol.origemId} · Criado em {sol.createdAt}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-cyber-text">{aprovados2}/{total}</p>
                          <p className="text-[10px] text-cyber-muted">aprovados</p>
                        </div>
                        <div className="w-20 bg-cyber-border/30 rounded-full h-2">
                          <div className={`h-2 rounded-full ${aprovados2 === total && total > 0 ? 'bg-cyber-green' : 'bg-cyber-cyan'}`} style={{ width: `${total ? (enviados2 / total) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-cyber-border/20">
                      {(sol.documentos || []).map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5 hover:bg-cyber-surface/20 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-cyber-surface flex items-center justify-center shrink-0">
                            <Folder size={14} className={doc.dataUrl ? 'text-cyber-cyan' : 'text-cyber-muted'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-cyber-text">{doc.tipo}</p>
                            {doc.nome && <p className="text-xs text-cyber-muted truncate">📎 {doc.nome} {doc.fileSize ? `· ${formatBytes(doc.fileSize)}` : ''}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {doc.status === 'aprovado' && <span className="flex items-center gap-1 text-xs text-cyber-green font-semibold"><CheckCircle size={12} /> Aprovado</span>}
                            {doc.status === 'pendente' && <span className="text-xs text-cyber-muted">Aguardando</span>}
                            {doc.status === 'enviado' && <span className="flex items-center gap-1 text-xs text-cyber-cyan font-semibold"><Clock size={12} /> Enviado</span>}
                            {doc.status === 'recusado' && <span className="flex items-center gap-1 text-xs text-cyber-red font-semibold"><XCircle size={12} /> Recusado</span>}
                            {doc.dataUrl && (doc.fileType?.startsWith('image/') || doc.fileType === 'application/pdf') && (
                              <button onClick={() => setPreviewDoc({ ...doc, nome: doc.nome || doc.tipo })} className="flex items-center gap-1 text-xs text-cyber-cyan hover:bg-cyber-cyan/10 px-2 py-1 rounded-lg transition-colors"><Eye size={12} /> Ver</button>
                            )}
                            {doc.dataUrl && (
                              <button onClick={() => downloadDoc({ ...doc, nome: doc.nome || doc.tipo })} className="p-1.5 text-cyber-muted hover:bg-cyber-surface rounded-lg transition-colors"><Download size={12} /></button>
                            )}
                            {doc.status === 'enviado' && (
                              <>
                                <button onClick={() => aprovarPortalDoc(sol, idx)} className="flex items-center gap-1 text-xs text-cyber-green hover:bg-cyber-green/10 px-2 py-1 rounded-lg transition-colors"><ThumbsUp size={12} /> Aprovar</button>
                                <button onClick={() => rejeitarPortalDoc(sol, idx)} className="flex items-center gap-1 text-xs text-cyber-red hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"><ThumbsDown size={12} /> Recusar</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Documentos Internos */}
      {!abaPortal && (<>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documento, cliente, tipo..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
            <option value="todos">Todos os status</option>
            {['pendente', 'enviado', 'aprovado', 'recusado'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <Button onClick={() => { setForm(emptyForm); setShowModal(true) }} icon={<Plus size={16} />}>Novo Documento</Button>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState icon={<Folder size={28} />} title="Nenhum documento" description="Adicione documentos dos seus clientes." action={<Button onClick={() => setShowModal(true)} icon={<Plus size={16} />}>Novo Documento</Button>} />
        ) : (
        <div className="bg-cyber-card rounded-2xl shadow-card border border-cyber-border/40 overflow-hidden">
          <div className="divide-y divide-cyber-border/20">
            {filtered.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 bg-cyber-surface rounded-xl flex items-center justify-center shrink-0">
                  {d.dataUrl
                    ? (d.fileType?.startsWith('image/') ? <Eye size={16} className="text-cyber-cyan" /> : <Folder size={16} className="text-cyber-amber" />)
                    : <Folder size={16} className="text-cyber-muted" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cyber-text truncate flex items-center gap-1.5">
                    {d.nome}
                    {d.origem === 'portal' && <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-400/20 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5"><Link2 size={9} /> Portal</span>}
                  </p>
                  <p className="text-xs text-cyber-muted">
                    {d.tipo} · {d.cliente}
                    {d.apolice ? ` · ${d.apolice}` : ''}
                    {d.fileSize ? ` · ${formatBytes(d.fileSize)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  <div className="flex items-center gap-1">{statusIcon[d.status]}</div>
                  <StatusBadge status={d.status} type="documento" />

                  {/* Visualizar */}
                  {d.dataUrl && (d.fileType?.startsWith('image/') || d.fileType === 'application/pdf') && (
                    <button onClick={() => setPreviewDoc(d)} className="flex items-center gap-1 text-xs text-cyber-cyan hover:bg-cyber-cyan/10 px-2 py-1 rounded-lg transition-colors" title="Visualizar">
                      <Eye size={12} /> Ver
                    </button>
                  )}

                  {/* Download */}
                  {d.dataUrl && (
                    <button onClick={() => downloadDoc(d)} className="flex items-center gap-1 text-xs text-cyber-muted hover:bg-cyber-surface px-2 py-1 rounded-lg transition-colors" title="Baixar">
                      <Download size={12} />
                    </button>
                  )}

                  {/* Aprovar / Rejeitar */}
                  {['pendente', 'enviado'].includes(d.status) && (
                    <>
                      <button onClick={() => aprovar(d)} className="flex items-center gap-1 text-xs text-cyber-green hover:bg-cyber-green/10 px-2 py-1 rounded-lg transition-colors">
                        <CheckCircle size={12} /> Aprovar
                      </button>
                      <button onClick={() => rejeitar(d)} className="flex items-center gap-1 text-xs text-cyber-red hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                        <XCircle size={12} /> Rejeitar
                      </button>
                    </>
                  )}

                  <button onClick={() => setConfirmDelete(d)} className="p-1.5 text-cyber-muted hover:text-cyber-red hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>)}

      {/* Modal Confirmar Exclusão */}
      {confirmDelete && (
        <Modal isOpen title="Confirmar exclusão" onClose={() => setConfirmDelete(null)} size="sm"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete.id)}>Excluir</Button>
            </div>
          }
        >
          <p className="text-sm text-cyber-text">Excluir o documento <strong className="text-cyber-red">"{confirmDelete.nome}"</strong>?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}

      {/* Modal Preview */}
      {previewDoc && (
        <Modal isOpen title={previewDoc.nome} onClose={() => setPreviewDoc(null)} size="xl"
          footer={
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setPreviewDoc(null)}>Fechar</Button>
              <Button icon={<Download size={14} />} onClick={() => downloadDoc(previewDoc)}>Baixar</Button>
            </div>
          }
        >
          <div className="flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto">
            {previewDoc.fileType?.startsWith('image/') ? (
              <img src={previewDoc.dataUrl} alt={previewDoc.nome} className="max-w-full max-h-[65vh] object-contain rounded-lg" />
            ) : previewDoc.fileType === 'application/pdf' ? (
              <object data={previewDoc.dataUrl} type="application/pdf" className="w-full h-[65vh] rounded-lg">
                <p className="text-sm text-cyber-muted text-center">Seu navegador não suporta visualização de PDF. <button onClick={() => downloadDoc(previewDoc)} className="text-cyber-cyan underline">Baixar para ver</button>.</p>
              </object>
            ) : (
              <p className="text-sm text-cyber-muted">Tipo sem visualização prévia. <button onClick={() => downloadDoc(previewDoc)} className="text-cyber-cyan underline">Clique para baixar</button>.</p>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Novo Documento */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(emptyForm) }} title="Novo Documento" size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowModal(false); setForm(emptyForm) }}>Cancelar</Button>
            <Button onClick={handleSave}>Cadastrar</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="hud-label mb-1">Cliente</label>
            <select value={form.clienteId} onChange={e => { const c = clientes.find(c => c.id === e.target.value); setForm(f => ({ ...f, clienteId: e.target.value, cliente: c?.nome || '' })) }} className={inputCls}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="hud-label mb-1">Tipo de documento</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inputCls}>
              {tiposDoc.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="hud-label mb-1">Nome do arquivo</label>
            <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} placeholder="Ex: RG João Mendes.pdf" />
          </div>

          {/* Upload real */}
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${form.dataUrl ? 'border-cyber-green/50 bg-cyber-green/5' : 'border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5'}`}
          >
            {form.dataUrl ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-cyber-green">
                  <CheckCircle size={16} />
                  <span className="truncate max-w-[200px]">{form.nome || 'Arquivo selecionado'}</span>
                  <span className="text-xs text-cyber-muted">{formatBytes(form.fileSize)}</span>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, dataUrl: '', fileType: '', fileSize: 0 })) }} className="text-cyber-muted hover:text-cyber-red">
                  <XIcon size={14} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-cyber-muted mb-2" />
                <p className="text-sm text-cyber-muted">Clique para selecionar o arquivo</p>
                <p className="text-xs text-cyber-muted mt-1">PDF, JPG, PNG até 10 MB</p>
              </>
            )}
          </div>

          <div>
            <label className="hud-label mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
