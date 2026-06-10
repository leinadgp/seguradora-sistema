import { useState } from 'react'
import { input as inputCls } from '../lib/styles'
import { Settings, Save, Building2, Bell, Users, CreditCard, Tag } from 'lucide-react'
import Button from '../components/ui/Button'
import { useApp } from '../context/AppContext'

const ABAS = [
  { key: 'corretora', label: 'Dados da Corretora', icon: <Building2 size={16} /> },

  { key: 'financeiro', label: 'Financeiro', icon: <CreditCard size={16} /> },
  { key: 'origens', label: 'Origens de Lead', icon: <Tag size={16} /> },
  { key: 'acesso', label: 'Perfis de Acesso', icon: <Users size={16} /> },
  { key: 'notificacoes', label: 'Notificações', icon: <Bell size={16} /> },
]



export default function Configuracoes() {
  const { showToast } = useApp()
  const [aba, setAba] = useState('corretora')

  const [corretora, setCorretora] = useState({
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
  })

  const [notif, setNotif] = useState({
    renovacoes30d: true,
    renovacoes15d: true,
    renovacoes7d: true,
    tarefasAtrasadas: true,
    sinistrosAbertos: true,
    comissoesPrevistas: true,
    propostaSemRetorno: true,
    emailDiario: false,
    whatsappAlertas: false,
  })

  const origens = ['Site', 'Indicação', 'Redes Sociais', 'WhatsApp', 'Prospecção', 'Facebook Ads', 'Google Ads', 'Ligação ativa', 'Parceria', 'Evento']
  const formasPagamento = ['Débito automático', 'Cartão de crédito', 'Boleto', 'PIX']
  const perfis = [
    { nome: 'Administrador', desc: 'Acesso total ao sistema', cor: 'bg-cyber-purple/10 text-cyber-purple' },
    { nome: 'Gestor', desc: 'Visualiza tudo, edita clientes e apólices', cor: 'bg-cyber-cyan/10 text-cyber-cyan' },
    { nome: 'Corretor', desc: 'Acessa clientes, apólices e tarefas próprias', cor: 'bg-cyber-green/10 text-cyber-green' },
    { nome: 'Financeiro', desc: 'Acessa comissões e relatórios financeiros', cor: 'bg-cyber-amber/10 text-cyber-amber' },
    { nome: 'Atendimento', desc: 'Acessa clientes e tarefas', cor: 'bg-cyber-surface text-cyber-muted' },
  ]

  function salvar() { showToast('Configurações salvas com sucesso!') }

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
              <h3 className="font-semibold text-cyber-text mb-3">Comissão padrão</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[['Auto', '15'], ['Residencial', '14'], ['Empresarial', '16'], ['Vida', '12'], ['Saúde', '12'], ['Frota', '13']].map(([t, v]) => (
                  <div key={t}>
                    <label className="hud-label mb-1">{t} (%)</label>
                    <input type="number" defaultValue={v} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === 'origens' && (
          <div>
            <h3 className="font-semibold text-cyber-text mb-4">Origens de Lead</h3>
            <div className="space-y-2">
              {origens.map(o => (
                <div key={o} className="flex items-center justify-between p-3 border border-cyber-border/40 rounded-xl hover:bg-slate-100">
                  <span className="text-sm text-cyber-text/80">{o}</span>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-6 bg-cyber-border/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:bg-cyber-cyan after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-card after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === 'acesso' && (
          <div>
            <h3 className="font-semibold text-cyber-text mb-4">Perfis de Acesso</h3>
            <div className="space-y-3">
              {perfis.map(p => (
                <div key={p.nome} className="flex items-center justify-between p-4 border border-cyber-border/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.cor}`}>{p.nome}</span>
                    <p className="text-sm text-cyber-muted">{p.desc}</p>
                  </div>
                  <button className="text-sm text-cyber-cyan hover:underline">Editar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === 'notificacoes' && (
          <div>
            <h3 className="font-semibold text-cyber-text mb-4">Configurações de Notificações</h3>
            <div className="space-y-3">
              {[
                ['renovacoes30d', 'Alertar renovações em 30 dias'],
                ['renovacoes15d', 'Alertar renovações em 15 dias'],
                ['renovacoes7d', 'Alertar renovações em 7 dias'],
                ['tarefasAtrasadas', 'Notificar tarefas atrasadas'],
                ['sinistrosAbertos', 'Notificar sinistros em aberto'],
                ['comissoesPrevistas', 'Alertar comissões previstas'],
                ['propostaSemRetorno', 'Alertar proposta sem retorno há 3+ dias'],
                ['emailDiario', 'Enviar resumo diário por e-mail'],
                ['whatsappAlertas', 'Enviar alertas urgentes via WhatsApp'],
              ].map(([k, l]) => (
                <div key={k} className="flex items-center justify-between p-3 border border-cyber-border/40 rounded-xl hover:bg-slate-100">
                  <span className="text-sm text-cyber-text/80">{l}</span>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" checked={notif[k]} onChange={e => setNotif(n => ({ ...n, [k]: e.target.checked }))} className="sr-only peer" />
                    <div className="w-10 h-6 bg-cyber-border/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:bg-cyber-cyan after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-card after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-cyber-border/40">
          <Button icon={<Save size={14} />} onClick={salvar}>Salvar Configurações</Button>
        </div>
      </div>
    </div>
  )
}
