import { useState, useEffect } from 'react'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Shield, Edit2, Eye, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Layers, Tag, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { useCatalogo } from '../hooks/useCatalogo'

// ── Produtos ───────────────────────────────────────────────────────────────
const categorias = ['Todos', 'Veículos', 'Patrimonial', 'Empresarial', 'Vida e Pessoas', 'Saúde', 'Agrícola', 'Responsabilidade Civil', 'Viagem']
const catColor = {
  'Veículos': 'bg-cyber-cyan/10 text-cyber-cyan',
  'Patrimonial': 'bg-cyber-purple/10 text-cyber-purple',
  'Empresarial': 'bg-cyber-amber/10 text-cyber-amber',
  'Vida e Pessoas': 'bg-cyber-red/10 text-cyber-red',
  'Saúde': 'bg-cyber-green/10 text-cyber-green',
  'Agrícola': 'bg-lime-100 text-lime-700',
  'Responsabilidade Civil': 'bg-indigo-100 text-indigo-700',
  'Viagem': 'bg-sky-100 text-sky-700',
}
const emptyProd = { nome: '', categoria: 'Veículos', descricao: '', seguradoras: [], documentos: '', status: 'ativo', observacoes: '' }

// ── Catálogo ───────────────────────────────────────────────────────────────
const moduloBadge = {
  seguro:      { label: 'Seguro',      cls: 'bg-cyber-cyan/10 text-cyber-cyan' },
  saude:       { label: 'Saúde',       cls: 'bg-cyber-green/10 text-cyber-green' },
  previdencia: { label: 'Previdência', cls: 'bg-cyber-purple/10 text-cyber-purple' },
  consorcio:   { label: 'Consórcio',   cls: 'bg-cyber-amber/10 text-cyber-amber' },
}

function ModuloBadge({ modulo }) {
  const b = moduloBadge[modulo] || moduloBadge.seguro
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
}

