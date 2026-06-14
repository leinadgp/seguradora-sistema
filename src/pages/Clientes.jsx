import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, Edit2, User, Building2, Phone, Mail, MapPin, FileText, ClipboardList, AlertTriangle, Paperclip, CheckCircle, Clock, XCircle, X, Trash2, ThumbsUp, ThumbsDown, Upload, Download } from 'lucide-react'
import { input as inputCls } from '../lib/styles'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { validarCPF, validarCNPJ, validarEmail, validarTelefone, validarCEP } from '../lib/validators'

const tipoOpcoes = ['Todos', 'PF', 'PJ']
const statusOpcoes = ['Todos', 'ativo', 'inativo', 'prospect']
const origens = ['Indicação', 'Site', 'Redes Sociais', 'Prospecção', 'WhatsApp', 'Ligação ativa']

const emptyForm = {
  tipo: 'PF', nome: '', nomeFantasia: '', apelido: '', cpf: '', cnpj: '', rg: '', dataNascimento: '', sexo: '',
  email: '', telefone: '', whatsapp: '', telefoneSecundario: '', estadoCivil: '', profissao: '',
  produtor: '', responsavel: 'Carlos Silva', origem: 'Indicação', status: 'ativo', observacoes: '',
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  atividade: '', numeroFuncionarios: '', faturamentoMensal: '', responsavelLegal: '',
  cpfResponsavel: '', cargoResponsavel: '', emailFinanceiro: '', telefoneFinanceiro: '',
  banco: '', agencia: '', conta: '', tipoConta: 'Corrente', chavePix: '',
  naturezaEmpresa: 'Privada', tomador: false, limitesTaxaGarantia: [],
  grupoSegurado: '', classificacao: '',
}

function fmtMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0)
}

