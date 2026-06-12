import { ExternalLink, User, Phone, Mail, Tag, FileText, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="hud-label px-4 mb-2">{title}</p>
      <div className="px-4 space-y-1.5">{children}</div>
    </div>
  )
}

function Field({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon size={12} className="text-cyber-muted shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-cyber-muted">{label}</p>
        <p className="text-xs text-cyber-text break-words">{value}</p>
      </div>
    </div>
  )
}

export default function ContactPanel({ conversa, clientes, leads }) {
  const navigate = useNavigate()

  if (!conversa) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <User size={32} className="text-cyber-muted mb-2" />
        <p className="text-xs text-cyber-muted">Selecione uma conversa para ver os dados do contato</p>
      </div>
    )
  }

  const cliente = conversa.clienteId ? clientes.find(c => c.id === conversa.clienteId) : null
  const lead = conversa.leadId ? leads.find(l => l.id === conversa.leadId) : null

  const tags = conversa.lead_tags || []

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Avatar e nome */}
      <div className="px-4 py-4 border-b border-cyber-cyan/10 text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold"
          style={{ background: conversa.isGroup ? 'linear-gradient(135deg, #7c3aed, #a21caf)' : 'linear-gradient(135deg, #0891b2, #2563eb)' }}>
          {conversa.isGroup
            ? <Users size={22} />
            : (conversa.name || conversa.phone || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
          }
        </div>
        <p className="text-sm font-semibold text-cyber-text">
          {conversa.isGroup ? conversa.groupName || conversa.name : conversa.name || conversa.phone}
        </p>
        <p className="text-xs text-cyber-muted">{conversa.phone}</p>
        {conversa.isGroup && (
          <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mt-1 inline-block">Grupo</span>
        )}
      </div>

      {/* Cliente vinculado */}
      {cliente && (
        <Section title="Cliente Vinculado">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                {cliente.tipo || 'PF'}
              </span>
              <p className="text-xs font-medium text-cyber-text">{cliente.nome}</p>
            </div>
            <button
              onClick={() => navigate('/clientes')}
              title="Ver cliente"
              className="p-1 hover:text-cyber-cyan transition-colors cursor-pointer"
            >
              <ExternalLink size={11} className="text-cyber-muted" />
            </button>
          </div>
          <Field icon={Mail} label="E-mail" value={cliente.email} />
          <Field icon={Phone} label="Telefone" value={cliente.telefone} />
          <Field icon={FileText} label="CPF/CNPJ" value={cliente.cpf || cliente.cnpj} />
          {cliente.responsavel && (
            <Field icon={User} label="Responsável" value={cliente.responsavel} />
          )}
        </Section>
      )}

      {/* Lead vinculado */}
      {lead && !cliente && (
        <Section title="Lead Vinculado">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-cyber-text">{lead.nome}</p>
            <button
              onClick={() => navigate('/leads')}
              title="Ver lead"
              className="p-1 hover:text-cyber-cyan transition-colors cursor-pointer"
            >
              <ExternalLink size={11} className="text-cyber-muted" />
            </button>
          </div>
          <Field icon={Mail} label="E-mail" value={lead.email} />
          <Field icon={Phone} label="Telefone" value={lead.telefone || lead.whatsapp} />
          {lead.responsavel && (
            <Field icon={User} label="Responsável" value={lead.responsavel} />
          )}
        </Section>
      )}

      {/* Dados do UAZAPI Lead */}
      {(conversa.lead_name || conversa.lead_email || conversa.lead_status) && (
        <Section title="Dados do WhatsApp">
          {conversa.lead_name && <Field icon={User} label="Nome" value={conversa.lead_name} />}
          {conversa.lead_email && <Field icon={Mail} label="E-mail" value={conversa.lead_email} />}
          {conversa.lead_status && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-cyber-muted">Status:</span>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{conversa.lead_status}</span>
            </div>
          )}
          {conversa.lead_notes && (
            <div className="mt-1">
              <p className="text-[10px] text-cyber-muted mb-0.5">Notas</p>
              <p className="text-xs text-cyber-text bg-slate-50 rounded p-1.5">{conversa.lead_notes}</p>
            </div>
          )}
        </Section>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <span key={i} className="text-[10px] bg-cyber-cyan/10 text-cyber-cyan px-2 py-0.5 rounded-full border border-cyber-cyan/20 flex items-center gap-1">
                <Tag size={8} />
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Sem vínculo */}
      {!cliente && !lead && !conversa.lead_name && (
        <div className="px-4 py-3">
          <p className="text-[11px] text-cyber-muted text-center">
            Contato não vinculado a cliente ou lead no sistema
          </p>
          <button
            onClick={() => navigate('/leads')}
            className="mt-2 w-full text-xs text-cyber-cyan border border-cyber-cyan/30 rounded-lg py-1.5 hover:bg-cyber-cyan/10 transition-colors cursor-pointer"
          >
            Criar Lead
          </button>
        </div>
      )}
    </div>
  )
}
