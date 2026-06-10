import { useState } from 'react'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Eye, Edit2, Building2, ExternalLink } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'

const segmentos = ['Auto', 'Moto', 'Residencial', 'Empresarial', 'Vida', 'Saúde', 'Frota', 'Rural', 'RC', 'Garantia', 'Engenharia', 'Odontológico', 'Viagem']

const emptyForm = { nome: '', cnpj: '', segmentos: [], gerente: '', telefoneGerente: '', emailGerente: '', linkPortal: '', comissaoMedia: '', prazoEmissao: '', prazoPagamento: '', status: 'ativa', observacoes: '' }

function fmtMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0) }

export default function Seguradoras() {
  const { showToast } = useApp()
  const { data: seguradoras, create, update } = useResource('seguradoras')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)

  const filtered = seguradoras.filter(s => !search || s.nome.toLowerCase().includes(search.toLowerCase()))

  function openNew() { setForm(emptyForm); setIsEditing(false); setShowModal(true) }
  function openEdit(s) { setForm({ ...emptyForm, ...s }); setIsEditing(true); setShowModal(true); setShowDetalhes(false) }

  async function handleSave() {
    if (!form.nome) { showToast('Preencha o nome da seguradora.', 'error'); return }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form })
        showToast('Seguradora atualizada!')
      } else {
        await create({ ...form, id: Date.now().toString(), apolicesAtivas: 0, comissaoPrevista: 0, propostasAbertas: 0 })
        showToast('Seguradora cadastrada!')
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar seguradora..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <Button onClick={openNew} icon={<Plus size={16} />}>Nova Seguradora</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(s => (
          <div key={s.id} className="bg-cyber-card rounded-2xl p-5 shadow-card border border-cyber-border/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyber-surface rounded-xl flex items-center justify-center font-bold text-cyber-muted text-sm">
                  {s.nome.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-cyber-text">{s.nome}</p>
                  <p className="text-xs text-cyber-muted">{s.cnpj}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === 'ativa' ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-surface text-cyber-muted'}`}>{s.status === 'ativa' ? 'Ativa' : 'Inativa'}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {s.segmentos.map(sg => <span key={sg} className="text-xs bg-cyber-cyan/5 text-cyber-cyan px-2 py-0.5 rounded-full">{sg}</span>)}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-cyber-surface/50 rounded-xl">
              <div className="text-center"><p className="text-xs text-cyber-muted">Apólices</p><p className="font-bold text-cyber-text">{s.apolicesAtivas}</p></div>
              <div className="text-center"><p className="text-xs text-cyber-muted">Comissão prev.</p><p className="font-bold text-cyber-green">{fmtMoeda(s.comissaoPrevista)}</p></div>
              <div className="text-center"><p className="text-xs text-cyber-muted">Comissão</p><p className="font-bold text-cyber-text">{s.comissaoMedia}%</p></div>
            </div>
            <div className="flex items-center justify-between text-xs text-cyber-muted mb-3">
              <span>Gerente: {s.gerente}</span>
              <span>Prazo pagto: {s.prazoPagamento}d</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelected(s); setShowDetalhes(true) }} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg py-1.5 transition-colors"><Eye size={14} /> Ver</button>
              <button onClick={() => { setSelected(s); openEdit(s) }} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-cyber-muted hover:bg-slate-100 rounded-lg py-1.5 transition-colors"><Edit2 size={14} /> Editar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Detalhes */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected?.nome} size="md"
        footer={<div className="flex justify-between"><Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button><Button variant="secondary" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Editar</Button></div>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['CNPJ', selected.cnpj], ['Gerente', selected.gerente], ['Telefone', selected.telefoneGerente], ['E-mail', selected.emailGerente], ['Comissão média', `${selected.comissaoMedia}%`], ['Prazo emissão', `${selected.prazoEmissao} dias`], ['Prazo pagamento', `${selected.prazoPagamento} dias`], ['Apólices ativas', selected.apolicesAtivas], ['Comissão prevista', fmtMoeda(selected.comissaoPrevista)], ['Propostas em aberto', selected.propostasAbertas]].map(([k, v]) => (
                <div key={k}><p className="text-xs text-cyber-muted mb-0.5">{k}</p><p className="text-sm font-medium text-cyber-text">{v}</p></div>
              ))}
            </div>
            <div>
              <p className="text-xs text-cyber-muted mb-1">Portal</p>
              <a href={`https://${selected.linkPortal}`} target="_blank" rel="noreferrer" className="text-sm text-cyber-cyan hover:underline flex items-center gap-1">
                {selected.linkPortal} <ExternalLink size={12} />
              </a>
            </div>
            {selected.observacoes && <div className="p-3 bg-cyber-surface/50 rounded-xl"><p className="text-xs text-cyber-muted mb-1">Observações</p><p className="text-sm text-cyber-text/80">{selected.observacoes}</p></div>}
          </div>
        )}
      </Modal>

      {/* Modal Cadastro */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Seguradora' : 'Nova Seguradora'} size="md"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Cadastrar'}</Button></div>}
      >
        <div className="space-y-3">
          <div><label className="hud-label mb-1">Nome *</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} /></div>
          <div><label className="hud-label mb-1">CNPJ</label><input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} className={inputCls} /></div>
          <div>
            <label className="text-xs font-medium text-cyber-muted mb-2 block">Segmentos atendidos</label>
            <div className="grid grid-cols-3 gap-2 p-3 border border-cyber-border rounded-lg">
              {segmentos.map(sg => (
                <label key={sg} className="flex items-center gap-1.5 text-xs text-cyber-text/80 cursor-pointer">
                  <input type="checkbox" checked={form.segmentos.includes(sg)} onChange={e => setForm(f => ({ ...f, segmentos: e.target.checked ? [...f.segmentos, sg] : f.segmentos.filter(x => x !== sg) }))} className="rounded" />
                  {sg}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="hud-label mb-1">Gerente comercial</label><input value={form.gerente} onChange={e => setForm(f => ({ ...f, gerente: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Telefone</label><input value={form.telefoneGerente} onChange={e => setForm(f => ({ ...f, telefoneGerente: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">E-mail</label><input value={form.emailGerente} onChange={e => setForm(f => ({ ...f, emailGerente: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Portal</label><input value={form.linkPortal} onChange={e => setForm(f => ({ ...f, linkPortal: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Comissão média (%)</label><input type="number" value={form.comissaoMedia} onChange={e => setForm(f => ({ ...f, comissaoMedia: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Prazo emissão (dias)</label><input type="number" value={form.prazoEmissao} onChange={e => setForm(f => ({ ...f, prazoEmissao: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Prazo pagamento (dias)</label><input type="number" value={form.prazoPagamento} onChange={e => setForm(f => ({ ...f, prazoPagamento: e.target.value }))} className={inputCls} /></div>
            <div><label className="hud-label mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>
          </div>
          <div><label className="hud-label mb-1">Observações</label><textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} className={inputCls + ' resize-none'} /></div>
        </div>
      </Modal>
    </div>
  )
}
