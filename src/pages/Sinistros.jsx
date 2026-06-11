import { useState, useEffect } from 'react'
import { input as inputCls, label as labelCls } from '../lib/styles'
import { Plus, Search, Eye, Edit2, AlertTriangle, Download, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import DynamicForm from '../components/ui/DynamicForm'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { useCatalogo } from '../hooks/useCatalogo'
import { sinistroTypeFields } from '../data/insuranceFields'
import { genNumero, logEvento, todayISO } from '../lib/flow'

const statusOpcoes = ['aberto', 'em_analise', 'aguardando_documentos', 'aguardando_seguradora', 'aprovado', 'negado', 'indenizado', 'encerrado']
const prioridades = ['Baixa', 'Normal', 'Alta', 'Urgente']

const emptyForm = {
  apoliceId: '', apolice: '', clienteId: '', cliente: '', seguradora: '',
  tipoSinistro: 'Auto', causaSinistro: '',
  prioridade: 'Normal', status: 'aberto',
  dataOcorrido: '', horaOcorrido: '', localOcorrido: '',
  descricao: '', valorEstimado: '',
  responsavel: 'Carlos Silva',
  numeroBo: '', protocoloSeguradora: '',
  perito: '', dataVistoria: '',
  valorIndenizado: '', dataIndenizacao: '',
  documentosPendentes: '', proximaAcao: '', dataProximaAcao: '',
  observacoes: '',
}

const ABAS_FORM = ['Dados Gerais', 'Detalhes Específicos', 'Acompanhamento']

function fmtMoeda(v) {
  if (!v && v !== 0) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const prioridadeColor = {
  'Baixa':   'bg-cyber-surface/60 text-cyber-muted border border-cyber-muted/20',
  'Normal':  'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20',
  'Alta':    'bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20',
  'Urgente': 'bg-cyber-red/10 text-cyber-red border border-cyber-red/20',
}

const statusColor = {
  aberto:                  'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20',
  em_analise:              'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  aguardando_documentos:   'bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20',
  aguardando_seguradora:   'bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20',
  aprovado:                'bg-cyber-green/10 text-cyber-green border border-cyber-green/20',
  negado:                  'bg-cyber-red/10 text-cyber-red border border-cyber-red/20',
  indenizado:              'bg-cyber-green/10 text-cyber-green border border-cyber-green/20',
  encerrado:               'bg-cyber-muted/10 text-cyber-muted border border-cyber-muted/20',
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

function exportarCSV(dados) {
  const cab = [
    'Número', 'Apólice', 'Cliente', 'Seguradora', 'Tipo de Seguro', 'Causa',
    'Prioridade', 'Status', 'Data Ocorrido', 'Hora', 'Local', 'Abertura',
    'Valor Estimado (R$)', 'Valor Indenizado (R$)', 'Data Indenização',
    'Responsável', 'Protocolo Seguradora', 'Nº B.O.', 'Perito', 'Data Vistoria',
    'Próxima Ação', 'Observações',
  ]
  const linhas = dados.map(s => [
    s.numero, s.apolice, s.cliente, s.seguradora || '',
    s.tipoSinistro, s.causaSinistro || '',
    s.prioridade || '', s.status.replace(/_/g, ' '),
    fmtDate(s.dataOcorrido), s.horaOcorrido || '', `"${(s.localOcorrido || '').replace(/"/g, '""')}"`,
    fmtDate(s.dataAbertura),
    (s.valorEstimado || 0).toString().replace('.', ','),
    (s.valorIndenizado || 0).toString().replace('.', ','),
    fmtDate(s.dataIndenizacao),
    s.responsavel, s.protocoloSeguradora || '', s.numeroBo || '',
    s.perito || '', fmtDate(s.dataVistoria),
    `"${(s.proximaAcao || '').replace(/"/g, '""')}"`,
    `"${(s.observacoes || '').replace(/"/g, '""')}"`,
  ])
  const csv = [cab.join(';'), ...linhas.map(l => l.join(';'))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `sinistros_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function Sinistros() {
  const { showToast } = useApp()
  const { data: sinistros, create, update, remove } = useResource('sinistros')
  const { data: usuarios } = useResource('usuarios')
  const { data: apolices } = useResource('apolices')
  const { getTipos, catalogo } = useCatalogo()
  // Tipos ativos para formulário; todos os tipos (incl. legados) para o filtro
  const tiposSinistroForm = [...new Set([...getTipos(), 'Outros'])]
  const tiposSinistroFiltro = [...new Set([...catalogo.map(c => c.tipo), 'Outros'])]
  const { data: clientes } = useResource('clientes')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterPrioridade, setFilterPrioridade] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [aba, setAba] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 20
  useEffect(() => { setPage(1) }, [search, filterStatus, filterTipo, filterPrioridade])

  const filtered = sinistros.filter(s => {
    const q = search.toLowerCase()
    const match = !q || s.cliente.toLowerCase().includes(q) || s.numero.toLowerCase().includes(q)
      || s.tipoSinistro.toLowerCase().includes(q) || (s.causaSinistro || '').toLowerCase().includes(q)
      || (s.protocoloSeguradora || '').toLowerCase().includes(q)
    const matchStatus     = filterStatus === 'todos' || s.status === filterStatus
    const matchTipo       = filterTipo === 'todos' || s.tipoSinistro === filterTipo
    const matchPrioridade = filterPrioridade === 'todos' || s.prioridade === filterPrioridade
    return match && matchStatus && matchTipo && matchPrioridade
  })
  const paginado = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const emAberto     = sinistros.filter(s => !['encerrado', 'indenizado', 'negado'].includes(s.status)).length
  const urgentes     = sinistros.filter(s => s.prioridade === 'Urgente' && !['encerrado', 'indenizado', 'negado'].includes(s.status)).length
  const totalEstimado  = sinistros.reduce((a, s) => a + (Number(s.valorEstimado) || 0), 0)
  const totalIndenizado = sinistros.reduce((a, s) => a + (Number(s.valorIndenizado) || 0), 0)

  function openNew() { setForm(emptyForm); setIsEditing(false); setAba(0); setShowModal(true) }

  function openEdit(s) {
    setForm({
      ...emptyForm, ...s,
      documentosPendentes: Array.isArray(s.documentosPendentes) ? s.documentosPendentes.join(', ') : (s.documentosPendentes || ''),
      valorEstimado: s.valorEstimado ?? '',
      valorIndenizado: s.valorIndenizado ?? '',
    })
    setIsEditing(true); setAba(0); setShowModal(true); setShowDetalhes(false)
  }

  function handleApoliceChange(apoliceId) {
    const ap = apolices.find(a => a.id === apoliceId)
    if (ap) {
      setForm(f => ({ ...f, apoliceId: ap.id, apolice: ap.numero, clienteId: ap.clienteId, cliente: ap.cliente, seguradora: ap.seguradora, tipoSinistro: ap.tipoSeguro || f.tipoSinistro }))
    } else {
      setForm(f => ({ ...f, apoliceId: '', apolice: '', clienteId: '', cliente: '', seguradora: '' }))
    }
  }

  async function handleSave() {
    if (!form.cliente) { showToast('Selecione o cliente ou apólice.', 'error'); return }
    if (!form.dataOcorrido) { showToast('Preencha a data do ocorrido.', 'error'); return }
    if (!form.descricao) { showToast('Preencha a descrição do sinistro.', 'error'); return }

    const docsPendentes = form.documentosPendentes
      ? form.documentosPendentes.split(',').map(d => d.trim()).filter(Boolean)
      : []

    const payload = {
      ...form,
      documentosPendentes: docsPendentes,
      valorEstimado: Number(form.valorEstimado) || null,
      valorIndenizado: Number(form.valorIndenizado) || null,
    }

    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...payload })
        await logEvento('sinistro', selected.id, 'Sinistro atualizado', `Sinistro ${selected.numero} atualizado.`)
        showToast('Sinistro atualizado!')
      } else {
        const id = Date.now().toString()
        const numero = genNumero('SIN', sinistros)
        await create({
          ...payload,
          id,
          numero,
          dataAbertura: todayISO(),
          timeline: [{ data: todayISO(), acao: 'Sinistro registrado', responsavel: form.responsavel }],
        })
        await logEvento('sinistro', id, 'Sinistro registrado', `Sinistro ${numero} (${payload.tipoSinistro}) registrado para ${payload.cliente}.`)
        showToast('Sinistro registrado!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Sinistro excluído!')
      setConfirmDelete(null)
      if (selected?.id === id) setShowDetalhes(false)
    } catch {
      showToast('Erro ao excluir.', 'error')
    }
  }

  async function atualizarStatus(id, novoStatus) {
    try {
      const s = sinistros.find(s => s.id === id)
      if (s) {
        const novaEntrada = { data: todayISO(), acao: `Status alterado para: ${novoStatus.replace(/_/g, ' ')}`, responsavel: s.responsavel || 'Sistema' }
        const timeline = [...(Array.isArray(s.timeline) ? s.timeline : []), novaEntrada]
        const updated = await update(id, { ...s, status: novoStatus, timeline })
        await logEvento('sinistro', id, 'Status atualizado', `Status do sinistro ${s.numero} alterado para "${novoStatus.replace(/_/g, ' ')}".`)
        if (selected?.id === id) setSelected(updated)
      }
      showToast('Status atualizado!')
    } catch {
      showToast('Erro ao atualizar status.', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente, número, causa, protocolo..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option value="todos">Todos os status</option>
          {statusOpcoes.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option value="todos">Todos os tipos</option>
          {tiposSinistroFiltro.map(t => <option key={t} value={t}>{t}</option>)}
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
          <Plus size={15} /> Novo Sinistro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: sinistros.length, color: 'text-cyber-text' },
          { label: 'Em Aberto', value: emAberto, color: 'text-cyber-cyan' },
          { label: 'Urgentes', value: urgentes, color: 'text-cyber-red' },
          { label: 'Filtrados', value: filtered.length, color: 'text-cyber-muted' },
          { label: 'Valor Estimado', value: fmtMoeda(totalEstimado), color: 'text-cyber-amber' },
          { label: 'Indenizado', value: fmtMoeda(totalIndenizado), color: 'text-cyber-green' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <p className={`text-lg font-display font-bold leading-tight ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-cyber-muted uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <EmptyState icon={<AlertTriangle size={28} />} title="Nenhum sinistro encontrado" description="Ajuste os filtros ou registre um novo sinistro." />
      ) : (
        <>
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyber-cyan/10 text-left">
                  {['Número', 'Cliente / Apólice', 'Tipo / Causa', 'Ocorrido', 'Estimado', 'Indenizado', 'Prioridade', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-semibold text-cyber-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-cyan/5">
                {paginado.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-cyber-cyan whitespace-nowrap">{s.numero}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-cyber-text text-xs">{s.cliente}</p>
                      <p className="text-[10px] text-cyber-muted">{s.apolice}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-cyber-text">{s.tipoSinistro}</p>
                      {s.causaSinistro && <p className="text-[10px] text-cyber-muted">{s.causaSinistro}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-cyber-muted whitespace-nowrap">{fmtDate(s.dataOcorrido)}</td>
                    <td className="px-4 py-3 text-xs text-cyber-amber whitespace-nowrap">{fmtMoeda(s.valorEstimado)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {s.valorIndenizado
                        ? <span className="text-cyber-green">{fmtMoeda(s.valorIndenizado)}</span>
                        : <span className="text-cyber-muted">—</span>}
                    </td>
                    <td className="px-4 py-3"><PrioridadeChip prioridade={s.prioridade || 'Normal'} /></td>
                    <td className="px-4 py-3"><StatusChip status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelected(s); setShowDetalhes(true) }}
                          className="p-1.5 rounded-lg hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer" title="Ver">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => { setSelected(s); openEdit(s) }}
                          className="p-1.5 rounded-lg hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer" title="Editar">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setConfirmDelete(s)}
                          className="p-1.5 rounded-lg hover:bg-cyber-red/10 text-cyber-muted hover:text-cyber-red transition-colors cursor-pointer" title="Excluir">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-cyber-cyan/20 bg-cyber-surface/40">
                  <td colSpan={4} className="px-4 py-2.5 text-[10px] text-cyber-muted uppercase tracking-widest font-semibold">
                    {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-cyber-amber whitespace-nowrap">
                    {fmtMoeda(filtered.reduce((a, s) => a + (Number(s.valorEstimado) || 0), 0))}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-cyber-green whitespace-nowrap">
                    {fmtMoeda(filtered.reduce((a, s) => a + (Number(s.valorIndenizado) || 0), 0))}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
        </>
      )}

      {/* Modal Detalhes */}
      {showDetalhes && selected && (
        <Modal isOpen title={`Sinistro ${selected.numero}`} onClose={() => setShowDetalhes(false)} size="xl"
          footer={
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button>
              <Button onClick={() => openEdit(selected)}>Editar</Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Cabeçalho */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><p className={labelCls}>Número</p><p className="text-sm font-mono text-cyber-cyan">{selected.numero}</p></div>
              <div><p className={labelCls}>Apólice</p><p className="text-sm text-cyber-text">{selected.apolice}</p></div>
              <div><p className={labelCls}>Status</p><StatusChip status={selected.status} /></div>
              <div><p className={labelCls}>Prioridade</p><PrioridadeChip prioridade={selected.prioridade || 'Normal'} /></div>
              <div><p className={labelCls}>Cliente</p><p className="text-sm text-cyber-text">{selected.cliente}</p></div>
              <div><p className={labelCls}>Seguradora</p><p className="text-sm text-cyber-text">{selected.seguradora}</p></div>
              <div><p className={labelCls}>Tipo de Seguro</p><p className="text-sm text-cyber-text">{selected.tipoSinistro}</p></div>
              <div><p className={labelCls}>Causa</p><p className="text-sm text-cyber-text">{selected.causaSinistro || '—'}</p></div>
            </div>

            <hr className="border-cyber-cyan/10" />

            {/* Ocorrência */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><p className={labelCls}>Data Ocorrido</p><p className="text-sm text-cyber-text">{fmtDate(selected.dataOcorrido)}{selected.horaOcorrido && ` às ${selected.horaOcorrido}`}</p></div>
              <div><p className={labelCls}>Data Abertura</p><p className="text-sm text-cyber-text">{fmtDate(selected.dataAbertura)}</p></div>
              <div className="col-span-2"><p className={labelCls}>Local do Ocorrido</p><p className="text-sm text-cyber-text">{selected.localOcorrido || '—'}</p></div>
              <div><p className={labelCls}>Valor Estimado</p><p className="text-sm font-semibold text-cyber-amber">{fmtMoeda(selected.valorEstimado)}</p></div>
              <div><p className={labelCls}>Valor Indenizado</p><p className="text-sm font-semibold text-cyber-green">{selected.valorIndenizado ? fmtMoeda(selected.valorIndenizado) : '—'}</p></div>
              {selected.dataIndenizacao && <div><p className={labelCls}>Data Indenização</p><p className="text-sm text-cyber-green">{fmtDate(selected.dataIndenizacao)}</p></div>}
              <div><p className={labelCls}>Responsável</p><p className="text-sm text-cyber-text">{selected.responsavel}</p></div>
            </div>

            {selected.descricao && (
              <div><p className={labelCls}>Descrição</p><p className="text-sm text-cyber-text bg-cyber-surface/40 p-3 rounded-xl">{selected.descricao}</p></div>
            )}

            <hr className="border-cyber-cyan/10" />

            {/* Gestão do sinistro */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selected.protocoloSeguradora && <div><p className={labelCls}>Protocolo Seguradora</p><p className="text-sm font-mono text-cyber-cyan">{selected.protocoloSeguradora}</p></div>}
              {selected.numeroBo && <div><p className={labelCls}>Nº B.O.</p><p className="text-sm text-cyber-text">{selected.numeroBo}</p></div>}
              {selected.perito && <div><p className={labelCls}>Perito</p><p className="text-sm text-cyber-text">{selected.perito}</p></div>}
              {selected.dataVistoria && <div><p className={labelCls}>Data Vistoria</p><p className="text-sm text-cyber-text">{fmtDate(selected.dataVistoria)}</p></div>}
            </div>

            {selected.documentosPendentes?.length > 0 && (
              <div className="p-3 bg-cyber-amber/5 rounded-xl border border-cyber-amber/10">
                <p className="text-xs font-semibold text-cyber-amber mb-2 uppercase tracking-wide">Documentos Pendentes</p>
                <ul className="space-y-1">
                  {(Array.isArray(selected.documentosPendentes) ? selected.documentosPendentes : [selected.documentosPendentes]).map(d => (
                    <li key={d} className="text-sm text-cyber-amber flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyber-amber shrink-0" />{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {(selected.proximaAcao || selected.observacoes) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selected.proximaAcao && (
                  <div>
                    <p className={labelCls}>Próxima Ação{selected.dataProximaAcao && ` — até ${fmtDate(selected.dataProximaAcao)}`}</p>
                    <p className="text-sm text-cyber-text">{selected.proximaAcao}</p>
                  </div>
                )}
                {selected.observacoes && (
                  <div><p className={labelCls}>Observações</p><p className="text-sm text-cyber-muted">{selected.observacoes}</p></div>
                )}
              </div>
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

            {/* Timeline */}
            {selected.timeline?.length > 0 && (
              <div>
                <p className={labelCls + ' mb-3'}>Linha do Tempo</p>
                <div className="space-y-0">
                  {selected.timeline.map((t, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-cyber-cyan/60 mt-1.5 shrink-0" />
                        {i < selected.timeline.length - 1 && <div className="w-px bg-cyber-cyan/10 flex-1 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-medium text-cyber-text">{t.acao}</p>
                        <p className="text-[10px] text-cyber-muted">{fmtDate(t.data)} · {t.responsavel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
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
          <p className="text-sm text-cyber-text">Excluir o sinistro <strong className="text-cyber-red">{confirmDelete.numero}</strong>?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}

      {/* Modal Formulário */}
      {showModal && (
        <Modal isOpen title={isEditing ? 'Editar Sinistro' : 'Novo Sinistro'} onClose={() => setShowModal(false)} size="xl"
          footer={
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {aba > 0 && <Button variant="secondary" onClick={() => setAba(a => a - 1)}>Anterior</Button>}
                {aba < ABAS_FORM.length - 1 && <Button onClick={() => setAba(a => a + 1)}>Próximo</Button>}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Registrar'}</Button>
              </div>
            </div>
          }
        >
          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-cyber-cyan/10">
            {ABAS_FORM.map((a, i) => (
              <button key={a} onClick={() => setAba(i)}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer ${aba === i ? 'bg-cyber-cyan/10 text-cyber-cyan border-b-2 border-cyber-cyan' : 'text-cyber-muted hover:text-cyber-text'}`}>
                {i + 1}. {a}
              </button>
            ))}
          </div>

          {/* Aba 0: Dados Gerais */}
          {aba === 0 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Apólice *</label>
                <select value={form.apoliceId} onChange={e => handleApoliceChange(e.target.value)} className={inputCls}>
                  <option value="">Selecione a apólice (ou preencha manualmente abaixo)...</option>
                  {apolices.map(a => <option key={a.id} value={a.id}>{a.numero} — {a.cliente} ({a.tipoSeguro})</option>)}
                </select>
              </div>
              {!form.apoliceId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Cliente *</label>
                    <select value={form.clienteId} onChange={e => { const c = clientes.find(c => c.id === e.target.value); setForm(f => ({ ...f, clienteId: e.target.value, cliente: c?.nome || '' })) }} className={inputCls}>
                      <option value="">Selecione...</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Nº Apólice</label>
                    <input value={form.apolice} onChange={e => setForm(f => ({ ...f, apolice: e.target.value }))} placeholder="AP-2024-0001" className={inputCls} />
                  </div>
                </div>
              )}
              {form.cliente && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Cliente</label><p className="text-sm text-cyber-text py-1">{form.cliente}</p></div>
                  <div><label className={labelCls}>Seguradora</label><p className="text-sm text-cyber-text py-1">{form.seguradora || '—'}</p></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tipo de Seguro *</label>
                  <select value={form.tipoSinistro} onChange={e => setForm(f => ({ ...f, tipoSinistro: e.target.value }))} className={inputCls}>
                    {tiposSinistroForm.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Causa do Sinistro</label>
                  <input value={form.causaSinistro} onChange={e => setForm(f => ({ ...f, causaSinistro: e.target.value }))} placeholder="Ex: Colisão, Furto, Incêndio, Alagamento..." className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Prioridade</label>
                  <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))} className={inputCls}>
                    {prioridades.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {statusOpcoes.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Data do Ocorrido *</label>
                  <input type="date" value={form.dataOcorrido} onChange={e => setForm(f => ({ ...f, dataOcorrido: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Hora</label>
                  <input type="time" value={form.horaOcorrido} onChange={e => setForm(f => ({ ...f, horaOcorrido: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Responsável</label>
                  <select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className={inputCls}>
                    {usuarios.map(u => <option key={u.id}>{u.nome}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Local do Ocorrido</label>
                <input value={form.localOcorrido} onChange={e => setForm(f => ({ ...f, localOcorrido: e.target.value }))} placeholder="Cidade, endereço ou descrição do local" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Descrição do Sinistro *</label>
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} placeholder="Descreva detalhadamente o que aconteceu..." className={inputCls + ' resize-none'} />
              </div>
              <div>
                <label className={labelCls}>Valor Estimado do Dano (R$)</label>
                <input type="number" value={form.valorEstimado} onChange={e => setForm(f => ({ ...f, valorEstimado: e.target.value }))} placeholder="0" className={inputCls} />
              </div>
            </div>
          )}

          {/* Aba 1: Detalhes Específicos */}
          {aba === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-cyber-cyan/5 rounded-xl">
                <span className="text-[10px] text-cyber-muted font-semibold uppercase tracking-wide">Tipo:</span>
                <span className="text-sm font-bold text-cyber-cyan">{form.tipoSinistro}</span>
                {form.causaSinistro && <><span className="text-cyber-muted">·</span><span className="text-xs text-cyber-muted">{form.causaSinistro}</span></>}
              </div>
              {sinistroTypeFields[form.tipoSinistro] ? (
                <DynamicForm
                  sections={sinistroTypeFields[form.tipoSinistro].sections}
                  values={form}
                  onChange={(key, val) => setForm(f => ({ ...f, [key]: val }))}
                />
              ) : (
                <div className="p-6 bg-cyber-surface/40 rounded-xl text-sm text-cyber-muted text-center">
                  Não há campos específicos para este tipo. Use a aba Acompanhamento para informações adicionais.
                </div>
              )}
            </div>
          )}

          {/* Aba 2: Acompanhamento */}
          {aba === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Protocolo na Seguradora</label>
                  <input value={form.protocoloSeguradora} onChange={e => setForm(f => ({ ...f, protocoloSeguradora: e.target.value }))} placeholder="Ex: POR-2026-78900" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nº do Boletim de Ocorrência</label>
                  <input value={form.numeroBo} onChange={e => setForm(f => ({ ...f, numeroBo: e.target.value }))} placeholder="Ex: BO-2026-45678" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Perito Designado</label>
                  <input value={form.perito} onChange={e => setForm(f => ({ ...f, perito: e.target.value }))} placeholder="Nome do perito" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Data da Vistoria</label>
                  <input type="date" value={form.dataVistoria} onChange={e => setForm(f => ({ ...f, dataVistoria: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Valor Indenizado (R$)</label>
                  <input type="number" value={form.valorIndenizado} onChange={e => setForm(f => ({ ...f, valorIndenizado: e.target.value }))} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Data de Indenização</label>
                  <input type="date" value={form.dataIndenizacao} onChange={e => setForm(f => ({ ...f, dataIndenizacao: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Documentos Pendentes (separados por vírgula)</label>
                <input value={form.documentosPendentes} onChange={e => setForm(f => ({ ...f, documentosPendentes: e.target.value }))} placeholder="Ex: Laudo técnico, B.O., Nota fiscal, RG..." className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Próxima Ação</label>
                  <input value={form.proximaAcao} onChange={e => setForm(f => ({ ...f, proximaAcao: e.target.value }))} placeholder="Ex: Ligar para seguradora, aguardar vistoria..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Data da Próxima Ação</label>
                  <input type="date" value={form.dataProximaAcao} onChange={e => setForm(f => ({ ...f, dataProximaAcao: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Observações Internas</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={4} placeholder="Notas de acompanhamento, histórico, pendências..." className={inputCls + ' resize-none'} />
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
