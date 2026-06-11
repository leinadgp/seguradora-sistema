import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Eye, ArrowRight, Shield, FileText, LayoutGrid, List } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { StatusBadge } from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import DynamicForm from '../components/ui/DynamicForm'
import FluxoSeguro from '../components/ui/FluxoSeguro'
import Timeline from '../components/ui/Timeline'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { insuranceTypeFields } from '../data/insuranceFields'
import { genNumero, logEvento, todayISO, propostaStatus, propostaKanbanList, propostaStatusList } from '../lib/flow'
import { useCatalogo } from '../hooks/useCatalogo'
const responsaveis = ['Carlos Silva', 'Ana Santos', 'Pedro Lima', 'Roberto Alves']
const todas_seguradoras = ['Porto Seguro', 'Tokio Marine', 'Azul Seguros', 'Liberty Seguros', 'Mapfre', 'SulAmérica', 'Bradesco Seguros', 'Allianz']
const formasPagamento = ['Débito automático', 'Cartão de crédito', 'Boleto', 'PIX', '1x no cartão', '3x no cartão', '6x no cartão', '10x no cartão', '12x no cartão']

const ABAS = ['Dados Gerais', 'Dados do Seguro', 'Valores', 'Observações']

const emptyForm = {
  cliente: '', tipoSeguro: 'Auto', subcategorias: [], ramo: '',
  seguradorasCotadas: [], melhorValor: '', valorApresentado: '',
  premioLiquido: '', premioBruto: '',
  percentualComissaoTotal: '', percentualComissaoAttenti: '75', percentualComissaoMega: '',
  coCorretagem: false,
  formaPagamento: '12x no cartão', responsavel: 'Carlos Silva', dataSolicitacao: '',
  dataEnvio: '', dataPrevRetorno: '', status: 'em_analise', motivoPerda: '', observacoes: '',
}

function fmtMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0) }

