import { useState } from 'react'
import { input as inputCls } from '../lib/styles'
import { Plus, Search, Eye, Edit2, User, Building2, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { validarCPFouCNPJ, validarEmail, validarCEP } from '../lib/validators'

const tiposProdutor = ['Funcionário Administrativo', 'Funcionário Comercial', 'Externo']
const tipoProdutorColor = {
  'Funcionário Administrativo': 'bg-cyber-cyan/10 text-cyber-cyan',
  'Funcionário Comercial': 'bg-cyber-green/10 text-cyber-green',
  'Externo': 'bg-cyber-purple/10 text-cyber-purple',
}

const emptyForm = {
  tipoPessoa: 'Física', tipoProdutor: 'Funcionário Comercial',
  nome: '', admissao: '', demissao: '',
  cpfCnpj: '', rg: '', dataNascimento: '', sexo: '',
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  telefoneCelular: '', telefoneFixo: '', email: '',
  banco: '', agencia: '', conta: '', tipoConta: 'Corrente', chavePix: '',
  formaRepasse: 'PIX', repassePercentual: '', repasseSobre: 'Comissão recebida',
  status: 'ativo', observacoes: '',
}

function iniciais(nome = '') {
  return nome.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
}

export default function Produtores() {
  const { showToast } = useApp()
  const { data: produtores, create, update, remove } = useResource('produtores')
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = produtores.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.nome.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q) || (p.cpfCnpj || '').includes(q)
    const matchTipo = filterTipo === 'Todos' || p.tipoProdutor === filterTipo
    return matchSearch && matchTipo
  })

  function openNew() { setForm(emptyForm); setIsEditing(false); setShowModal(true) }
  function openEdit(p) { setForm({ ...emptyForm, ...p }); setIsEditing(true); setShowModal(true); setShowDetalhes(false) }
  function openDetalhes(p) { setSelected(p); setShowDetalhes(true) }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Produtor excluído!')
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
    if (form.cep && !validarCEP(form.cep)) { showToast('CEP inválido.', 'error'); return }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form, avatar: iniciais(form.nome) })
        showToast('Produtor atualizado!')
      } else {
        await create({ ...form, id: Date.now().toString(), avatar: iniciais(form.nome) })
        showToast('Produtor cadastrado!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produtor por nome, e-mail ou CPF/CNPJ..." className={`${inputCls} pl-9 pr-4 py-2.5 rounded-xl`} />
        </div>
        <div className="flex gap-2 shrink-0">
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className={`${inputCls} rounded-xl px-3 py-2.5 cursor-pointer`}>
            <option>Todos</option>
            {tiposProdutor.map(t => <option key={t}>{t}</option>)}
          </select>
          <Button onClick={openNew} icon={<Plus size={16} />}>Novo Produtor</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(p => (
          <div key={p.id} className="bg-cyber-card rounded-2xl p-4 shadow-card border border-cyber-border/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">{p.avatar || iniciais(p.nome)}</div>
              <div className="min-w-0">
                <p className="font-semibold text-cyber-text truncate">{p.nome}</p>
                <p className="text-xs text-cyber-muted truncate flex items-center gap-1">
                  {p.tipoPessoa === 'Jurídica' ? <Building2 size={11} /> : <User size={11} />}
                  {p.tipoPessoa} · {p.cpfCnpj || '—'}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block ${tipoProdutorColor[p.tipoProdutor] || 'bg-cyber-surface text-cyber-muted'}`}>{p.tipoProdutor}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 bg-cyber-surface/50 rounded-xl mb-3 text-center">
              <div><p className="text-xs text-cyber-muted">Repasse</p><p className="text-sm font-bold text-cyber-green">{p.repassePercentual ? `${p.repassePercentual}%` : '—'}</p></div>
              <div><p className="text-xs text-cyber-muted">Sobre</p><p className="text-sm font-bold text-cyber-text leading-tight">{p.repasseSobre || '—'}</p></div>
            </div>
            <div className="flex items-center justify-between text-xs text-cyber-muted mb-3">
              <span>{p.telefoneCelular || p.telefoneFixo || '—'}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${p.status === 'ativo' ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-surface text-cyber-muted'}`}>{p.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openDetalhes(p)} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg py-1.5 transition-colors"><Eye size={14} /> Ver</button>
              <button onClick={() => { setSelected(p); openEdit(p) }} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-cyber-muted hover:bg-slate-100 rounded-lg py-1.5 transition-colors"><Edit2 size={14} /> Editar</button>
              <button onClick={() => setConfirmDelete(p)} className="p-1.5 text-cyber-muted hover:text-cyber-red hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={14} /></button>
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
          <p className="text-sm text-cyber-text">Excluir o produtor <strong className="text-cyber-red">"{confirmDelete.nome}"</strong>?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}

      {/* Detalhes */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected?.nome} size="md"
        footer={<div className="flex justify-between"><Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button><Button variant="secondary" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Editar</Button></div>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">{selected.avatar || iniciais(selected.nome)}</div>
              <div>
                <p className="font-bold text-cyber-text text-lg">{selected.nome}</p>
                <p className="text-sm text-cyber-muted">{selected.tipoPessoa} · {selected.cpfCnpj}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoProdutorColor[selected.tipoProdutor] || 'bg-cyber-surface text-cyber-muted'}`}>{selected.tipoProdutor}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['RG', selected.rg], ['Data de nascimento', selected.dataNascimento], ['Sexo', selected.sexo],
                ['Admissão', selected.admissao], ['Demissão', selected.demissao || '—'],
                ['Celular', selected.telefoneCelular], ['Telefone fixo', selected.telefoneFixo], ['E-mail', selected.email],
                ['Forma de repasse', selected.formaRepasse], ['Repasse (%)', selected.repassePercentual ? `${selected.repassePercentual}%` : '—'], ['Repasse sobre', selected.repasseSobre],
              ].map(([k, v]) => (
                <div key={k}><p className="text-xs text-cyber-muted mb-0.5">{k}</p><p className="text-sm font-medium text-cyber-text">{v || '—'}</p></div>
              ))}
            </div>
            <div>
              <p className="hud-label mb-1">Dados para crédito</p>
              <p className="text-sm text-cyber-text/80">{selected.banco || '—'} · Ag. {selected.agencia || '—'} · Conta {selected.conta || '—'} ({selected.tipoConta || '—'}) · PIX: {selected.chavePix || '—'}</p>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Produtor' : 'Novo Produtor'} size="lg"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Produtor'}</Button></div>}
      >
        <div className="space-y-5">
          {/* Tipo de pessoa */}
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
              <FormField label="Tipo de produtor">
                <select value={form.tipoProdutor} onChange={e => setForm(f => ({ ...f, tipoProdutor: e.target.value }))} className={inputCls}>
                  {tiposProdutor.map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </FormField>
              <FormField label={form.tipoPessoa === 'Física' ? 'Nome completo *' : 'Razão social *'} colSpan={2}>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} />
              </FormField>
              <FormField label={form.tipoPessoa === 'Física' ? 'CPF' : 'CNPJ'}>
                <input value={form.cpfCnpj} onChange={e => setForm(f => ({ ...f, cpfCnpj: e.target.value }))} className={inputCls} placeholder={form.tipoPessoa === 'Física' ? '000.000.000-00' : '00.000.000/0001-00'} />
              </FormField>
              {form.tipoPessoa === 'Física' && (
                <FormField label="RG"><input value={form.rg} onChange={e => setForm(f => ({ ...f, rg: e.target.value }))} className={inputCls} /></FormField>
              )}
              {form.tipoPessoa === 'Física' && <>
                <FormField label="Data de nascimento"><input type="date" value={form.dataNascimento} onChange={e => setForm(f => ({ ...f, dataNascimento: e.target.value }))} className={inputCls} /></FormField>
                <FormField label="Sexo">
                  <select value={form.sexo} onChange={e => setForm(f => ({ ...f, sexo: e.target.value }))} className={inputCls}>
                    <option value="">Selecione</option>
                    {['Masculino', 'Feminino', 'Não informado'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </FormField>
              </>}
              <FormField label="Admissão"><input type="date" value={form.admissao} onChange={e => setForm(f => ({ ...f, admissao: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Demissão"><input type="date" value={form.demissao} onChange={e => setForm(f => ({ ...f, demissao: e.target.value }))} className={inputCls} /></FormField>
            </div>
          </Section>

          <Section title="Contato">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Telefone celular"><input value={form.telefoneCelular} onChange={e => setForm(f => ({ ...f, telefoneCelular: e.target.value }))} className={inputCls} placeholder="(00) 00000-0000" /></FormField>
              <FormField label="Telefone fixo"><input value={form.telefoneFixo} onChange={e => setForm(f => ({ ...f, telefoneFixo: e.target.value }))} className={inputCls} placeholder="(00) 0000-0000" /></FormField>
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

          <Section title="Dados de Conta para Crédito">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Banco"><input value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Agência"><input value={form.agencia} onChange={e => setForm(f => ({ ...f, agencia: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Conta"><input value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Tipo de conta">
                <select value={form.tipoConta} onChange={e => setForm(f => ({ ...f, tipoConta: e.target.value }))} className={inputCls}>
                  {['Corrente', 'Poupança', 'Pagamento'].map(o => <option key={o}>{o}</option>)}
                </select>
              </FormField>
              <FormField label="Chave PIX" colSpan={2}><input value={form.chavePix} onChange={e => setForm(f => ({ ...f, chavePix: e.target.value }))} className={inputCls} /></FormField>
            </div>
          </Section>

          <Section title="Repasse">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Forma de repasse">
                <select value={form.formaRepasse} onChange={e => setForm(f => ({ ...f, formaRepasse: e.target.value }))} className={inputCls}>
                  {['PIX', 'TED', 'Depósito', 'Boleto', 'Outro'].map(o => <option key={o}>{o}</option>)}
                </select>
              </FormField>
              <FormField label="Repasse (%) sobre 100% da comissão recebida pela Attenti">
                <input type="number" value={form.repassePercentual} onChange={e => setForm(f => ({ ...f, repassePercentual: e.target.value }))} className={inputCls} placeholder="Ex: 60" />
              </FormField>
              <FormField label="Repasse sobre" colSpan={2}>
                <div className="flex gap-4 mt-1">
                  {['Prêmio líquido', 'Comissão recebida'].map(o => (
                    <label key={o} className="flex items-center gap-2 text-sm text-cyber-muted cursor-pointer hover:text-cyber-text transition-colors">
                      <input type="radio" name="repasseSobre" value={o} checked={form.repasseSobre === o} onChange={() => setForm(f => ({ ...f, repasseSobre: o }))} className="accent-cyber-cyan" />
                      {o}
                    </label>
                  ))}
                </div>
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
