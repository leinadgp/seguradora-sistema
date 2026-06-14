import { useState, useEffect } from 'react'
import { Search, DollarSign, Trash2, Plus, Edit2 } from 'lucide-react'
import MetricCard from '../components/ui/MetricCard'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import useResource from '../hooks/useResource'
import { useApp } from '../context/AppContext'
import { input as inputCls } from '../lib/styles'

const statusOpcoes = ['todos', 'prevista', 'recebida', 'paga_corretor', 'atrasada']

const emptyForm = {
  clienteId: '', cliente: '', apolice: '', seguradora: '', corretor: '',
  tipoSeguro: '', valorPremio: '', percentual: '', valor: '',
  status: 'prevista', dataPrevista: '', dataRecebimento: '', observacoes: '',
}

function fmtMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0) }

export default function Comissoes() {
  const { showToast } = useApp()
  const { data: comissoes, create, update, remove } = useResource('comissoes')
  const { data: clientes } = useResource('clientes')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterCorretor, setFilterCorretor] = useState('Todos')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const PER_PAGE = 20
  useEffect(() => { setPage(1) }, [search, filterStatus, filterCorretor])

  // Auto-calcular valor ao mudar prêmio ou percentual
  useEffect(() => {
    const p = parseFloat(form.valorPremio || 0)
    const t = parseFloat(form.percentual || 0)
    if (p > 0 && t > 0) setForm(f => ({ ...f, valor: (p * t / 100).toFixed(2) }))
  }, [form.valorPremio, form.percentual]) // eslint-disable-line

  const corretoresUnicos = ['Todos', ...new Set(comissoes.map(c => c.corretor).filter(Boolean))]

  function openNew() { setForm(emptyForm); setEditando(null); setShowModal(true) }
  function openEdit(c) { setForm({ ...emptyForm, ...c }); setEditando(c); setShowModal(true) }

  async function handleSave() {
    if (!form.cliente) { showToast('Informe o cliente.', 'error'); return }
    if (!form.percentual) { showToast('Informe o percentual de comissão.', 'error'); return }
    try {
      if (editando) {
        await update(editando.id, { ...editando, ...form })
        showToast('Comissão atualizada!')
      } else {
        await create({ ...form, id: `com_${Date.now()}`, createdAt: new Date().toISOString() })
        showToast('Comissão cadastrada!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar.', 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Comissão excluída!')
      setConfirmDelete(null)
    } catch {
      showToast('Erro ao excluir.', 'error')
    }
  }

  const filtered = comissoes.filter(c => {
    const q = search.toLowerCase()
    const match = !q || (c.cliente || '').toLowerCase().includes(q) || (c.seguradora || '').toLowerCase().includes(q) || (c.apolice || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    const matchCorretor = filterCorretor === 'Todos' || c.corretor === filterCorretor
    return match && matchStatus && matchCorretor
  })
  const paginado = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const prevista  = comissoes.filter(c => c.status === 'prevista').reduce((a, c) => a + (Number(c.valor) || 0), 0)
  const recebida  = comissoes.filter(c => ['recebida', 'paga_corretor'].includes(c.status)).reduce((a, c) => a + (Number(c.valor) || 0), 0)
  const pendente  = comissoes.filter(c => c.status === 'prevista').reduce((a, c) => a + (Number(c.valor) || 0), 0)
  const atrasada  = comissoes.filter(c => c.status === 'atrasada').reduce((a, c) => a + (Number(c.valor) || 0), 0)

  const porCorretor = [...new Set(comissoes.map(c => c.corretor).filter(Boolean))].map(nome => ({
    nome,
    total: comissoes.filter(c => c.corretor === nome).reduce((a, c) => a + (Number(c.valor) || 0), 0),
    qtd: comissoes.filter(c => c.corretor === nome).length,
  })).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-5">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Comissão Prevista" value={fmtMoeda(prevista)} icon={<DollarSign size={18} />} color="blue" subtitle="A receber" />
        <MetricCard title="Comissão Recebida" value={fmtMoeda(recebida)} icon={<DollarSign size={18} />} color="green" subtitle="No período" />
        <MetricCard title="Pendente" value={fmtMoeda(pendente)} icon={<DollarSign size={18} />} color="yellow" />
        <MetricCard title="Atrasada" value={fmtMoeda(atrasada)} icon={<DollarSign size={18} />} color="red" />
      </div>

      {/* Por corretor */}
      {porCorretor.length > 0 && (
        <div className="bg-cyber-card rounded-2xl p-5 shadow-card border border-cyber-border/40">
          <h3 className="text-sm font-semibold text-cyber-text mb-4">Comissão por Corretor</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {porCorretor.map(c => (
              <div key={c.nome} className="text-center p-3 bg-cyber-surface/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                  {c.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <p className="text-xs text-cyber-muted mb-0.5">{c.nome.split(' ')[0]}</p>
                <p className="text-sm font-bold text-cyber-text">{fmtMoeda(c.total)}</p>
                <p className="text-xs text-cyber-muted">{c.qtd} comissões</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros + botão */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, apólice, seguradora..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          {statusOpcoes.map(s => <option key={s} value={s}>{s === 'todos' ? 'Todos os status' : s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterCorretor} onChange={e => setFilterCorretor(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          {corretoresUnicos.map(c => <option key={c}>{c}</option>)}
        </select>
        <Button onClick={openNew} icon={<Plus size={16} />}>Nova Comissão</Button>
      </div>

      {/* Tabela */}
      <div className="bg-cyber-card rounded-2xl shadow-card border border-cyber-border/40 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border/40">
                {['Apólice', 'Cliente', 'Seguradora', 'Corretor', 'Prêmio', 'Comissão %', 'Valor', 'Data Prevista', 'Recebimento', 'Status', ''].map(h => (
                  <th key={h} className="text-left hud-label px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/20">
              {paginado.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-data text-cyber-muted">{c.apolice || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-cyber-text">{c.cliente}</td>
                  <td className="px-4 py-3 text-sm text-cyber-muted">{c.seguradora || '—'}</td>
                  <td className="px-4 py-3 text-sm text-cyber-muted">{(c.corretor || '').split(' ')[0] || '—'}</td>
                  <td className="px-4 py-3 text-sm text-cyber-text/80">{fmtMoeda(c.valorPremio)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-cyber-text/80">{c.percentual || 0}%</td>
                  <td className="px-4 py-3 text-sm font-bold text-cyber-green">{fmtMoeda(c.valor)}</td>
                  <td className="px-4 py-3 text-xs text-cyber-muted">{c.dataPrevista || '—'}</td>
                  <td className="px-4 py-3 text-xs text-cyber-muted">{c.dataRecebimento || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} type="comissao" /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg transition-colors" title="Editar"><Edit2 size={13} /></button>
                      <button onClick={() => setConfirmDelete(c)} className="p-1.5 text-cyber-muted hover:text-cyber-red hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-cyber-border/30">
          {paginado.map(c => (
            <div key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-medium text-cyber-text">{c.cliente}</p>
                  <p className="text-xs text-cyber-muted">{c.apolice || '—'} · {c.seguradora || '—'}</p>
                </div>
                <StatusBadge status={c.status} type="comissao" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-cyber-muted">Prêmio: {fmtMoeda(c.valorPremio)}</span>
                <span className="text-sm font-bold text-cyber-green">{fmtMoeda(c.valor)}</span>
              </div>
              <p className="text-xs text-cyber-muted mt-1">Corretor: {c.corretor || '—'} · {c.percentual || 0}%</p>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => openEdit(c)} className="p-1.5 text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg transition-colors"><Edit2 size={13} /></button>
                <button onClick={() => setConfirmDelete(c)} className="p-1.5 text-cyber-muted hover:text-cyber-red hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-cyber-muted text-sm">Nenhuma comissão encontrada.</div>
        )}
      </div>

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      {/* Modal Criar/Editar */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editando ? 'Editar Comissão' : 'Nova Comissão'} size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editando ? 'Salvar Alterações' : 'Cadastrar'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="hud-label mb-1">Cliente *</label>
              <input
                list="com-clientes-list"
                value={form.cliente}
                onChange={e => {
                  const cli = clientes.find(c => c.nome === e.target.value)
                  setForm(f => ({ ...f, cliente: e.target.value, clienteId: cli?.id || '' }))
                }}
                placeholder="Digite o nome do cliente"
                className={inputCls}
              />
              <datalist id="com-clientes-list">
                {clientes.map(c => <option key={c.id} value={c.nome} />)}
              </datalist>
            </div>
            <div>
              <label className="hud-label mb-1">Nº Apólice</label>
              <input value={form.apolice} onChange={e => setForm(f => ({ ...f, apolice: e.target.value }))} placeholder="Ex: AP-2024-001" className={inputCls} />
            </div>
            <div>
              <label className="hud-label mb-1">Seguradora</label>
              <input value={form.seguradora} onChange={e => setForm(f => ({ ...f, seguradora: e.target.value }))} placeholder="Ex: Porto Seguro" className={inputCls} />
            </div>
            <div>
              <label className="hud-label mb-1">Corretor</label>
              <input value={form.corretor} onChange={e => setForm(f => ({ ...f, corretor: e.target.value }))} placeholder="Nome do corretor" className={inputCls} />
            </div>
            <div>
              <label className="hud-label mb-1">Tipo de Seguro</label>
              <input value={form.tipoSeguro} onChange={e => setForm(f => ({ ...f, tipoSeguro: e.target.value }))} placeholder="Ex: Auto" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="hud-label mb-1">Prêmio (R$)</label>
              <input type="number" step="0.01" value={form.valorPremio} onChange={e => setForm(f => ({ ...f, valorPremio: e.target.value }))} placeholder="0,00" className={inputCls} />
            </div>
            <div>
              <label className="hud-label mb-1">Taxa (%)*</label>
              <input type="number" step="0.1" value={form.percentual} onChange={e => setForm(f => ({ ...f, percentual: e.target.value }))} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className="hud-label mb-1">Valor Comissão</label>
              <input
                readOnly
                value={form.valor ? `R$ ${parseFloat(form.valor).toFixed(2).replace('.', ',')}` : ''}
                className={inputCls + ' bg-cyber-surface/60 cursor-default text-cyber-green font-semibold'}
                placeholder="Calculado automaticamente"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="hud-label mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                <option value="prevista">Prevista</option>
                <option value="recebida">Recebida</option>
                <option value="paga_corretor">Paga ao Corretor</option>
                <option value="atrasada">Atrasada</option>
              </select>
            </div>
            <div>
              <label className="hud-label mb-1">Data Prevista</label>
              <input type="date" value={form.dataPrevista} onChange={e => setForm(f => ({ ...f, dataPrevista: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="hud-label mb-1">Data Recebimento</label>
              <input type="date" value={form.dataRecebimento} onChange={e => setForm(f => ({ ...f, dataRecebimento: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="hud-label mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} placeholder="Notas adicionais..." />
          </div>
        </div>
      </Modal>

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
          <p className="text-sm text-cyber-text">Excluir a comissão de <strong className="text-cyber-red">"{confirmDelete.cliente}"</strong> ({confirmDelete.apolice || '—'})?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}
    </div>
  )
}
