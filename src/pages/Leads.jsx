import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { input as inputCls } from '../lib/styles'
import { Plus, Phone, User, Search, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { validarEmail, validarTelefone } from '../lib/validators'
import { genNumero, todayISO } from '../lib/flow'
import { useCatalogo } from '../hooks/useCatalogo'

const COLUNAS = [
  { key: 'novo', label: 'Novo', cor: 'bg-cyber-surface text-cyber-muted' },
  { key: 'primeiro_contato', label: '1º Contato', cor: 'bg-cyber-cyan/10 text-cyber-cyan' },
  { key: 'qualificacao', label: 'Qualificação', cor: 'bg-cyber-purple/10 text-cyber-purple' },
  { key: 'cotacao', label: 'Em Cotação', cor: 'bg-cyber-amber/10 text-cyber-amber' },
]

const FASES_FINAIS = [
  { key: 'ganho', label: 'Ganho ✓', cor: 'bg-cyber-green/10 text-cyber-green' },
  { key: 'perdido', label: 'Perdido', cor: 'bg-red-100 text-red-500' },
]

const tempCor = { quente: 'bg-cyber-red glow-red', morno: 'bg-cyber-amber', frio: 'bg-cyber-cyan' }
// Lista mantida apenas como referência; selects usam useCatalogo()
const tiposSeguros = ['Auto', 'Moto', 'Residencial', 'Empresarial', 'Vida Individual', 'Vida Empresarial', 'Saúde', 'Frota', 'Rural', 'Viagem']
const origens = ['Site', 'Indicação', 'Redes Sociais', 'WhatsApp', 'Prospecção', 'Facebook Ads', 'Google Ads']

const emptyForm = { nome: '', telefone: '', whatsapp: '', email: '', cidade: '', estado: 'SP', tipoSeguro: 'Auto', subcategorias: [], coberturas: [], ramo: '', origem: 'Site', campanha: '', responsavel: 'Carlos Silva', status: 'novo', temperatura: 'morno', valorEstimado: '', proximaAcao: '', observacoes: '' }

export default function Leads() {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const { data: leads, create, update, remove } = useResource('leads')
  const { data: usuarios } = useResource('usuarios')
  const { data: cotacoes, create: createCotacao } = useResource('cotacoes')
  const { create: createCliente } = useResource('clientes')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [showPerdidos, setShowPerdidos] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [dragId, setDragId] = useState(null)
  const { getTipos, getSubcategorias, getCoberturasDaSelecao, getRamo } = useCatalogo()
  const [expandCobs, setExpandCobs] = useState(false)
  const [dragOver, setDragOver] = useState(null)
  const [confirmCotacao, setConfirmCotacao] = useState(null) // { lead }
  const scrollRef = useRef(null)
  const scrollState = useRef({ dragging: false, startX: 0, scrollLeft: 0 })
  const touchState = useRef({ cardId: null })

  const ativos = leads.filter(l => !['ganho', 'perdido'].includes(l.status))
  const perdidos = leads.filter(l => l.status === 'perdido')
  const ganhos = leads.filter(l => l.status === 'ganho')

  const filtered = ativos.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.nome.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.telefone?.includes(q)
  })

  function openNew() { setForm(emptyForm); setIsEditing(false); setShowModal(true) }
  function openEdit(l) { setForm({ ...emptyForm, ...l }); setIsEditing(true); setShowModal(true); setShowDetalhes(false) }

  function buildClienteFromLead(leadId, leadData, clienteId) {
    return {
      id: clienteId,
      tipo: 'PF',
      nome: leadData.nome,
      cpf: '',
      cnpj: '',
      email: leadData.email || '',
      telefone: leadData.telefone || '',
      whatsapp: leadData.whatsapp || '',
      cidade: leadData.cidade || '',
      estado: leadData.estado || 'SP',
      lead_id: leadId,
      origem: leadData.origem || '',
      responsavel: leadData.responsavel || '',
      status: 'prospect',
      observacoes: leadData.observacoes || '',
      dataCadastro: todayISO(),
    }
  }

  async function handleConverterCliente(lead) {
    if (lead.cliente_id) {
      setShowDetalhes(false)
      navigate('/clientes')
      return
    }
    try {
      const clienteId = Date.now().toString()
      await createCliente(buildClienteFromLead(lead.id, lead, clienteId))
      await update(lead.id, { ...lead, cliente_id: clienteId })
      setSelected(prev => prev ? { ...prev, cliente_id: clienteId } : prev)
      showToast(`Cliente "${lead.nome}" criado com sucesso!`)
    } catch {
      showToast('Erro ao criar cliente.', 'error')
    }
  }

  async function handleSave() {
    if (!form.nome) { showToast('Preencha o nome do lead.', 'error'); return }
    if (form.email && !validarEmail(form.email)) { showToast('E-mail inválido.', 'error'); return }
    if (form.telefone && !validarTelefone(form.telefone)) { showToast('Telefone inválido.', 'error'); return }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form })
        showToast('Lead atualizado!')
      } else {
        const leadId = Date.now().toString()
        const novoLead = { ...form, id: leadId, createdAt: new Date().toISOString().split('T')[0] }
        await create(novoLead)
        const clienteId = String(parseInt(leadId) + 1)
        await createCliente(buildClienteFromLead(leadId, form, clienteId))
        await update(leadId, { ...novoLead, cliente_id: clienteId })
        showToast(`Lead cadastrado e cliente "${form.nome}" criado automaticamente!`)
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function moverLead(id, novoStatus) {
    const lead = leads.find(l => l.id === id)
    if (!lead) return

    const isFinal = FASES_FINAIS.some(f => f.key === novoStatus)

    if (!isFinal) {
      const colOrder = COLUNAS.map(c => c.key)
      const idxNovo    = colOrder.indexOf(novoStatus)
      const cotacaoIdx = colOrder.indexOf('cotacao')

      // Bloqueio: lead além das colunas ativas (gerou proposta) — não permite voltar ao pipeline
      if (!colOrder.includes(lead.status)) {
        showToast('Este lead já gerou uma proposta. Acesse a pipeline de Propostas para gerenciar.', 'error')
        return
      }
      // Bloqueio: tem cotação ativa e tenta voltar antes do estágio 'cotacao'
      if (lead.cotacao_id && idxNovo < cotacaoIdx) {
        showToast('Este lead está em cotação ativa. Acesse a pipeline de Cotações para gerenciar.', 'error')
        return
      }
      // Confirmação: movendo para 'cotacao' sem cotação vinculada → exibe modal
      if (novoStatus === 'cotacao' && !lead.cotacao_id) {
        setConfirmCotacao({ lead })
        return
      }
    }

    await executarMoverLead(lead, novoStatus)
  }

  async function executarMoverLead(lead, novoStatus) {
    try {
      // Auto-criar cliente ao entrar em cotação se ainda não houver um vinculado
      let leadAtual = lead
      if (novoStatus === 'cotacao' && !lead.cliente_id) {
        const clienteId = Date.now().toString()
        await createCliente(buildClienteFromLead(lead.id, lead, clienteId))
        await update(lead.id, { ...lead, cliente_id: clienteId })
        leadAtual = { ...lead, cliente_id: clienteId }
        setSelected(prev => prev ? { ...prev, cliente_id: clienteId } : prev)
        showToast(`Cliente criado automaticamente para ${lead.nome}.`)
      }

      if (novoStatus === 'cotacao') {
        if (leadAtual.cotacao_id) {
          await update(leadAtual.id, { ...leadAtual, status: novoStatus })
          showToast('Lead movido para Em Cotação. Cotação já existente vinculada.')
          setSelected(prev => prev ? { ...prev, status: novoStatus } : prev)
          return
        }
        const numero = genNumero('COT', cotacoes)
        const cotId = Date.now().toString()
        await createCotacao({
          id: cotId, numero,
          lead_id: leadAtual.id,
          cliente: leadAtual.nome,
          telefone: leadAtual.telefone || '',
          whatsapp: leadAtual.whatsapp || '',
          email: leadAtual.email || '',
          tipoSeguro: leadAtual.tipoSeguro,
          ramo: leadAtual.ramo || '',
          subcategorias: leadAtual.subcategorias || [],
          coberturas: leadAtual.coberturas || [],
          valorEstimado: leadAtual.valorEstimado || '',
          responsavel: leadAtual.responsavel,
          status: 'nova',
          dataCriacao: todayISO(),
          observacoes: leadAtual.observacoes || '',
          origem: leadAtual.origem || '',
          temperatura: leadAtual.temperatura || '',
          anexos: [],
          converted_proposal_id: null,
          cpfCnpj: '', seguradora: '', seguradoraId: '', produto: '',
          corretora: '', corretoraId: '', produtor: '', produtorId: '',
          premio: '', percentualComissaoTotal: '', percentualComissaoAttenti: '75', comissao: '',
        })
        await update(leadAtual.id, { ...leadAtual, status: novoStatus, cotacao_id: cotId })
        showToast(`Cotação ${numero} criada automaticamente para ${leadAtual.nome}!`)
        setSelected(prev => prev ? { ...prev, status: novoStatus, cotacao_id: cotId } : prev)
        return
      }

      await update(leadAtual.id, { ...leadAtual, status: novoStatus })
      showToast('Status do lead atualizado!')
      setSelected(prev => prev ? { ...prev, status: novoStatus } : prev)
    } catch {
      showToast('Erro ao atualizar status.', 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Lead excluído!')
      setConfirmDelete(null)
      if (selected?.id === id) setShowDetalhes(false)
    } catch {
      showToast('Erro ao excluir.', 'error')
    }
  }

  async function reativarPerdido(lead) {
    try {
      await update(lead.id, { ...lead, status: 'novo' })
      showToast(`Lead "${lead.nome}" reativado!`)
    } catch {
      showToast('Erro ao reativar lead.', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar leads..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <Button onClick={openNew} icon={<Plus size={16} />}>Novo Lead</Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm text-cyber-muted">
        <span>{filtered.length} leads ativos</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-red font-medium">{filtered.filter(l => l.temperatura === 'quente').length} quentes</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-amber font-medium">{filtered.filter(l => l.temperatura === 'morno').length} mornos</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-cyan font-medium">{filtered.filter(l => l.temperatura === 'frio').length} frios</span>
        {ganhos.length > 0 && (
          <>
            <span className="text-cyber-dim">·</span>
            <span className="text-cyber-green font-medium">{ganhos.length} ganhos</span>
          </>
        )}
      </div>

      {/* Kanban */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2 select-none"
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
          {COLUNAS.map(col => {
            const colLeads = filtered.filter(l => l.status === col.key)
            const isOver = dragOver === col.key
            return (
              <div key={col.key} className="w-64 shrink-0"
                data-kanban-col={col.key}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOver !== col.key) setDragOver(col.key) }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
                onDrop={e => { e.preventDefault(); if (dragId) moverLead(dragId, col.key); setDragId(null); setDragOver(null) }}
              >
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-150 ${col.cor} ${isOver ? 'ring-2 ring-cyber-cyan/50 ring-offset-1' : ''}`}>{col.label}</span>
                  <span className="text-xs text-cyber-muted font-medium">{colLeads.length}</span>
                </div>
                <div className={`space-y-2 min-h-[72px] rounded-2xl p-1 transition-all duration-150 ${isOver ? 'bg-cyber-cyan/5 ring-2 ring-inset ring-cyber-cyan/30' : ''}`}>
                  {colLeads.map(l => (
                    <div key={l.id}
                      data-drag-card="true"
                      draggable
                      onDragStart={e => { setDragId(l.id); e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => { setDragId(null); setDragOver(null) }}
                      onTouchStart={() => { touchState.current.cardId = l.id }}
                      onTouchMove={e => e.preventDefault()}
                      onTouchEnd={e => {
                        const t = e.changedTouches[0]
                        const el = document.elementFromPoint(t.clientX, t.clientY)
                        const tc = el?.closest('[data-kanban-col]')?.getAttribute('data-kanban-col')
                        if (tc && touchState.current.cardId) moverLead(touchState.current.cardId, tc)
                        touchState.current.cardId = null; setDragOver(null)
                      }}
                      onClick={() => { setSelected(l); setShowDetalhes(true) }}
                      className={`bg-cyber-card border border-cyber-border/40 rounded-2xl p-3.5 cursor-grab active:cursor-grabbing shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 ${dragId === l.id ? 'opacity-40 scale-95 shadow-none' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold text-cyber-text leading-tight">{l.nome}</p>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${tempCor[l.temperatura]}`} title={l.temperatura} />
                      </div>
                      <p className="text-xs text-cyber-muted mb-2">{l.tipoSeguro} · {l.origem}</p>
                      <div className="flex items-center gap-2 text-xs text-cyber-muted mb-2">
                        <Phone size={11} /> <span>{l.telefone}</span>
                      </div>
                      {l.valorEstimado && (
                        <p className="text-xs font-semibold text-cyber-green">R$ {Number(l.valorEstimado).toLocaleString('pt-BR')}/ano</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-cyber-muted">Resp: {l.responsavel?.split(' ')[0]}</p>
                        <div className="flex items-center gap-1">
                          {l.cliente_id && (
                            <span className="text-[10px] text-cyber-green bg-cyber-green/10 px-1.5 py-0.5 rounded font-medium">
                              👤 Cliente
                            </span>
                          )}
                          {l.cotacao_id && (
                            <span className="text-[10px] text-cyber-amber bg-cyber-amber/10 px-1.5 py-0.5 rounded font-medium">
                              📋 Cotação
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div className={`border-2 border-dashed rounded-2xl py-6 text-center transition-colors duration-150 ${isOver ? 'border-cyber-cyan/50 bg-cyber-cyan/5' : 'border-cyber-border'}`}>
                      <p className={`text-xs font-medium ${isOver ? 'text-cyber-cyan' : 'text-cyber-muted'}`}>{isOver ? '↓ Soltar aqui' : 'Nenhum lead'}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Seção Perdidos */}
      <div className="border border-cyber-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowPerdidos(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>Perdidos</span>
            {perdidos.length > 0 && (
              <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold">{perdidos.length}</span>
            )}
          </span>
          {showPerdidos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showPerdidos && (
          <div className="px-4 pb-4 pt-1 space-y-2">
            {perdidos.length === 0 ? (
              <p className="text-sm text-cyber-muted text-center py-4">Nenhum lead perdido.</p>
            ) : (
              perdidos.map(l => (
                <div key={l.id} className="flex items-center justify-between bg-cyber-card/60 border border-cyber-border/30 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-cyber-text/70">{l.nome}</p>
                    <p className="text-xs text-cyber-muted">{l.tipoSeguro} · {l.responsavel?.split(' ')[0]}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => reativarPerdido(l)} className="text-xs text-cyber-cyan hover:underline">Reativar</button>
                    <button onClick={() => setConfirmDelete(l)} className="text-xs text-cyber-red hover:underline">Excluir</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

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
          <p className="text-sm text-cyber-text">Excluir o lead <strong className="text-cyber-red">"{confirmDelete.nome}"</strong>?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}

      {/* Modal Detalhes Lead */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title="Detalhes do Lead" size="md"
        footer={
          <div className="flex flex-wrap gap-2 justify-between">
            <Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => openEdit(selected)}>Editar</Button>
              <Button variant="danger" onClick={() => { setShowDetalhes(false); setConfirmDelete(selected) }}>Excluir</Button>
              <Button variant="success" icon={<User size={14} />} onClick={() => handleConverterCliente(selected)}>
                {selected?.cliente_id ? 'Ver Cliente' : 'Converter em Cliente'}
              </Button>
            </div>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-cyber-text text-lg">{selected.nome}</h3>
                <p className="text-sm text-cyber-muted">{selected.tipoSeguro} · {selected.origem}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={selected.status} type="lead" />
                <StatusBadge status={selected.temperatura} type="temperatura" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Telefone', selected.telefone], ['WhatsApp', selected.whatsapp], ['E-mail', selected.email], ['Cidade', `${selected.cidade}/${selected.estado}`], ['Responsável', selected.responsavel], ['Valor estimado', selected.valorEstimado ? `R$ ${Number(selected.valorEstimado).toLocaleString('pt-BR')}/ano` : '—'], ['Criado em', selected.createdAt], ['Próxima ação', selected.proximaAcao]].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-cyber-muted mb-0.5">{k}</p>
                  <p className="text-sm font-medium text-cyber-text">{v || '—'}</p>
                </div>
              ))}
            </div>
            {selected.observacoes && (
              <div className="p-3 bg-cyber-surface/50 rounded-xl">
                <p className="text-xs text-cyber-muted mb-1">Observações</p>
                <p className="text-sm text-cyber-text/80">{selected.observacoes}</p>
              </div>
            )}
            {/* Links para entidades vinculadas */}
            {selected.cliente_id && (
              <button
                onClick={() => { setShowDetalhes(false); navigate('/clientes') }}
                className="w-full flex items-center gap-2 text-sm text-cyber-green font-medium bg-cyber-green/5 border border-cyber-green/20 rounded-xl px-3 py-2.5 hover:bg-cyber-green/10 transition-colors"
              >
                <User size={14} /> Ver cliente vinculado →
              </button>
            )}
            {selected.cotacao_id && (
              <button
                onClick={() => { setShowDetalhes(false); navigate(`/cotacoes?focus=${selected.cotacao_id}`) }}
                className="w-full flex items-center gap-2 text-sm text-cyber-amber font-medium bg-cyber-amber/5 border border-cyber-amber/20 rounded-xl px-3 py-2.5 hover:bg-cyber-amber/10 transition-colors"
              >
                <FileText size={14} /> Ver cotação vinculada →
              </button>
            )}
            {/* Mover status */}
            <div>
              <p className="hud-label mb-2">Mover para</p>
              <div className="flex flex-wrap gap-2">
                {[...COLUNAS, ...FASES_FINAIS].filter(c => c.key !== selected.status).map(c => (
                  <button key={c.key} onClick={() => moverLead(selected.id, c.key)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${c.cor} hover:opacity-80`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar geração de cotação */}
      <Modal isOpen={!!confirmCotacao} onClose={() => setConfirmCotacao(null)} title="Gerar Cotação" size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmCotacao(null)}>Agora não</Button>
            <Button variant="success" icon={<FileText size={14} />}
              onClick={() => { const l = confirmCotacao.lead; setConfirmCotacao(null); executarMoverLead(l, 'cotacao') }}>
              Gerar Cotação
            </Button>
          </div>
        }
      >
        <div className="text-center py-3">
          <div className="w-14 h-14 bg-cyber-cyan/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText size={26} className="text-cyber-cyan" />
          </div>
          <p className="text-sm text-cyber-muted">
            Mover <strong className="text-cyber-text">{confirmCotacao?.lead?.nome}</strong> para{' '}
            <strong className="text-cyber-text">"Em Cotação"</strong> e gerar a cotação automaticamente?
          </p>
        </div>
      </Modal>

      {/* Modal Novo/Edit Lead */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Lead' : 'Novo Lead'} size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Cadastrar Lead'}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          {[
            { label: 'Nome *', key: 'nome', placeholder: 'Nome do lead' },
            { label: 'Telefone', key: 'telefone', placeholder: '(00) 00000-0000' },
            { label: 'WhatsApp', key: 'whatsapp', placeholder: '(00) 00000-0000' },
            { label: 'E-mail', key: 'email', placeholder: 'email@exemplo.com' },
            { label: 'Cidade', key: 'cidade' },
          ].map(f => (
            <div key={f.key}>
              <label className="hud-label mb-1">{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className={inputCls} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="hud-label mb-1">Tipo de Seguro</label>
              <select value={form.tipoSeguro} onChange={e => { setExpandCobs(false); setForm(p => ({ ...p, tipoSeguro: e.target.value, ramo: getRamo(e.target.value), subcategorias: [], coberturas: [] })) }} className={inputCls}>
                {getTipos(['seguro', 'saude', 'previdencia', 'consorcio']).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="hud-label mb-1">Subtipo / Ramo</label>
              <div className="flex flex-wrap gap-1.5 mt-1 min-h-[32px]">
                {getSubcategorias(form.tipoSeguro).map(s => {
                  const sel = (form.subcategorias || []).includes(s.nome)
                  return (
                    <button key={s.id} type="button"
                      onClick={() => setForm(f => {
                        const arr = f.subcategorias || []
                        const newSubs = arr.includes(s.nome) ? arr.filter(x => x !== s.nome) : [...arr, s.nome]
                        const validCobs = getCoberturasDaSelecao(f.tipoSeguro, newSubs)
                        return { ...f, subcategorias: newSubs, coberturas: (f.coberturas || []).filter(c => validCobs.includes(c)) }
                      })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${sel ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/40' : 'bg-cyber-surface/50 text-cyber-muted border-cyber-border/40 hover:border-cyber-cyan/30'}`}>
                      {s.nome}
                    </button>
                  )
                })}
                {getSubcategorias(form.tipoSeguro).length === 0 && (
                  <span className="text-xs text-cyber-muted self-center">Selecione o tipo de seguro acima</span>
                )}
              </div>
            </div>
            {(form.subcategorias || []).length > 0 && (() => {
              const todas = getCoberturasDaSelecao(form.tipoSeguro, form.subcategorias || [])
              if (!todas.length) return null
              const visiveis = expandCobs ? todas : todas.slice(0, 8)
              return (
                <div className="col-span-2">
                  <label className="hud-label mb-1">
                    Coberturas
                    {(form.coberturas || []).length > 0 && <span className="ml-2 text-cyber-purple font-normal normal-case">{(form.coberturas || []).length} selecionada(s)</span>}
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {visiveis.map(c => {
                      const sel = (form.coberturas || []).includes(c)
                      return (
                        <button key={c} type="button"
                          onClick={() => setForm(f => { const arr = f.coberturas || []; return { ...f, coberturas: arr.includes(c) ? arr.filter(x => x !== c) : [...arr, c] } })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${sel ? 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/40' : 'bg-cyber-surface/40 text-cyber-muted border-cyber-border/30 hover:border-cyber-purple/30'}`}>
                          {c}
                        </button>
                      )
                    })}
                    {todas.length > 8 && (
                      <button type="button" onClick={() => setExpandCobs(v => !v)}
                        className="px-2 py-0.5 rounded-md text-[10px] text-cyber-cyan border border-cyber-cyan/30 hover:bg-cyber-cyan/10 transition-colors">
                        {expandCobs ? 'Ver menos ▲' : `+${todas.length - 8} Ver mais ▼`}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
            <div>
              <label className="hud-label mb-1">Temperatura</label>
              <select value={form.temperatura} onChange={e => setForm(p => ({ ...p, temperatura: e.target.value }))} className={inputCls}>
                <option value="frio">Frio</option>
                <option value="morno">Morno</option>
                <option value="quente">Quente</option>
              </select>
            </div>
            <div>
              <label className="hud-label mb-1">Origem</label>
              <select value={form.origem} onChange={e => setForm(p => ({ ...p, origem: e.target.value }))} className={inputCls}>
                {origens.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="hud-label mb-1">Responsável</label>
              <select value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} className={inputCls}>
                {usuarios.map(u => <option key={u.id}>{u.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="hud-label mb-1">Valor estimado (anual)</label>
            <input value={form.valorEstimado} onChange={e => setForm(p => ({ ...p, valorEstimado: e.target.value }))} placeholder="R$ 0,00" className={inputCls} />
          </div>
          <div>
            <label className="hud-label mb-1">Próxima ação</label>
            <input type="date" value={form.proximaAcao} onChange={e => setForm(p => ({ ...p, proximaAcao: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="hud-label mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={3} className={inputCls + ' resize-none'} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
