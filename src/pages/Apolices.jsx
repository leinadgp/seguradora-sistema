import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Eye, Edit2, FileText, Paperclip, Upload, X as XIcon, Download, FilePen, ClipboardList } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge, { StatusBadge } from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import DynamicForm from '../components/ui/DynamicForm'
import FluxoSeguro from '../components/ui/FluxoSeguro'
import Timeline from '../components/ui/Timeline'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { insuranceTypeFields } from '../data/insuranceFields'
import { logEvento } from '../lib/flow'
import { useCatalogo } from '../hooks/useCatalogo'
const statusOpcoes = ['ativa', 'vencida', 'cancelada', 'em_renovacao', 'suspensa', 'aguardando_pagamento', 'aguardando_emissao']
const formasPagamento = ['Débito automático', 'Cartão de crédito', 'Boleto', 'PIX']
const responsaveis = ['Carlos Silva', 'Ana Santos', 'Pedro Lima', 'Roberto Alves']


const ABAS_FORM = ['Dados Principais', 'Dados do Seguro', 'Coberturas', 'Financeiro', 'Observações', 'Anexos']

const emptyForm = {
  clienteId: '', cliente: '', tipoSeguro: 'Auto', subcategorias: [], ramo: '',
  seguradoraId: '', seguradora: '', numero: '', numeroProposta: '',
  corretor: 'Carlos Silva', status: 'ativa', dataEmissao: '', inicioVigencia: '', fimVigencia: '', dataRenovacao: '', canal: 'Corretor',
  premioBruto: '', premioLiquido: '', formaPagamento: 'Boleto', parcelas: '12', valorParcela: '', vencimentoPrimeiraParcela: '',
  diaVencimento: '1', comissaoPercentual: '15', comissaoValor: '', statusComissao: 'prevista', observacoes: '', anexos: [],
  // Auto
  marca: '', modelo: '', anoFab: '', anoMod: '', placa: '', chassi: '', renavam: '', valorFipe: '',
  uso: 'Lazer', garagem: true, condutorPrincipal: '', classeBonus: '1', coberturaTotal: true, coberturaRca: '', assistencia24h: true, carroReserva: false, franquia: '',
  // Residencial
  tipoImovel: 'Apartamento', enderecoImovel: '', areaConstruida: '', tipoConstrucao: 'Alvenaria', valorImovel: '',
  coberturaIncendio: '', coberturaRoubo: '', coberturaDanosEletricos: '', coberturaRC: '',
  // Empresarial
  cnpjEmpresa: '', atividadeEmpresa: '', enderecoSegurado: '', areaEstabelecimento: '', numFuncionarios: '', faturamentoMensal: '',
  cobIncendio: '', cobRoubo: '', cobEquipamentos: '', cobRCEmpresarial: '', cobLucros: false,
  // Vida
  seguradoPrincipal: '', capitalSegurado: '', cobMorte: true, cobInvalidez: true, cobDoencasGraves: false, cobFuneral: false,
  // Saúde
  titular: '', qtdVidas: '1', operadora: '', tipoPlano: '', abrangencia: 'Nacional', coparticipacao: false, acomodacao: 'Enfermaria', valorMensal: '',
}


function fmtMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Apolices() {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: apolices, create, update } = useResource('apolices')
  const fileInputRef = useRef(null)
  const { data: clientes } = useResource('clientes')
  const { data: seguradoras } = useResource('seguradoras')
  const { data: cotacoes } = useResource('cotacoes')
  const { data: propostas } = useResource('propostas')
  const { data: endossos } = useResource('endossos')
  const { data: historico } = useResource('historico')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('Todos')
  const [filterVenc, setFilterVenc] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [abaForm, setAbaForm] = useState(0)
  const { getTipos, getSubcategorias, getRamo } = useCatalogo()

  const filtered = apolices.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.cliente.toLowerCase().includes(q) || a.numero.toLowerCase().includes(q) || a.tipoSeguro.toLowerCase().includes(q) || a.seguradora.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || a.status === filterStatus
    const matchTipo = filterTipo === 'Todos' || a.tipoSeguro === filterTipo
    const matchVenc = filterVenc === 'Todos' || (filterVenc === '7' && a.diasParaVencer <= 7) || (filterVenc === '30' && a.diasParaVencer <= 30) || (filterVenc === '60' && a.diasParaVencer <= 60) || (filterVenc === '90' && a.diasParaVencer <= 90)
    return matchSearch && matchStatus && matchTipo && matchVenc
  })

  function openNew() { setForm(emptyForm); setIsEditing(false); setAbaForm(0); setShowModal(true) }
  function openEdit(a) { setForm({ ...emptyForm, ...a, anexos: a.anexos || [], ...(a.autoData || {}), ...(a.residencialData || {}), ...(a.empresarialData || {}), ...(a.saudeData || {}) }); setIsEditing(true); setAbaForm(0); setShowModal(true); setShowDetalhes(false) }

  // Auto-abrir detalhe via ?focus=<id>
  useEffect(() => {
    const focus = searchParams.get('focus')
    if (focus && apolices.length) {
      const a = apolices.find(x => x.id === focus)
      if (a) { setSelected(a); setShowDetalhes(true) }
      searchParams.delete('focus'); setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, apolices]) // eslint-disable-line

  function stagesFor(a) {
    const cot = a.quote_id ? cotacoes.find(c => c.id === a.quote_id) : null
    const prop = a.proposal_id ? propostas.find(p => p.id === a.proposal_id) : null
    const ends = endossos.filter(e => e.policy_id === a.id || e.apoliceId === a.id)
    return [
      cot
        ? { key: 'cotacao', label: 'Cotação', stage: 'green', sub: cot.numero, onClick: () => navigate(`/cotacoes?focus=${cot.id}`) }
        : { key: 'cotacao', label: 'Cotação', stage: 'gray', sub: '—' },
      prop
        ? { key: 'proposta', label: 'Proposta', stage: 'green', sub: prop.numero || 'Vinculada', onClick: () => navigate(`/propostas?focus=${prop.id}`) }
        : { key: 'proposta', label: 'Proposta', stage: 'gray', sub: 'Avulsa' },
      { key: 'apolice', label: 'Apólice', stage: ['cancelada','vencida'].includes(a.status) ? 'red' : 'green', sub: a.numero },
      { key: 'endosso', label: 'Endosso', stage: ends.length ? 'green' : 'gray', sub: ends.length ? `${ends.length} endosso(s)` : 'Nenhum', onClick: () => navigate(`/endossos?apolice=${a.id}`) },
    ]
  }

  const endossosApolice = selected ? endossos.filter(e => e.policy_id === selected.id || e.apoliceId === selected.id) : []
  const eventos = selected ? historico.filter(h => h.entity_type === 'apolice' && h.entity_id === selected.id) : []

  function handleAnexos(e) {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const anexo = { id: Date.now() + Math.random(), nome: file.name, tamanho: file.size, tipo: file.type, data: new Date().toISOString().split('T')[0], dataUrl: ev.target.result }
        setForm(f => ({ ...f, anexos: [...(f.anexos || []), anexo] }))
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removerAnexo(id) {
    setForm(f => ({ ...f, anexos: (f.anexos || []).filter(a => a.id !== id) }))
  }

  function downloadAnexo(anexo) {
    const a = document.createElement('a')
    a.href = anexo.dataUrl
    a.download = anexo.nome
    a.click()
  }

  async function handleSave() {
    if (!form.cliente) { showToast('Selecione um cliente.', 'error'); return }
    if (!form.tipoSeguro) { showToast('Selecione o tipo de seguro.', 'error'); return }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form })
        showToast('Apólice atualizada com sucesso!')
      } else {
        await create({ ...form, id: Date.now().toString(), diasParaVencer: 365, dataEmissao: new Date().toISOString().split('T')[0] })
        showToast('Apólice cadastrada com sucesso!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  const vencendoLogo = filtered.filter(a => a.diasParaVencer <= 30 && a.status === 'ativa').length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, nº apólice, seguradora..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
            <option value="todos">Todos os status</option>
            {statusOpcoes.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
            <option>Todos</option>
            {tiposSeguros.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterVenc} onChange={e => setFilterVenc(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
            <option>Todos</option>
            <option value="7">Vence em 7d</option>
            <option value="30">Vence em 30d</option>
            <option value="60">Vence em 60d</option>
            <option value="90">Vence em 90d</option>
          </select>
          <Button onClick={openNew} icon={<Plus size={16} />}>Nova Apólice</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm text-cyber-muted">
        <span>{filtered.length} apólices</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-green font-medium">{filtered.filter(a => a.status === 'ativa').length} ativas</span>
        {vencendoLogo > 0 && <><span className="text-cyber-dim">·</span><span className="text-cyber-amber font-medium">{vencendoLogo} vencendo em 30d</span></>}
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={28} />} title="Nenhuma apólice encontrada" description="Ajuste os filtros ou cadastre uma nova apólice." action={<Button onClick={openNew} icon={<Plus size={16} />}>Nova Apólice</Button>} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-cyber-card rounded-2xl shadow-card border border-cyber-border/40 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border/40">
                  {['Cliente', 'Tipo / Seguradora', 'Nº Apólice', 'Vigência', 'Prêmio', 'Dias p/ Vencer', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left hud-label px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/20">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-cyber-text">{a.cliente}</p>
                      <p className="text-xs text-cyber-muted">{a.corretor}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-cyber-text/80">{a.tipoSeguro}</p>
                      <p className="text-xs text-cyber-muted">{a.seguradora}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-data text-cyber-text/80">{a.numero}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-cyber-muted">{a.inicioVigencia}</p>
                      <p className="text-xs text-cyber-muted">até {a.fimVigencia}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-cyber-text">{fmtMoeda(a.premioBruto)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${a.diasParaVencer <= 15 ? 'text-cyber-red' : a.diasParaVencer <= 30 ? 'text-cyber-amber' : 'text-cyber-muted'}`}>
                        {a.diasParaVencer}d
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} type="apolice" /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setSelected(a); setShowDetalhes(true) }} className="p-1.5 text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg transition-colors"><Eye size={15} /></button>
                        <button onClick={() => { setSelected(a); openEdit(a) }} className="p-1.5 text-cyber-muted hover:text-cyber-muted hover:bg-slate-100 rounded-lg transition-colors"><Edit2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(a => (
              <div key={a.id} className="bg-cyber-card rounded-2xl p-4 shadow-card border border-cyber-border/40">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-cyber-text">{a.cliente}</p>
                    <p className="text-xs text-cyber-muted">{a.tipoSeguro} · {a.seguradora}</p>
                  </div>
                  <StatusBadge status={a.status} type="apolice" />
                </div>
                <p className="text-xs font-data text-cyber-muted mb-2">{a.numero}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-cyber-text">{fmtMoeda(a.premioBruto)}</span>
                  <span className={`text-sm font-bold ${a.diasParaVencer <= 30 ? 'text-cyber-amber' : 'text-cyber-muted'}`}>{a.diasParaVencer}d p/ vencer</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setSelected(a); setShowDetalhes(true) }} className="flex-1 py-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg text-center transition-colors">Ver detalhes</button>
                  <button onClick={() => { setSelected(a); openEdit(a) }} className="flex-1 py-1.5 text-sm text-cyber-muted hover:bg-slate-100 rounded-lg text-center transition-colors">Editar</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Detalhes Apólice */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected?.numero ? `Pólise ${selected.numero}` : 'Detalhes da Apólice'} size="lg"
        footer={
          <div className="flex flex-wrap gap-2 justify-between">
            <Button variant="secondary" onClick={() => setShowDetalhes(false)}>Voltar</Button>
            <div className="flex flex-wrap gap-2">
              {selected?.proposal_id && <Button variant="secondary" icon={<ClipboardList size={14} />} onClick={() => navigate(`/propostas?focus=${selected.proposal_id}`)}>Ver Proposta</Button>}
              {endossosApolice.length > 0 && <Button variant="secondary" icon={<FilePen size={14} />} onClick={() => navigate(`/endossos?apolice=${selected.id}`)}>Ver Endossos ({endossosApolice.length})</Button>}
              <Button icon={<FilePen size={14} />} onClick={() => navigate(`/endossos?apolice=${selected.id}&novo=1`)}>Adicionar Endosso</Button>
            </div>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <FluxoSeguro stages={stagesFor(selected)} />
            {selected.temEndosso && <Badge color="purple">Com endosso</Badge>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[['Número', selected.numero], ['Cliente', selected.cliente], ['Tipo de Seguro', selected.tipoSeguro], ['Seguradora', selected.seguradora], ['Corretor', selected.corretor], ['Status', null], ['Início', selected.inicioVigencia], ['Vencimento', selected.fimVigencia], ['Dias p/ Vencer', `${selected.diasParaVencer} dias`], ['Prêmio bruto', fmtMoeda(selected.premioBruto)], ['Comissão', fmtMoeda(selected.comissaoValor)], ['Status comissão', selected.statusComissao]].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-cyber-muted mb-0.5">{k}</p>
                  {v === null ? <StatusBadge status={selected.status} type="apolice" /> : <p className="text-sm font-medium text-cyber-text">{v}</p>}
                </div>
              ))}
            </div>
            {selected.autoData && (
              <div>
                <p className="hud-label mb-2">Dados do Veículo</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-cyber-surface/50 rounded-xl">
                  {[['Veículo', `${selected.autoData.marca} ${selected.autoData.modelo}`], ['Ano', `${selected.autoData.anoFab}/${selected.autoData.anoMod}`], ['Placa', selected.autoData.placa], ['Valor FIPE', fmtMoeda(selected.autoData.valorFipe)], ['Classe Bônus', selected.autoData.classeBonus], ['Franquia', fmtMoeda(selected.autoData.franquia)]].map(([k, v]) => (
                    <div key={k}><p className="text-xs text-cyber-muted mb-0.5">{k}</p><p className="text-sm font-medium">{v}</p></div>
                  ))}
                </div>
              </div>
            )}
            {selected.observacoes && <div className="p-3 bg-cyber-amber/5 rounded-xl"><p className="text-xs text-cyber-amber font-semibold mb-1">Observações</p><p className="text-sm text-cyber-amber">{selected.observacoes}</p></div>}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="hud-label">Endossos ({endossosApolice.length})</p>
                <button onClick={() => navigate(`/endossos?apolice=${selected.id}&novo=1`)} className="text-xs text-cyber-cyan hover:underline cursor-pointer">+ Adicionar endosso</button>
              </div>
              {endossosApolice.length === 0 ? (
                <p className="text-xs text-cyber-muted italic">Nenhum endosso vinculado a esta pólise.</p>
              ) : (
                <div className="space-y-2">
                  {endossosApolice.map(e => (
                    <button key={e.id} onClick={() => navigate(`/endossos?apolice=${selected.id}&focus=${e.id}`)} className="w-full text-left flex items-center justify-between p-2.5 border border-cyber-border/40 rounded-lg hover:border-cyber-cyan/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-cyber-text">{e.numero} · {e.tipoEndosso}</p>
                        <p className="text-xs text-cyber-muted">{e.dataRequisicao || e.dataEndosso || ''}</p>
                      </div>
                      <Badge color={['aprovado','aplicado','emitido'].includes(e.status) ? 'green' : ['recusado','rejeitado'].includes(e.status) ? 'red' : 'blue'}>{(e.status || '').replace(/_/g,' ')}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="hud-label mb-2">Histórico</p>
              <Timeline events={eventos} />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Cadastro/Edição */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Apólice' : 'Nova Apólice'} size="xl"
        footer={
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {abaForm > 0 && <Button variant="secondary" onClick={() => setAbaForm(a => a - 1)}>Anterior</Button>}
              {abaForm < ABAS_FORM.length - 1 && <Button onClick={() => setAbaForm(a => a + 1)}>Próximo</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Apólice'}</Button>
            </div>
          </div>
        }
      >
        {/* Abas do formulário */}
        <div className="flex gap-1 mb-5 border-b border-cyber-border/40 overflow-x-auto scrollbar-hide">
          {ABAS_FORM.map((aba, i) => (
            <button key={aba} onClick={() => setAbaForm(i)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${abaForm === i ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-cyber-muted hover:text-cyber-text/80'}`}>
              {i + 1}. {aba}
            </button>
          ))}
        </div>

        {/* Aba 0: Dados Principais */}
        {abaForm === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="hud-label mb-1">Cliente *</label>
                <select value={form.clienteId} onChange={e => { const c = clientes.find(c => c.id === e.target.value); setForm(f => ({ ...f, clienteId: e.target.value, cliente: c?.nome || '' })) }} className={inputCls}>
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="hud-label mb-1">Tipo de Seguro *</label>
                <select value={form.tipoSeguro} onChange={e => setForm(f => ({ ...f, tipoSeguro: e.target.value, subcategorias: [], ramo: getRamo(e.target.value) }))} className={inputCls}>
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
                <label className="hud-label mb-1">Seguradora</label>
                <select value={form.seguradoraId} onChange={e => { const s = seguradoras.find(s => s.id === e.target.value); setForm(f => ({ ...f, seguradoraId: e.target.value, seguradora: s?.nome || '' })) }} className={inputCls}>
                  <option value="">Selecione...</option>
                  {seguradoras.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div><label className="hud-label mb-1">Número da apólice</label><input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} className={inputCls} placeholder="AP-2024-0000" /></div>
              <div><label className="hud-label mb-1">Número da proposta</label><input value={form.numeroProposta} onChange={e => setForm(f => ({ ...f, numeroProposta: e.target.value }))} className={inputCls} /></div>
              <div>
                <label className="hud-label mb-1">Corretor responsável</label>
                <select value={form.corretor} onChange={e => setForm(f => ({ ...f, corretor: e.target.value }))} className={inputCls}>
                  {responsaveis.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="hud-label mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  {statusOpcoes.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div><label className="hud-label mb-1">Data de emissão</label><input type="date" value={form.dataEmissao} onChange={e => setForm(f => ({ ...f, dataEmissao: e.target.value }))} className={inputCls} /></div>
              <div><label className="hud-label mb-1">Início da vigência</label><input type="date" value={form.inicioVigencia} onChange={e => setForm(f => ({ ...f, inicioVigencia: e.target.value }))} className={inputCls} /></div>
              <div><label className="hud-label mb-1">Fim da vigência</label><input type="date" value={form.fimVigencia} onChange={e => setForm(f => ({ ...f, fimVigencia: e.target.value }))} className={inputCls} /></div>
              <div><label className="hud-label mb-1">Data de renovação</label><input type="date" value={form.dataRenovacao} onChange={e => setForm(f => ({ ...f, dataRenovacao: e.target.value }))} className={inputCls} /></div>
            </div>
          </div>
        )}

        {/* Aba 1: Dados do Seguro (dinâmico por tipo) */}
        {abaForm === 1 && (
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

        {/* Aba 2: Coberturas */}
        {abaForm === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-cyber-cyan/5 rounded-xl">
              <p className="text-sm font-semibold text-cyber-text mb-2">Resumo de Coberturas — {form.tipoSeguro}</p>
              <p className="text-sm text-cyber-cyan">Configure as coberturas nos campos do tipo de seguro (aba anterior) ou detalhe abaixo:</p>
            </div>
            <div>
              <label className="hud-label mb-1">Coberturas incluídas (texto livre)</label>
              <textarea rows={4} className={inputCls + ' resize-none'} placeholder="Ex: Cobertura total, RCA 100k, RCF 50k, Assistência 24h, Carro reserva 10 dias..." />
            </div>
            <div>
              <label className="hud-label mb-1">Coberturas excluídas / franquias</label>
              <textarea rows={3} className={inputCls + ' resize-none'} placeholder="Ex: Sem cobertura para alagamento. Franquia padrão R$ 2.800." />
            </div>
          </div>
        )}

        {/* Aba 3: Financeiro */}
        {abaForm === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="hud-label mb-1">Prêmio líquido (R$)</label><input type="number" value={form.premioLiquido} onChange={e => setForm(f => ({ ...f, premioLiquido: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Prêmio total (R$)</label><input type="number" value={form.premioBruto} onChange={e => setForm(f => ({ ...f, premioBruto: e.target.value }))} className={inputCls} /></div>
            <div>
              <label className="hud-label mb-1">Forma de pagamento</label>
              <select value={form.formaPagamento} onChange={e => setForm(f => ({ ...f, formaPagamento: e.target.value }))} className={inputCls}>
                {formasPagamento.map(fp => <option key={fp}>{fp}</option>)}
              </select>
            </div>
            <div>
              <label className="hud-label mb-1">Parcelas</label>
              <select value={form.parcelas} onChange={e => setForm(f => ({ ...f, parcelas: e.target.value }))} className={inputCls}>
                {['1', '2', '3', '4', '6', '10', '12'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="hud-label mb-1">Valor da parcela (R$)</label><input value={form.valorParcela} onChange={e => setForm(f => ({ ...f, valorParcela: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">1º vencimento</label><input type="date" value={form.vencimentoPrimeiraParcela} onChange={e => setForm(f => ({ ...f, vencimentoPrimeiraParcela: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Comissão (%)</label><input type="number" value={form.comissaoPercentual} onChange={e => setForm(f => ({ ...f, comissaoPercentual: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Comissão (R$)</label><input value={form.comissaoValor} onChange={e => setForm(f => ({ ...f, comissaoValor: e.target.value }))} className={inputCls} /></div>
            <div>
              <label className="hud-label mb-1">Status da comissão</label>
              <select value={form.statusComissao} onChange={e => setForm(f => ({ ...f, statusComissao: e.target.value }))} className={inputCls}>
                <option value="prevista">Prevista</option>
                <option value="recebida">Recebida</option>
                <option value="paga_corretor">Paga ao corretor</option>
                <option value="atrasada">Atrasada</option>
              </select>
            </div>
          </div>
        )}

        {/* Aba 4: Observações */}
        {abaForm === 4 && (
          <div className="space-y-3">
            <div><label className="hud-label mb-1">Canal de venda</label>
              <select value={form.canal} onChange={e => setForm(f => ({ ...f, canal: e.target.value }))} className={inputCls}>
                {['Corretor', 'Digital', 'Parceiro', 'Renovação'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="hud-label mb-1">Observações gerais</label><textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={5} className={inputCls + ' resize-none'} /></div>
          </div>
        )}

        {/* Aba 5: Anexos */}
        {abaForm === 5 && (
          <div className="space-y-4">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAnexos} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-cyber-cyan/30 rounded-2xl hover:border-cyber-cyan/60 hover:bg-cyber-cyan/5 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyber-cyan/10 flex items-center justify-center group-hover:bg-cyber-cyan/20 transition-colors">
                <Upload size={22} className="text-cyber-cyan" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-cyber-text">Clique para selecionar arquivos</p>
                <p className="text-xs text-cyber-muted mt-0.5">PDF, Imagens, Word, Excel — múltiplos arquivos permitidos</p>
              </div>
            </button>

            {(form.anexos || []).length === 0 ? (
              <p className="text-center text-sm text-cyber-muted py-4">Nenhum anexo adicionado</p>
            ) : (
              <div className="space-y-2">
                {(form.anexos || []).map(anexo => (
                  <div key={anexo.id} className="flex items-center gap-3 p-3 bg-cyber-surface/50 rounded-xl border border-cyber-border/40 group">
                    <div className="w-9 h-9 rounded-lg bg-cyber-cyan/10 flex items-center justify-center shrink-0">
                      <Paperclip size={15} className="text-cyber-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cyber-text truncate">{anexo.nome}</p>
                      <p className="text-xs text-cyber-muted">{formatBytes(anexo.tamanho)} · {anexo.data}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => downloadAnexo(anexo)} className="p-1.5 rounded-lg hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer" title="Baixar">
                        <Download size={13} />
                      </button>
                      <button onClick={() => removerAnexo(anexo.id)} className="p-1.5 rounded-lg hover:bg-cyber-red/10 text-cyber-muted hover:text-cyber-red transition-colors cursor-pointer" title="Remover">
                        <XIcon size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-cyber-muted text-center">
              Os anexos são salvos junto com a apólice e ficam disponíveis para download posteriormente.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
