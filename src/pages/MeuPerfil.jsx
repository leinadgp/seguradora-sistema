import { useState } from 'react'
import { User, Lock, Save, Eye, EyeOff, ShieldCheck, Mail } from 'lucide-react'
import { input as inputCls } from '../lib/styles'
import Button from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const perfilLabel = { admin: 'Administrador', gestor: 'Gestor', corretor: 'Corretor', financeiro: 'Financeiro', atendimento: 'Atendimento' }
const perfilColor = { admin: 'bg-cyber-purple/10 text-cyber-purple', gestor: 'bg-cyber-cyan/10 text-cyber-cyan', corretor: 'bg-cyber-green/10 text-cyber-green', financeiro: 'bg-cyber-amber/10 text-cyber-amber', atendimento: 'bg-cyber-surface text-cyber-muted' }

function initials(nome) {
  if (!nome) return '?'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function MeuPerfil() {
  const { showToast } = useApp()
  const { user, updateProfile } = useAuth()

  const [form, setForm] = useState({
    nome: user?.nome || '',
    telefone: user?.telefone || '',
    cargo: user?.cargo || '',
  })
  const [saving, setSaving] = useState(false)

  const [passForm, setPassForm] = useState({ current: '', novo: '', confirma: '' })
  const [passVisible, setPassVisible] = useState({ current: false, novo: false, confirma: false })
  const [savingPass, setSavingPass] = useState(false)

  async function handleSavePerfil() {
    if (!form.nome.trim()) { showToast('Nome é obrigatório.', 'error'); return }
    setSaving(true)
    try {
      await updateProfile(form)
      showToast('Perfil atualizado com sucesso!')
    } catch (err) {
      showToast(err.message || 'Erro ao salvar perfil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangeSenha() {
    if (!passForm.current || !passForm.novo || !passForm.confirma) {
      showToast('Preencha todos os campos.', 'error'); return
    }
    if (passForm.novo !== passForm.confirma) {
      showToast('A nova senha e a confirmação não coincidem.', 'error'); return
    }
    if (passForm.novo.length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error'); return
    }
    setSavingPass(true)
    try {
      await api.post('auth/change-password', {
        email: user?.email,
        currentPassword: passForm.current,
        newPassword: passForm.novo,
      })
      showToast('Senha alterada com sucesso!')
      setPassForm({ current: '', novo: '', confirma: '' })
    } catch (err) {
      showToast(err.message || 'Erro ao alterar senha.', 'error')
    } finally {
      setSavingPass(false)
    }
  }

  const avatarInitials = initials(user?.nome || user?.email)

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* Card dados pessoais */}
      <div className="bg-cyber-card rounded-2xl p-6 shadow-card border border-cyber-border/40">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-cyber-border/40">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 glow-cyan"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
            {avatarInitials}
          </div>
          <div>
            <p className="font-bold text-cyber-text text-lg leading-none">{user?.nome || user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-cyber-muted">
              <Mail size={11} />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {user?.perfil && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${perfilColor[user.perfil]}`}>
                  {perfilLabel[user.perfil]}
                </span>
              )}
              {user?.cargo && <span className="text-xs text-cyber-muted">{user.cargo}</span>}
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <User size={14} className="text-cyber-cyan" /> Dados Pessoais
          </h3>
          <div>
            <label className="hud-label mb-1">Nome completo *</label>
            <input
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="hud-label mb-1">E-mail</label>
            <input
              value={user?.email || ''}
              disabled
              className={`${inputCls} opacity-50 cursor-not-allowed`}
            />
            <p className="text-xs text-cyber-muted mt-1">O e-mail de acesso não pode ser alterado aqui.</p>
          </div>
          <div>
            <label className="hud-label mb-1">Telefone</label>
            <input
              value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
              placeholder="(00) 00000-0000"
              className={inputCls}
            />
          </div>
          <div>
            <label className="hud-label mb-1">Cargo</label>
            <input
              value={form.cargo}
              onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-4 border-t border-cyber-border/40">
          <Button icon={<Save size={14} />} onClick={handleSavePerfil} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>

      {/* Card troca de senha */}
      <div className="bg-cyber-card rounded-2xl p-6 shadow-card border border-cyber-border/40">
        <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2 mb-4">
          <Lock size={14} className="text-cyber-cyan" /> Alterar Senha
        </h3>
        <div className="space-y-3">
          {[
            ['current', 'Senha atual'],
            ['novo', 'Nova senha'],
            ['confirma', 'Confirmar nova senha'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="hud-label mb-1">{label}</label>
              <div className="relative">
                <input
                  type={passVisible[key] ? 'text' : 'password'}
                  value={passForm[key]}
                  onChange={e => setPassForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={key === 'novo' ? 'Mínimo 6 caracteres' : ''}
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setPassVisible(v => ({ ...v, [key]: !v[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-text"
                >
                  {passVisible[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-5 pt-4 border-t border-cyber-border/40">
          <Button icon={<Lock size={14} />} onClick={handleChangeSenha} disabled={savingPass}>
            {savingPass ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </div>
      </div>

    </div>
  )
}
