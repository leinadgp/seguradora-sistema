import { useState, useEffect } from 'react'
import { input as inputCls } from '../lib/styles'
import {
  Save, Building2, Bell, Users, CreditCard, Tag,
  Plus, Search, Edit2, KeyRound, Eye, EyeOff, ShieldCheck, UserX, UserCheck,
  MessageSquare, CheckCircle, AlertCircle,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import useResource from '../hooks/useResource'
import { validarEmail } from '../lib/validators'
import api from '../api/client'

// ─── Perfis ────────────────────────────────────────────────────────────────
const perfisLabel = { admin: 'Administrador', gestor: 'Gestor', corretor: 'Corretor', financeiro: 'Financeiro', atendimento: 'Atendimento' }
const perfilColor = { admin: 'bg-cyber-purple/10 text-cyber-purple', gestor: 'bg-cyber-cyan/10 text-cyber-cyan', corretor: 'bg-cyber-green/10 text-cyber-green', financeiro: 'bg-cyber-amber/10 text-cyber-amber', atendimento: 'bg-cyber-surface text-cyber-muted' }
const perfisOpcoes = ['admin', 'gestor', 'corretor', 'financeiro', 'atendimento']
const emptyUserForm = { nome: '', email: '', telefone: '', cargo: '', perfil: 'corretor', status: 'ativo', metaMensal: '' }

// ─── Defaults ──────────────────────────────────────────────────────────────
const DEFAULT_CORRETORA = {
  nome: 'SeguroControl Corretora de Seguros LTDA',
  cnpj: '12.345.678/0001-99',
  susep: '10123456789',
  email: 'contato@segurocontrol.com.br',
  telefone: '(11) 3000-0001',
  whatsapp: '(11) 99000-0001',
  site: 'www.segurocontrol.com.br',
  cep: '01310-100',
  rua: 'Av. Paulista',
  numero: '1200',
  complemento: '8º andar',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
}

const DEFAULT_NOTIF = {
  renovacoes30d: true,
  renovacoes15d: true,
  renovacoes7d: true,
  tarefasAtrasadas: true,
  sinistrosAbertos: true,
  comissoesPrevistas: true,
  propostaSemRetorno: true,
  emailDiario: false,
  whatsappAlertas: false,
}

const DEFAULT_COMISSOES = {
  auto: 15, residencial: 14, empresarial: 16,
  vida: 12, saude: 12, frota: 13,
  rural: 10, rc: 14, viagem: 10,
  consorcio: 1.5, // fixo manual seção 4
}

export default function Configuracoes() {
  const { showToast } = useApp()
  const { user: authUser } = useAuth()
  const { data: configs, create: createConfig, update: updateConfig } = useResource('configuracoes')
  const { data: usuarios, create: createUser, update: updateUser } = useResource('usuarios')

  const canManageUsers = authUser?.perfil === 'admin' || authUser?.perfil === 'gestor'

  const ABAS = [
    { key: 'corretora',     label: 'Dados da Corretora', icon: <Building2 size={16} /> },
    { key: 'financeiro',    label: 'Financeiro',          icon: <CreditCard size={16} /> },
    { key: 'origens',       label: 'Origens de Lead',     icon: <Tag size={16} /> },
    ...(canManageUsers ? [{ key: 'acesso', label: 'Perfis de Acesso', icon: <Users size={16} /> }] : []),
    { key: 'notificacoes',  label: 'Notificações',        icon: <Bell size={16} /> },
    { key: 'whatsapp',      label: 'WhatsApp / UAZAPI',   icon: <MessageSquare size={16} /> },
  ]

  const [aba, setAba] = useState('corretora')
  const [corretora, setCorretora] = useState(DEFAULT_CORRETORA)
  const [notif, setNotif] = useState(DEFAULT_NOTIF)
  const [comissoes, setComissoes] = useState(DEFAULT_COMISSOES)
  const [uazapi, setUazapi] = useState({ instanceName: '', baseUrl: '', token: '', owner: '' })
  const [uazapiTestando, setUazapiTestando] = useState(false)
  const [uazapiTestResult, setUazapiTestResult] = useState(null) // null | 'ok' | 'error'

  // ─── Estado gestão de usuários ───────────────────────────────────────────
  const [userSearch, setUserSearch] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginTarget, setLoginTarget] = useState(null)
  const [loginPass, setLoginPass] = useState('')
  const [loginPassVisible, setLoginPassVisible] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    if (configs.length > 0) {
      const cfg = configs.find(c => c.id === 'config') || configs[0]
      if (cfg.corretora) setCorretora(c => ({ ...DEFAULT_CORRETORA, ...cfg.corretora }))
      if (cfg.notif) setNotif(n => ({ ...DEFAULT_NOTIF, ...cfg.notif }))
      if (cfg.comissoes) setComissoes(c => ({ ...DEFAULT_COMISSOES, ...cfg.comissoes }))
      const uazapiCfg = configs.find(c => c.id === 'uazapi')
      if (uazapiCfg) setUazapi(u => ({ ...u, ...uazapiCfg }))
    }
  }, [configs.length])

  useEffect(() => {
    if (aba === 'acesso' && !canManageUsers) setAba('corretora')
  }, [aba, canManageUsers])

  // ─── Dados auxiliares ────────────────────────────────────────────────────
  const origens = ['Site', 'Indicação', 'Redes Sociais', 'WhatsApp', 'Prospecção', 'Facebook Ads', 'Google Ads', 'Ligação ativa', 'Parceria', 'Evento']
  const formasPagamento = ['Débito automático', 'Cartão de crédito', 'Boleto', 'PIX']

  const usuariosFiltrados = usuarios.filter(u =>
    !userSearch ||
    u.nome?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  // ─── Handlers usuários ───────────────────────────────────────────────────
  function openNewUser() {
    setUserForm(emptyUserForm)
    setIsEditingUser(false)
    setSelectedUser(null)
    setShowUserModal(true)
  }

  function openEditUser(u) {
    setUserForm({
      nome: u.nome || '', email: u.email || '', telefone: u.telefone || '',
      cargo: u.cargo || '', perfil: u.perfil || 'corretor',
      status: u.status || 'ativo', metaMensal: u.metaMensal || '',
    })
    setIsEditingUser(true)
    setSelectedUser(u)
    setShowUserModal(true)
  }

  async function handleSaveUser() {
    if (!userForm.nome || !userForm.email) { showToast('Preencha nome e e-mail.', 'error'); return }
    if (!validarEmail(userForm.email)) { showToast('E-mail inválido.', 'error'); return }
    try {
      if (isEditingUser) {
        await updateUser(selectedUser.id, { ...selectedUser, ...userForm })
        showToast('Usuário atualizado!')
      } else {
        await createUser({
          ...userForm,
          id: Date.now().toString(),
          comissaoGerada: 0,
          leadsAtribuidos: 0,
          propostasAbertas: 0,
          avatar: userForm.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          loginAtivo: false,
        })
        showToast('Usuário cadastrado!')
      }
      setShowUserModal(false)
    } catch {
      showToast('Erro ao salvar usuário.', 'error')
    }
  }

  async function handleToggleStatus(u) {
    if (u.email?.toLowerCase() === authUser?.email?.toLowerCase() && u.status === 'ativo') {
      showToast('Você não pode desativar sua própria conta.', 'error'); return
    }
    const newStatus = u.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await updateUser(u.id, { ...u, status: newStatus })
      showToast(`Usuário ${newStatus === 'ativo' ? 'reativado' : 'desativado'}.`)
    } catch {
      showToast('Erro ao alterar status.', 'error')
    }
  }

  async function handleAtivarLogin() {
    if (!loginPass || loginPass.length < 6) { showToast('Senha deve ter no mínimo 6 caracteres.', 'error'); return }
    setLoginLoading(true)
    try {
      await api.post('auth/admin/create-user', { email: loginTarget.email, password: loginPass, nome: loginTarget.nome })
      await updateUser(loginTarget.id, { ...loginTarget, loginAtivo: true })
      showToast(`Acesso ${loginTarget.loginAtivo ? 'atualizado' : 'ativado'} para ${loginTarget.nome}!`)
      setShowLoginModal(false)
    } catch (err) {
      showToast(err.message || 'Erro ao configurar acesso.', 'error')
    } finally {
      setLoginLoading(false)
    }
  }

  // ─── Salvar configurações ────────────────────────────────────────────────
  async function salvar() {
    if (aba === 'whatsapp') {
      try {
        const existing = configs.find(c => c.id === 'uazapi')
        const payload = { id: 'uazapi', ...uazapi }
        if (existing) {
          await updateConfig('uazapi', payload)
        } else {
          await createConfig(payload)
        }
        showToast('Configuração UAZAPI salva com sucesso!')
      } catch {
        showToast('Erro ao salvar configuração UAZAPI.', 'error')
      }
      return
    }
    const payload = { id: 'config', corretora, notif, comissoes }
    try {
      const existing = configs.find(c => c.id === 'config')
      if (existing) {
        await updateConfig('config', payload)
      } else {
        await createConfig(payload)
      }
      showToast('Configurações salvas com sucesso!')
    } catch {
      showToast('Erro ao salvar configurações.', 'error')
    }
  }

  async function testarUazapi() {
    if (!uazapi.baseUrl || !uazapi.token) {
      showToast('Informe o BaseUrl e Token antes de testar.', 'error')
      return
    }
    setUazapiTestando(true)
    setUazapiTestResult(null)
    try {
      // Testa chamando o endpoint de contatos da UAZAPI
      const res = await fetch(`${uazapi.baseUrl}/contacts`, {
        method: 'GET',
        headers: { 'token': uazapi.token },
      })
      setUazapiTestResult(res.ok ? 'ok' : 'error')
    } catch {
      setUazapiTestResult('error')
    } finally {
      setUazapiTestando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Abas */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-cyber-card rounded-2xl p-1 shadow-card border border-cyber-border/40">
        {ABAS.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${aba === a.key ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30' : 'text-cyber-muted hover:text-cyber-text hover:bg-slate-100'}`}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <div className="bg-cyber-card rounded-2xl p-5 shadow-card border border-cyber-border/40">

        {/* ── Dados da Corretora ─────────────────────────────────────────── */}
        {aba === 'corretora' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-cyber-text">Dados da Corretora</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['Nome / Razão social', 'nome'], ['CNPJ', 'cnpj'], ['Código SUSEP', 'susep'], ['E-mail', 'email'], ['Telefone', 'telefone'], ['WhatsApp', 'whatsapp'], ['Site', 'site']].map(([l, k]) => (
                <div key={k}><label className="hud-label mb-1">{l}</label><input value={corretora[k]} onChange={e => setCorretora(p => ({ ...p, [k]: e.target.value }))} className={inputCls} /></div>
              ))}
            </div>
            <div>
              <p className="hud-label mb-3">Endereço</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[['CEP', 'cep'], ['Rua', 'rua'], ['Número', 'numero'], ['Complemento', 'complemento'], ['Bairro', 'bairro'], ['Cidade', 'cidade'], ['Estado', 'estado']].map(([l, k]) => (
                  <div key={k}><label className="hud-label mb-1">{l}</label><input value={corretora[k]} onChange={e => setCorretora(p => ({ ...p, [k]: e.target.value }))} className={inputCls} /></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Financeiro ────────────────────────────────────────────────── */}
        {aba === 'financeiro' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-cyber-text mb-3">Formas de Pagamento</h3>
              <div className="flex flex-col gap-2">
                {formasPagamento.map(fp => (
                  <label key={fp} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-sm text-cyber-text/80">
                    <input type="checkbox" defaultChecked className="rounded text-cyber-cyan" />
                    {fp}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-cyber-text mb-1">Comissão padrão por tipo</h3>
              <p className="text-xs text-cyber-muted mb-3">Usada como fallback quando a seguradora não tem comissão média configurada.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[['auto','Auto'], ['residencial','Residencial'], ['empresarial','Empresarial'], ['vida','Vida'], ['saude','Saúde'], ['frota','Frota'], ['rural','Rural'], ['rc','Resp. Civil'], ['viagem','Viagem'], ['consorcio','Consórcio']].map(([k, l]) => (
                  <div key={k}>
                    <label className="hud-label mb-1">{l} (%)</label>
                    <input type="number" step="0.1" value={comissoes[k] ?? ''} onChange={e => setComissoes(c => ({ ...c, [k]: Number(e.target.value) }))} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Origens de Lead ───────────────────────────────────────────── */}
        {aba === 'origens' && (
          <div>
            <h3 className="font-semibold text-cyber-text mb-4">Origens de Lead</h3>
            <div className="space-y-2">
              {origens.map(o => (
                <div key={o} className="flex items-center justify-between p-3 border border-cyber-border/40 rounded-xl hover:bg-slate-100">
                  <span className="text-sm text-cyber-text/80">{o}</span>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-6 bg-cyber-border/60 rounded-full peer peer-checked:after:translate-x-4 peer-checked:bg-cyber-cyan after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-card after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Perfis de Acesso — Gestão de Usuários ─────────────────────── */}
        {aba === 'acesso' && canManageUsers && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-cyber-text">Usuários do Sistema</h3>
                <p className="text-xs text-cyber-muted mt-0.5">
                  {usuariosFiltrados.length} usuário{usuariosFiltrados.length !== 1 ? 's' : ''} cadastrado{usuariosFiltrados.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={openNewUser} icon={<Plus size={14} />}>Novo Usuário</Button>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-surface"
              />
            </div>

            <div className="space-y-2">
              {usuariosFiltrados.map(u => (
                <div key={u.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${u.status === 'inativo' ? 'opacity-60 border-cyber-border/30 bg-slate-50/50' : 'border-cyber-border/40 hover:bg-slate-50'}`}>
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {u.avatar || u.nome?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-cyber-text truncate">{u.nome}</p>
                      {u.loginAtivo && <ShieldCheck size={12} className="text-cyber-green shrink-0" title="Acesso ao sistema ativo" />}
                    </div>
                    <p className="text-xs text-cyber-muted truncate">{u.email}{u.cargo ? ` · ${u.cargo}` : ''}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${perfilColor[u.perfil]}`}>{perfisLabel[u.perfil]}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${u.status === 'ativo' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditUser(u)}
                      className="p-1.5 text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg transition-colors"
                      title="Editar usuário"
                    ><Edit2 size={13} /></button>
                    <button
                      onClick={() => { setLoginTarget(u); setLoginPass(''); setLoginPassVisible(false); setShowLoginModal(true) }}
                      className={`p-1.5 rounded-lg transition-colors ${u.loginAtivo ? 'text-cyber-green hover:bg-green-50' : 'text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10'}`}
                      title={u.loginAtivo ? 'Redefinir senha de acesso' : 'Ativar acesso ao sistema'}
                    ><KeyRound size={13} /></button>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`p-1.5 rounded-lg transition-colors ${u.status === 'ativo' ? 'text-cyber-amber hover:bg-amber-50' : 'text-cyber-green hover:bg-green-50'}`}
                      title={u.status === 'ativo' ? 'Desativar usuário' : 'Reativar usuário'}
                    >
                      {u.status === 'ativo' ? <UserX size={13} /> : <UserCheck size={13} />}
                    </button>
                  </div>
                </div>
              ))}
              {usuariosFiltrados.length === 0 && (
                <p className="text-sm text-cyber-muted text-center py-8">Nenhum usuário encontrado.</p>
              )}
            </div>

            {/* Legenda de perfis */}
            <div className="pt-3 border-t border-cyber-border/40">
              <p className="hud-label mb-3">Níveis de Acesso</p>
              <div className="space-y-1.5">
                {[
                  { perfil: 'admin',      desc: 'Acesso total ao sistema, gestão de usuários e configurações' },
                  { perfil: 'gestor',     desc: 'Visualiza tudo, edita clientes e apólices, gerencia equipe' },
                  { perfil: 'corretor',   desc: 'Acessa clientes, cotações, propostas, apólices e tarefas próprias' },
                  { perfil: 'financeiro', desc: 'Acessa comissões, sinistros e relatórios financeiros' },
                  { perfil: 'atendimento',desc: 'Acessa clientes, tarefas e assistências' },
                ].map(p => (
                  <div key={p.perfil} className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${perfilColor[p.perfil]}`}>{perfisLabel[p.perfil]}</span>
                    <p className="text-xs text-cyber-muted">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Notificações ──────────────────────────────────────────────── */}
        {aba === 'notificacoes' && (
          <div>
            <h3 className="font-semibold text-cyber-text mb-4">Configurações de Notificações</h3>
            <div className="space-y-3">
              {[
                ['renovacoes30d',     'Alertar renovações em 30 dias'],
                ['renovacoes15d',     'Alertar renovações em 15 dias'],
                ['renovacoes7d',      'Alertar renovações em 7 dias'],
                ['tarefasAtrasadas',  'Notificar tarefas atrasadas'],
                ['sinistrosAbertos',  'Notificar sinistros em aberto'],
                ['comissoesPrevistas','Alertar comissões previstas'],
                ['propostaSemRetorno','Alertar proposta sem retorno há 3+ dias'],
                ['emailDiario',       'Enviar resumo diário por e-mail'],
                ['whatsappAlertas',   'Enviar alertas urgentes via WhatsApp'],
              ].map(([k, l]) => (
                <div key={k} className="flex items-center justify-between p-3 border border-cyber-border/40 rounded-xl hover:bg-slate-100">
                  <span className="text-sm text-cyber-text/80">{l}</span>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" checked={notif[k]} onChange={e => setNotif(n => ({ ...n, [k]: e.target.checked }))} className="sr-only peer" />
                    <div className="w-10 h-6 bg-cyber-border/60 rounded-full peer peer-checked:after:translate-x-4 peer-checked:bg-cyber-cyan after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-card after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WhatsApp / UAZAPI ─────────────────────────────────────────── */}
        {aba === 'whatsapp' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-cyber-text">Integração WhatsApp — UAZAPI</h3>
              <p className="text-xs text-cyber-muted mt-0.5">
                Configure a instância UAZAPI para receber e enviar mensagens pelo WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="hud-label mb-1">Instance Name</label>
                <input
                  value={uazapi.instanceName}
                  onChange={e => setUazapi(u => ({ ...u, instanceName: e.target.value }))}
                  placeholder="Ex: Felipe"
                  className={inputCls}
                />
                <p className="text-[10px] text-cyber-muted mt-0.5">Nome da instância no painel UAZAPI</p>
              </div>
              <div>
                <label className="hud-label mb-1">Owner (número do dono)</label>
                <input
                  value={uazapi.owner}
                  onChange={e => setUazapi(u => ({ ...u, owner: e.target.value }))}
                  placeholder="Ex: 555183437876"
                  className={inputCls}
                />
                <p className="text-[10px] text-cyber-muted mt-0.5">Número do WhatsApp conectado (só números)</p>
              </div>
              <div className="sm:col-span-2">
                <label className="hud-label mb-1">Base URL da API</label>
                <input
                  value={uazapi.baseUrl}
                  onChange={e => setUazapi(u => ({ ...u, baseUrl: e.target.value }))}
                  placeholder="Ex: https://sua-instancia.uazapi.com"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="hud-label mb-1">Token de autenticação</label>
                <input
                  value={uazapi.token}
                  onChange={e => setUazapi(u => ({ ...u, token: e.target.value }))}
                  placeholder="Ex: b9847777-39bb-47a8-81f8-b75f6c71ac0e"
                  className={inputCls}
                />
              </div>
            </div>

            {/* URL do webhook */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs font-medium text-cyber-text mb-1">URL do Webhook (configure na UAZAPI)</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-cyber-cyan bg-cyber-cyan/5 px-2 py-1 rounded flex-1 overflow-x-auto">
                  {window.location.origin}/api/webhook/uazapi
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/webhook/uazapi`); showToast('URL copiada!') }}
                  className="text-xs text-cyber-cyan border border-cyber-cyan/30 px-2 py-1 rounded hover:bg-cyber-cyan/10 transition-colors cursor-pointer"
                >
                  Copiar
                </button>
              </div>
              <p className="text-[10px] text-cyber-muted mt-1.5">
                Em desenvolvimento local: use <strong>ngrok</strong> para expor a porta 3001 e configure a URL pública do ngrok + /api/webhook/uazapi
              </p>
            </div>

            {/* Testar conexão */}
            <div className="flex items-center gap-3">
              <button
                onClick={testarUazapi}
                disabled={uazapiTestando}
                className="flex items-center gap-2 text-sm px-4 py-2 border border-cyber-cyan/30 text-cyber-cyan rounded-xl hover:bg-cyber-cyan/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {uazapiTestando ? (
                  <span className="w-4 h-4 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageSquare size={14} />
                )}
                {uazapiTestando ? 'Testando...' : 'Testar conexão'}
              </button>
              {uazapiTestResult === 'ok' && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle size={13} /> Conectado com sucesso!
                </span>
              )}
              {uazapiTestResult === 'error' && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <AlertCircle size={13} /> Falha na conexão. Verifique URL e Token.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Botão salvar (somente nas abas de configuração, não na de usuários) */}
        {aba !== 'acesso' && (
          <div className="flex justify-end mt-6 pt-4 border-t border-cyber-border/40">
            <Button icon={<Save size={14} />} onClick={salvar}>Salvar Configurações</Button>
          </div>
        )}
      </div>

      {/* ─── Modal: Criar / Editar Usuário ─────────────────────────────────── */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={isEditingUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowUserModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveUser}>{isEditingUser ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="hud-label mb-1">Nome *</label>
            <input value={userForm.nome} onChange={e => setUserForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="hud-label mb-1">E-mail *</label>
            <input
              type="email"
              value={userForm.email}
              onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
              disabled={isEditingUser}
              className={`${inputCls} ${isEditingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {isEditingUser && <p className="text-xs text-cyber-muted mt-1">O e-mail não pode ser alterado.</p>}
          </div>
          <div>
            <label className="hud-label mb-1">Telefone</label>
            <input value={userForm.telefone} onChange={e => setUserForm(f => ({ ...f, telefone: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="hud-label mb-1">Cargo</label>
            <input value={userForm.cargo} onChange={e => setUserForm(f => ({ ...f, cargo: e.target.value }))} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="hud-label mb-1">Perfil</label>
              <select value={userForm.perfil} onChange={e => setUserForm(f => ({ ...f, perfil: e.target.value }))} className={inputCls}>
                {perfisOpcoes.map(p => <option key={p} value={p}>{perfisLabel[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="hud-label mb-1">Status</label>
              <select value={userForm.status} onChange={e => setUserForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="hud-label mb-1">Meta mensal (R$)</label>
            <input type="number" value={userForm.metaMensal} onChange={e => setUserForm(f => ({ ...f, metaMensal: e.target.value }))} className={inputCls} />
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Ativar / Redefinir Login ────────────────────────────────── */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title={loginTarget?.loginAtivo ? 'Redefinir senha de acesso' : 'Ativar acesso ao sistema'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowLoginModal(false)}>Cancelar</Button>
            <Button onClick={handleAtivarLogin} disabled={loginLoading}>
              {loginLoading ? 'Salvando...' : loginTarget?.loginAtivo ? 'Redefinir senha' : 'Ativar acesso'}
            </Button>
          </div>
        }
      >
        {loginTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-cyber-surface/50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {loginTarget.avatar || loginTarget.nome?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-cyber-text text-sm">{loginTarget.nome}</p>
                <p className="text-xs text-cyber-muted">{loginTarget.email}</p>
              </div>
            </div>
            <div>
              <label className="hud-label mb-1">{loginTarget.loginAtivo ? 'Nova senha' : 'Definir senha'} *</label>
              <div className="relative">
                <input
                  type={loginPassVisible ? 'text' : 'password'}
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`${inputCls} pr-10`}
                  onKeyDown={e => e.key === 'Enter' && handleAtivarLogin()}
                />
                <button type="button" onClick={() => setLoginPassVisible(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-text">
                  {loginPassVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {!loginTarget.loginAtivo && (
              <p className="text-xs text-cyber-muted">
                O usuário poderá acessar o sistema com o e-mail{' '}
                <strong className="text-cyber-text">{loginTarget.email}</strong> e esta senha.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
