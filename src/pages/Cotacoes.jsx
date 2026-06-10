import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Eye, Edit2, FileText, ArrowRight, LayoutGrid, List, ClipboardList } from 'lucide-react'
import { input as inputCls } from '../lib/styles'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import FluxoSeguro from '../components/ui/FluxoSeguro'
import Timeline from '../components/ui/Timeline'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import {
  fmtMoeda, todayISO, genNumero, logEvento, CURRENT_USER,
  cotacaoStatus, cotacaoStatusList, cotacaoKanbanList, tiposSeguro, responsaveis, seguradorasLista,
} from '../lib/flow'

const emptyForm = {
  cliente: '', cpfCnpj: '', telefone: '', email: '',
  tipoSeguro: 'Auto', seguradora: 'Porto Seguro', produto: '',
  valorEstimado: '', premio: '', percentualComissao: '15', comissao: '',
  responsavel: 'Carlos Silva', status: 'nova', observacoes: '',
}

function StatusChip({ status }) {
  const s = cotacaoStatus[status] || { label: status, color: 'slate' }
  return <Badge color={s.color}>{s.label}</Badge>
}

export default function Cotacoes() {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: cotacoes, create, update } = useResource('cotacoes')
  const { data: propostas, create: createProposta } = useResource('propostas')
  const { data: apolices } = useResource('apolices')
  const { data: endossos } = useResource('endossos')
  const { data: historico, refetch: refetchHist } = useResource('historico')

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [view, setView] = useState('kanban')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [convertConfirm, setConvertConfirm] = useState(null) // { cot } para confirmar gerar proposta

  // Auto-abrir detalhe via ?focus=<id>
  useEffect(() => {
    const focus = searchParams.get('focus')
    if (focus && cotacoes.length) {
      const c = cotacoes.find(x => x.id === focus)
      if (c) { setSelected(c); setShowDetalhes(true) }
      searchParams.delete('focus'); setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, cotacoes]) // eslint-disable-line

  const filtered = cotacoes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.cliente.toLowerCase().includes(q) || (c.numero || '').toLowerCase().includes(q) || (c.cpfCnpj || '').includes(q)
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  function openNew() { setForm(emptyForm); setIsEditing(false); setShowModal(true) }
  function openEdit(c) { setForm({ ...emptyForm, ...c }); setIsEditing(true); setShowModal(true); setShowDetalhes(false) }
  function openDetalhes(c) { setSelected(c); setShowDetalhes(true) }

  function recalcComissao(premio, pct) {
    const p = Number(premio) || 0, c = Number(pct) || 0
    return p && c ? parseFloat((p * c / 100).toFixed(2)) : ''
  }

  async function handleSave() {
    if (!form.cliente) { showToast('Preencha o nome do cliente.', 'error'); return }
    const comissao = recalcComissao(form.premio, form.percentualComissao)
    try {
      if (isEditing) {
        const updated = await update(selected.id, { ...selected, ...form, comissao })
        await logEvento('cotacao', selected.id, 'Cotação atualizada', `Dados da cotação ${selected.numero} atualizados.`)
        showToast('Cotação atualizada!')
        if (selected?.id) setSelected(updated)
      } else {
        const numero = genNumero('COT', cotacoes)
        const novo = await create({
          ...form, comissao, id: Date.now().toString(), numero,
          dataCriacao: todayISO(), converted_proposal_id: null, anexos: [],
        })
        await logEvento('cotacao', novo.id, 'Cotação criada', `Cotação ${numero} criada para ${form.cliente} (${form.tipoSeguro}).`)
        showToast(`Cotação ${numero} criada!`)
      }
      refetchHist()
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function alterarStatus(cot, novoStatus) {
    try {
      const updated = await update(cot.id, { ...cot, status: novoStatus })
      await logEvento('cotacao', cot.id, 'Status atualizado', `Status alterado para "${cotacaoStatus[novoStatus]?.label || novoStatus}".`)
      refetchHist()
      if (selected?.id === cot.id) setSelected(updated)
      if (novoStatus === 'aprovada' && !cot.converted_proposal_id) setConvertConfirm(updated)
    } catch {
      showToast('Erro ao atualizar status.', 'error')
    }
  }

  async function gerarProposta(cot) {
    // Já possui proposta vinculada → oferecer abrir
    if (cot.converted_proposal_id) {
      const existe = propostas.find(p => p.id === cot.converted_proposal_id)
      if (existe) {
        if (window.confirm('Essa cotação já possui uma proposta vinculada. Deseja abrir a proposta existente?')) {
          navigate(`/propostas?focus=${existe.id}`)
        }
        return
      }
    }
    try {
      const numero = genNumero('PROP', propostas)
      const id = Date.now().toString()
      const novaProposta = await createProposta({
        id, numero,
        quote_id: cot.id, cotacaoNumero: cot.numero,
        cliente: cot.cliente, cpfCnpj: cot.cpfCnpj, telefone: cot.telefone, email: cot.email,
        tipoSeguro: cot.tipoSeguro, seguradora: cot.seguradora, produto: cot.produto,
        seguradorasCotadas: cot.seguradora ? [cot.seguradora] : [],
        premio: cot.premio, melhorValor: cot.premio, valorApresentado: cot.premio,
        comissao: cot.comissao, percentualComissao: cot.percentualComissao,
        responsavel: cot.responsavel,
        status: 'em_analise', statusFlow: 'rascunho',
        dataSolicitacao: todayISO(), dataCriacao: todayISO(), dataEnvio: '', dataAprovacao: '',
        observacoes: cot.observacoes || '', anexos: cot.anexos || [],
        converted_policy_id: null,
      })
      const cotAtualizada = await update(cot.id, { ...cot, status: 'convertida', converted_proposal_id: id })
      await logEvento('cotacao', cot.id, 'Proposta gerada', `Proposta ${numero} criada a partir da cotação ${cot.numero}.`)
      await logEvento('proposta', id, 'Proposta criada', `Proposta ${numero} criada automaticamente a partir da cotação ${cot.numero}.`)
      refetchHist()
      setSelected(cotAtualizada)
      setConvertConfirm(null)
      setShowDetalhes(false)
      showToast('Proposta criada com sucesso a partir da cotação')
      navigate(`/propostas?focus=${id}`)
    } catch {
      showToast('Erro ao gerar proposta.', 'error')
    }
  }

  // Calcula as etapas do fluxo para o stepper
  function stagesFor(cot) {
    const cs = cotacaoStatus[cot.status] || {}
    const proposta = cot.converted_proposal_id ? propostas.find(p => p.id === cot.converted_proposal_id) : null
    const apolice = proposta?.converted_policy_id ? apolices.find(a => a.id === proposta.converted_policy_id) : null
    const ends = apolice ? endossos.filter(e => e.policy_id === apolice.id || e.apoliceId === apolice.id) : []
    return [
      { key: 'cotacao', label: 'Cotação', stage: cs.stage || 'blue', sub: cs.label },
      proposta
        ? { key: 'proposta', label: 'Proposta', stage: ['aprovada','convertida'].includes(proposta.status) ? 'green' : ['recusada','perdida'].includes(proposta.status) ? 'red' : 'blue', sub: proposta.numero || 'Criada', onClick: () => navigate(`/propostas?focus=${proposta.id}`) }
        : { key: 'proposta', label: 'Proposta', stage: 'gray', sub: 'Não criada' },
      apolice
        ? { key: 'apolice', label: 'Apólice', stage: ['cancelada','vencida'].includes(apolice.status) ? 'red' : 'green', sub: apolice.numero || 'Emitida', onClick: () => navigate(`/apolices?focus=${apolice.id}`) }
        : { key: 'apolice', label: 'Apólice', stage: 'gray', sub: 'Não criada' },
      { key: 'endosso', label: 'Endosso', stage: ends.length ? 'green' : 'gray', sub: ends.length ? `${ends.length} endosso(s)` : 'Nenhum', onClick: apolice ? () => navigate(`/endossos?apolice=${apolice.id}`) : undefined },
    ]
  }

  const eventos = selected ? historico.filter(h => h.entity_type === 'cotacao' && h.entity_id === selected.id) : []

  // Indicadores
  const totalAprovadas = cotacoes.filter(c => c.status === 'aprovada').length
  const totalConvertidas = cotacoes.filter(c => c.converted_proposal_id).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente, número ou CPF/CNPJ..." className={`${inputCls} pl-9 pr-4 py-2.5 rounded-xl`} />
        </div>
        <div className="flex gap-2 shrink-0">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${inputCls} rounded-xl px-3 py-2.5 cursor-pointer`}>
            <option value="todos">Todos os status</option>
            {cotacaoStatusList.map(s => <option key={s} value={s}>{cotacaoStatus[s].label}</option>)}
          </select>
          <div className="flex border border-cyber-border rounded-xl overflow-hidden">
            <button onClick={() => setView('lista')} className={`px-3 py-2.5 ${view === 'lista' ? 'bg-cyber-cyan/10 text-cyber-cyan' : 'text-cyber-muted hover:bg-slate-100'}`} title="Lista"><List size={16} /></button>
            <button onClick={() => setView('kanban')} className={`px-3 py-2.5 ${view === 'kanban' ? 'bg-cyber-cyan/10 text-cyber-cyan' : 'text-cyber-muted hover:bg-slate-100'}`} title="Kanban"><LayoutGrid size={16} /></button>
          </div>
          <Button onClick={openNew} icon={<Plus size={16} />}>Nova Cotação</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm text-cyber-muted">
        <span>{filtered.length} cotações</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-green font-medium">{totalAprovadas} aprovadas</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-cyan font-medium">{totalConvertidas} convertidas em proposta</span>
      </div>

      {/* Lista */}
      {view === 'lista' && (
        filtered.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title="Nenhuma cotação" description="Crie a primeira cotação para iniciar o fluxo." action={<Button onClick={openNew} icon={<Plus size={16} />}>Nova Cotação</Button>} />
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-cyber-card rounded-2xl p-4 shadow-card border border-cyber-border/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyber-cyan">{c.numero}</span>
                      <p className="font-semibold text-cyber-text">{c.cliente}</p>
                      <StatusChip status={c.status} />
                      {c.converted_proposal_id && <Badge color="purple">Proposta vinculada</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-cyber-muted">
                      <span>{c.tipoSeguro} · {c.seguradora}</span>
                      <span>·</span>
                      <span>Resp: {c.responsavel?.split(' ')[0]}</span>
                      {c.dataCriacao && <><span>·</span><span>{c.dataCriacao}</span></>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {c.premio && <p className="text-lg font-bold text-cyber-text">{fmtMoeda(c.premio)}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => openDetalhes(c)} className="flex items-center gap-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 px-3 py-1.5 rounded-lg transition-colors"><Eye size={14} /> Ver</button>
                      <button onClick={() => openEdit(c)} className="text-sm text-cyber-muted hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">Editar</button>
                      {c.converted_proposal_id ? (
                        <button onClick={() => navigate(`/propostas?focus=${c.converted_proposal_id}`)} className="flex items-center gap-1.5 text-sm text-cyber-purple hover:bg-cyber-purple/10 px-3 py-1.5 rounded-lg transition-colors font-medium">Ver Proposta <ArrowRight size={14} /></button>
                      ) : (
                        <button onClick={() => gerarProposta(c)} className="flex items-center gap-1.5 text-sm text-cyber-green hover:bg-cyber-green/10 px-3 py-1.5 rounded-lg transition-colors font-medium"><ClipboardList size={14} /> Gerar Proposta</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Kanban */}
      {view === 'kanban' && (
        <>
          <KanbanCotacoes
            cotacoes={filtered.filter(c => !['recusada', 'cancelada', 'perdida'].includes(c.status))}
            onDropStatus={(cot, status) => alterarStatus(cot, status)}
            onOpen={openDetalhes}
          />
          <PerdidosCotacoes
            cotacoes={filtered.filter(c => ['recusada', 'cancelada', 'perdida'].includes(c.status))}
            onReativar={cot => alterarStatus(cot, 'nova')}
            onOpen={openDetalhes}
          />
        </>
      )}

      {/* Modal Detalhes */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected ? `Cotação ${selected.numero}` : ''} size="lg"
        footer={
          <div className="flex flex-wrap gap-2 justify-between">
            <Button variant="secondary" onClick={() => setShowDetalhes(false)}>Voltar</Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Editar</Button>
              {selected?.converted_proposal_id ? (
                <Button onClick={() => navigate(`/propostas?focus=${selected.converted_proposal_id}`)} icon={<ArrowRight size={14} />}>Ver Proposta</Button>
              ) : (
                <Button variant="success" icon={<ClipboardList size={14} />} onClick={() => gerarProposta(selected)}>Gerar Proposta</Button>
              )}
            </div>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <FluxoSeguro stages={stagesFor(selected)} />
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-cyber-text text-lg">{selected.cliente}</h3>
                <p className="text-sm text-cyber-muted">{selected.tipoSeguro} · {selected.produto || '—'}</p>
              </div>
              <StatusChip status={selected.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ['CPF/CNPJ', selected.cpfCnpj], ['Telefone', selected.telefone], ['E-mail', selected.email],
                ['Seguradora', selected.seguradora], ['Valor estimado', fmtMoeda(selected.valorEstimado)], ['Prêmio', fmtMoeda(selected.premio)],
                ['Comissão', `${selected.percentualComissao || 0}% · ${fmtMoeda(selected.comissao)}`], ['Responsável', selected.responsavel], ['Criada em', selected.dataCriacao],
              ].map(([k, v]) => (
                <div key={k}><p className="text-xs text-cyber-muted mb-0.5">{k}</p><p className="text-sm font-medium text-cyber-text">{v || '—'}</p></div>
              ))}
            </div>
            {selected.observacoes && <div className="p-3 bg-cyber-surface/60 rounded-xl"><p className="text-xs text-cyber-muted mb-1">Observações</p><p className="text-sm text-cyber-text/80">{selected.observacoes}</p></div>}

            <div>
              <p className="hud-label mb-2">Alterar status</p>
              <div className="flex flex-wrap gap-2">
                {cotacaoStatusList.filter(s => s !== selected.status && s !== 'convertida').map(s => (
                  <button key={s} onClick={() => alterarStatus(selected, s)} className="text-[11px] px-2.5 py-1 rounded-full border border-cyber-border hover:border-cyber-cyan/40 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer">
                    {cotacaoStatus[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="hud-label mb-2">Histórico</p>
              <Timeline events={eventos} />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Cadastro/Edição */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Cotação' : 'Nova Cotação'} size="lg"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Criar Cotação'}</Button></div>}
      >
        <div className="space-y-4">
          <Section title="Dados do Cliente">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FF label="Nome do cliente *" span><input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} className={inputCls} /></FF>
              <FF label="CPF/CNPJ"><input value={form.cpfCnpj} onChange={e => setForm(f => ({ ...f, cpfCnpj: e.target.value }))} className={inputCls} /></FF>
              <FF label="Telefone"><input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className={inputCls} placeholder="(00) 00000-0000" /></FF>
              <FF label="E-mail" span><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></FF>
            </div>
          </Section>
          <Section title="Dados do Seguro">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FF label="Tipo de seguro"><select value={form.tipoSeguro} onChange={e => setForm(f => ({ ...f, tipoSeguro: e.target.value }))} className={inputCls}>{tiposSeguro.map(t => <option key={t}>{t}</option>)}</select></FF>
              <FF label="Seguradora"><select value={form.seguradora} onChange={e => setForm(f => ({ ...f, seguradora: e.target.value }))} className={inputCls}>{seguradorasLista.map(s => <option key={s}>{s}</option>)}</select></FF>
              <FF label="Produto" span><input value={form.produto} onChange={e => setForm(f => ({ ...f, produto: e.target.value }))} className={inputCls} placeholder="Ex: Seguro Auto" /></FF>
            </div>
          </Section>
          <Section title="Valores">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FF label="Valor estimado (R$)"><input type="number" value={form.valorEstimado} onChange={e => setForm(f => ({ ...f, valorEstimado: e.target.value }))} className={inputCls} /></FF>
              <FF label="Valor do prêmio (R$)"><input type="number" value={form.premio} onChange={e => setForm(f => ({ ...f, premio: e.target.value, comissao: recalcComissao(e.target.value, f.percentualComissao) }))} className={inputCls} /></FF>
              <FF label="Comissão (%)"><input type="number" value={form.percentualComissao} onChange={e => setForm(f => ({ ...f, percentualComissao: e.target.value, comissao: recalcComissao(f.premio, e.target.value) }))} className={inputCls} /></FF>
              <FF label="Comissão prevista (R$)"><input value={fmtMoeda(form.comissao)} disabled className={inputCls + ' opacity-70'} /></FF>
            </div>
          </Section>
          <Section title="Gestão">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FF label="Responsável"><select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className={inputCls}>{responsaveis.map(r => <option key={r}>{r}</option>)}</select></FF>
              <FF label="Status"><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>{cotacaoStatusList.filter(s => s !== 'convertida').map(s => <option key={s} value={s}>{cotacaoStatus[s].label}</option>)}</select></FF>
              <FF label="Observações" span><textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} className={inputCls + ' resize-none'} /></FF>
            </div>
          </Section>
        </div>
      </Modal>

      {/* Confirmar gerar proposta (após arrastar p/ Aprovada) */}
      <Modal isOpen={!!convertConfirm} onClose={() => setConvertConfirm(null)} title="Gerar proposta?" size="sm"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setConvertConfirm(null)}>Agora não</Button><Button variant="success" onClick={() => gerarProposta(convertConfirm)}>Gerar Proposta</Button></div>}
      >
        <div className="text-center py-3">
          <div className="w-14 h-14 bg-cyber-green/10 rounded-full flex items-center justify-center mx-auto mb-3"><ClipboardList size={26} className="text-cyber-green" /></div>
          <p className="text-sm text-cyber-muted">A cotação de <strong className="text-cyber-text">{convertConfirm?.cliente}</strong> foi aprovada. Deseja gerar a proposta agora?</p>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children }) {
  return <div><p className="hud-label mb-2">{title}</p>{children}</div>
}
function FF({ label, children, span }) {
  return <div className={span ? 'sm:col-span-2' : ''}><label className="block text-xs font-medium text-cyber-muted mb-1">{label}</label>{children}</div>
}

function KanbanCotacoes({ cotacoes, onDropStatus, onOpen }) {
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const scrollRef = useRef(null)
  const scrollState = useRef({ dragging: false, startX: 0, scrollLeft: 0 })
  const touchState = useRef({ cardId: null })

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto pb-2 -mx-1 px-1 select-none"
      style={{ cursor: dragId ? 'default' : 'grab' }}
      onMouseDown={e => {
        if (e.button !== 0 || e.target.closest('[data-drag-card]')) return
        scrollState.current = { dragging: true, startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft }
        e.currentTarget.style.cursor = 'grabbing'
      }}
      onMouseMove={e => {
        if (!scrollState.current.dragging) return
        if (scrollRef.current) scrollRef.current.scrollLeft = scrollState.current.scrollLeft - (e.clientX - scrollState.current.startX)
      }}
      onMouseUp={e => { scrollState.current.dragging = false; e.currentTarget.style.cursor = dragId ? 'default' : 'grab' }}
      onMouseLeave={() => { scrollState.current.dragging = false }}
    >
      <div className="flex gap-3 min-w-max">
        {cotacaoKanbanList.map(col => {
          const items = cotacoes.filter(c => c.status === col)
          const isOver = dragOver === col
          return (
            <div key={col} className="w-64 shrink-0"
              data-kanban-col={col}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOver !== col) setDragOver(col) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
              onDrop={e => {
                e.preventDefault()
                const c = cotacoes.find(x => x.id === dragId)
                if (c && c.status !== col) onDropStatus(c, col)
                setDragId(null); setDragOver(null)
              }}
            >
              <div className={`bg-cyber-surface/60 border rounded-2xl p-2.5 transition-all duration-150 ${isOver ? 'border-cyber-cyan/50 bg-cyber-cyan/5 ring-2 ring-cyber-cyan/20' : 'border-cyber-border/60'}`}>
                <div className="flex items-center justify-between px-1.5 mb-2.5">
                  <span className="text-xs font-semibold text-cyber-text">{cotacaoStatus[col]?.label || col}</span>
                  <span className={`text-[10px] bg-cyber-card border rounded-full px-2 py-0.5 transition-colors ${isOver ? 'border-cyber-cyan/40 text-cyber-cyan' : 'border-cyber-border text-cyber-muted'}`}>{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[52px]">
                  {items.map(c => (
                    <div key={c.id}
                      data-drag-card="true"
                      draggable
                      onDragStart={e => { setDragId(c.id); e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => { setDragId(null); setDragOver(null) }}
                      onTouchStart={() => { touchState.current.cardId = c.id }}
                      onTouchMove={e => e.preventDefault()}
                      onTouchEnd={e => {
                        const t = e.changedTouches[0]
                        const el = document.elementFromPoint(t.clientX, t.clientY)
                        const tc = el?.closest('[data-kanban-col]')?.getAttribute('data-kanban-col')
                        if (tc && touchState.current.cardId) {
                          const item = cotacoes.find(x => x.id === touchState.current.cardId)
                          if (item && item.status !== tc) onDropStatus(item, tc)
                        }
                        touchState.current.cardId = null; setDragOver(null)
                      }}
                      onClick={() => onOpen(c)}
                      className={`bg-cyber-card border border-cyber-border/50 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-cyber-cyan/40 hover:shadow-card-md transition-all duration-200 ${dragId === c.id ? 'opacity-40 scale-95 shadow-none' : ''}`}
                    >
                      <p className="font-mono text-[10px] text-cyber-cyan mb-0.5">{c.numero}</p>
                      <p className="text-sm font-semibold text-cyber-text leading-tight">{c.cliente}</p>
                      <p className="text-xs text-cyber-muted mt-0.5">{c.tipoSeguro} · {c.seguradora || '—'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-cyber-text">{fmtMoeda(c.premio)}</span>
                        {c.converted_proposal_id && <Badge color="purple">Proposta</Badge>}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className={`border-2 border-dashed rounded-xl py-5 text-center transition-colors duration-150 ${isOver ? 'border-cyber-cyan/50 bg-cyber-cyan/5' : 'border-cyber-border/40'}`}>
                      <p className={`text-[10px] font-medium ${isOver ? 'text-cyber-cyan' : 'text-cyber-muted'}`}>{isOver ? '↓ Soltar aqui' : '—'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PerdidosCotacoes({ cotacoes, onReativar, onOpen }) {
  const [open, setOpen] = useState(false)
  if (cotacoes.length === 0) return null
  return (
    <div className="border border-cyber-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/40 transition-colors">
        <span className="flex items-center gap-2">
          Perdidas / Recusadas
          <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold">{cotacoes.length}</span>
        </span>
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {cotacoes.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-cyber-card/60 border border-cyber-border/30 rounded-xl px-3 py-2.5 cursor-pointer" onClick={() => onOpen(c)}>
              <div>
                <p className="text-xs font-mono text-cyber-muted">{c.numero}</p>
                <p className="text-sm font-medium text-cyber-text/70">{c.cliente}</p>
                <p className="text-xs text-cyber-muted">{c.tipoSeguro}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); onReativar(c) }} className="text-xs text-cyber-cyan hover:underline ml-2 shrink-0">Reativar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
