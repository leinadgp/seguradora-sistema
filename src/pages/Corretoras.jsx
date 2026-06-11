import { useState } from 'react'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Eye, Edit2, User, Building2, Phone, Mail, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { validarCPFouCNPJ, validarEmail } from '../lib/validators'

const emptyForm = {
  tipoPessoa: 'Jurídica', nome: '', cpfCnpj: '', inscricaoMunicipal: '', contato: '',
  telefoneFixo: '', telefoneCelular: '', email: '',
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  percentualCocorretagem: '', status: 'ativa', observacoes: '',
}

export default function Corretoras() {
  const { showToast } = useApp()
  const { data: corretoras, create, update, remove } = useResource('corretoras')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = corretoras.filter(c => {
    const q = search.toLowerCase()
    return !q || c.nome.toLowerCase().includes(q) || (c.cpfCnpj || '').includes(q) || (c.contato || '').toLowerCase().includes(q)
  })

  function openNew() { setForm(emptyForm); setIsEditing(false); setShowModal(true) }
  function openEdit(c) { setForm({ ...emptyForm, ...c }); setIsEditing(true); setShowModal(true); setShowDetalhes(false) }
  function openDetalhes(c) { setSelected(c); setShowDetalhes(true) }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Corretora excluída!')
      setConfirmDelete(null)
      if (selected?.id === id) { setShowDetalhes(false); setSelected(null) }
    } catch {
      showToast('Erro ao excluir.', 'error')
    }
  }

  async function handleSave() {
    if (!form.nome) { showToast('Preencha o nome / razão social.', 'error'); return }
    if (form.cpfCnpj && !validarCPFouCNPJ(form.cpfCnpj)) { showToast('CPF/CNPJ inválido.', 'error'); return }
    if (form.email && !validarEmail(form.email)) { showToast('E-mail inválido.', 'error'); return }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form })
        showToast('Corretora atualizada!')
      } else {
        await create({ ...form, id: Date.now().toString() })
        showToast('Corretora cadastrada!')
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar corretora por nome, CPF/CNPJ ou contato..." className={`${inputCls} pl-9 pr-4 py-2.5 rounded-xl`} />
        </div>
        <Button onClick={openNew} icon={<Plus size={16} />}>Nova Corretora</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-cyber-card rounded-2xl p-5 shadow-card border border-cyber-border/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.tipoPessoa === 'Jurídica' ? 'bg-cyber-purple/10' : 'bg-cyber-cyan/10'}`}>
                  {c.tipoPessoa === 'Jurídica' ? <Building2 size={18} className="text-cyber-purple" /> : <User size={18} className="text-cyber-cyan" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-cyber-text leading-tight">{c.nome}</p>
                  <p className="text-xs text-cyber-muted mt-0.5">{c.cpfCnpj}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === 'ativa' ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-surface text-cyber-muted'}`}>{c.status === 'ativa' ? 'Ativa' : 'Inativa'}</span>
            </div>
            <div className="space-y-1.5 mb-3">
              {c.contato && <div className="flex items-center gap-2 text-xs text-cyber-muted"><User size={12} /><span>{c.contato}</span></div>}
              <div className="flex items-center gap-2 text-xs text-cyber-muted"><Phone size={12} /><span>{c.telefoneCelular || c.telefoneFixo || '—'}</span></div>
              <div className="flex items-center gap-2 text-xs text-cyber-muted"><Mail size={12} /><span className="truncate">{c.email}</span></div>
            </div>
            <div className="p-3 bg-cyber-surface/50 rounded-xl mb-3 text-center">
              <p className="text-xs text-cyber-muted">Co-corretagem (sobre 100%)</p>
              <p className="text-lg font-bold text-cyber-green">{c.percentualCocorretagem ? `${c.percentualCocorretagem}%` : '—'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openDetalhes(c)} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg py-1.5 transition-colors"><Eye size={14} /> Ver</button>
              <button onClick={() => { setSelected(c); openEdit(c) }} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-cyber-muted hover:bg-slate-100 rounded-lg py-1.5 transition-colors"><Edit2 size={14} /> Editar</button>
              <button onClick={() => setConfirmDelete(c)} className="p-1.5 text-cyber-muted hover:text-cyber-red hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={14} /></button>
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
          <p className="text-sm text-cyber-text">Excluir a corretora <strong className="text-cyber-red">"{confirmDelete.nome}"</strong>?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}

      {/* Detalhes */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected?.nome} size="md"
        footer={<div className="flex justify-between"><Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button><Button variant="secondary" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Editar</Button></div>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Tipo de pessoa', selected.tipoPessoa],
                [selected.tipoPessoa === 'Jurídica' ? 'CNPJ' : 'CPF', selected.cpfCnpj],
                ['Inscrição municipal', selected.inscricaoMunicipal || '—'],
                ['Contato', selected.contato],
                ['Telefone fixo', selected.telefoneFixo], ['Telefone celular', selected.telefoneCelular],
                ['E-mail', selected.email],
                ['Co-corretagem (%)', selected.percentualCocorretagem ? `${selected.percentualCocorretagem}%` : '—'],
              ].map(([k, v]) => (
                <div key={k}><p className="text-xs text-cyber-muted mb-0.5">{k}</p><p className="text-sm font-medium text-cyber-text">{v || '—'}</p></div>
              ))}
            </div>
            {(selected.rua || selected.cidade) && (
              <div>
                <p className="hud-label mb-1">Endereço</p>
                <p className="text-sm text-cyber-text/80">{selected.rua}, {selected.numero} {selected.complemento} — {selected.bairro}, {selected.cidade}/{selected.estado} — CEP {selected.cep}</p>
              </div>
            )}
            {selected.observacoes && <div className="p-3 bg-cyber-surface/50 rounded-xl"><p className="text-xs text-cyber-muted mb-1">Observações</p><p className="text-sm text-cyber-text/80">{selected.observacoes}</p></div>}
          </div>
        )}
      </Modal>

      {/* Modal Cadastro/Edição */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Corretora' : 'Nova Corretora'} size="lg"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Corretora'}</Button></div>}
      >
        <div className="space-y-5">
          <div className="flex gap-3">
            {['Física', 'Jurídica'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, tipoPessoa: t }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${form.tipoPessoa === t ? 'border-cyber-cyan bg-cyber-cyan/5 text-cyber-cyan' : 'border-cyber-border text-cyber-muted hover:border-cyber-cyan/50'}`}>
                Pessoa {t}
              </button>
            ))}
          </div>

          <Section title="Dados Principais">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label={form.tipoPessoa === 'Física' ? 'Nome completo *' : 'Razão social *'} colSpan={2}>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} />
              </FormField>
              <FormField label={form.tipoPessoa === 'Física' ? 'CPF' : 'CNPJ'}>
                <input value={form.cpfCnpj} onChange={e => setForm(f => ({ ...f, cpfCnpj: e.target.value }))} className={inputCls} placeholder={form.tipoPessoa === 'Física' ? '000.000.000-00' : '00.000.000/0001-00'} />
              </FormField>
              <FormField label="Inscrição municipal"><input value={form.inscricaoMunicipal} onChange={e => setForm(f => ({ ...f, inscricaoMunicipal: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Percentual de co-corretagem (% sobre 100)"><input type="number" value={form.percentualCocorretagem} onChange={e => setForm(f => ({ ...f, percentualCocorretagem: e.target.value }))} className={inputCls} placeholder="Ex: 30" /></FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>
              </FormField>
            </div>
          </Section>

          <Section title="Contato">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Contato" colSpan={2}><input value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} className={inputCls} placeholder="Nome da pessoa de contato" /></FormField>
              <FormField label="Telefone fixo"><input value={form.telefoneFixo} onChange={e => setForm(f => ({ ...f, telefoneFixo: e.target.value }))} className={inputCls} placeholder="(00) 0000-0000" /></FormField>
              <FormField label="Telefone celular"><input value={form.telefoneCelular} onChange={e => setForm(f => ({ ...f, telefoneCelular: e.target.value }))} className={inputCls} placeholder="(00) 00000-0000" /></FormField>
              <FormField label="E-mail" colSpan={2}><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></FormField>
            </div>
          </Section>

          <Section title="Endereço">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="CEP"><input value={form.cep} onChange={e => setForm(f => ({ ...f, cep: e.target.value }))} className={inputCls} placeholder="00000-000" /></FormField>
              <FormField label="Rua"><input value={form.rua} onChange={e => setForm(f => ({ ...f, rua: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Número"><input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Complemento"><input value={form.complemento} onChange={e => setForm(f => ({ ...f, complemento: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Bairro"><input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Cidade"><input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Estado">
                <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className={inputCls}>
                  <option value="">UF</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => <option key={uf}>{uf}</option>)}
                </select>
              </FormField>
            </div>
          </Section>

          <FormField label="Observações">
            <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} className={inputCls + ' resize-none'} />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="hud-label mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FormField({ label, children, colSpan }) {
  return (
    <div className={colSpan === 2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-cyber-muted mb-1">{label}</label>
      {children}
    </div>
  )
}