export default function Propostas() {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: propostas, create, update } = useResource('propostas')
  const { data: cotacoes } = useResource('cotacoes')
  const { data: apolices, create: createApolice } = useResource('apolices')
  const { data: endossos } = useResource('endossos')
  const { data: historico, refetch: refetchHist } = useResource('historico')
  const { data: leads, update: updateLead } = useResource('leads')

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [view, setView] = useState('kanban')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [showConvertir, setShowConvertir] = useState(false)
  const [aba, setAba] = useState(0)
  const { getTipos, getSubcategorias, getRamo, getEntrada } = useCatalogo()

  function aplicarComissaoDoTipo(tipo, formAtual = {}) {
    const entrada = getEntrada(tipo)
    if (!entrada) return formAtual
    return {
      ...formAtual,
      percentualComissaoAttenti: String(entrada.comissaoAttenti ?? ''),
      coCorretagem: !!entrada.coCorretagem,
      percentualComissaoMega: entrada.coCorretagem ? String(entrada.comissaoMega ?? 20) : '',
    }
  }

  // Auto-abrir detalhe via ?focus=<id>
  useEffect(() => {
    const focus = searchParams.get('focus')
    if (focus && propostas.length) {
      const p = propostas.find(x => x.id === focus)
      if (p) { setSelected(p); setShowDetalhes(true) }
      searchParams.delete('focus'); setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, propostas]) // eslint-disable-line

  const filtered = propostas.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.cliente.toLowerCase().includes(q) || p.tipoSeguro.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const ativas = filtered.filter(p => !['recusada', 'perdida', 'convertida'].includes(p.status))
  const perdidas = filtered.filter(p => ['recusada', 'perdida'].includes(p.status))

  function openNew() { setForm(emptyForm); setIsEditing(false); setAba(0); setShowModal(true) }
  function openEdit(p) { setForm({ ...emptyForm, ...p }); setIsEditing(true); setAba(0); setShowModal(true); setShowDetalhes(false) }

  async function handleSave() {
    if (!form.cliente) { showToast('Preencha o nome do cliente.', 'error'); return }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form })
        showToast('Proposta atualizada!')
      } else {
        await create({ ...form, id: Date.now().toString(), numero: genNumero('PROP', propostas), dataSolicitacao: new Date().toISOString().split('T')[0] })
        showToast('Proposta cadastrada!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function alterarStatus(prop, novoStatus) {
    try {
      const updated = await update(prop.id, { ...prop, status: novoStatus })
      await logEvento('proposta', prop.id, 'Status atualizado', `Status alterado para "${propostaStatus[novoStatus]?.label || novoStatus}".`)
      refetchHist()
      if (selected?.id === prop.id) setSelected(updated)
      if (novoStatus === 'aprovada' && !prop.converted_policy_id) setShowConvertir(true)
    } catch {
      showToast('Erro ao atualizar status.', 'error')
    }
  }

  async function gerarPolice(prop) {
    if (!prop) return
    if (prop.converted_policy_id) {
      const existe = apolices.find(a => a.id === prop.converted_policy_id)
      if (existe) {
        if (window.confirm('Essa proposta já possui uma pólice vinculada. Deseja abrir a pólice existente?')) {
          navigate(`/apolices?focus=${existe.id}`)
        }
        return
      }
    }
    try {
      const numero = genNumero('AP', apolices, 4)
      const id = Date.now().toString()
      const inicio = todayISO()
      const fim = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0] })()
      await createApolice({
        id, numero,
        proposal_id: prop.id, propostaNumero: prop.numero, quote_id: prop.quote_id, cotacaoNumero: prop.cotacaoNumero,
        numeroProposta: prop.numero,
        cliente: prop.cliente, cpfCnpj: prop.cpfCnpj, telefone: prop.telefone, email: prop.email,
        tipoSeguro: prop.tipoSeguro, seguradora: prop.seguradora, produto: prop.produto,
        premioBruto: prop.premio || prop.melhorValor || '', premioLiquido: prop.premio || '', premio: prop.premio || prop.melhorValor || '',
        comissaoValor: prop.comissao || '', comissao: prop.comissao || '', comissaoPercentual: prop.percentualComissao || '',
        statusComissao: 'prevista', corretor: prop.responsavel, responsavel: prop.responsavel,
        status: 'ativa', dataEmissao: inicio, inicioVigencia: inicio, fimVigencia: fim, diasParaVencer: 365,
        observacoes: prop.observacoes || '', anexos: prop.anexos || [], temEndosso: false, endossosCount: 0,
      })
      const propAtualizada = await update(prop.id, { ...prop, status: 'convertida', statusFlow: 'convertida', converted_policy_id: id, dataAprovacao: todayISO() })
      await logEvento('proposta', prop.id, 'Pólice gerada', `Pólice ${numero} criada a partir da proposta ${prop.numero || ''}.`)
      await logEvento('apolice', id, 'Pólice criada', `Pólice ${numero} criada automaticamente a partir da proposta ${prop.numero || ''}.`)
      if (prop.quote_id) await logEvento('cotacao', prop.quote_id, 'Pólice gerada', `Pólice ${numero} emitida (via proposta ${prop.numero || ''}).`)
      // Atualiza lead vinculado para 'ganho'
      const leadId = prop.lead_id || prop.leadId
      if (leadId) {
        const linkedLead = leads.find(l => l.id === leadId)
        if (linkedLead && !['ganho', 'convertida'].includes(linkedLead.status)) {
          await updateLead(leadId, { ...linkedLead, status: 'ganho' })
        }
      }
      refetchHist()
      setSelected(propAtualizada)
      setShowConvertir(false)
      setShowDetalhes(false)
      showToast('Pólice criada com sucesso a partir da proposta')
      navigate(`/apolices?focus=${id}`)
    } catch {
      showToast('Erro ao gerar pólice.', 'error')
    }
  }

  function stagesFor(prop) {
    const cot = prop.quote_id ? cotacoes.find(c => c.id === prop.quote_id) : null
    const apolice = prop.converted_policy_id ? apolices.find(a => a.id === prop.converted_policy_id) : null
    const ends = apolice ? endossos.filter(e => e.policy_id === apolice.id || e.apoliceId === apolice.id) : []
    return [
      cot
        ? { key: 'cotacao', label: 'Cotação', stage: 'green', sub: cot.numero, onClick: () => navigate(`/cotacoes?focus=${cot.id}`) }
        : { key: 'cotacao', label: 'Cotação', stage: 'gray', sub: 'Avulsa' },
      { key: 'proposta', label: 'Proposta', stage: ['aprovada','convertida'].includes(prop.status) ? 'green' : ['recusada','perdida'].includes(prop.status) ? 'red' : 'blue', sub: prop.numero || prop.status },
      apolice
        ? { key: 'apolice', label: 'Apólice', stage: ['cancelada','vencida'].includes(apolice.status) ? 'red' : 'green', sub: apolice.numero, onClick: () => navigate(`/apolices?focus=${apolice.id}`) }
        : { key: 'apolice', label: 'Apólice', stage: 'gray', sub: 'Não criada' },
      { key: 'endosso', label: 'Endosso', stage: ends.length ? 'green' : 'gray', sub: ends.length ? `${ends.length} endosso(s)` : 'Nenhum', onClick: apolice ? () => navigate(`/endossos?apolice=${apolice.id}`) : undefined },
    ]
  }

  const eventos = selected ? historico.filter(h => h.entity_type === 'proposta' && h.entity_id === selected.id) : []
  const abertas = filtered.filter(p => !['aprovada', 'recusada', 'perdida', 'convertida'].includes(p.status)).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, tipo de seguro..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <div className="flex gap-2 shrink-0">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${inputCls} rounded-xl px-3 py-2.5 cursor-pointer`}>
            <option value="todos">Todos os status</option>
            {propostaStatusList.map(s => <option key={s} value={s}>{propostaStatus[s]?.label || s}</option>)}
          </select>
          <div className="flex border border-cyber-border rounded-xl overflow-hidden">
            <button onClick={() => setView('lista')} className={`px-3 py-2.5 ${view === 'lista' ? 'bg-cyber-cyan/10 text-cyber-cyan' : 'text-cyber-muted hover:bg-slate-100'}`} title="Lista"><List size={16} /></button>
            <button onClick={() => setView('kanban')} className={`px-3 py-2.5 ${view === 'kanban' ? 'bg-cyber-cyan/10 text-cyber-cyan' : 'text-cyber-muted hover:bg-slate-100'}`} title="Kanban"><LayoutGrid size={16} /></button>
          </div>
          <Button onClick={openNew} icon={<Plus size={16} />}>Nova Proposta</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-cyber-muted">
        <span>{filtered.length} propostas</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-cyan font-medium">{abertas} em aberto</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-green font-medium">{filtered.filter(p => p.status === 'aprovada').length} aprovadas</span>
      </div>

      {/* Lista */}
      {view === 'lista' && (
        filtered.length === 0 ? (
          <EmptyState icon={<Shield size={28} />} title="Nenhuma proposta" description="Cadastre uma nova proposta para começar." action={<Button onClick={openNew} icon={<Plus size={16} />}>Nova Proposta</Button>} />
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="bg-cyber-card rounded-2xl p-4 shadow-card border border-cyber-border/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {p.numero && <span className="font-mono text-xs text-cyber-cyan">{p.numero}</span>}
                      <p className="font-semibold text-cyber-text">{p.cliente}</p>
                      <StatusBadge status={p.status} type="proposta" />
                    </div>
                    <p className="text-sm text-cyber-muted">{p.tipoSeguro}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-cyber-muted">
                      <span>Seguradoras: {p.seguradorasCotadas?.join(', ') || '—'}</span>
                      <span>·</span>
                      <span>Resp: {p.responsavel?.split(' ')[0]}</span>
                      {p.dataSolicitacao && <><span>·</span><span>Solicitado: {p.dataSolicitacao}</span></>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {p.melhorValor && <p className="text-lg font-bold text-cyber-text">{fmtMoeda(p.melhorValor)}/ano</p>}
                    <div className="flex gap-2">
                      <button onClick={() => { setSelected(p); setShowDetalhes(true) }} className="flex items-center gap-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 px-3 py-1.5 rounded-lg transition-colors">
                        <Eye size={14} /> Ver
                      </button>
                      <button onClick={() => openEdit(p)} className="text-sm text-cyber-muted hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">Editar</button>
                      {p.converted_policy_id ? (
                        <button onClick={() => navigate(`/apolices?focus=${p.converted_policy_id}`)} className="flex items-center gap-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 px-3 py-1.5 rounded-lg transition-colors font-medium"><Shield size={14} /> Ver Pólice</button>
                      ) : (
                        <button onClick={() => { setSelected(p); setShowConvertir(true) }} className="flex items-center gap-1.5 text-sm text-cyber-green hover:bg-cyber-green/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
                          <Shield size={14} /> Gerar Pólice
                        </button>
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
          <KanbanPropostas
            propostas={ativas}
            onDropStatus={(prop, status) => alterarStatus(prop, status)}
            onOpen={p => { setSelected(p); setShowDetalhes(true) }}
          />
          <PerdidosPropostas
            propostas={perdidas}
            onReativar={p => alterarStatus(p, 'em_analise')}
            onOpen={p => { setSelected(p); setShowDetalhes(true) }}
          />
        </>
      )}

      {/* Modal Detalhes */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected?.numero ? `Proposta ${selected.numero}` : 'Detalhes da Proposta'} size="lg"
        footer={
          <div className="flex flex-wrap gap-2 justify-between">
            <Button variant="secondary" onClick={() => setShowDetalhes(false)}>Voltar</Button>
            <div className="flex flex-wrap gap-2">
              {selected?.quote_id && <Button variant="secondary" icon={<FileText size={14} />} onClick={() => navigate(`/cotacoes?focus=${selected.quote_id}`)}>Ver Cotação</Button>}
              {selected?.converted_policy_id ? (
                <Button icon={<Shield size={14} />} onClick={() => navigate(`/apolices?focus=${selected.converted_policy_id}`)}>Ver Pólice</Button>
              ) : (
                <Button variant="success" icon={<Shield size={14} />} onClick={() => setShowConvertir(true)}>Gerar Pólice</Button>
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
                <p className="text-sm text-cyber-muted">{selected.tipoSeguro} · {selected.seguradora || selected.seguradorasCotadas?.join(', ') || '—'}</p>
              </div>
              <StatusBadge status={selected.status} type="proposta" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Cotação vinculada', selected.cotacaoNumero || '—'],
                ['CPF/CNPJ', selected.cpfCnpj || '—'],
                ['Telefone', selected.telefone || '—'],
                ['E-mail', selected.email || '—'],
                ['Produto', selected.produto || '—'],
                ['Prêmio', fmtMoeda(selected.premio || selected.melhorValor)],
                ['Comissão', selected.comissao ? `${selected.percentualComissao || 0}% · ${fmtMoeda(selected.comissao)}` : '—'],
                ['Responsável', selected.responsavel],
                ['Solicitado em', selected.dataSolicitacao || '—'],
                ['Enviado em', selected.dataEnvio || '—'],
                ['Aprovada em', selected.dataAprovacao || '—'],
                ['Forma de pagamento', selected.formaPagamento || '—'],
              ].map(([k, v]) => (
                <div key={k}><p className="text-xs text-cyber-muted mb-0.5">{k}</p><p className="text-sm font-medium text-cyber-text">{v || '—'}</p></div>
              ))}
            </div>
            {selected.observacoes && <div className="p-3 bg-cyber-surface/60 rounded-xl"><p className="text-xs text-cyber-muted mb-1">Observações</p><p className="text-sm text-cyber-text/80">{selected.observacoes}</p></div>}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(selected)}>Editar</Button>
            </div>
            {/* Alterar status */}
            {!['convertida'].includes(selected.status) && (
              <div>
                <p className="hud-label mb-2">Mover para</p>
                <div className="flex flex-wrap gap-2">
                  {propostaStatusList.filter(s => s !== selected.status && s !== 'convertida').map(s => (
                    <button key={s} onClick={() => alterarStatus(selected, s)} className="text-[11px] px-2.5 py-1 rounded-full border border-cyber-border hover:border-cyber-cyan/40 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer">
                      {propostaStatus[s]?.label || s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="hud-label mb-2">Histórico</p>
              <Timeline events={eventos} />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmar geração de pólice */}
      <Modal isOpen={showConvertir} onClose={() => setShowConvertir(false)} title="Gerar Pólice" size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowConvertir(false)}>Cancelar</Button>
            <Button variant="success" icon={<Shield size={14} />} onClick={() => gerarPolice(selected)}>Gerar Pólice</Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-cyber-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-cyber-green" />
          </div>
          <p className="font-semibold text-cyber-text mb-2">Gerar pólice a partir desta proposta?</p>
          <p className="text-sm text-cyber-muted">Uma nova pólice será criada com os dados da proposta de <strong>{selected?.cliente}</strong>, vinculada automaticamente, e a proposta será marcada como convertida.</p>
        </div>
      </Modal>

      {/* Modal Novo/Edit */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Proposta' : 'Nova Proposta'} size="xl"
        footer={
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {aba > 0 && <Button variant="secondary" onClick={() => setAba(a => a - 1)}>Anterior</Button>}
              {aba < ABAS.length - 1 && <Button onClick={() => setAba(a => a + 1)}>Próximo</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Cadastrar'}</Button>
            </div>
          </div>
        }
      >
        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-cyber-border/40 overflow-x-auto scrollbar-hide">
          {ABAS.map((label, i) => (
            <button key={label} onClick={() => setAba(i)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${aba === i ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-cyber-muted hover:text-cyber-text/80'}`}>
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {aba === 0 && (
          <div className="space-y-3">
            <div><label className="hud-label mb-1">Cliente / Lead *</label><input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} className={inputCls} placeholder="Nome do cliente ou lead" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="hud-label mb-1">Tipo de seguro *</label>
                <select
                  value={form.tipoSeguro}
                  onChange={e => {
                    const tipo = e.target.value
                    setForm(f => aplicarComissaoDoTipo(tipo, { ...f, tipoSeguro: tipo, subcategorias: [], ramo: getRamo(tipo) }))
                  }}
                  className={inputCls}
                >
                  {getTipos(['seguro', 'saude', 'previdencia', 'consorcio']).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="hud-label mb-1">Coberturas / Subcategoria</label>
                <div className="flex flex-wrap gap-1.5 mt-1 min-h-[32px]">
                  {getSubcategorias(form.tipoSeguro).map(s => {
                    const sel = (form.subcategorias || []).includes(s.nome)
                    return (
                      <button key={s.id} type="button"
                        onClick={() => setForm(f => { const arr = f.subcategorias || []; return { ...f, subcategorias: arr.includes(s.nome) ? arr.filter(x => x !== s.nome) : [...arr, s.nome] } })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${sel ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/40' : 'bg-cyber-surface/50 text-cyber-muted border-cyber-border/40 hover:border-cyber-cyan/30'}`}>
                        {s.nome}
                      </button>
                    )
                  })}
                  {getSubcategorias(form.tipoSeguro).length === 0 && (
                    <span className="text-xs text-cyber-muted self-center">Selecione o tipo acima</span>
                  )}
                </div>
              </div>
              <div>
                <label className="hud-label mb-1">Responsável</label>
                <select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className={inputCls}>
                  {responsaveis.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="hud-label mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  {propostaStatusList.map(s => <option key={s} value={s}>{propostaStatus[s]?.label || s}</option>)}
                </select>
              </div>
              <div><label className="hud-label mb-1">Data de solicitação</label><input type="date" value={form.dataSolicitacao} onChange={e => setForm(f => ({ ...f, dataSolicitacao: e.target.value }))} className={inputCls} /></div>
              <div><label className="hud-label mb-1">Data de envio</label><input type="date" value={form.dataEnvio} onChange={e => setForm(f => ({ ...f, dataEnvio: e.target.value }))} className={inputCls} /></div>
              <div><label className="hud-label mb-1">Retorno previsto</label><input type="date" value={form.dataPrevRetorno} onChange={e => setForm(f => ({ ...f, dataPrevRetorno: e.target.value }))} className={inputCls} /></div>
            </div>
          </div>
        )}

        {aba === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-cyber-cyan/5 rounded-xl">
              <span className="text-xs text-cyber-cyan font-semibold uppercase tracking-wide">Tipo selecionado:</span>
              <span className="text-sm font-bold text-cyber-cyan">{form.tipoSeguro}</span>
            </div>
            <DynamicForm
              sections={insuranceTypeFields[form.tipoSeguro]?.sections || []}
              values={form}
              onChange={(key, val) => setForm(f => ({ ...f, [key]: val }))}
            />
          </div>
        )}

        {aba === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-cyber-muted mb-2 block">Seguradoras cotadas</label>
              <div className="grid grid-cols-2 gap-2 p-3 border border-cyber-border rounded-lg">
                {todas_seguradoras.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm text-cyber-text/80 cursor-pointer">
                    <input type="checkbox" checked={form.seguradorasCotadas?.includes(s)} onChange={e => setForm(f => ({ ...f, seguradorasCotadas: e.target.checked ? [...(f.seguradorasCotadas || []), s] : (f.seguradorasCotadas || []).filter(x => x !== s) }))} className="rounded" />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="hud-label mb-1">Melhor valor encontrado (R$/ano)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-cyber-muted font-medium">R$</span>
                  <input type="number" value={form.melhorValor} onChange={e => setForm(f => ({ ...f, melhorValor: e.target.value }))} className={inputCls + ' pl-8'} placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className="hud-label mb-1">Valor apresentado ao cliente (R$/ano)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-cyber-muted font-medium">R$</span>
                  <input type="number" value={form.valorApresentado} onChange={e => setForm(f => ({ ...f, valorApresentado: e.target.value }))} className={inputCls + ' pl-8'} placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className="hud-label mb-1">Prêmio líquido (R$)</label>
                <input type="number" value={form.premioLiquido} onChange={e => setForm(f => ({ ...f, premioLiquido: e.target.value }))} className={inputCls} placeholder="0,00" />
              </div>
              <div>
                <label className="hud-label mb-1">Prêmio bruto (R$)</label>
                <input type="number" value={form.premioBruto} onChange={e => setForm(f => ({ ...f, premioBruto: e.target.value }))} className={inputCls} placeholder="0,00" />
              </div>
              <div>
                <label className="hud-label mb-1">Comissão total (%)</label>
                <input type="number" step="0.01" value={form.percentualComissaoTotal} onChange={e => setForm(f => ({ ...f, percentualComissaoTotal: e.target.value }))} className={inputCls} placeholder="Ex: 15" />
              </div>
              <div>
                <label className="hud-label mb-1">Comissão ATTENTI (%) <span className="text-cyber-cyan font-semibold">{form.percentualComissaoAttenti ? `— ${form.percentualComissaoAttenti}%` : ''}</span></label>
                <input type="number" step="0.01" value={form.percentualComissaoAttenti} onChange={e => setForm(f => ({ ...f, percentualComissaoAttenti: e.target.value }))} className={inputCls + ' bg-cyber-cyan/5'} placeholder="Auto-preenchido pelo tipo" />
              </div>
              {form.coCorretagem && (
                <div>
                  <label className="hud-label mb-1">Co-corretagem Grupo MEGA (%)</label>
                  <input type="number" step="0.01" value={form.percentualComissaoMega} onChange={e => setForm(f => ({ ...f, percentualComissaoMega: e.target.value }))} className={inputCls + ' bg-violet-500/5'} />
                </div>
              )}
              <div>
                <label className="hud-label mb-1">Forma de pagamento</label>
                <select value={form.formaPagamento} onChange={e => setForm(f => ({ ...f, formaPagamento: e.target.value }))} className={inputCls}>
                  {formasPagamento.map(fp => <option key={fp}>{fp}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {aba === 3 && (
          <div className="space-y-3">
            <div><label className="hud-label mb-1">Motivo de perda (se aplicável)</label><input value={form.motivoPerda} onChange={e => setForm(f => ({ ...f, motivoPerda: e.target.value }))} className={inputCls} placeholder="Ex: preço, concorrência, não contratou..." /></div>
            <div><label className="hud-label mb-1">Observações gerais</label><textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={6} className={inputCls + ' resize-none'} placeholder="Notas internas, pontos de atenção, histórico de negociação..." /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function KanbanPropostas({ propostas, onDropStatus, onOpen }) {
  const [dragId, setDragId] = useState(null)
  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex gap-3 min-w-max">
        {propostaKanbanList.map(col => {
          const items = propostas.filter(p => p.status === col)
          return (
            <div key={col}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { const p = propostas.find(x => x.id === dragId); if (p && p.status !== col) onDropStatus(p, col); setDragId(null) }}
              className="w-64 shrink-0 bg-cyber-surface/60 border border-cyber-border/60 rounded-2xl p-2.5"
            >
              <div className="flex items-center justify-between px-1.5 mb-2">
                <span className="text-xs font-semibold text-cyber-text">{propostaStatus[col]?.label || col}</span>
                <span className="text-[10px] text-cyber-muted bg-cyber-card border border-cyber-border rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <div className="space-y-2 min-h-[40px]">
                {items.map(p => (
                  <div key={p.id} draggable
                    onDragStart={() => setDragId(p.id)}
                    onClick={() => onOpen(p)}
                    className="bg-cyber-card border border-cyber-border/50 rounded-xl p-3 cursor-pointer hover:border-cyber-cyan/40 hover:shadow-card-md transition-all active:cursor-grabbing">
                    {p.numero && <p className="font-mono text-[10px] text-cyber-cyan mb-0.5">{p.numero}</p>}
                    <p className="text-sm font-semibold text-cyber-text leading-tight">{p.cliente}</p>
                    <p className="text-xs text-cyber-muted mt-0.5">{p.tipoSeguro}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-cyber-text">{p.melhorValor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.melhorValor) : '—'}</span>
                      {p.converted_policy_id && <Badge color="green">Pólice</Badge>}
                    </div>
                    <p className="text-[10px] text-cyber-muted mt-1">{p.responsavel?.split(' ')[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PerdidosPropostas({ propostas, onReativar, onOpen }) {
  const [open, setOpen] = useState(false)
  if (propostas.length === 0) return null
  return (
    <div className="border border-cyber-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/40 transition-colors">
        <span className="flex items-center gap-2">
          Perdidas / Recusadas
          <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold">{propostas.length}</span>
        </span>
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {propostas.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-cyber-card/60 border border-cyber-border/30 rounded-xl px-3 py-2.5 cursor-pointer" onClick={() => onOpen(p)}>
              <div>
                {p.numero && <p className="text-xs font-mono text-cyber-muted">{p.numero}</p>}
                <p className="text-sm font-medium text-cyber-text/70">{p.cliente}</p>
                <p className="text-xs text-cyber-muted">{p.tipoSeguro}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); onReativar(p) }} className="text-xs text-cyber-cyan hover:underline ml-2 shrink-0">Reativar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
