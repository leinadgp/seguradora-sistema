import { useState } from 'react'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Edit2, UserCog, TrendingUp } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'

const perfis = ['admin', 'gestor', 'corretor', 'financeiro', 'atendimento']
const perfilLabel = { admin: 'Administrador', gestor: 'Gestor', corretor: 'Corretor', financeiro: 'Financeiro', atendimento: 'Atendimento' }
const perfilColor = { admin: 'bg-cyber-purple/10 text-cyber-purple', gestor: 'bg-cyber-cyan/10 text-cyber-cyan', corretor: 'bg-cyber-green/10 text-cyber-green', financeiro: 'bg-cyber-amber/10 text-cyber-amber', atendimento: 'bg-cyber-surface text-cyber-muted' }

const emptyForm = { nome: '', email: '', telefone: '', cargo: '', perfil: 'corretor', status: 'ativo', metaMensal: '', comissaoIndividual: '' }

function fmtMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0) }

export default function Usuarios() {
  const { showToast } = useApp()
  const { data: usuarios, create, update } = useResource('usuarios')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)

  const filtered = usuarios.filter(u => !search || u.nome.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  function openNew() { setForm(emptyForm); setIsEditing(false); setShowModal(true) }
  function openEdit(u) { setForm({ ...emptyForm, ...u }); setIsEditing(true); setShowModal(true); setShowDetalhes(false) }

  async function handleSave() {
    if (!form.nome || !form.email) { showToast('Preencha nome e e-mail.', 'error'); return }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form })
        showToast('Usuário atualizado!')
      } else {
        await create({ ...form, id: Date.now().toString(), comissaoGerada: 0, leadsAtribuidos: 0, propostasAbertas: 0, avatar: form.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() })
        showToast('Usuário cadastrado!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Ranking */}
      <div className="bg-cyber-card rounded-2xl p-5 shadow-card border border-cyber-border/40">
        <h3 className="font-semibold text-cyber-text mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-cyber-cyan" /> Produção da Equipe — Maio/2026</h3>
        <div className="space-y-3">
          {[...usuarios].sort((a, b) => b.comissaoGerada - a.comissaoGerada).map((u, i) => {
            const pct = u.metaMensal ? Math.round((u.comissaoGerada / u.metaMensal) * 100) : 0
            return (
              <div key={u.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-cyber-muted w-4 shrink-0">{i + 1}</span>
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">{u.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-cyber-text">{u.nome}</span>
                    <span className="text-sm font-bold">{fmtMoeda(u.comissaoGerada)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-cyber-surface rounded-full h-1.5">
                      <div className="bg-cyber-cyan/50 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${pct >= 80 ? 'text-cyber-green' : 'text-cyber-amber'}`}>{pct}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <Button onClick={openNew} icon={<Plus size={16} />}>Novo Usuário</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(u => (
          <div key={u.id} className="bg-cyber-card rounded-2xl p-4 shadow-card border border-cyber-border/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">{u.avatar}</div>
              <div className="min-w-0">
                <p className="font-semibold text-cyber-text truncate">{u.nome}</p>
                <p className="text-xs text-cyber-muted truncate">{u.cargo}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block ${perfilColor[u.perfil]}`}>{perfilLabel[u.perfil]}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 bg-cyber-surface/50 rounded-xl mb-3 text-center">
              <div><p className="text-xs text-cyber-muted">Comissão</p><p className="text-sm font-bold text-cyber-green">{fmtMoeda(u.comissaoGerada)}</p></div>
              <div><p className="text-xs text-cyber-muted">Leads</p><p className="text-sm font-bold text-cyber-text">{u.leadsAtribuidos}</p></div>
              <div><p className="text-xs text-cyber-muted">Propostas</p><p className="text-sm font-bold text-cyber-text">{u.propostasAbertas}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelected(u); setShowDetalhes(true) }} className="flex-1 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg py-1.5 transition-colors">Ver perfil</button>
              <button onClick={() => { setSelected(u); openEdit(u) }} className="flex-1 text-sm text-cyber-muted hover:bg-slate-100 rounded-lg py-1.5 transition-colors">Editar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Detalhes */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected?.nome} size="sm"
        footer={<div className="flex justify-between"><Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button><Button variant="secondary" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Editar</Button></div>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">{selected.avatar}</div>
              <div>
                <p className="font-bold text-cyber-text text-lg">{selected.nome}</p>
                <p className="text-sm text-cyber-muted">{selected.cargo}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${perfilColor[selected.perfil]}`}>{perfilLabel[selected.perfil]}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['E-mail', selected.email], ['Telefone', selected.telefone], ['Meta mensal', fmtMoeda(selected.metaMensal)], ['Comissão gerada', fmtMoeda(selected.comissaoGerada)], ['Leads atribuídos', selected.leadsAtribuidos], ['Propostas em aberto', selected.propostasAbertas]].map(([k, v]) => (
                <div key={k}><p className="text-xs text-cyber-muted mb-0.5">{k}</p><p className="text-sm font-medium text-cyber-text">{v}</p></div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Novo/Edit */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Usuário' : 'Novo Usuário'} size="sm"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Cadastrar'}</Button></div>}
      >
        <div className="space-y-3">
          <div><label className="hud-label mb-1">Nome *</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} /></div>
          <div><label className="hud-label mb-1">E-mail *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></div>
          <div><label className="hud-label mb-1">Telefone</label><input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className={inputCls} /></div>
          <div><label className="hud-label mb-1">Cargo</label><input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="hud-label mb-1">Perfil</label>
              <select value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))} className={inputCls}>
                {perfis.map(p => <option key={p} value={p}>{perfilLabel[p]}</option>)}
              </select>
            </div>
            <div><label className="hud-label mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div><label className="hud-label mb-1">Meta mensal (R$)</label><input type="number" value={form.metaMensal} onChange={e => setForm(f => ({ ...f, metaMensal: e.target.value }))} className={inputCls} /></div>
        </div>
      </Modal>
    </div>
  )
}
