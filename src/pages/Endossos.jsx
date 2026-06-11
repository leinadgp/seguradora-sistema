import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { input as inputCls, label as labelCls } from '../lib/styles'
import { Plus, Search, Eye, Edit2, FilePen, Download, Shield } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { genNumero, logEvento, todayISO } from '../lib/flow'

const statusOpcoes = ['rascunho', 'pendente', 'em_analise', 'aprovado', 'aplicado', 'rejeitado', 'cancelado']

const tiposEndosso = [
  'Alteração de dados',
  'Inclusão de cobertura',
  'Exclusão de cobertura',
  'Alteração de valor',
  'Substituição',
  'Cancelamento',
  'Substituição de item',
  'Correção cadastral',
  'Outro',
]

const TIPOS_COM_TERMO = ['Seguro Garantia', 'Seguro Licitante', 'Seguro Judicial', 'Risco Engenharia', 'Responsabilidade Civil']
const TIPOS_CO_CORRETAGEM = ['Seguro Garantia', 'Seguro Licitante', 'Seguro Judicial', 'Risco Engenharia', 'Responsabilidade Civil']

const responsaveis = ['Carlos Silva', 'Ana Santos', 'Pedro Lima', 'Roberto Alves', 'Fernanda Costa']

const emptyForm = {
  apoliceId: '', apolice: '', clienteId: '', cliente: '',
  tipoSeguro: '', seguradora: '',
  tipoEndosso: 'Alteração de dados',
  status: 'rascunho',
  dataRequisicao: new Date().toISOString().split('T')[0],
  dataPrevisao: '', dataExecucao: '',
  motivo: '', descricao: '', motivacao: '',
  termoAditivo: '',
  impactoFinanceiro: '',
  comissaoPercentual: '',
  comissaoValor: 0,
  coCorretagemAtiva: false, percentualAttenti: '', percentualMega: '',
  responsavel: 'Carlos Silva',
  observacoes: '',
}

const ABAS_FORM = ['Dados Gerais', 'Detalhes', 'Financeiro & Obs.']

