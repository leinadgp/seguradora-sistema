import { useState } from 'react'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, CheckSquare, Phone, MessageSquare, Mail, RefreshCw, DollarSign, Folder, Users, Calendar } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'

const tipoIcon = {
  ligacao: <Phone size={14} className="text-cyber-cyan" />,
  whatsapp: <MessageSquare size={14} className="text-green-500" />,
  email: <Mail size={14} className="text-orange-500" />,
  renovacao: <RefreshCw size={14} className="text-purple-500" />,
  cobranca: <DollarSign size={14} className="text-cyber-red" />,
  documento: <Folder size={14} className="text-amber-500" />,
  reuniao: <Users size={14} className="text-indigo-500" />,
  cotacao: <CheckSquare size={14} className="text-teal-500" />,
}

const prioridades = { alta: 'text-cyber-red bg-red-50', media: 'text-cyber-amber bg-cyber-amber/5', baixa: 'text-cyber-muted bg-cyber-surface/50' }
const tipos = ['ligacao', 'whatsapp', 'email', 'renovacao', 'cobranca', 'documento', 'reuniao', 'cotacao']
const responsaveis = ['Carlos Silva', 'Ana Santos', 'Pedro Lima', 'Roberto Alves', 'Fernanda Costa']

const emptyForm = { titulo: '', descricao: '', cliente: '', clienteId: '', responsavel: 'Carlos Silva', tipo: 'ligacao', prioridade: 'media', data: '', horario: '', status: 'pendente' }

const hoje = new Date().toISOString().split('T')[0]

export default function Tarefas() {
  const { showToast } = useApp()
  const { data: tarefas, create, update } = useResource('tarefas')
  const { data: clientes } = useResource('clientes')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterResp, setFilterResp] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [selected, setSelected] = useState(null)

  const filtered = tarefas.filter(t => {
    const q = search.toLowerCase()
    const match = !q || t.titulo.toLowerCase().includes(q) || t.cliente?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || t.status === filterStatus
    const matchResp = filterResp === 'Todos' || t.responsavel === filterResp
    return match && matchStatus && matchResp
  })

  const atrasadas = filtered.filter(t => t.status === 'atrasada')
  const hoje_tarefas = filtered.filter(t => t.data === hoje && t.status !== 'atrasada')
  const futuras = filtered.filter(t => t.data > hoje && t.status !== 'concluida')

  function openNew() { setForm(emptyForm); setIsEditing(false); setShowModal(true) }
  function openEdit(t) { setForm({ ...emptyForm, ...t }); setIsEditing(true); setSelected(t); setShowModal(true) }

  async function handleSave() {
    if (!form.titulo) { showToast('Preencha o título.', 'error'); return }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form })
        showToast('Tarefa atualizada!')
      } else {
        await create({ ...form, id: Date.now().toString() })
        showToast('Tarefa criada!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function concluir(id) {
    try {
      const t = tarefas.find(t => t.id === id)
      if (t) await update(id, { ...t, status: 'concluida' })
      showToast('Tarefa concluída!')
    } catch {
      showToast('Erro ao concluir tarefa.', 'error')
    }
  }

  function TarefaCard({ t }) {
    return (
      <div className={`bg-cyber-card rounded-2xl p-4 shadow-card border transition-all duration-200 hover:shadow-card-md hover:-translate-y-0.5 ${t.status === 'atrasada' ? 'border-red-200' : 'border-cyber-border/40'}`}>
        <div className="flex items-start gap-3">
          <button onClick={() => concluir(t.id)} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${t.status === 'concluida' ? 'bg-cyber-green/50 border-cyber-green' : 'border-cyber-border hover:border-cyber-green'}`}>
            {t.status === 'concluida' && <CheckSquare size={12} className="text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {tipoIcon[t.tipo]}
              <p className={`text-sm font-medium ${t.status === 'concluida' ? 'line-through text-cyber-muted' : 'text-cyber-text'}`}>{t.titulo}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioridades[t.prioridade]}`}>{t.prioridade}</span>
            </div>
            {t.cliente && <p className="text-xs text-cyber-muted">{t.cliente}</p>}
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-cyber-muted">
              <span><Calendar size={10} className="inline mr-0.5" />{t.data} {t.horario}</span>
              <span>·</span>
              <span>{t.responsavel?.split(' ')[0]}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={t.status} type="tarefa" />
            <button onClick={() => openEdit(t)} className="p-1.5 text-cyber-muted hover:text-cyber-muted hover:bg-slate-100 rounded-lg ml-1 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarefa, cliente..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option value="todos">Todos</option>
          <option value="pendente">Pendentes</option>
          <option value="atrasada">Atrasadas</option>
          <option value="concluida">Concluídas</option>
        </select>
        <select value={filterResp} onChange={e => setFilterResp(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option>Todos</option>
          {responsaveis.map(r => <option key={r}>{r}</option>)}
        </select>
        <Button onClick={openNew} icon={<Plus size={16} />}>Nova Tarefa</Button>
      </div>

      {atrasadas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cyber-red mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyber-red inline-block" /> Atrasadas ({atrasadas.length})
          </h3>
          <div className="space-y-2">{atrasadas.map(t => <TarefaCard key={t.id} t={t} />)}</div>
        </div>
      )}

      {hoje_tarefas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cyber-text/80 mb-2">Hoje ({hoje_tarefas.length})</h3>
          <div className="space-y-2">{hoje_tarefas.map(t => <TarefaCard key={t.id} t={t} />)}</div>
        </div>
      )}

      {futuras.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cyber-muted mb-2">Próximas ({futuras.length})</h3>
          <div className="space-y-2">{futuras.slice(0, 10).map(t => <TarefaCard key={t.id} t={t} />)}</div>
        </div>
      )}

      {filtered.length === 0 && <EmptyState icon={<CheckSquare size={28} />} title="Nenhuma tarefa" description="Crie uma nova tarefa para começar." action={<Button onClick={openNew} icon={<Plus size={16} />}>Nova Tarefa</Button>} />}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Tarefa' : 'Nova Tarefa'} size="sm"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Criar Tarefa'}</Button></div>}
      >
        <div className="space-y-3">
          <div><label className="hud-label mb-1">Título *</label><input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className={inputCls} /></div>
          <div><label className="hud-label mb-1">Descrição</label><textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} className={inputCls + ' resize-none'} /></div>
          <div><label className="hud-label mb-1">Cliente</label>
            <select value={form.clienteId} onChange={e => { const c = clientes.find(c => c.id === e.target.value); setForm(f => ({ ...f, clienteId: e.target.value, cliente: c?.nome || '' })) }} className={inputCls}>
              <option value="">— Nenhum —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="hud-label mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inputCls}>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="hud-label mb-1">Prioridade</label>
              <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))} className={inputCls}>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div><label className="hud-label mb-1">Data</label><input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Horário</label><input type="time" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Responsável</label>
              <select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className={inputCls}>
                {responsaveis.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="hud-label mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                <option value="pendente">Pendente</option>
                <option value="concluida">Concluída</option>
                <option value="atrasada">Atrasada</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
