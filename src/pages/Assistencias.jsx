import { useState } from 'react'
import { input as inputCls, label as labelCls } from '../lib/styles'
import { Plus, Search, Eye, Edit2, Headphones, Download, Star, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { genNumero } from '../lib/flow'

const statusOpcoes = ['solicitado', 'em_atendimento', 'concluido', 'cancelado']
const prioridades = ['Normal', 'Alta', 'Urgente']

const tiposAssistencia = ['Auto 24h', 'Residencial / Patrimonial', 'Funeral', 'Equipamentos', 'Jurídica', 'Outros']

const servicosPorTipo = {
  'Auto 24h':              ['Reboque', 'Chaveiro', 'Troca de Pneu', 'Pane Seca', 'Bateria', 'Vidros', 'Carro Reserva', 'Pane Mecânica', 'Orientação de Guincho', 'Outros'],
  'Residencial / Patrimonial': ['Chaveiro', 'Eletricista', 'Encanador', 'Vidraceiro', 'Dedetização', 'Pequenos Reparos', 'Vistoria', 'Outros'],
  'Funeral':               ['Translado', 'Urna Funerária', 'Velório', 'Cremação', 'Orientação Funerária', 'Outros'],
  'Equipamentos':          ['Reparo Técnico', 'Substituição de Peça', 'Calibração', 'Manutenção Preventiva', 'Outros'],
  'Jurídica':              ['Orientação Jurídica', 'Advogado de Trânsito', 'Defesa em Acidente', 'Outros'],
  'Outros':                ['Serviço Solicitado', 'Outros'],
}

const emptyForm = {
  apoliceId: '', apolice: '', clienteId: '', cliente: '',
  tipoSeguro: '', seguradora: '',
  tipoAssistencia: 'Auto 24h', tipoServico: 'Reboque',
  status: 'solicitado', prioridade: 'Normal',
  dataHoraSolicitacao: new Date().toISOString().slice(0, 16),
  dataHoraConclusao: '',
  localAtendimento: '',
  prestador: '', telefonePrestador: '',
  tempoConclusaoMin: '', avaliacaoCliente: '',
  responsavel: 'Carlos Silva',
  observacoes: '',
}

function fmtDateTime(dt) {
  if (!dt) return '—'
  const [date, time] = dt.split('T')
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}${time ? ` ${time}` : ''}`
}

function fmtDuracao(min) {
  if (!min && min !== 0) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

const statusColor = {
  solicitado:      'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20',
  em_atendimento:  'bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20',
  concluido:       'bg-cyber-green/10 text-cyber-green border border-cyber-green/20',
  cancelado:       'bg-cyber-muted/10 text-cyber-muted border border-cyber-muted/20',
}

const prioridadeColor = {
  'Normal':  'bg-cyber-surface/60 text-cyber-muted border border-cyber-muted/20',
  'Alta':    'bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20',
  'Urgente': 'bg-cyber-red/10 text-cyber-red border border-cyber-red/20',
}

function StatusChip({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusColor[status] || 'bg-cyber-surface text-cyber-muted'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function PrioridadeChip({ prioridade }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${prioridadeColor[prioridade] || ''}`}>
      {prioridade}
    </span>
  )
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange && onChange(n)}
          className={`cursor-pointer transition-colors ${onChange ? 'hover:text-cyber-amber' : ''} ${Number(value) >= n ? 'text-cyber-amber' : 'text-cyber-border'}`}>
          <Star size={16} fill={Number(value) >= n ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

function exportarCSV(dados) {
  const cab = [
    'Número', 'Apólice', 'Cliente', 'Tipo de Seguro', 'Seguradora',
    'Tipo de Assistência', 'Serviço', 'Status', 'Prioridade',
    'Data/Hora Solicitação', 'Data/Hora Conclusão', 'Local',
    'Prestador', 'Telefone Prestador', 'Tempo (min)', 'Avaliação',
    'Responsável', 'Observações',
  ]
  const linhas = dados.map(a => [
    a.numero, a.apolice, a.cliente, a.tipoSeguro, a.seguradora,
    a.tipoAssistencia, a.tipoServico, a.status.replace(/_/g, ' '), a.prioridade,
    fmtDateTime(a.dataHoraSolicitacao), fmtDateTime(a.dataHoraConclusao),
    `"${(a.localAtendimento || '').replace(/"/g, '""')}"`,
    a.prestador || '', a.telefonePrestador || '',
    a.tempoConclusaoMin ?? '', a.avaliacaoCliente ?? '',
    a.responsavel,
    `"${(a.observacoes || '').replace(/"/g, '""')}"`,
  ])
  const csv = [cab.join(';'), ...linhas.map(l => l.join(';'))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `assistencias_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function Assistencias() {
  const { showToast } = useApp()
  const { data: assistencias, create, update, remove } = useResource('assistencias')
  const { data: usuarios } = useResource('usuarios')
  const { data: apolices } = useResource('apolices')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterPrioridade, setFilterPrioridade] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = assistencias.filter(a => {
    const q = search.toLowerCase()
    const match = !q || a.cliente.toLowerCase().includes(q) || a.numero.toLowerCase().includes(q)
      || a.tipoServico.toLowerCase().includes(q) || (a.prestador || '').toLowerCase().includes(q)
      || a.apolice.toLowerCase().includes(q)
    const matchStatus     = filterStatus === 'todos' || a.status === filterStatus
    const matchTipo       = filterTipo === 'todos' || a.tipoAssistencia === filterTipo
    const matchPrioridade = filterPrioridade === 'todos' || a.prioridade === filterPrioridade
    return match && matchStatus && matchTipo && matchPrioridade
  })

  // Métricas
  const emAtendimento = assistencias.filter(a => ['solicitado', 'em_atendimento'].includes(a.status)).length
  const concluidas    = assistencias.filter(a => a.status === 'concluido').length
  const comAvaliacao  = assistencias.filter(a => a.avaliacaoCliente)
  const mediaAvaliacao = comAvaliacao.length
    ? (comAvaliacao.reduce((s, a) => s + Number(a.avaliacaoCliente), 0) / comAvaliacao.length).toFixed(1)
    : '—'
  const comTempo     = assistencias.filter(a => a.tempoConclusaoMin)
  const mediaTempo   = comTempo.length
    ? Math.round(comTempo.reduce((s, a) => s + Number(a.tempoConclusaoMin), 0) / comTempo.length)
    : null

  function openNew() { setForm(emptyForm); setIsEditing(false); setShowModal(true) }
  function openEdit(a) { setForm({ ...emptyForm, ...a, tempoConclusaoMin: a.tempoConclusaoMin ?? '', avaliacaoCliente: a.avaliacaoCliente ?? '' }); setIsEditing(true); setShowModal(true); setShowDetalhes(false) }
  function openDetalhes(a) { setSelected(a); setShowDetalhes(true) }

  function handleApoliceChange(apoliceId) {
    const ap = apolices.find(a => a.id === apoliceId)
    if (ap) {
      setForm(f => ({ ...f, apoliceId: ap.id, apolice: ap.numero, clienteId: ap.clienteId, cliente: ap.cliente, tipoSeguro: ap.tipoSeguro, seguradora: ap.seguradora }))
    } else {
      setForm(f => ({ ...f, apoliceId: '', apolice: '', clienteId: '', cliente: '', tipoSeguro: '', seguradora: '' }))
    }
  }

  async function handleSave() {
    if (!form.apoliceId)              { showToast('Selecione a apólice.', 'error'); return }
    if (!form.dataHoraSolicitacao)    { showToast('Preencha a data/hora de solicitação.', 'error'); return }
    if (!form.localAtendimento)       { showToast('Preencha o local de atendimento.', 'error'); return }

    const payload = {
      ...form,
      tempoConclusaoMin: form.tempoConclusaoMin !== '' ? Number(form.tempoConclusaoMin) : null,
      avaliacaoCliente: form.avaliacaoCliente !== '' ? Number(form.avaliacaoCliente) : null,
    }

    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...payload })
        showToast('Assistência atualizada!')
      } else {
        await create({
          ...payload,
          id: Date.now().toString(),
          numero: genNumero('ASS', assistencias),
        })
        showToast('Assistência registrada!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Assistência excluída!')
      setConfirmDelete(null)
      if (selected?.id === id) setShowDetalhes(false)
    } catch {
      showToast('Erro ao excluir.', 'error')
    }
  }

  async function atualizarStatus(id, novoStatus) {
    try {
      const a = assistencias.find(a => a.id === id)
      if (a) {
        const updated = await update(id, { ...a, status: novoStatus })
        if (selected?.id === id) setSelected(updated)
      }
      showToast('Status atualizado!')
    } catch {
      showToast('Erro ao atualizar status.', 'error')
    }
  }

  const servicosDisponiveis = servicosPorTipo[form.tipoAssistencia] || []

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente, número, serviço, prestador..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option value="todos">Todos os status</option>
          {statusOpcoes.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option value="todos">Todos os tipos</option>
          {tiposAssistencia.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterPrioridade} onChange={e => setFilterPrioridade(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option value="todos">Toda prioridade</option>
          {prioridades.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => { exportarCSV(filtered); showToast('Exportação gerada!') }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-cyber-border rounded-xl text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 bg-cyber-card transition-colors cursor-pointer whitespace-nowrap">
          <Download size={15} /> Exportar
        </button>
        <Button onClick={openNew} className="flex items-center gap-2 whitespace-nowrap">
          <Plus size={15} /> Nova Assistência
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',          value: assistencias.length,  color: 'text-cyber-text' },
          { label: 'Em Atendimento', value: emAtendimento,        color: 'text-cyber-amber' },
          { label: 'Concluídas',     value: concluidas,           color: 'text-cyber-green' },
          { label: 'Filtradas',      value: filtered.length,      color: 'text-cyber-muted' },
          { label: 'Tempo Médio',    value: mediaTempo ? fmtDuracao(mediaTempo) : '—', color: 'text-cyber-cyan' },
          { label: 'Avaliação Média', value: mediaAvaliacao !== '—' ? `${mediaAvaliacao} ★` : '—', color: 'text-cyber-amber' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <p className={`text-lg font-display font-bold leading-tight ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-cyber-muted uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Headphones size={28} />} title="Nenhuma assistência encontrada" description="Ajuste os filtros ou registre uma nova assistência." />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyber-cyan/10 text-left">
                  {['Número', 'Cliente / Apólice', 'Tipo / Serviço', 'Solicitação', 'Local', 'Prestador', 'Tempo', 'Avaliação', 'Prioridade', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-semibold text-cyber-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-cyan/5">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-cyber-cyan whitespace-nowrap">{a.numero}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-cyber-text text-xs">{a.cliente}</p>
                      <p className="text-[10px] text-cyber-muted">{a.apolice}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-cyber-text">{a.tipoAssistencia}</p>
                      <p className="text-[10px] text-cyber-muted">{a.tipoServico}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-cyber-muted whitespace-nowrap">{fmtDateTime(a.dataHoraSolicitacao)}</td>
                    <td className="px-4 py-3 text-xs text-cyber-muted max-w-36 truncate" title={a.localAtendimento}>{a.localAtendimento || '—'}</td>
                    <td className="px-4 py-3 text-xs text-cyber-text whitespace-nowrap">{a.prestador || <span className="text-cyber-muted">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-cyber-muted whitespace-nowrap">{fmtDuracao(a.tempoConclusaoMin)}</td>
                    <td className="px-4 py-3">
                      {a.avaliacaoCliente
                        ? <StarRating value={a.avaliacaoCliente} />
                        : <span className="text-[10px] text-cyber-muted">—</span>
                      }
                    </td>
                    <td className="px-4 py-3"><PrioridadeChip prioridade={a.prioridade} /></td>
                    <td className="px-4 py-3"><StatusChip status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDetalhes(a)} className="p-1.5 rounded-lg hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer" title="Ver"><Eye size={13} /></button>
                        <button onClick={() => { setSelected(a); openEdit(a) }} className="p-1.5 rounded-lg hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer" title="Editar"><Edit2 size={13} /></button>
                        <button onClick={() => setConfirmDelete(a)} className="p-1.5 rounded-lg hover:bg-cyber-red/10 text-cyber-muted hover:text-cyber-red transition-colors cursor-pointer" title="Excluir"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-cyber-cyan/20 bg-cyber-surface/40">
                  <td colSpan={3} className="px-4 py-2.5 text-[10px] text-cyber-muted uppercase tracking-widest font-semibold">
                    {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                  </td>
                  <td colSpan={2} className="px-4 py-2.5 text-[10px] text-cyber-muted">
                    {filtered.filter(a => ['solicitado', 'em_atendimento'].includes(a.status)).length} em atendimento
                  </td>
                  <td colSpan={2} className="px-4 py-2.5 text-[10px] text-cyber-muted">
                    {filtered.filter(a => a.status === 'concluido').length} concluídas
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

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
          <p className="text-sm text-cyber-text">Excluir a assistência <strong className="text-cyber-red">{confirmDelete.numero}</strong>?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}

      {/* Modal Detalhes */}
      {showDetalhes && selected && (
        <Modal isOpen title={`Assistência ${selected.numero}`} onClose={() => setShowDetalhes(false)} size="lg"
          footer={
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button>
              <Button onClick={() => openEdit(selected)}>Editar</Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Cabeçalho */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><p className={labelCls}>Número</p><p className="text-sm font-mono text-cyber-cyan">{selected.numero}</p></div>
              <div><p className={labelCls}>Status</p><StatusChip status={selected.status} /></div>
              <div><p className={labelCls}>Prioridade</p><PrioridadeChip prioridade={selected.prioridade} /></div>
              <div><p className={labelCls}>Cliente</p><p className="text-sm text-cyber-text">{selected.cliente}</p></div>
              <div><p className={labelCls}>Apólice</p><p className="text-sm text-cyber-text">{selected.apolice}</p></div>
              <div><p className={labelCls}>Seguradora</p><p className="text-sm text-cyber-text">{selected.seguradora}</p></div>
            </div>

            <hr className="border-cyber-cyan/10" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><p className={labelCls}>Tipo de Assistência</p><p className="text-sm font-semibold text-cyber-cyan">{selected.tipoAssistencia}</p></div>
              <div><p className={labelCls}>Serviço</p><p className="text-sm text-cyber-text">{selected.tipoServico}</p></div>
              <div><p className={labelCls}>Responsável</p><p className="text-sm text-cyber-text">{selected.responsavel}</p></div>
              <div><p className={labelCls}>Solicitação</p><p className="text-sm text-cyber-text">{fmtDateTime(selected.dataHoraSolicitacao)}</p></div>
              <div><p className={labelCls}>Conclusão</p><p className="text-sm text-cyber-text">{fmtDateTime(selected.dataHoraConclusao)}</p></div>
              <div><p className={labelCls}>Tempo de Atendimento</p><p className="text-sm text-cyber-text">{fmtDuracao(selected.tempoConclusaoMin)}</p></div>
              <div className="col-span-2 sm:col-span-3">
                <p className={labelCls}>Local de Atendimento</p>
                <p className="text-sm text-cyber-text">{selected.localAtendimento || '—'}</p>
              </div>
            </div>

            {(selected.prestador || selected.telefonePrestador) && (
              <div className="p-3 bg-cyber-surface/40 rounded-xl grid grid-cols-2 gap-3">
                <div><p className={labelCls}>Prestador</p><p className="text-sm text-cyber-text">{selected.prestador}</p></div>
                <div><p className={labelCls}>Telefone do Prestador</p><p className="text-sm text-cyber-text">{selected.telefonePrestador || '—'}</p></div>
              </div>
            )}

            {selected.avaliacaoCliente && (
              <div>
                <p className={labelCls}>Avaliação do Cliente</p>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={selected.avaliacaoCliente} />
                  <span className="text-sm text-cyber-amber font-semibold">{selected.avaliacaoCliente}/5</span>
                </div>
              </div>
            )}

            {selected.observacoes && (
              <div><p className={labelCls}>Observações</p><p className="text-sm text-cyber-muted">{selected.observacoes}</p></div>
            )}

            {/* Alterar status */}
            <div>
              <p className={labelCls}>Alterar Status</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {statusOpcoes.filter(s => s !== selected.status).map(s => (
                  <button key={s} onClick={() => atualizarStatus(selected.id, s)}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-cyber-border hover:border-cyber-cyan/40 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer uppercase tracking-wide">
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Formulário */}
      {showModal && (
        <Modal isOpen title={isEditing ? 'Editar Assistência' : 'Nova Assistência'} onClose={() => setShowModal(false)} size="lg"
          footer={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Registrar'}</Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Apólice */}
            <div>
              <label className={labelCls}>Apólice *</label>
              <select value={form.apoliceId} onChange={e => handleApoliceChange(e.target.value)} className={inputCls}>
                <option value="">Selecione a apólice...</option>
                {apolices.map(a => <option key={a.id} value={a.id}>{a.numero} — {a.cliente} ({a.tipoSeguro})</option>)}
              </select>
            </div>
            {form.cliente && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Cliente</label><p className="text-sm text-cyber-text py-1">{form.cliente}</p></div>
                <div><label className={labelCls}>Seguradora</label><p className="text-sm text-cyber-text py-1">{form.seguradora}</p></div>
              </div>
            )}

            {/* Tipo e Serviço */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo de Assistência *</label>
                <select value={form.tipoAssistencia}
                  onChange={e => setForm(f => ({ ...f, tipoAssistencia: e.target.value, tipoServico: servicosPorTipo[e.target.value]?.[0] || '' }))}
                  className={inputCls}>
                  {tiposAssistencia.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Serviço Solicitado *</label>
                <select value={form.tipoServico} onChange={e => setForm(f => ({ ...f, tipoServico: e.target.value }))} className={inputCls}>
                  {servicosDisponiveis.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Status, Prioridade, Responsável */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  {statusOpcoes.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Prioridade</label>
                <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))} className={inputCls}>
                  {prioridades.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Responsável</label>
                <select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className={inputCls}>
                  {usuarios.map(u => <option key={u.id}>{u.nome}</option>)}
                </select>
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Data/Hora Solicitação *</label>
                <input type="datetime-local" value={form.dataHoraSolicitacao} onChange={e => setForm(f => ({ ...f, dataHoraSolicitacao: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Data/Hora Conclusão</label>
                <input type="datetime-local" value={form.dataHoraConclusao} onChange={e => setForm(f => ({ ...f, dataHoraConclusao: e.target.value }))} className={inputCls} />
              </div>
            </div>

            {/* Local */}
            <div>
              <label className={labelCls}>Local de Atendimento *</label>
              <input value={form.localAtendimento} onChange={e => setForm(f => ({ ...f, localAtendimento: e.target.value }))} placeholder="Endereço, cidade ou referência do local" className={inputCls} />
            </div>

            {/* Prestador */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Prestador / Empresa</label>
                <input value={form.prestador} onChange={e => setForm(f => ({ ...f, prestador: e.target.value }))} placeholder="Nome do prestador" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Telefone do Prestador</label>
                <input value={form.telefonePrestador} onChange={e => setForm(f => ({ ...f, telefonePrestador: e.target.value }))} placeholder="(11) 99999-0000" className={inputCls} />
              </div>
            </div>

            {/* Conclusão */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tempo de Atendimento (min)</label>
                <input type="number" min="1" value={form.tempoConclusaoMin} onChange={e => setForm(f => ({ ...f, tempoConclusaoMin: e.target.value }))} placeholder="Ex: 45" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Avaliação do Cliente (1 a 5)</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <StarRating value={form.avaliacaoCliente} onChange={v => setForm(f => ({ ...f, avaliacaoCliente: v }))} />
                  {form.avaliacaoCliente && <span className="text-sm text-cyber-amber">{form.avaliacaoCliente}/5</span>}
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className={labelCls}>Observações</label>
              <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} placeholder="Detalhes do atendimento, ocorrências, feedback..." className={inputCls + ' resize-none'} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