// ── Componente CatalogoAdmin ───────────────────────────────────────────────
function CatalogoAdmin() {
  const { showToast } = useApp()
  const { catalogo, porRamo, loading, salvarEntrada, create } = useCatalogo()
  const [expandido, setExpandido] = useState({})       // { [tipoId]: bool }
  const [editTipo, setEditTipo] = useState(null)        // registro completo para editar
  const [addSubModal, setAddSubModal] = useState(null)  // id do tipo onde adicionar subcategoria
  const [newSubNome, setNewSubNome] = useState('')
  const [newSubCobs, setNewSubCobs] = useState([])      // array de strings
  const [novoTipo, setNovoTipo] = useState(null)        // modal novo tipo
  const [editSubModal, setEditSubModal] = useState(null) // { tipoId, subId }
  const [editSubNome, setEditSubNome] = useState('')
  const [editSubCobs, setEditSubCobs] = useState([])   // array de strings
  const [editCobInput, setEditCobInput] = useState('')  // input temporário
  const [newCobInput, setNewCobInput] = useState('')    // input temporário para novo modal

  const emptyNovoTipo = { tipo: '', ramo: '', modulo: 'seguro', ordem: catalogo.length + 1, ativo: true, subcategorias: [] }

  function toggle(id) {
    setExpandido(prev => ({ ...prev, [id]: !prev[id] }))
  }

  useEffect(() => {
    if (catalogo.length > 0 && Object.keys(expandido).length === 0) {
      setExpandido(Object.fromEntries(catalogo.map(c => [c.id, true])))
    }
  }, [catalogo.length]) // eslint-disable-line

  async function toggleAtivo(entrada) {
    try {
      await salvarEntrada({ ...entrada, ativo: !entrada.ativo })
      showToast(`${entrada.tipo} ${entrada.ativo ? 'desativado' : 'ativado'}!`)
    } catch {
      showToast('Erro ao atualizar.', 'error')
    }
  }

  async function toggleSubAtivo(entrada, subId) {
    const subs = (entrada.subcategorias || []).map(s =>
      s.id === subId ? { ...s, ativo: !s.ativo } : s
    )
    try {
      await salvarEntrada({ ...entrada, subcategorias: subs })
      showToast('Subcategoria atualizada!')
    } catch {
      showToast('Erro ao atualizar.', 'error')
    }
  }

  function abrirEditSub(entrada, sub) {
    setEditSubModal({ tipoId: entrada.id, subId: sub.id })
    setEditSubNome(sub.nome)
    setEditSubCobs(sub.coberturas || [])
    setEditCobInput('')
  }

  function adicionarCobEdit(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = editCobInput.replace(/,$/, '').trim()
      if (val && !editSubCobs.includes(val)) setEditSubCobs(prev => [...prev, val])
      setEditCobInput('')
    }
  }

  function adicionarCobNew(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = newCobInput.replace(/,$/, '').trim()
      if (val && !newSubCobs.includes(val)) setNewSubCobs(prev => [...prev, val])
      setNewCobInput('')
    }
  }

  async function salvarEdicaoSub() {
    if (!editSubNome.trim()) { showToast('Informe o nome.', 'error'); return }
    const cobsFinal = editCobInput.trim()
      ? [...editSubCobs, editCobInput.trim()]
      : editSubCobs
    const entrada = catalogo.find(c => c.id === editSubModal.tipoId)
    if (!entrada) return
    const subs = (entrada.subcategorias || []).map(s =>
      s.id === editSubModal.subId
        ? { ...s, nome: editSubNome.trim(), coberturas: cobsFinal }
        : s
    )
    try {
      await salvarEntrada({ ...entrada, subcategorias: subs })
      showToast('Subcategoria atualizada!')
      setEditSubModal(null)
    } catch {
      showToast('Erro ao salvar.', 'error')
    }
  }

  async function excluirSubcategoria(entrada, subId) {
    const subs = (entrada.subcategorias || []).filter(s => s.id !== subId)
    try {
      await salvarEntrada({ ...entrada, subcategorias: subs })
      showToast('Subcategoria removida!')
    } catch {
      showToast('Erro ao remover.', 'error')
    }
  }

  async function adicionarSubcategoria() {
    if (!newSubNome.trim()) return
    const entrada = catalogo.find(c => c.id === addSubModal)
    if (!entrada) return
    const novaId = `${entrada.id}-${newSubNome.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    const cobsFinal = newCobInput.trim()
      ? [...newSubCobs, newCobInput.trim()]
      : newSubCobs
    const subs = [
      ...(entrada.subcategorias || []),
      {
        id: novaId,
        nome: newSubNome.trim(),
        coberturas: cobsFinal,
        ordem: (entrada.subcategorias?.length || 0) + 1,
        ativo: true,
      },
    ]
    try {
      await salvarEntrada({ ...entrada, subcategorias: subs })
      showToast(`Subcategoria "${newSubNome}" adicionada!`)
      setAddSubModal(null); setNewSubNome(''); setNewSubCobs([]); setNewCobInput('')
    } catch {
      showToast('Erro ao adicionar subcategoria.', 'error')
    }
  }

  async function salvarEdicaoTipo() {
    if (!editTipo?.tipo) { showToast('Informe o nome do tipo.', 'error'); return }
    try {
      await salvarEntrada(editTipo)
      showToast('Tipo atualizado!')
      setEditTipo(null)
    } catch {
      showToast('Erro ao salvar.', 'error')
    }
  }

  async function criarNovoTipo() {
    if (!novoTipo?.tipo || !novoTipo?.ramo) { showToast('Preencha tipo e ramo.', 'error'); return }
    try {
      const id = novoTipo.tipo.toLowerCase().replace(/[^a-z0-9]/g, '-')
      await create({ ...novoTipo, id })
      showToast(`Tipo "${novoTipo.tipo}" criado!`)
      setNovoTipo(null)
    } catch {
      showToast('Erro ao criar.', 'error')
    }
  }

  if (loading) return <div className="py-8 text-center text-cyber-muted text-sm">Carregando catálogo...</div>

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-cyber-muted">{catalogo.length} tipos cadastrados · {catalogo.filter(c => c.ativo).length} ativos</p>
        </div>
        <Button onClick={() => setNovoTipo({ ...emptyNovoTipo })} icon={<Plus size={16} />}>Novo Tipo</Button>
      </div>

      {/* Cards por ramo */}
      {Object.entries(porRamo).map(([ramo, tipos]) => (
        <div key={ramo}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyber-muted">{ramo}</span>
            <div className="flex-1 h-px bg-cyber-border/40" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {tipos.map(entrada => {
              const isExp = expandido[entrada.id]
              const subAtivas = (entrada.subcategorias || []).filter(s => s.ativo !== false).length
              return (
                <div key={entrada.id} className={`bg-cyber-card border rounded-2xl overflow-hidden transition-all ${entrada.ativo ? 'border-cyber-border/40' : 'border-cyber-border/20 opacity-60'}`}>
                  {/* Cabeçalho do tipo */}
                  <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-cyber-cyan/10 rounded-xl flex items-center justify-center shrink-0">
                        <Shield size={15} className="text-cyber-cyan" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-cyber-text text-sm">{entrada.tipo}</p>
                          <ModuloBadge modulo={entrada.modulo} />
                        </div>
                        <p className="text-xs text-cyber-muted mt-0.5">
                          {subAtivas} subcategoria{subAtivas !== 1 ? 's' : ''} ativa{subAtivas !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button onClick={() => toggleAtivo(entrada)} title={entrada.ativo ? 'Desativar' : 'Ativar'} className="text-cyber-muted hover:text-cyber-cyan transition-colors p-1">
                        {entrada.ativo ? <ToggleRight size={20} className="text-cyber-cyan" /> : <ToggleLeft size={20} />}
                      </button>
                      <button onClick={() => setEditTipo({ ...entrada })} title="Editar" className="text-cyber-muted hover:text-cyber-cyan transition-colors p-1">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => toggle(entrada.id)} className="text-cyber-muted hover:text-cyber-text transition-colors p-1">
                        {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Subcategorias expandidas */}
                  {isExp && (
                    <div className="border-t border-cyber-border/30 px-3.5 pb-3 pt-2 space-y-1.5">
                      {(entrada.subcategorias || []).length === 0 && (
                        <p className="text-xs text-cyber-muted py-2 text-center">Nenhuma subcategoria cadastrada.</p>
                      )}
                      {(entrada.subcategorias || []).map(sub => (
                        <div key={sub.id} className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-xl ${sub.ativo !== false ? 'bg-cyber-surface/50' : 'bg-cyber-surface/20 opacity-50'}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-cyber-text">{sub.nome}</p>
                            {sub.coberturas?.length > 0 && (
                              <p className="text-[10px] text-cyber-muted mt-0.5 leading-relaxed">
                                {sub.coberturas.join(' · ')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                            <button onClick={() => abrirEditSub(entrada, sub)} title="Editar" className="p-1 text-cyber-muted hover:text-cyber-cyan transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => excluirSubcategoria(entrada, sub.id)} title="Excluir" className="p-1 text-cyber-muted hover:text-cyber-red transition-colors">
                              <Trash2 size={13} />
                            </button>
                            <button onClick={() => toggleSubAtivo(entrada, sub.id)} title={sub.ativo !== false ? 'Desativar' : 'Ativar'} className="p-1 text-cyber-muted hover:text-cyber-cyan transition-colors">
                              {sub.ativo !== false
                                ? <ToggleRight size={18} className="text-cyber-cyan" />
                                : <ToggleLeft size={18} />}
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => { setAddSubModal(entrada.id); setNewSubNome(''); setNewSubCobs('') }}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-cyber-cyan border border-dashed border-cyber-cyan/30 rounded-xl py-2 hover:bg-cyber-cyan/5 transition-colors mt-1"
                      >
                        <Plus size={13} /> Adicionar subcategoria
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Modal Editar Subcategoria */}
      <Modal isOpen={!!editSubModal} onClose={() => setEditSubModal(null)} title="Editar Subcategoria" size="md"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setEditSubModal(null)}>Cancelar</Button><Button onClick={salvarEdicaoSub}>Salvar</Button></div>}
      >
        <div className="space-y-4">
          <div><label className="hud-label mb-1">Nome *</label><input value={editSubNome} onChange={e => setEditSubNome(e.target.value)} className={inputCls} /></div>
          <div>
            <label className="hud-label mb-1">Coberturas{editSubCobs.length > 0 ? ` — ${editSubCobs.length}` : ''}</label>
            <div className="border border-cyber-border rounded-xl p-3 bg-cyber-bg/40 min-h-[80px]">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editSubCobs.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {c}
                    <button type="button" onClick={() => setEditSubCobs(prev => prev.filter((_, j) => j !== i))}
                      className="text-purple-400 hover:text-red-400 transition-colors ml-0.5 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
              <input
                value={editCobInput}
                onChange={e => setEditCobInput(e.target.value)}
                onKeyDown={adicionarCobEdit}
                onBlur={() => { if (editCobInput.trim()) { setEditSubCobs(prev => [...prev, editCobInput.trim()]); setEditCobInput('') } }}
                placeholder="Digite uma cobertura e pressione Enter..."
                className="w-full bg-transparent text-sm text-cyber-text placeholder-cyber-dim outline-none border-t border-cyber-border/40 pt-2 mt-1"
              />
            </div>
            <p className="text-[10px] text-cyber-dim mt-1">Pressione Enter ou vírgula para adicionar · Clique × para remover</p>
          </div>
        </div>
      </Modal>

      {/* Modal Adicionar Subcategoria */}
      <Modal isOpen={!!addSubModal} onClose={() => setAddSubModal(null)} title="Nova Subcategoria" size="md"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setAddSubModal(null)}>Cancelar</Button><Button onClick={adicionarSubcategoria}>Adicionar</Button></div>}
      >
        <div className="space-y-4">
          <div><label className="hud-label mb-1">Nome *</label><input value={newSubNome} onChange={e => setNewSubNome(e.target.value)} placeholder="Ex: Individual, Frota, PME..." className={inputCls} /></div>
          <div>
            <label className="hud-label mb-1">Coberturas{newSubCobs.length > 0 ? ` — ${newSubCobs.length}` : ''}</label>
            <div className="border border-cyber-border rounded-xl p-3 bg-cyber-bg/40 min-h-[80px]">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {newSubCobs.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {c}
                    <button type="button" onClick={() => setNewSubCobs(prev => prev.filter((_, j) => j !== i))}
                      className="text-purple-400 hover:text-red-400 transition-colors ml-0.5 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
              <input
                value={newCobInput}
                onChange={e => setNewCobInput(e.target.value)}
                onKeyDown={adicionarCobNew}
                onBlur={() => { if (newCobInput.trim()) { setNewSubCobs(prev => [...prev, newCobInput.trim()]); setNewCobInput('') } }}
                placeholder="Digite uma cobertura e pressione Enter..."
                className="w-full bg-transparent text-sm text-cyber-text placeholder-cyber-dim outline-none border-t border-cyber-border/40 pt-2 mt-1"
              />
            </div>
            <p className="text-[10px] text-cyber-dim mt-1">Pressione Enter ou vírgula para adicionar · Clique × para remover</p>
          </div>
        </div>
      </Modal>

      {/* Modal Editar Tipo */}
      <Modal isOpen={!!editTipo} onClose={() => setEditTipo(null)} title="Editar Tipo" size="sm"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setEditTipo(null)}>Cancelar</Button><Button onClick={salvarEdicaoTipo}>Salvar</Button></div>}
      >
        {editTipo && (
          <div className="space-y-3">
            <div><label className="hud-label mb-1">Nome do tipo *</label><input value={editTipo.tipo} onChange={e => setEditTipo(t => ({ ...t, tipo: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Ramo *</label><input value={editTipo.ramo} onChange={e => setEditTipo(t => ({ ...t, ramo: e.target.value.toUpperCase() }))} className={inputCls} placeholder="Ex: AUTOMÓVEL, PATRIMONIAL..." /></div>
            <div><label className="hud-label mb-1">Módulo</label>
              <select value={editTipo.modulo} onChange={e => setEditTipo(t => ({ ...t, modulo: e.target.value }))} className={inputCls}>
                <option value="seguro">Seguro</option>
                <option value="saude">Saúde</option>
                <option value="previdencia">Previdência</option>
                <option value="consorcio">Consórcio</option>
              </select>
            </div>
            <div><label className="hud-label mb-1">Ordem de exibição</label><input type="number" value={editTipo.ordem} onChange={e => setEditTipo(t => ({ ...t, ordem: Number(e.target.value) }))} className={inputCls} /></div>
          </div>
        )}
      </Modal>

      {/* Modal Novo Tipo */}
      <Modal isOpen={!!novoTipo} onClose={() => setNovoTipo(null)} title="Novo Tipo de Seguro" size="sm"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setNovoTipo(null)}>Cancelar</Button><Button onClick={criarNovoTipo}>Criar</Button></div>}
      >
        {novoTipo && (
          <div className="space-y-3">
            <div><label className="hud-label mb-1">Nome do tipo *</label><input value={novoTipo.tipo} onChange={e => setNovoTipo(t => ({ ...t, tipo: e.target.value }))} className={inputCls} placeholder="Ex: Seguro de Drones" /></div>
            <div><label className="hud-label mb-1">Ramo *</label><input value={novoTipo.ramo} onChange={e => setNovoTipo(t => ({ ...t, ramo: e.target.value.toUpperCase() }))} className={inputCls} placeholder="Ex: PATRIMONIAL" /></div>
            <div><label className="hud-label mb-1">Módulo</label>
              <select value={novoTipo.modulo} onChange={e => setNovoTipo(t => ({ ...t, modulo: e.target.value }))} className={inputCls}>
                <option value="seguro">Seguro</option>
                <option value="saude">Saúde</option>
                <option value="previdencia">Previdência</option>
                <option value="consorcio">Consórcio</option>
              </select>
            </div>
            <div><label className="hud-label mb-1">Ordem de exibição</label><input type="number" value={novoTipo.ordem} onChange={e => setNovoTipo(t => ({ ...t, ordem: Number(e.target.value) }))} className={inputCls} /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── Componente ProdutosAdmin ───────────────────────────────────────────────
function ProdutosAdmin() {
  const { showToast } = useApp()
  const { data: produtos, create, update, remove } = useResource('produtos')
  const { data: seguradoras } = useResource('seguradoras')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyProd)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = produtos.filter(p => {
    const match = !search || p.nome.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'Todos' || p.categoria === filterCat
    return match && matchCat
  })

  function openNew() { setForm(emptyProd); setIsEditing(false); setShowModal(true) }
  function openEdit(p) { setForm({ ...emptyProd, ...p }); setIsEditing(true); setShowModal(true); setShowDetalhes(false) }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Produto excluído!')
      setConfirmDelete(null)
      if (selected?.id === id) { setShowDetalhes(false); setSelected(null) }
    } catch {
      showToast('Erro ao excluir.', 'error')
    }
  }

  async function handleSave() {
    if (!form.nome) { showToast('Preencha o nome do produto.', 'error'); return }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form })
        showToast('Produto atualizado!')
      } else {
        await create({ ...form, id: Date.now().toString(), documentos: form.documentos ? form.documentos.split(',').map(d => d.trim()) : [] })
        showToast('Produto cadastrado!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar.', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categorias.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} className={`whitespace-nowrap text-sm px-3 py-2 rounded-xl font-medium transition-colors ${filterCat === c ? 'bg-blue-600 text-white' : 'bg-cyber-card text-cyber-muted border border-cyber-border hover:bg-slate-100'}`}>{c}</button>
          ))}
        </div>
        <Button onClick={openNew} icon={<Plus size={16} />}>Novo Produto</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => (
          <div key={p.id} className="bg-cyber-card rounded-2xl p-4 shadow-card border border-cyber-border/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-cyber-cyan/10 rounded-xl flex items-center justify-center"><Shield size={16} className="text-cyber-cyan" /></div>
                <div>
                  <p className="font-semibold text-cyber-text text-sm">{p.nome}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor[p.categoria] || 'bg-cyber-surface text-cyber-muted'}`}>{p.categoria}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'ativo' ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-surface text-cyber-muted'}`}>{p.status}</span>
            </div>
            <p className="text-xs text-cyber-muted mb-3 line-clamp-2">{p.descricao}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {p.seguradoras?.slice(0, 3).map(s => <span key={s} className="text-xs bg-cyber-surface text-cyber-muted px-2 py-0.5 rounded-full">{s}</span>)}
              {p.seguradoras?.length > 3 && <span className="text-xs text-cyber-muted">+{p.seguradoras.length - 3}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelected(p); setShowDetalhes(true) }} className="flex-1 flex items-center justify-center gap-1 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg py-1.5 transition-colors"><Eye size={13} /> Ver</button>
              <button onClick={() => { setSelected(p); openEdit(p) }} className="flex-1 flex items-center justify-center gap-1 text-sm text-cyber-muted hover:bg-slate-100 rounded-lg py-1.5 transition-colors"><Edit2 size={13} /> Editar</button>
              <button onClick={() => setConfirmDelete(p)} className="p-1.5 text-cyber-muted hover:text-cyber-red hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {confirmDelete && (
        <Modal isOpen title="Confirmar exclusão" onClose={() => setConfirmDelete(null)} size="sm"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete.id)}>Excluir</Button>
            </div>
          }
        >
          <p className="text-sm text-cyber-text">Excluir o produto <strong className="text-cyber-red">"{confirmDelete.nome}"</strong>?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}

      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected?.nome} size="sm"
        footer={<div className="flex justify-between"><Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button><Button variant="secondary" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Editar</Button></div>}
      >
        {selected && (
          <div className="space-y-3">
            <p className="text-sm text-cyber-muted">{selected.descricao}</p>
            <div><p className="text-xs text-cyber-muted mb-1">Categoria</p><p className="text-sm font-medium">{selected.categoria}</p></div>
            <div><p className="text-xs text-cyber-muted mb-2">Seguradoras parceiras</p>
              <div className="flex flex-wrap gap-1">{selected.seguradoras?.map(s => <span key={s} className="text-xs bg-cyber-cyan/5 text-cyber-cyan px-2.5 py-1 rounded-full">{s}</span>)}</div>
            </div>
            <div><p className="text-xs text-cyber-muted mb-2">Documentos exigidos</p>
              <ul className="space-y-1">{(Array.isArray(selected.documentos) ? selected.documentos : [selected.documentos]).filter(Boolean).map(d => <li key={d} className="text-sm text-cyber-text/80">• {d}</li>)}</ul>
            </div>
            {selected.observacoes && <div className="p-3 bg-cyber-surface/50 rounded-xl"><p className="text-xs text-cyber-muted mb-1">Observações</p><p className="text-sm text-cyber-text/80">{selected.observacoes}</p></div>}
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Produto' : 'Novo Produto'} size="md"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Cadastrar'}</Button></div>}
      >
        <div className="space-y-3">
          <div><label className="hud-label mb-1">Nome do produto *</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} /></div>
          <div><label className="hud-label mb-1">Categoria</label>
            <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={inputCls}>
              {categorias.filter(c => c !== 'Todos').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="hud-label mb-1">Descrição</label><textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} className={inputCls + ' resize-none'} /></div>
          <div>
            <label className="text-xs font-medium text-cyber-muted mb-2 block">Seguradoras parceiras</label>
            <div className="grid grid-cols-2 gap-2 p-3 border border-cyber-border rounded-lg">
              {seguradoras.map(s => (
                <label key={s.id} className="flex items-center gap-1.5 text-xs text-cyber-text/80 cursor-pointer">
                  <input type="checkbox" checked={form.seguradoras.includes(s.nome)} onChange={e => setForm(f => ({ ...f, seguradoras: e.target.checked ? [...f.seguradoras, s.nome] : f.seguradoras.filter(x => x !== s.nome) }))} className="rounded" />
                  {s.nome}
                </label>
              ))}
            </div>
          </div>
          <div><label className="hud-label mb-1">Documentos exigidos (separados por vírgula)</label><input value={Array.isArray(form.documentos) ? form.documentos.join(', ') : form.documentos} onChange={e => setForm(f => ({ ...f, documentos: e.target.value }))} className={inputCls} placeholder="CPF, RG, CNH..." /></div>
          <div><label className="hud-label mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Página principal com abas ──────────────────────────────────────────────
const ABAS = [
  { id: 'catalogo', label: 'Catálogo de Ramos', icon: <Layers size={15} /> },
  { id: 'produtos', label: 'Produtos',           icon: <Tag size={15} /> },
]

export default function Seguros() {
  const [aba, setAba] = useState('catalogo')

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-cyber-border/40">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${aba === a.id ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-cyber-muted hover:text-cyber-text/80'}`}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {aba === 'catalogo' && <CatalogoAdmin />}
      {aba === 'produtos' && <ProdutosAdmin />}
    </div>
  )
}