function fmtMoeda(v) {
  const n = Number(v)
  if (v === '' || v === null || v === undefined) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(n)
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const statusColor = {
  rascunho:    'bg-cyber-muted/10 text-cyber-muted border border-cyber-muted/20',
  pendente:    'bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20',
  em_analise:  'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20',
  aprovado:    'bg-cyber-green/10 text-cyber-green border border-cyber-green/20',
  aplicado:    'bg-violet-500/10 text-violet-500 border border-violet-500/20',
  emitido:     'bg-violet-500/10 text-violet-500 border border-violet-500/20',
  rejeitado:   'bg-cyber-red/10 text-cyber-red border border-cyber-red/20',
  recusado:    'bg-cyber-red/10 text-cyber-red border border-cyber-red/20',
  cancelado:   'bg-cyber-muted/10 text-cyber-muted border border-cyber-muted/20',
}

function StatusChip({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusColor[status] || 'bg-cyber-surface text-cyber-muted'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function calcComissaoValor(impacto, pct) {
  const imp = Number(impacto) || 0
  const p   = Number(pct)    || 0
  if (imp <= 0 || p <= 0) return 0
  return parseFloat((imp * p / 100).toFixed(2))
}

function exportarCSV(dados) {
  const cabecalho = [
    'Número', 'Apólice', 'Cliente', 'Tipo de Seguro', 'Seguradora',
    'Tipo de Endosso', 'Status', 'Data Requisição', 'Previsão', 'Data Execução',
    'Responsável', 'Impacto Financeiro (R$)', 'Comissão (%)', 'Comissão (R$)',
    'Descrição', 'Motivação', 'Observações',
  ]

  const linhas = dados.map(e => [
    e.numero, e.apolice, e.cliente, e.tipoSeguro, e.seguradora,
    e.tipoEndosso, e.status.replace(/_/g, ' '), fmtDate(e.dataRequisicao),
    fmtDate(e.dataPrevisao), fmtDate(e.dataExecucao),
    e.responsavel,
    (e.impactoFinanceiro ?? 0).toString().replace('.', ','),
    (e.comissaoPercentual ?? 0).toString().replace('.', ','),
    (e.comissaoValor ?? 0).toString().replace('.', ','),
    `"${(e.descricao || '').replace(/"/g, '""')}"`,
    `"${(e.motivacao || '').replace(/"/g, '""')}"`,
    `"${(e.observacoes || '').replace(/"/g, '""')}"`,
  ])

  const csv = [cabecalho.join(';'), ...linhas.map(l => l.join(';'))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `endossos_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Endossos() {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: endossos, create, update } = useResource('endossos')
  const { data: apolices, update: updateApolice } = useResource('apolices')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [aba, setAba] = useState(0)

  const filtered = endossos.filter(e => {
    const q = search.toLowerCase()
    const match = !q || e.cliente.toLowerCase().includes(q) || e.numero.toLowerCase().includes(q) || e.apolice.toLowerCase().includes(q) || e.tipoEndosso.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || e.status === filterStatus
    const matchTipo   = filterTipo === 'todos'   || e.tipoEndosso === filterTipo
    return match && matchStatus && matchTipo
  })

  const pendentes      = filtered.filter(e => ['pendente', 'em_analise'].includes(e.status)).length
  const aprovados      = filtered.filter(e => e.status === 'aprovado' || e.status === 'emitido').length
  const totalComissao  = filtered.reduce((acc, e) => acc + (Number(e.comissaoValor) || 0), 0)
  const mediaComissaoPct = (() => {
    const comValidos = filtered.filter(e => Number(e.comissaoPercentual) > 0)
    if (!comValidos.length) return 0
    return comValidos.reduce((acc, e) => acc + Number(e.comissaoPercentual), 0) / comValidos.length
  })()

  function openNew() { setForm(emptyForm); setIsEditing(false); setAba(0); setShowModal(true) }
  function openEdit(e) {
    setForm({ ...emptyForm, ...e, impactoFinanceiro: e.impactoFinanceiro ?? '', comissaoPercentual: e.comissaoPercentual ?? '' })
    setIsEditing(true); setAba(0); setShowModal(true); setShowDetalhes(false)
  }
  function openDetalhes(e) { setSelected(e); setShowDetalhes(true) }

  // Preseleção via URL: ?apolice=<id>&novo=1 (novo endosso) | ?focus=<id> (abrir detalhe)
  useEffect(() => {
    const focus = searchParams.get('focus')
    const apoliceId = searchParams.get('apolice')
    const novo = searchParams.get('novo')
    let consumed = false
    if (focus && endossos.length) {
      const e = endossos.find(x => x.id === focus)
      if (e) { setSelected(e); setShowDetalhes(true); consumed = true }
    }
    if (novo === '1' && apoliceId && apolices.length) {
      const ap = apolices.find(a => a.id === apoliceId)
      if (ap) {
        setForm({
          ...emptyForm,
          apoliceId: ap.id, apolice: ap.numero, policy_id: ap.id,
          clienteId: ap.clienteId, cliente: ap.cliente,
          tipoSeguro: ap.tipoSeguro, seguradora: ap.seguradora,
          comissaoPercentual: ap.comissaoPercentual ?? '',
        })
        setIsEditing(false); setAba(0); setShowModal(true); consumed = true
      }
    }
    if (consumed) {
      ['focus', 'apolice', 'novo'].forEach(k => searchParams.delete(k))
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, endossos, apolices]) // eslint-disable-line

  function handleApoliceChange(apoliceId) {
    const ap = apolices.find(a => a.id === apoliceId)
    if (ap) {
      setForm(f => ({
        ...f,
        apoliceId: ap.id, apolice: ap.numero, policy_id: ap.id,
        clienteId: ap.clienteId, cliente: ap.cliente,
        tipoSeguro: ap.tipoSeguro, seguradora: ap.seguradora,
        comissaoPercentual: ap.comissaoPercentual ?? '',
        comissaoValor: calcComissaoValor(f.impactoFinanceiro, ap.comissaoPercentual),
      }))
    } else {
      setForm(f => ({ ...f, apoliceId: '', apolice: '', clienteId: '', cliente: '', tipoSeguro: '', seguradora: '', comissaoPercentual: '', comissaoValor: 0 }))
    }
  }

  function handleImpactoChange(val) {
    setForm(f => ({ ...f, impactoFinanceiro: val, comissaoValor: calcComissaoValor(val, f.comissaoPercentual) }))
  }

  function handleComissaoPctChange(val) {
    setForm(f => ({ ...f, comissaoPercentual: val, comissaoValor: calcComissaoValor(f.impactoFinanceiro, val) }))
  }

  async function handleSave() {
    if (!form.apolice)       { showToast('Selecione a apólice.', 'error'); return }
    if (!form.descricao)     { showToast('Preencha a descrição do endosso.', 'error'); return }
    if (!form.dataRequisicao){ showToast('Preencha a data de requisição.', 'error'); return }

    const payload = {
      ...form,
      policy_id: form.apoliceId,
      impactoFinanceiro: Number(form.impactoFinanceiro) || 0,
      comissaoPercentual: Number(form.comissaoPercentual) || 0,
      comissaoValor: calcComissaoValor(form.impactoFinanceiro, form.comissaoPercentual),
    }

    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...payload })
        await logEvento('endosso', selected.id, 'Endosso atualizado', `Endosso ${selected.numero} atualizado.`)
        if (['aprovado', 'aplicado'].includes(payload.status)) await marcarApoliceComEndosso(payload.apoliceId, selected.numero)
        showToast('Endosso atualizado!')
      } else {
        const id = Date.now().toString()
        const numero = genNumero('END', endossos)
        await create({ ...payload, id, numero, endorsement_number: numero, dataEndosso: todayISO() })
        await logEvento('endosso', id, 'Endosso criado', `Endosso ${numero} (${payload.tipoEndosso}) criado na pólise ${payload.apolice}.`)
        if (payload.apoliceId) await logEvento('apolice', payload.apoliceId, 'Endosso adicionado', `Endosso ${numero} (${payload.tipoEndosso}) vinculado à pólise.`)
        if (['aprovado', 'aplicado'].includes(payload.status)) await marcarApoliceComEndosso(payload.apoliceId, numero)
        showToast(`Endosso ${numero} registrado!`)
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function marcarApoliceComEndosso(apoliceId, endNumero) {
    if (!apoliceId) return
    const ap = apolices.find(a => a.id === apoliceId)
    if (ap && !ap.temEndosso) {
      try {
        await updateApolice(ap.id, { ...ap, temEndosso: true })
        await logEvento('apolice', ap.id, 'Status: Com endosso', `Pólice marcada como "Com endosso" após aplicação do endosso ${endNumero}.`)
      } catch (e) { console.error(e) }
    }
  }

  async function atualizarStatus(id, novoStatus) {
    try {
      const e = endossos.find(e => e.id === id)
      if (e) {
        const updated = await update(id, { ...e, status: novoStatus })
        await logEvento('endosso', id, 'Status atualizado', `Status do endosso ${e.numero} alterado para "${novoStatus.replace(/_/g, ' ')}".`)
        if (['aprovado', 'aplicado'].includes(novoStatus)) await marcarApoliceComEndosso(e.apoliceId || e.policy_id, e.numero)
        if (selected?.id === id) setSelected(updated)
      }
      showToast('Status do endosso atualizado!')
    } catch {
      showToast('Erro ao atualizar status.', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente, número, apólice, tipo..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option value="todos">Todos os status</option>
          {statusOpcoes.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option value="todos">Todos os tipos</option>
          {tiposEndosso.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => { exportarCSV(filtered); showToast('Exportação gerada!') }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-cyber-border rounded-xl text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 bg-cyber-card transition-colors cursor-pointer whitespace-nowrap"
          title="Exportar CSV"
        >
          <Download size={15} /> Exportar
        </button>
        <Button onClick={openNew} icon={<Plus size={15} />}>Novo Endosso</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',          display: filtered.length,    color: 'text-cyber-text' },
          { label: 'Em Andamento',   display: pendentes,           color: 'text-cyber-amber' },
          { label: 'Concluídos',     display: aprovados,           color: 'text-cyber-green' },
          { label: 'Rejeitados',     display: filtered.filter(e => e.status === 'rejeitado').length, color: 'text-cyber-red' },
          { label: 'Média Comissão', display: `${mediaComissaoPct.toFixed(1)}%`, color: 'text-violet-400' },
          { label: 'Total Comissão', display: fmtMoeda(totalComissao), color: 'text-cyber-cyan' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <p className={`text-lg font-display font-bold leading-tight ${s.color}`}>{s.display}</p>
            <p className="text-[9px] text-cyber-muted uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <EmptyState icon={FilePen} title="Nenhum endosso encontrado" description="Ajuste os filtros ou registre um novo endosso." />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyber-cyan/10 text-left">
                  {['Número', 'Apólice', 'Cliente', 'Tipo de Endosso', 'Requisição', 'Impacto', 'Comissão', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-semibold text-cyber-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-cyan/5">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-cyber-cyan whitespace-nowrap">{e.numero}</td>
                    <td className="px-4 py-3 text-xs text-cyber-muted whitespace-nowrap">{e.apolice}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-cyber-text text-xs">{e.cliente}</p>
                      <p className="text-[10px] text-cyber-muted">{e.tipoSeguro}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-cyber-text whitespace-nowrap">{e.tipoEndosso}</td>
                    <td className="px-4 py-3 text-xs text-cyber-muted whitespace-nowrap">{fmtDate(e.dataRequisicao)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {e.impactoFinanceiro > 0
                        ? <span className="text-cyber-green">+{fmtMoeda(e.impactoFinanceiro)}</span>
                        : e.impactoFinanceiro < 0
                          ? <span className="text-cyber-red">{fmtMoeda(e.impactoFinanceiro)}</span>
                          : <span className="text-cyber-muted">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {Number(e.comissaoPercentual) > 0
                        ? <span className="text-violet-400">{e.comissaoPercentual}% · {fmtMoeda(e.comissaoValor)}</span>
                        : <span className="text-cyber-muted">—</span>
                      }
                    </td>
                    <td className="px-4 py-3"><StatusChip status={e.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDetalhes(e)} className="p-1.5 rounded-lg hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer" title="Ver detalhes"><Eye size={13} /></button>
                        <button onClick={() => { setSelected(e); openEdit(e) }} className="p-1.5 rounded-lg hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer" title="Editar"><Edit2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-cyber-cyan/20 bg-cyber-surface/40">
                  <td colSpan={5} className="px-4 py-2.5 text-[10px] text-cyber-muted uppercase tracking-widest font-semibold">
                    {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-cyber-green whitespace-nowrap">
                    {fmtMoeda(filtered.reduce((a, e) => a + (Number(e.impactoFinanceiro) || 0), 0))}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-violet-400 whitespace-nowrap">
                    {mediaComissaoPct.toFixed(1)}% · {fmtMoeda(totalComissao)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhes && !!selected}
        title={selected ? `Endosso ${selected.numero}` : ''}
        onClose={() => setShowDetalhes(false)}
        size="lg"
        footer={
          <div className="flex gap-2 flex-wrap justify-between w-full">
            <Button variant="secondary" onClick={() => setShowDetalhes(false)}>Voltar</Button>
            <div className="flex gap-2">
              {(selected?.policy_id || selected?.apoliceId) && <Button variant="secondary" icon={<Shield size={14} />} onClick={() => navigate(`/apolices?focus=${selected.policy_id || selected.apoliceId}`)}>Ver Pólise</Button>}
              <Button onClick={() => openEdit(selected)}>Editar</Button>
            </div>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><p className={labelCls}>Número</p><p className="text-sm font-mono text-cyber-cyan">{selected.numero}</p></div>
              <div><p className={labelCls}>Apólice</p><p className="text-sm text-cyber-text">{selected.apolice}</p></div>
              <div><p className={labelCls}>Status</p><StatusChip status={selected.status} /></div>
              <div><p className={labelCls}>Cliente</p><p className="text-sm text-cyber-text">{selected.cliente}</p></div>
              <div><p className={labelCls}>Seguradora</p><p className="text-sm text-cyber-text">{selected.seguradora}</p></div>
              <div><p className={labelCls}>Tipo de Seguro</p><p className="text-sm text-cyber-text">{selected.tipoSeguro}</p></div>
            </div>

            <hr className="border-cyber-cyan/10" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 sm:col-span-1"><p className={labelCls}>Tipo de Endosso</p><p className="text-sm text-cyber-text">{selected.tipoEndosso}</p></div>
              <div><p className={labelCls}>Data Requisição</p><p className="text-sm text-cyber-text">{fmtDate(selected.dataRequisicao)}</p></div>
              <div><p className={labelCls}>Previsão</p><p className="text-sm text-cyber-text">{fmtDate(selected.dataPrevisao)}</p></div>
              {selected.dataExecucao && <div><p className={labelCls}>Executado em</p><p className="text-sm text-cyber-green">{fmtDate(selected.dataExecucao)}</p></div>}
              <div><p className={labelCls}>Responsável</p><p className="text-sm text-cyber-text">{selected.responsavel}</p></div>
              <div>
                <p className={labelCls}>Impacto Financeiro</p>
                <p className={`text-sm font-semibold ${selected.impactoFinanceiro > 0 ? 'text-cyber-green' : selected.impactoFinanceiro < 0 ? 'text-cyber-red' : 'text-cyber-muted'}`}>
                  {selected.impactoFinanceiro > 0 ? `+${fmtMoeda(selected.impactoFinanceiro)}` : selected.impactoFinanceiro < 0 ? fmtMoeda(selected.impactoFinanceiro) : 'Sem impacto'}
                </p>
              </div>
              <div>
                <p className={labelCls}>Comissão</p>
                <p className="text-sm font-semibold text-violet-400">
                  {Number(selected.comissaoPercentual) > 0
                    ? `${selected.comissaoPercentual}% · ${fmtMoeda(selected.comissaoValor)}`
                    : '—'
                  }
                </p>
              </div>
            </div>

            <div><p className={labelCls}>Descrição</p><p className="text-sm text-cyber-text">{selected.descricao}</p></div>
            <div><p className={labelCls}>Motivação</p><p className="text-sm text-cyber-text">{selected.motivacao}</p></div>
            {selected.observacoes && <div><p className={labelCls}>Observações</p><p className="text-sm text-cyber-muted">{selected.observacoes}</p></div>}

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
        )}
      </Modal>

      {/* Modal Formulário */}
      <Modal
        isOpen={showModal}
        title={isEditing ? 'Editar Endosso' : 'Novo Endosso'}
        onClose={() => setShowModal(false)}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{isEditing ? 'Salvar Alterações' : 'Registrar Endosso'}</Button>
          </div>
        }
      >
        {/* Abas */}
        <div className="flex gap-1 mb-5 border-b border-cyber-cyan/10 pb-0">
          {ABAS_FORM.map((a, i) => (
            <button key={a} onClick={() => setAba(i)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer ${aba === i ? 'bg-cyber-cyan/10 text-cyber-cyan border-b-2 border-cyber-cyan' : 'text-cyber-muted hover:text-cyber-text'}`}>
              {a}
            </button>
          ))}
        </div>

        {aba === 0 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Apólice *</label>
              <select value={form.apoliceId} onChange={e => handleApoliceChange(e.target.value)} className={inputCls}>
                <option value="">Selecione a apólice...</option>
                {apolices.map(a => (
                  <option key={a.id} value={a.id}>{a.numero} — {a.cliente} ({a.tipoSeguro})</option>
                ))}
              </select>
            </div>
            {form.cliente && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Cliente</label><p className="text-sm text-cyber-text py-1">{form.cliente}</p></div>
                <div><label className={labelCls}>Seguradora</label><p className="text-sm text-cyber-text py-1">{form.seguradora}</p></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo de Endosso *</label>
                <select value={form.tipoEndosso} onChange={e => setForm(f => ({ ...f, tipoEndosso: e.target.value }))} className={inputCls}>
                  {tiposEndosso.map(t => <option key={t} value={t}>{t}</option>)}
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
                <label className={labelCls}>Data Requisição *</label>
                <input type="date" value={form.dataRequisicao} onChange={e => setForm(f => ({ ...f, dataRequisicao: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Previsão de Conclusão</label>
                <input type="date" value={form.dataPrevisao} onChange={e => setForm(f => ({ ...f, dataPrevisao: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Data de Execução</label>
                <input type="date" value={form.dataExecucao} onChange={e => setForm(f => ({ ...f, dataExecucao: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Responsável</label>
              <select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className={inputCls}>
                {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}

        {aba === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Motivo do Endosso</label>
              <input
                value={form.motivo}
                onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                placeholder="Ex: Alteração solicitada pelo cliente"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Descrição do Endosso *</label>
              <textarea
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                rows={3}
                placeholder="Descreva o que será alterado na apólice..."
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Motivação / Justificativa</label>
              <textarea
                value={form.motivacao}
                onChange={e => setForm(f => ({ ...f, motivacao: e.target.value }))}
                rows={3}
                placeholder="Por que o cliente está solicitando este endosso?"
                className={inputCls}
              />
            </div>
            {TIPOS_COM_TERMO.includes(form.tipoSeguro) && (
              <div>
                <label className={labelCls}>Termo Aditivo</label>
                <input
                  value={form.termoAditivo}
                  onChange={e => setForm(f => ({ ...f, termoAditivo: e.target.value }))}
                  placeholder="Ex: Termo Aditivo nº 01/2025"
                  className={inputCls}
                />
              </div>
            )}
          </div>
        )}

        {aba === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Impacto Financeiro (R$)</label>
                <input
                  type="number" step="0.01"
                  value={form.impactoFinanceiro}
                  onChange={e => handleImpactoChange(e.target.value)}
                  placeholder="Ex: 320.00 ou -960.00"
                  className={inputCls}
                />
                <p className="text-[10px] text-cyber-muted mt-1">Negativo = redução de prêmio</p>
              </div>
              <div>
                <label className={labelCls}>Comissão (%)</label>
                <input
                  type="number" step="0.01" min="0" max="100"
                  value={form.comissaoPercentual}
                  onChange={e => handleComissaoPctChange(e.target.value)}
                  placeholder="Ex: 15"
                  className={inputCls}
                />
                {Number(form.comissaoValor) > 0 && (
                  <p className="text-[10px] text-violet-400 mt-1">Comissão calculada: {fmtMoeda(form.comissaoValor)}</p>
                )}
              </div>
            </div>
            {TIPOS_CO_CORRETAGEM.includes(form.tipoSeguro) && (
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={!!form.coCorretagemAtiva} onChange={e => setForm(f => ({ ...f, coCorretagemAtiva: e.target.checked, percentualAttenti: e.target.checked ? (f.percentualAttenti || '80') : '', percentualMega: e.target.checked ? (f.percentualMega || '20') : '' }))} className="w-4 h-4 accent-cyber-cyan" />
                    <span className="text-sm font-medium text-cyber-text">Co-corretagem ATTENTI / MEGA</span>
                  </label>
                </div>
                {form.coCorretagemAtiva && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>ATTENTI % (co-corretagem)</label>
                      <input type="number" value={form.percentualAttenti} onChange={e => setForm(f => ({ ...f, percentualAttenti: e.target.value }))} placeholder="80" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>MEGA % (co-corretagem)</label>
                      <input type="number" value={form.percentualMega} onChange={e => setForm(f => ({ ...f, percentualMega: e.target.value }))} placeholder="20" className={inputCls} />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className={labelCls}>Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                rows={4}
                placeholder="Informações adicionais, documentos necessários, contatos..."
                className={inputCls}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
