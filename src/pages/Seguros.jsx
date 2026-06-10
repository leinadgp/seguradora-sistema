import { useState } from 'react'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Shield, Edit2, Eye } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'

const categorias = ['Todos', 'Veículos', 'Patrimonial', 'Empresarial', 'Vida e Pessoas', 'Saúde', 'Agrícola', 'Responsabilidade Civil', 'Viagem']
const todasSeguradoras = ['Porto Seguro', 'Tokio Marine', 'Azul Seguros', 'Liberty Seguros', 'Mapfre', 'SulAmérica', 'Bradesco Seguros', 'Allianz']

const emptyForm = { nome: '', categoria: 'Veículos', descricao: '', seguradoras: [], documentos: '', status: 'ativo', observacoes: '' }

const catColor = { 'Veículos': 'bg-cyber-cyan/10 text-cyber-cyan', 'Patrimonial': 'bg-cyber-purple/10 text-cyber-purple', 'Empresarial': 'bg-cyber-amber/10 text-cyber-amber', 'Vida e Pessoas': 'bg-cyber-red/10 text-cyber-red', 'Saúde': 'bg-cyber-green/10 text-cyber-green', 'Agrícola': 'bg-lime-100 text-lime-700', 'Responsabilidade Civil': 'bg-indigo-100 text-indigo-700', 'Viagem': 'bg-sky-100 text-sky-700' }

export default function Seguros() {
  const { showToast } = useApp()
  const { data: produtos, create, update } = useResource('produtos')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)

  const filtered = produtos.filter(p => {
    const match = !search || p.nome.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'Todos' || p.categoria === filterCat
    return match && matchCat
  })

  function openNew() { setForm(emptyForm); setIsEditing(false); setShowModal(true) }
  function openEdit(p) { setForm({ ...emptyForm, ...p }); setIsEditing(true); setShowModal(true); setShowDetalhes(false) }

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
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
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
                <div className="w-9 h-9 bg-cyber-cyan/10 rounded-xl flex items-center justify-center">
                  <Shield size={16} className="text-cyber-cyan" />
                </div>
                <div>
                  <p className="font-semibold text-cyber-text text-sm">{p.nome}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor[p.categoria] || 'bg-cyber-surface text-cyber-muted'}`}>{p.categoria}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'ativo' ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-surface text-cyber-muted'}`}>{p.status}</span>
            </div>
            <p className="text-xs text-cyber-muted mb-3 line-clamp-2">{p.descricao}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {p.seguradoras.slice(0, 3).map(s => <span key={s} className="text-xs bg-cyber-surface text-cyber-muted px-2 py-0.5 rounded-full">{s}</span>)}
              {p.seguradoras.length > 3 && <span className="text-xs text-cyber-muted">+{p.seguradoras.length - 3}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelected(p); setShowDetalhes(true) }} className="flex-1 flex items-center justify-center gap-1 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg py-1.5 transition-colors"><Eye size={13} /> Ver</button>
              <button onClick={() => { setSelected(p); openEdit(p) }} className="flex-1 flex items-center justify-center gap-1 text-sm text-cyber-muted hover:bg-slate-100 rounded-lg py-1.5 transition-colors"><Edit2 size={13} /> Editar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Detalhes */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected?.nome} size="sm"
        footer={<div className="flex justify-between"><Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button><Button variant="secondary" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Editar</Button></div>}
      >
        {selected && (
          <div className="space-y-3">
            <p className="text-sm text-cyber-muted">{selected.descricao}</p>
            <div><p className="text-xs text-cyber-muted mb-1">Categoria</p><p className="text-sm font-medium">{selected.categoria}</p></div>
            <div><p className="text-xs text-cyber-muted mb-2">Seguradoras parceiras</p>
              <div className="flex flex-wrap gap-1">{selected.seguradoras.map(s => <span key={s} className="text-xs bg-cyber-cyan/5 text-cyber-cyan px-2.5 py-1 rounded-full">{s}</span>)}</div>
            </div>
            <div><p className="text-xs text-cyber-muted mb-2">Documentos exigidos</p>
              <ul className="space-y-1">{(Array.isArray(selected.documentos) ? selected.documentos : [selected.documentos]).filter(Boolean).map(d => <li key={d} className="text-sm text-cyber-text/80">• {d}</li>)}</ul>
            </div>
            {selected.observacoes && <div className="p-3 bg-cyber-surface/50 rounded-xl"><p className="text-xs text-cyber-muted mb-1">Observações</p><p className="text-sm text-cyber-text/80">{selected.observacoes}</p></div>}
          </div>
        )}
      </Modal>

      {/* Modal Novo */}
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
              {todasSeguradoras.map(s => (
                <label key={s} className="flex items-center gap-1.5 text-xs text-cyber-text/80 cursor-pointer">
                  <input type="checkbox" checked={form.seguradoras.includes(s)} onChange={e => setForm(f => ({ ...f, seguradoras: e.target.checked ? [...f.seguradoras, s] : f.seguradoras.filter(x => x !== s) }))} className="rounded" />
                  {s}
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