export default function Clientes() {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const { data: clientes, create, update, remove } = useResource('clientes')
  const { data: usuarios } = useResource('usuarios')
  const { data: produtores } = useResource('produtores')
  const { data: seguradoras } = useResource('seguradoras')
  const { data: leads } = useResource('leads')
  const { data: cotacoes } = useResource('cotacoes')
  const { data: apolices } = useResource('apolices')
  const { data: propostas } = useResource('propostas')
  const { data: sinistros } = useResource('sinistros')
  const { data: documentos, update: updateDoc, create: createDoc } = useResource('documentos')
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [page, setPage] = useState(1)
  const [showDocModal, setShowDocModal] = useState(false)
  const [docForm, setDocForm] = useState({ tipo: 'CPF', nome: '', observacoes: '', dataUrl: '', fileType: '', fileSize: 0 })
  const [previewDocCliente, setPreviewDocCliente] = useState(null)
  const docFileRef = useRef(null)
  const PER_PAGE = 20
  useEffect(() => { setPage(1) }, [search, filterTipo, filterStatus])

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.nome.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.telefone || '').includes(q) || (c.cpf || '').includes(q) || (c.cnpj || '').includes(q)
    const matchTipo = filterTipo === 'Todos' || c.tipo === filterTipo
    const matchStatus = filterStatus === 'Todos' || c.status === filterStatus
    return matchSearch && matchTipo && matchStatus
  })
  const paginado = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function openNew() {
    setForm(emptyForm)
    setIsEditing(false)
    setShowModal(true)
  }

  function openEdit(c) {
    setForm({ ...emptyForm, ...c, ...c.endereco })
    setIsEditing(true)
    setShowModal(true)
    setShowDetalhes(false)
  }

  function openDetalhes(c) {
    setSelected(c)
    setActiveTab('dados')
    setShowDetalhes(true)
  }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Cliente excluído!')
      setConfirmDelete(null)
      if (selected?.id === id) { setShowDetalhes(false); setSelected(null) }
    } catch {
      showToast('Erro ao excluir.', 'error')
    }
  }

  const onlyDigits = (v) => (v || '').replace(/\D/g, '')
  const seguradorasGarantia = seguradoras.filter(s => (s.segmentos || []).includes('Garantia'))

  function addLimiteTaxa() {
    setForm(f => ({ ...f, limitesTaxaGarantia: [...(f.limitesTaxaGarantia || []), { seguradora: '', taxaMax: '', limiteReais: '' }] }))
  }
  function updateLimiteTaxa(i, key, value) {
    setForm(f => ({ ...f, limitesTaxaGarantia: f.limitesTaxaGarantia.map((l, idx) => idx === i ? { ...l, [key]: value } : l) }))
  }
  function removeLimiteTaxa(i) {
    setForm(f => ({ ...f, limitesTaxaGarantia: f.limitesTaxaGarantia.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    if (!form.nome) { showToast('Preencha o nome do cliente.', 'error'); return }
    // Trava cadastro com CNPJ duplicado
    if (form.tipo === 'PJ' && form.cnpj && onlyDigits(form.cnpj).length > 0) {
      const cnpjAtual = onlyDigits(form.cnpj)
      const duplicado = clientes.find(c => onlyDigits(c.cnpj) === cnpjAtual && c.id !== selected?.id)
      if (duplicado) { showToast(`Já existe um cliente com este CNPJ: ${duplicado.nome}.`, 'error'); return }
    }
    if (form.tipo === 'PF' && form.cpf && !validarCPF(form.cpf)) { showToast('CPF inválido.', 'error'); return }
    if (form.tipo === 'PJ' && form.cnpj && !validarCNPJ(form.cnpj)) { showToast('CNPJ inválido.', 'error'); return }
    if (form.email && !validarEmail(form.email)) { showToast('E-mail inválido.', 'error'); return }
    if (form.telefone && !validarTelefone(form.telefone)) { showToast('Telefone inválido.', 'error'); return }
    if (form.cep && !validarCEP(form.cep)) { showToast('CEP inválido.', 'error'); return }
    const endereco = { cep: form.cep, rua: form.rua, numero: form.numero, complemento: form.complemento, bairro: form.bairro, cidade: form.cidade, estado: form.estado }
    try {
      if (isEditing) {
        await update(selected.id, { ...selected, ...form, endereco })
        showToast('Cliente atualizado com sucesso!')
      } else {
        await create({ ...form, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0], apolicesCount: 0, propostas: 0, sinistros: 0, endereco })
        showToast('Cliente cadastrado com sucesso!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  // Traversal: cliente → lead → cotação → proposta → apólice
  const leadVinculado = selected
    ? (leads.find(l => l.id === selected.lead_id || l.cliente_id === selected.id) || null)
    : null
  const cotacaoVinculada = leadVinculado
    ? (cotacoes.find(c => c.id === leadVinculado.cotacao_id) || null)
    : null
  const propostaVinculadaId = cotacaoVinculada?.converted_proposal_id || null
  const propostaVinculada = propostaVinculadaId
    ? (propostas.find(p => p.id === propostaVinculadaId) || null)
    : null
  const apoliceVinculadaId = propostaVinculada?.converted_policy_id || null

  // Filtros: clienteId direto OU via traversal
  const apolicesCliente = selected ? apolices.filter(a =>
    a.clienteId === selected.id || a.id === apoliceVinculadaId || a.lead_id === leadVinculado?.id
  ) : []
  const propostasCliente = selected ? propostas.filter(p =>
    p.clienteId === selected.id || p.id === propostaVinculadaId || p.lead_id === leadVinculado?.id
  ) : []
  const cotacoesCliente = selected ? cotacoes.filter(c =>
    c.clienteId === selected.id || c.id === cotacaoVinculada?.id || c.lead_id === leadVinculado?.id
  ) : []
  const sinistrosCliente = selected ? sinistros.filter(s => s.clienteId === selected.id) : []
  const documentosCliente = selected ? documentos.filter(d => d.clienteId === selected.id) : []

  async function aprovarDocumento(doc) {
    try {
      await updateDoc(doc.id, { ...doc, status: 'aprovado' })
      showToast(`Documento "${doc.nome}" aprovado!`)
    } catch { showToast('Erro ao aprovar.', 'error') }
  }
  async function rejeitarDocumento(doc) {
    try {
      await updateDoc(doc.id, { ...doc, status: 'rejeitado' })
      showToast(`Documento "${doc.nome}" rejeitado.`)
    } catch { showToast('Erro ao rejeitar.', 'error') }
  }

  function handleDocFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setDocForm(f => ({
        ...f,
        nome: f.nome || `${f.tipo} - ${selected?.nome || 'cliente'}.${file.name.split('.').pop()}`,
        dataUrl: ev.target.result,
        fileType: file.type,
        fileSize: file.size,
      }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function salvarDocumento() {
    if (!docForm.tipo) { showToast('Selecione o tipo de documento.', 'error'); return }
    const nome = docForm.nome || `${docForm.tipo} - ${selected?.nome}.pdf`
    try {
      await createDoc({
        id: Date.now().toString(),
        clienteId: selected.id,
        cliente: selected.nome,
        tipo: docForm.tipo,
        nome,
        status: 'pendente',
        observacoes: docForm.observacoes,
        dataUrl: docForm.dataUrl,
        fileType: docForm.fileType,
        fileSize: docForm.fileSize,
        dataEnvio: new Date().toISOString().split('T')[0],
      })
      showToast('Documento adicionado!')
      setShowDocModal(false)
      setDocForm({ tipo: 'CPF', nome: '', observacoes: '', dataUrl: '', fileType: '', fileSize: 0 })
    } catch { showToast('Erro ao salvar documento.', 'error') }
  }

  function downloadDocumento(doc) {
    if (!doc.dataUrl) { showToast('Nenhum arquivo armazenado.', 'error'); return }
    const a = document.createElement('a')
    a.href = doc.dataUrl
    a.download = doc.nome
    a.click()
  }

  const detalheTabs = [
    { key: 'dados', label: 'Dados' },
    { key: 'cotacoes', label: `Cotações (${cotacoesCliente.length})` },
    { key: 'propostas', label: `Propostas (${propostasCliente.length})` },
    { key: 'apolices', label: `Apólices (${apolicesCliente.length})` },
    { key: 'sinistros', label: `Sinistros (${sinistrosCliente.length})` },
    { key: 'documentos', label: `Documentos (${documentosCliente.length})` },
  ]

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs text-cyber-muted mb-0.5">{label}</p>
      <p className="text-sm text-cyber-text font-medium">{value || '—'}</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF, e-mail, telefone..."
            className={`${inputCls} pl-9 pr-4 py-2.5 rounded-xl`}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className={`${inputCls} rounded-xl px-3 py-2.5 cursor-pointer`}>
            {tipoOpcoes.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${inputCls} rounded-xl px-3 py-2.5 cursor-pointer`}>
            {statusOpcoes.map(o => <option key={o}>{o === 'Todos' ? 'Todos os status' : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
          <Button onClick={openNew} icon={<Plus size={16} />}>Novo Cliente</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-cyber-muted">{filtered.length} clientes encontrados</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-muted">{clientes.filter(c => c.tipo === 'PF').length} PF</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-muted">{clientes.filter(c => c.tipo === 'PJ').length} PJ</span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState icon={<User size={28} />} title="Nenhum cliente encontrado" description="Tente ajustar os filtros ou cadastre um novo cliente." action={<Button onClick={openNew} icon={<Plus size={16} />}>Novo Cliente</Button>} />
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {paginado.map(c => (
            <div key={c.id} className="bg-cyber-card rounded-2xl p-4 shadow-card border border-cyber-border/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.tipo === 'PJ' ? 'bg-cyber-purple/10' : 'bg-cyber-cyan/10'}`}>
                    {c.tipo === 'PJ' ? <Building2 size={18} className="text-cyber-purple" /> : <User size={18} className="text-cyber-cyan" />}
                  </div>
                  <div>
                    <p className="font-semibold text-cyber-text text-sm leading-tight">{c.nome}</p>
                    <p className="text-xs text-cyber-muted mt-0.5">{c.tipo === 'PF' ? c.cpf : c.cnpj}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} type="cliente" />
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-cyber-muted">
                  <Phone size={12} /><span>{c.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-cyber-muted">
                  <Mail size={12} /><span className="truncate">{c.email}</span>
                </div>
                {c.endereco && (
                  <div className="flex items-center gap-2 text-xs text-cyber-muted">
                    <MapPin size={12} /><span>{c.endereco.cidade}, {c.endereco.estado}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3 text-xs text-cyber-muted">
                <span className="flex items-center gap-1"><FileText size={11} /> {c.apolicesCount} apólices</span>
                <span>·</span>
                <span className="flex items-center gap-1"><AlertTriangle size={11} /> {c.sinistros} sinistros</span>
                <span>·</span>
                <span>Resp: {c.responsavel?.split(' ')[0]}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openDetalhes(c)} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 active:bg-cyber-cyan/20 rounded-lg py-1.5 transition-colors cursor-pointer">
                  <Eye size={14} /> Ver
                </button>
                <button onClick={() => { setSelected(c); openEdit(c) }} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-cyber-muted hover:bg-slate-100 active:bg-slate-200 rounded-lg py-1.5 transition-colors cursor-pointer">
                  <Edit2 size={14} /> Editar
                </button>
                <button onClick={() => setConfirmDelete(c)} className="p-1.5 text-cyber-muted hover:text-cyber-red hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
        </>
      )}

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
          <p className="text-sm text-cyber-text">Excluir o cliente <strong className="text-cyber-red">"{confirmDelete.nome}"</strong>?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}

      {/* Modal Novo Documento do Cliente */}
      <input ref={docFileRef} type="file" className="hidden" onChange={handleDocFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
      <Modal isOpen={showDocModal} onClose={() => setShowDocModal(false)} title={`Novo Documento — ${selected?.nome}`} size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDocModal(false)}>Cancelar</Button>
            <Button onClick={salvarDocumento}>Salvar</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="hud-label mb-1">Tipo de documento</label>
            <select value={docForm.tipo} onChange={e => setDocForm(f => ({ ...f, tipo: e.target.value }))} className={inputCls}>
              {['CPF', 'RG', 'CNH', 'Comprovante de endereço', 'CNPJ', 'Contrato social', 'Nota fiscal', 'Documento do veículo', 'Matrícula do imóvel', 'Boleto', 'Proposta assinada', 'Apólice', 'Comprovante de pagamento', 'Laudo Técnico', 'B.O.', 'Outros'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="hud-label mb-1">Nome do arquivo</label>
            <input value={docForm.nome} onChange={e => setDocForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} placeholder={`Ex: ${docForm.tipo} - ${selected?.nome}.pdf`} />
          </div>
          <div
            onClick={() => docFileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${docForm.dataUrl ? 'border-cyber-green/50 bg-cyber-green/5' : 'border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5'}`}
          >
            {docForm.dataUrl ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-cyber-green">
                  <CheckCircle size={16} />
                  <span className="truncate max-w-[180px]">{docForm.nome || 'Arquivo selecionado'}</span>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setDocForm(f => ({ ...f, dataUrl: '', fileType: '', fileSize: 0 })) }} className="text-cyber-muted hover:text-cyber-red">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={22} className="mx-auto text-cyber-muted mb-2" />
                <p className="text-sm text-cyber-muted">Clique para selecionar o arquivo</p>
                <p className="text-xs text-cyber-muted mt-1">PDF, JPG, PNG</p>
              </>
            )}
          </div>
          <div>
            <label className="hud-label mb-1">Observações</label>
            <textarea value={docForm.observacoes} onChange={e => setDocForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />
          </div>
        </div>
      </Modal>

      {/* Modal Preview de Documento */}
      {previewDocCliente && (
        <Modal isOpen title={previewDocCliente.nome} onClose={() => setPreviewDocCliente(null)} size="xl"
          footer={
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setPreviewDocCliente(null)}>Fechar</Button>
              <Button icon={<Download size={14} />} onClick={() => downloadDocumento(previewDocCliente)}>Baixar</Button>
            </div>
          }
        >
          <div className="flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto">
            {previewDocCliente.fileType?.startsWith('image/') ? (
              <img src={previewDocCliente.dataUrl} alt={previewDocCliente.nome} className="max-w-full max-h-[65vh] object-contain rounded-lg" />
            ) : previewDocCliente.fileType === 'application/pdf' ? (
              <object data={previewDocCliente.dataUrl} type="application/pdf" className="w-full h-[65vh] rounded-lg">
                <p className="text-sm text-cyber-muted text-center">Seu navegador não suporta PDF. <button onClick={() => downloadDocumento(previewDocCliente)} className="text-cyber-cyan underline">Baixar</button>.</p>
              </object>
            ) : (
              <p className="text-sm text-cyber-muted">Tipo sem visualização. <button onClick={() => downloadDocumento(previewDocCliente)} className="text-cyber-cyan underline">Baixar para ver</button>.</p>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Cadastro/Edição */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Cliente' : 'Novo Cliente'} size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}</Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Tipo */}
          <div className="flex gap-3">
            {['PF', 'PJ'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${form.tipo === t ? 'border-cyber-cyan bg-cyber-cyan/5 text-cyber-cyan' : 'border-cyber-border text-cyber-muted hover:border-cyber-cyan/50'}`}>
                {t === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </button>
            ))}
          </div>

          {/* Dados principais */}
          <Section title="Dados Principais">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Nome completo / Razão social *" colSpan={2}>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} placeholder={form.tipo === 'PF' ? 'Nome completo' : 'Razão social'} />
              </FormField>
              {form.tipo === 'PJ' && (
                <FormField label="Nome fantasia">
                  <input value={form.nomeFantasia} onChange={e => setForm(f => ({ ...f, nomeFantasia: e.target.value }))} className={inputCls} placeholder="Nome fantasia" />
                </FormField>
              )}
              {form.tipo === 'PF' && <>
                <FormField label="CPF"><input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} className={inputCls} placeholder="000.000.000-00" /></FormField>
                <FormField label="RG"><input value={form.rg} onChange={e => setForm(f => ({ ...f, rg: e.target.value }))} className={inputCls} placeholder="00.000.000-0" /></FormField>
                <FormField label="Data de nascimento"><input type="date" value={form.dataNascimento} onChange={e => setForm(f => ({ ...f, dataNascimento: e.target.value }))} className={inputCls} /></FormField>
                <FormField label="Estado civil">
                  <select value={form.estadoCivil} onChange={e => setForm(f => ({ ...f, estadoCivil: e.target.value }))} className={inputCls}>
                    <option value="">Selecione</option>
                    {['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </FormField>
                <FormField label="Profissão"><input value={form.profissao} onChange={e => setForm(f => ({ ...f, profissao: e.target.value }))} className={inputCls} placeholder="Ex: Engenheiro" /></FormField>
                <FormField label="Apelido"><input value={form.apelido} onChange={e => setForm(f => ({ ...f, apelido: e.target.value }))} className={inputCls} placeholder="Como o cliente é conhecido" /></FormField>
                <FormField label="Sexo">
                  <select value={form.sexo} onChange={e => setForm(f => ({ ...f, sexo: e.target.value }))} className={inputCls}>
                    <option value="">Selecione</option>
                    {['Masculino', 'Feminino', 'Não informado'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </FormField>
              </>}
              {form.tipo === 'PJ' && <>
                <FormField label="CNPJ"><input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} className={inputCls} placeholder="00.000.000/0001-00" /></FormField>
                <FormField label="Natureza da empresa">
                  <select value={form.naturezaEmpresa} onChange={e => setForm(f => ({ ...f, naturezaEmpresa: e.target.value }))} className={inputCls}>
                    {['Privada', 'Pública'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </FormField>
                <FormField label="Atividade da empresa"><input value={form.atividade} onChange={e => setForm(f => ({ ...f, atividade: e.target.value }))} className={inputCls} /></FormField>
                <FormField label="Nº de funcionários"><input type="number" value={form.numeroFuncionarios} onChange={e => setForm(f => ({ ...f, numeroFuncionarios: e.target.value }))} className={inputCls} /></FormField>
                <FormField label="Faturamento médio mensal"><input value={form.faturamentoMensal} onChange={e => setForm(f => ({ ...f, faturamentoMensal: e.target.value }))} className={inputCls} placeholder="R$ 0,00" /></FormField>
                <FormField label="Responsável legal"><input value={form.responsavelLegal} onChange={e => setForm(f => ({ ...f, responsavelLegal: e.target.value }))} className={inputCls} /></FormField>
                <FormField label="CPF do responsável"><input value={form.cpfResponsavel} onChange={e => setForm(f => ({ ...f, cpfResponsavel: e.target.value }))} className={inputCls} /></FormField>
                <FormField label="Cargo do responsável"><input value={form.cargoResponsavel} onChange={e => setForm(f => ({ ...f, cargoResponsavel: e.target.value }))} className={inputCls} /></FormField>
              </>}
            </div>
          </Section>

          {/* Contato */}
          <Section title="Contato">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="E-mail *"><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Telefone"><input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className={inputCls} placeholder="(00) 00000-0000" /></FormField>
              <FormField label="WhatsApp"><input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className={inputCls} placeholder="(00) 00000-0000" /></FormField>
              {form.tipo === 'PJ' && <FormField label="E-mail financeiro"><input value={form.emailFinanceiro} onChange={e => setForm(f => ({ ...f, emailFinanceiro: e.target.value }))} className={inputCls} /></FormField>}
            </div>
          </Section>

          {/* Endereço */}
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

          {/* Dados Bancários */}
          <Section title="Dados Bancários">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Banco"><input value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} className={inputCls} placeholder="Ex: Itaú" /></FormField>
              <FormField label="Tipo de conta">
                <select value={form.tipoConta} onChange={e => setForm(f => ({ ...f, tipoConta: e.target.value }))} className={inputCls}>
                  {['Corrente', 'Poupança', 'Pagamento'].map(o => <option key={o}>{o}</option>)}
                </select>
              </FormField>
              <FormField label="Agência"><input value={form.agencia} onChange={e => setForm(f => ({ ...f, agencia: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Conta"><input value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="Chave PIX" colSpan={2}><input value={form.chavePix} onChange={e => setForm(f => ({ ...f, chavePix: e.target.value }))} className={inputCls} /></FormField>
            </div>
          </Section>

          {/* Seguro Garantia */}
          <Section title="Seguro Garantia">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <FormField label="Grupo de Segurado">
                <select
                  value={form.grupoSegurado}
                  onChange={e => setForm(f => ({ ...f, grupoSegurado: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Selecionar...</option>
                  {form.tipo === 'PF' ? (
                    <>
                      <option value="SEGURADO PESSOA FISICA">SEGURADO PESSOA FISICA</option>
                    </>
                  ) : (
                    <>
                      <option value="SEGURADO SEGURO GARANTIA">SEGURADO SEGURO GARANTIA</option>
                      <option value="TOMADOR SEGURO GARANTIA">TOMADOR SEGURO GARANTIA</option>
                      <option value="SUB-ESTIPULANTE">SUB-ESTIPULANTE</option>
                      <option value="SEGURADO PJ">SEGURADO PJ</option>
                    </>
                  )}
                </select>
              </FormField>
              <FormField label="Classificação">
                <select
                  value={form.classificacao}
                  onChange={e => setForm(f => ({ ...f, classificacao: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Selecionar...</option>
                  {form.tipo === 'PF' ? (
                    <>
                      <option value="SEGURADO PESSOA FISICA">SEGURADO PESSOA FISICA</option>
                      <option value="BENEFICIARIO PESSOA FISICA">BENEFICIARIO PESSOA FISICA</option>
                    </>
                  ) : (
                    <>
                      <option value="SEGURADO PJ">SEGURADO PJ</option>
                      <option value="BENEFICIARIO PJ">BENEFICIARIO PJ</option>
                    </>
                  )}
                </select>
              </FormField>
            </div>
            <label className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-cyber-border/60 hover:bg-slate-100 transition-colors cursor-pointer">
              <span className="text-sm text-cyber-text">É tomador (seguro garantia)?</span>
              <input type="checkbox" checked={!!form.tomador} onChange={e => setForm(f => ({ ...f, tomador: e.target.checked }))} className="w-4 h-4 accent-cyber-cyan cursor-pointer" />
            </label>

            {form.tomador && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-cyber-muted">Limites por seguradora de garantia</p>
                  <button type="button" onClick={addLimiteTaxa} className="text-xs text-cyber-cyan hover:underline cursor-pointer">+ Adicionar</button>
                </div>
                {(form.limitesTaxaGarantia || []).length === 0 && (
                  <p className="text-xs text-cyber-dim italic">Nenhum limite definido. Clique em "Adicionar" para incluir.</p>
                )}
                {(form.limitesTaxaGarantia || []).map((l, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center border border-cyber-border/40 rounded-lg p-2">
                    <select value={l.seguradora} onChange={e => updateLimiteTaxa(i, 'seguradora', e.target.value)} className={`${inputCls} flex-1`}>
                      <option value="">Seguradora...</option>
                      {seguradorasGarantia.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                      {seguradorasGarantia.length === 0 && <option value="" disabled>Nenhuma seguradora de garantia cadastrada</option>}
                    </select>
                    <div className="flex gap-2">
                      <div className="relative w-24 shrink-0">
                        <input type="number" step="0.01" value={l.taxaMax} onChange={e => updateLimiteTaxa(i, 'taxaMax', e.target.value)} placeholder="Taxa" className={`${inputCls} pr-6`} />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-cyber-muted select-none">%</span>
                      </div>
                      <div className="relative flex-1 sm:w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-cyber-muted select-none">R$</span>
                        <input type="number" step="0.01" value={l.limiteReais} onChange={e => updateLimiteTaxa(i, 'limiteReais', e.target.value)} placeholder="Limite" className={`${inputCls} pl-9`} />
                      </div>
                      <button type="button" onClick={() => removeLimiteTaxa(i)} className="text-cyber-red hover:bg-cyber-red/10 rounded-lg p-2 shrink-0 cursor-pointer" title="Remover">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Gestão */}
          <Section title="Gestão">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Produtor do cliente">
                <select value={form.produtor} onChange={e => setForm(f => ({ ...f, produtor: e.target.value }))} className={inputCls}>
                  <option value="">Selecione o produtor</option>
                  {produtores.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </FormField>
              <FormField label="Responsável">
                <select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className={inputCls}>
                  {usuarios.map(u => <option key={u.id}>{u.nome}</option>)}
                </select>
              </FormField>
              <FormField label="Origem">
                <select value={form.origem} onChange={e => setForm(f => ({ ...f, origem: e.target.value }))} className={inputCls}>
                  {origens.map(o => <option key={o}>{o}</option>)}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="prospect">Prospect</option>
                </select>
              </FormField>
            </div>
            <FormField label="Observações">
              <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} className={inputCls + ' resize-none'} />
            </FormField>
          </Section>
        </div>
      </Modal>

      {/* Modal Detalhes */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected?.nome} size="lg"
        footer={
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setShowDetalhes(false)}>Fechar</Button>
            <Button variant="secondary" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Editar</Button>
          </div>
        }
      >
        {selected && (
          <div>
            <div className="flex gap-1 mb-4 border-b border-cyber-border/40 overflow-x-auto scrollbar-hide">
              {detalheTabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.key ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-cyber-muted hover:text-cyber-text/80'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'dados' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-cyber-surface/50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                    {selected.tipo === 'PJ' ? <Building2 size={22} className="text-cyber-cyan" /> : <User size={22} className="text-cyber-cyan" />}
                  </div>
                  <div>
                    <p className="font-bold text-cyber-text">{selected.nome}</p>
                    <p className="text-sm text-cyber-muted">{selected.tipo === 'PF' ? `CPF: ${selected.cpf}` : `CNPJ: ${selected.cnpj}`}</p>
                    <div className="mt-1"><StatusBadge status={selected.status} type="cliente" /></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="E-mail" value={selected.email} />
                  <Field label="Telefone" value={selected.telefone} />
                  <Field label="WhatsApp" value={selected.whatsapp} />
                  {selected.tipo === 'PF' && <>
                    <Field label="Data de nascimento" value={selected.dataNascimento} />
                    <Field label="Estado civil" value={selected.estadoCivil} />
                    <Field label="Profissão" value={selected.profissao} />
                    <Field label="Apelido" value={selected.apelido} />
                    <Field label="Sexo" value={selected.sexo} />
                  </>}
                  {selected.tipo === 'PJ' && <>
                    <Field label="Natureza da empresa" value={selected.naturezaEmpresa} />
                    <Field label="Atividade" value={selected.atividade} />
                    <Field label="Funcionários" value={selected.numeroFuncionarios} />
                    <Field label="Responsável legal" value={selected.responsavelLegal} />
                  </>}
                  <Field label="Grupo de Segurado" value={selected.grupoSegurado} />
                  <Field label="Classificação" value={selected.classificacao} />
                  <Field label="Tomador (garantia)" value={selected.tomador ? 'Sim' : 'Não'} />
                  <Field label="Produtor" value={selected.produtor} />
                  <Field label="Responsável" value={selected.responsavel} />
                  <Field label="Origem" value={selected.origem} />
                  <Field label="Cadastro" value={selected.createdAt} />
                </div>
                {(selected.banco || selected.chavePix) && (
                  <div>
                    <p className="hud-label mb-2">Dados bancários</p>
                    <p className="text-sm text-cyber-text/80">{selected.banco || '—'} · Ag. {selected.agencia || '—'} · Conta {selected.conta || '—'} ({selected.tipoConta || '—'}) · PIX: {selected.chavePix || '—'}</p>
                  </div>
                )}
                {selected.tomador && (selected.limitesTaxaGarantia || []).length > 0 && (
                  <div>
                    <p className="hud-label mb-2">Limites por seguradora de garantia</p>
                    <div className="space-y-1.5">
                      {selected.limitesTaxaGarantia.map((l, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 border border-cyber-border/40 rounded-lg">
                          <span className="text-sm text-cyber-text">{l.seguradora || '—'}</span>
                          <span className="text-sm font-medium text-cyber-text/90 flex items-center gap-3">
                            <span className="text-cyber-cyan">{l.taxaMax !== '' && l.taxaMax != null ? `${l.taxaMax}%` : '—'}</span>
                            <span className="text-cyber-green">{l.limiteReais !== '' && l.limiteReais != null ? fmtMoeda(l.limiteReais) : '—'}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.endereco && (
                  <div>
                    <p className="hud-label mb-2">Endereço</p>
                    <p className="text-sm text-cyber-text/80">{selected.endereco.rua}, {selected.endereco.numero} {selected.endereco.complemento} — {selected.endereco.bairro}, {selected.endereco.cidade}/{selected.endereco.estado} — CEP {selected.endereco.cep}</p>
                  </div>
                )}
                {selected.observacoes && (
                  <div className="p-3 bg-cyber-amber/5 rounded-xl">
                    <p className="text-xs font-semibold text-cyber-amber mb-1">Observações</p>
                    <p className="text-sm text-cyber-amber">{selected.observacoes}</p>
                  </div>
                )}
                {/* Pipeline */}
                {leadVinculado && (
                  <div className="p-4 bg-cyber-surface/60 border border-cyber-border/40 rounded-xl">
                    <p className="hud-label mb-3">Pipeline</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button onClick={() => navigate('/leads')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyber-amber/10 text-cyber-amber font-medium hover:bg-cyber-amber/20 transition-colors">
                        <User size={11} /> Lead · {leadVinculado.status}
                      </button>
                      {cotacaoVinculada && (
                        <>
                          <span className="text-cyber-muted">→</span>
                          <button onClick={() => navigate(`/cotacoes?focus=${cotacaoVinculada.id}`)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyber-cyan/10 text-cyber-cyan font-medium hover:bg-cyber-cyan/20 transition-colors">
                            <FileText size={11} /> {cotacaoVinculada.numero} · {cotacaoVinculada.status}
                          </button>
                        </>
                      )}
                      {propostaVinculada && (
                        <>
                          <span className="text-cyber-muted">→</span>
                          <button onClick={() => navigate(`/propostas?focus=${propostaVinculada.id}`)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyber-purple/10 text-cyber-purple font-medium hover:bg-cyber-purple/20 transition-colors">
                            <ClipboardList size={11} /> {propostaVinculada.numero} · {propostaVinculada.status}
                          </button>
                        </>
                      )}
                      {apoliceVinculadaId && apolices.find(a => a.id === apoliceVinculadaId) && (
                        <>
                          <span className="text-cyber-muted">→</span>
                          <button onClick={() => navigate(`/apolices?focus=${apoliceVinculadaId}`)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyber-green/10 text-cyber-green font-medium hover:bg-cyber-green/20 transition-colors">
                            <CheckCircle size={11} /> {apolices.find(a => a.id === apoliceVinculadaId)?.numero} · Ativa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cotacoes' && (
              <div className="space-y-2">
                {cotacoesCliente.length === 0 ? <EmptyState icon={<FileText size={24} />} title="Sem cotações" description="Nenhuma cotação vinculada a este cliente." /> :
                  cotacoesCliente.map(c => (
                    <button key={c.id} onClick={() => navigate(`/cotacoes?focus=${c.id}`)}
                      className="w-full flex items-center justify-between p-3 border border-cyber-border/40 rounded-xl hover:border-cyber-cyan/30 hover:bg-cyber-cyan/5 transition-colors text-left">
                      <div>
                        <p className="text-sm font-medium">{c.numero} — {c.tipoSeguro}</p>
                        <p className="text-xs text-cyber-muted">{c.dataCriacao} · {c.seguradora || 'Sem seguradora'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.status} type="cotacao" />
                        <FileText size={14} className="text-cyber-muted" />
                      </div>
                    </button>
                  ))
                }
              </div>
            )}

            {activeTab === 'apolices' && (
              <div className="space-y-2">
                {apolicesCliente.length === 0 ? <EmptyState icon={<FileText size={24} />} title="Sem apólices" description="Este cliente não possui apólices vinculadas." /> :
                  apolicesCliente.map(a => (
                    <button key={a.id} onClick={() => navigate(`/apolices?focus=${a.id}`)}
                      className="w-full flex items-center justify-between p-3 border border-cyber-border/40 rounded-xl hover:border-cyber-green/30 hover:bg-cyber-green/5 transition-colors text-left">
                      <div>
                        <p className="text-sm font-medium">{a.tipoSeguro} — {a.seguradora}</p>
                        <p className="text-xs text-cyber-muted">{a.numero} · Vence {a.fimVigencia}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.status} type="apolice" />
                        <FileText size={14} className="text-cyber-muted" />
                      </div>
                    </button>
                  ))
                }
              </div>
            )}

            {activeTab === 'propostas' && (
              <div className="space-y-2">
                {propostasCliente.length === 0 ? <EmptyState icon={<ClipboardList size={24} />} title="Sem propostas" description="Nenhuma proposta vinculada." /> :
                  propostasCliente.map(p => (
                    <button key={p.id} onClick={() => navigate(`/propostas?focus=${p.id}`)}
                      className="w-full flex items-center justify-between p-3 border border-cyber-border/40 rounded-xl hover:border-cyber-purple/30 hover:bg-cyber-purple/5 transition-colors text-left">
                      <div>
                        <p className="text-sm font-medium">{p.numero || p.tipoSeguro} — {p.tipoSeguro}</p>
                        <p className="text-xs text-cyber-muted">Solicitado em {p.dataSolicitacao}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} type="proposta" />
                        <ClipboardList size={14} className="text-cyber-muted" />
                      </div>
                    </button>
                  ))
                }
              </div>
            )}

            {activeTab === 'sinistros' && (
              <div className="space-y-2">
                {sinistrosCliente.length === 0 ? <EmptyState icon={<AlertTriangle size={24} />} title="Sem sinistros" description="Nenhum sinistro registrado." /> :
                  sinistrosCliente.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 border border-cyber-border/40 rounded-xl">
                      <div>
                        <p className="text-sm font-medium">{s.tipoSinistro}</p>
                        <p className="text-xs text-cyber-muted">{s.numero} · {s.dataOcorrido}</p>
                      </div>
                      <StatusBadge status={s.status} type="sinistro" />
                    </div>
                  ))
                }
              </div>
            )}

            {activeTab === 'documentos' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button icon={<Plus size={14} />} onClick={() => { setDocForm({ tipo: 'CPF', nome: '', observacoes: '', dataUrl: '', fileType: '', fileSize: 0 }); setShowDocModal(true) }}>
                    Novo Documento
                  </Button>
                </div>
                {documentosCliente.length === 0 ? (
                  <EmptyState icon={<Paperclip size={24} />} title="Sem documentos" description="Nenhum documento vinculado a este cliente." />
                ) : (
                  <>
                    <div className="flex gap-3 text-xs text-cyber-muted mb-1">
                      <span>{documentosCliente.length} documento{documentosCliente.length !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span className="text-cyber-green">{documentosCliente.filter(d => d.status === 'aprovado').length} aprovados</span>
                      {documentosCliente.filter(d => d.status === 'pendente').length > 0 && (
                        <><span>·</span><span className="text-cyber-amber">{documentosCliente.filter(d => d.status === 'pendente').length} pendentes</span></>
                      )}
                    </div>
                    {documentosCliente.map(d => (
                      <div key={d.id} className="flex items-start gap-3 p-3 border border-cyber-border/40 rounded-xl hover:border-cyber-cyan/20 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-cyber-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Paperclip size={15} className="text-cyber-cyan" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-cyber-text truncate">{d.nome}</p>
                          <p className="text-xs text-cyber-muted">{d.tipo} · {d.apolice}</p>
                          {d.dataEnvio && <p className="text-xs text-cyber-muted mt-0.5">Enviado em {d.dataEnvio}</p>}
                          {d.observacoes && <p className="text-xs text-cyber-amber mt-1">{d.observacoes}</p>}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          {d.status === 'aprovado' && <span className="flex items-center gap-1 text-xs text-cyber-green font-medium"><CheckCircle size={12} /> Aprovado</span>}
                          {d.status === 'pendente' && <span className="flex items-center gap-1 text-xs text-cyber-amber font-medium"><Clock size={12} /> Pendente</span>}
                          {d.status === 'enviado' && <span className="flex items-center gap-1 text-xs text-cyber-cyan font-medium"><FileText size={12} /> Enviado</span>}
                          {d.status === 'rejeitado' && <span className="flex items-center gap-1 text-xs text-cyber-red font-medium"><XCircle size={12} /> Rejeitado</span>}
                          <div className="flex gap-1 mt-1">
                            {d.dataUrl && (d.fileType?.startsWith('image/') || d.fileType === 'application/pdf') && (
                              <button onClick={() => setPreviewDocCliente(d)} title="Visualizar" className="p-1 rounded-md text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors">
                                <Eye size={13} />
                              </button>
                            )}
                            {d.dataUrl && (
                              <button onClick={() => downloadDocumento(d)} title="Baixar" className="p-1 rounded-md text-cyber-muted hover:bg-cyber-surface transition-colors">
                                <Download size={13} />
                              </button>
                            )}
                            {['pendente', 'enviado'].includes(d.status) && (
                              <>
                                <button onClick={() => aprovarDocumento(d)} title="Aprovar" className="p-1 rounded-md text-cyber-green hover:bg-cyber-green/10 transition-colors">
                                  <ThumbsUp size={13} />
                                </button>
                                <button onClick={() => rejeitarDocumento(d)} title="Rejeitar" className="p-1 rounded-md text-cyber-red hover:bg-cyber-red/10 transition-colors">
                                  <ThumbsDown size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
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

