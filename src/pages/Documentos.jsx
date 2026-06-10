import { useState } from 'react'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Upload, Eye, Folder, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'

const tiposDoc = ['CPF', 'RG', 'CNH', 'Comprovante de endereço', 'CNPJ', 'Contrato social', 'Nota fiscal', 'Documento do veículo', 'Matrícula do imóvel', 'Boleto', 'Proposta assinada', 'Apólice', 'Comprovante de pagamento', 'Laudo Técnico', 'B.O.', 'Outros']

const emptyForm = { clienteId: '', cliente: '', apoliceId: '', apolice: '', tipo: 'CPF', nome: '', status: 'pendente', observacoes: '' }

const statusIcon = { pendente: <AlertCircle size={14} className="text-amber-500" />, enviado: <Clock size={14} className="text-cyber-cyan" />, aprovado: <CheckCircle size={14} className="text-cyber-green" />, recusado: <XCircle size={14} className="text-cyber-red" /> }

export default function Documentos() {
  const { showToast } = useApp()
  const { data: docs, create, update } = useResource('documentos')
  const { data: clientes } = useResource('clientes')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = docs.filter(d => {
    const q = search.toLowerCase()
    const match = !q || d.cliente.toLowerCase().includes(q) || d.nome.toLowerCase().includes(q) || d.tipo.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || d.status === filterStatus
    return match && matchStatus
  })

  async function handleSave() {
    if (!form.tipo || !form.cliente) { showToast('Preencha cliente e tipo.', 'error'); return }
    const novoNome = form.nome || `${form.tipo} - ${form.cliente}.pdf`
    try {
      await create({ ...form, id: Date.now().toString(), nome: novoNome, dataEnvio: new Date().toISOString().split('T')[0] })
      showToast('Documento cadastrado!')
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function simularUpload(id) {
    try {
      const doc = docs.find(d => d.id === id)
      if (doc) await update(id, { ...doc, status: 'enviado', dataEnvio: new Date().toISOString().split('T')[0] })
      showToast('Documento enviado!')
    } catch {
      showToast('Erro ao enviar documento.', 'error')
    }
  }

  async function aprovar(id) {
    try {
      const doc = docs.find(d => d.id === id)
      if (doc) await update(id, { ...doc, status: 'aprovado' })
      showToast('Documento aprovado!')
    } catch {
      showToast('Erro ao aprovar documento.', 'error')
    }
  }

  const pendentes = docs.filter(d => d.status === 'pendente').length
  const enviados = docs.filter(d => d.status === 'enviado').length
  const aprovados = docs.filter(d => d.status === 'aprovado').length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[['Pendentes', pendentes, 'bg-cyber-amber/5 text-cyber-amber'], ['Enviados', enviados, 'bg-cyber-cyan/5 text-cyber-cyan'], ['Aprovados', aprovados, 'bg-cyber-green/5 text-cyber-green']].map(([l, v, cls]) => (
          <div key={l} className={`rounded-2xl p-4 text-center ${cls}`}>
            <p className="text-2xl font-bold">{v}</p>
            <p className="text-sm font-medium">{l}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documento, cliente, tipo..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option value="todos">Todos</option>
          {['pendente', 'enviado', 'aprovado', 'recusado'].map(s => <option key={s} value={s}>{s}</option>)}
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
                  <Folder size={16} className="text-cyber-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cyber-text truncate">{d.nome}</p>
                  <p className="text-xs text-cyber-muted">{d.tipo} · {d.cliente} {d.apolice ? `· ${d.apolice}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">{statusIcon[d.status]}<span className="text-xs text-cyber-muted hidden sm:block">{d.dataEnvio || 'Sem data'}</span></div>
                  <StatusBadge status={d.status} type="documento" />
                  {d.status === 'pendente' && (
                    <button onClick={() => simularUpload(d.id)} className="flex items-center gap-1 text-xs text-cyber-cyan hover:bg-cyber-cyan/10 px-2 py-1 rounded-lg transition-colors">
                      <Upload size={12} /> Enviar
                    </button>
                  )}
                  {d.status === 'enviado' && (
                    <button onClick={() => aprovar(d.id)} className="flex items-center gap-1 text-xs text-cyber-green hover:bg-cyber-green/10 px-2 py-1 rounded-lg transition-colors">
                      <CheckCircle size={12} /> Aprovar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Novo */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Documento" size="sm"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>Cadastrar</Button></div>}
      >
        <div className="space-y-3">
          <div><label className="hud-label mb-1">Cliente</label>
            <select value={form.clienteId} onChange={e => { const c = clientes.find(c => c.id === e.target.value); setForm(f => ({ ...f, clienteId: e.target.value, cliente: c?.nome || '' })) }} className={inputCls}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div><label className="hud-label mb-1">Tipo de documento</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inputCls}>
              {tiposDoc.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="hud-label mb-1">Nome do arquivo</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} placeholder="Ex: RG João Mendes.pdf" /></div>
          <div className="border-2 border-dashed border-cyber-border rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 transition-colors" onClick={() => showToast('Simulação: arquivo selecionado com sucesso!')}>
            <Upload size={24} className="mx-auto text-cyber-muted mb-2" />
            <p className="text-sm text-cyber-muted">Clique para selecionar ou arraste o arquivo</p>
            <p className="text-xs text-cyber-muted mt-1">PDF, JPG, PNG até 10MB</p>
          </div>
          <div><label className="hud-label mb-1">Observações</label><textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} /></div>
        </div>
      </Modal>
    </div>
  )
}
