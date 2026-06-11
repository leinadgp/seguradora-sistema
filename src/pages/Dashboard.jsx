import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, FileText, AlertTriangle, CheckSquare, DollarSign,
  Target, RefreshCw, ClipboardList, Bell, ArrowRight,
  TrendingUp, ChevronRight, Activity
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import MetricCard from '../components/ui/MetricCard'
import { StatusBadge } from '../components/ui/Badge'
import useResource from '../hooks/useResource'

function fmtMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2.5 border border-cyber-cyan/20 shadow-neon-cyan">
      <p className="text-xs font-semibold text-cyber-muted mb-1 font-display tracking-wide">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold font-data tabular-nums" style={{ color: p.color }}>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function SectionCard({ title, onNavigate, children }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-display font-bold text-cyber-text tracking-wide uppercase">{title}</h3>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="p-1.5 rounded-lg hover:bg-cyber-cyan/10 transition-colors text-cyber-muted hover:text-cyber-cyan cursor-pointer"
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: clientes } = useResource('clientes')
  const { data: apolices } = useResource('apolices')
  const { data: leads } = useResource('leads')
  const { data: propostas } = useResource('propostas')
  const { data: cotacoes } = useResource('cotacoes')
  const { data: endossos } = useResource('endossos')
  const { data: sinistros } = useResource('sinistros')
  const { data: tarefas } = useResource('tarefas')
  const { data: comissoes } = useResource('comissoes')
  const { data: producaoMensal } = useResource('producaoMensal')
  const { data: alertas } = useResource('alertas')

  const clientesAtivos      = clientes.filter(c => c.status === 'ativo').length
  const leadsAbertos        = leads.filter(l => !['fechado', 'perdido'].includes(l.status)).length
  const apolicesAtivas      = apolices.filter(a => a.status === 'ativa').length
  const apolicesVencendo    = apolices.filter(a => a.diasParaVencer <= 30 && a.status === 'ativa').length
  const propostasAbertas    = propostas.filter(p => !['aprovada', 'recusada', 'perdida', 'convertida'].includes(p.status)).length
  const sinistrosAbertos    = sinistros.filter(s => !['encerrado', 'indenizado'].includes(s.status)).length
  const tarefasAtrasadas    = tarefas.filter(t => t.status === 'atrasada').length
  const comissaoPrevistaMes = comissoes.filter(c => c.status === 'prevista').reduce((acc, c) => acc + c.valor, 0)

  // ── Funil operacional: Cotação → Proposta → Apólice → Endosso ──
  const totalCotacoes        = cotacoes.length
  const cotacoesAprovadas    = cotacoes.filter(c => c.status === 'aprovada' || c.converted_proposal_id).length
  const cotacoesConvertidas  = cotacoes.filter(c => c.converted_proposal_id).length
  const propostasTotal       = propostas.length
  const propostasConvertidas = propostas.filter(p => p.converted_policy_id).length
  const apolicesEmitidas     = apolices.length
  const apolicesVigentes     = apolices.filter(a => a.status === 'ativa').length
  const apolicesComEndosso   = apolices.filter(a => a.temEndosso).length
  const endossosAnalise      = endossos.filter(e => ['em_analise', 'pendente', 'rascunho'].includes(e.status)).length
  const comissaoEmitida      = apolices.reduce((acc, a) => acc + (Number(a.comissaoValor || a.comissao) || 0), 0)
  const comissaoPrevistaFlow = cotacoes.reduce((acc, c) => acc + (Number(c.comissao) || 0), 0)
  const pct = (n, d) => d > 0 ? Math.round((n / d) * 100) : 0
  const funilEtapas = [
    { label: 'Cotações',  valor: totalCotacoes,    cor: 'text-cyber-cyan',   to: '/cotacoes' },
    { label: 'Propostas', valor: propostasTotal,   cor: 'text-cyber-purple', to: '/propostas' },
    { label: 'Apólices',   valor: apolicesEmitidas, cor: 'text-cyber-green',  to: '/apolices' },
    { label: 'Endossos',  valor: endossos.length,  cor: 'text-cyber-amber',  to: '/endossos' },
  ]

  const renovacoesProximas = apolices
    .filter(a => a.diasParaVencer <= 60 && a.status === 'ativa')
    .sort((a, b) => a.diasParaVencer - b.diasParaVencer)

  const tarefasUrgentes = tarefas
    .filter(t => t.status !== 'concluida')
    .sort((a, b) => {
      const order = { atrasada: 0, pendente: 1 }
      return (order[a.status] ?? 2) - (order[b.status] ?? 2)
    })
    .slice(0, 5)

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const anoMesAtual = new Date().toISOString().slice(0, 7)

  const ranking = useMemo(() => {
    function agrupar(lista) {
      const por = {}
      lista.forEach(a => {
        const nome = a.responsavel || 'Sem responsável'
        por[nome] = (por[nome] || 0) + (Number(a.premioBruto || a.premioLiquido || a.premio) || 0)
      })
      return por
    }
    let por = agrupar(apolices.filter(a => (a.dataEmissao || '').startsWith(anoMesAtual)))
    if (!Object.keys(por).length) por = agrupar(apolices)
    const sorted = Object.entries(por)
      .map(([nome, realizado]) => ({
        nome, realizado,
        avatar: nome.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
      }))
      .sort((a, b) => b.realizado - a.realizado)
      .slice(0, 5)
    const max = sorted[0]?.realizado || 1
    return sorted.map(u => ({ ...u, meta: max }))
  }, [apolices, anoMesAtual])

  const rankGrads = [
    'linear-gradient(135deg,#f59e0b,#ec4899)',
    'linear-gradient(135deg,#06b6d4,#8b5cf6)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
    'linear-gradient(135deg,#475569,#334155)',
  ]

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="glass rounded-2xl px-5 py-4 border border-cyber-amber/20"
          style={{ background: 'rgba(245,158,11,0.04)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-cyber-amber shrink-0" />
            <span className="text-xs font-display font-bold text-cyber-amber tracking-wide uppercase">Alertas Críticos</span>
            <span className="ml-auto text-xs text-cyber-amber font-data font-semibold">{alertas.length} itens</span>
          </div>
          <div className="space-y-1.5">
            {alertas.map(alerta => (
              <button
                key={alerta.id}
                onClick={() => navigate(alerta.link)}
                className="w-full flex items-start gap-2.5 text-left hover:bg-cyber-amber/5 rounded-lg px-1.5 py-1 transition-colors cursor-pointer group"
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  alerta.urgencia === 'alta' ? 'bg-cyber-red glow-red' :
                  alerta.urgencia === 'media' ? 'bg-cyber-amber glow-amber' : 'bg-cyber-cyan glow-cyan'
                }`} />
                <span className="text-sm text-cyber-text/80 group-hover:text-cyber-amber transition-colors">{alerta.mensagem}</span>
                <ChevronRight size={13} className="text-cyber-amber/40 ml-auto shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Clientes Ativos"  value={clientesAtivos}   icon={<Users size={17} />}       color="blue"   trend={8}  trendLabel="vs. mês anterior" />
        <MetricCard title="Leads em Aberto"  value={leadsAbertos}     icon={<Target size={17} />}      color="purple" trend={12} trendLabel="vs. mês anterior" />
        <MetricCard title="Apólices Ativas"  value={apolicesAtivas}   icon={<FileText size={17} />}    color="green"  trend={5}  trendLabel="vs. mês anterior" />
        <MetricCard title="Vencem em 30d"    value={apolicesVencendo} icon={<RefreshCw size={17} />}   color="yellow" subtitle="Requerem atenção" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Propostas Abertas" value={propostasAbertas}          icon={<ClipboardList size={17} />} color="orange" />
        <MetricCard title="Comissão Prevista" value={fmtMoeda(comissaoPrevistaMes)} icon={<DollarSign size={17} />}    color="green"  subtitle="Este mês" />
        <MetricCard title="Sinistros Abertos" value={sinistrosAbertos}          icon={<AlertTriangle size={17} />} color="red" />
        <MetricCard title="Tarefas Atrasadas" value={tarefasAtrasadas}          icon={<CheckSquare size={17} />}   color="red"    subtitle="Ação imediata" />
      </div>

      {/* Funil do Seguro */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-display font-bold text-cyber-text tracking-wide uppercase">Funil do Seguro</h3>
            <p className="text-[11px] text-cyber-muted mt-0.5">Cotação → Proposta → Apólice → Endosso</p>
          </div>
        </div>

        {/* Etapas do funil */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
          {funilEtapas.map((e, i) => (
            <div key={e.label} className="flex-1 flex items-center">
              <button onClick={() => navigate(e.to)} className="flex-1 text-center p-4 rounded-xl bg-cyber-surface/60 border border-cyber-border/60 hover:border-cyber-cyan/40 transition-colors cursor-pointer">
                <p className={`text-2xl font-data font-bold ${e.cor}`}>{e.valor}</p>
                <p className="text-[11px] text-cyber-muted uppercase tracking-wide mt-0.5">{e.label}</p>
              </button>
              {i < funilEtapas.length - 1 && (
                <div className="px-1 sm:px-2 text-cyber-dim shrink-0 flex sm:block justify-center">
                  <span className="hidden sm:inline">→</span>
                  <span className="sm:hidden">↓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Taxas de conversão */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-cyber-surface/40 border border-cyber-border/40 text-center">
            <p className="text-lg font-bold text-cyber-cyan">{pct(cotacoesConvertidas, totalCotacoes)}%</p>
            <p className="text-[11px] text-cyber-muted">Cotação → Proposta</p>
          </div>
          <div className="p-3 rounded-xl bg-cyber-surface/40 border border-cyber-border/40 text-center">
            <p className="text-lg font-bold text-cyber-purple">{pct(propostasConvertidas, propostasTotal)}%</p>
            <p className="text-[11px] text-cyber-muted">Proposta → Apólice</p>
          </div>
          <div className="p-3 rounded-xl bg-cyber-surface/40 border border-cyber-border/40 text-center">
            <p className="text-lg font-bold text-cyber-amber">{pct(apolicesComEndosso, apolicesEmitidas)}%</p>
            <p className="text-[11px] text-cyber-muted">Apólices com endosso</p>
          </div>
        </div>
      </div>

      {/* Indicadores operacionais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Cotações aprovadas', v: cotacoesAprovadas, c: 'text-cyber-green' },
          { label: 'Cotações convertidas', v: cotacoesConvertidas, c: 'text-cyber-cyan' },
          { label: 'Propostas → apólice', v: propostasConvertidas, c: 'text-cyber-purple' },
          { label: 'Apólices vigentes', v: apolicesVigentes, c: 'text-cyber-green' },
          { label: 'Apólices c/ endosso', v: apolicesComEndosso, c: 'text-cyber-amber' },
          { label: 'Endossos em análise', v: endossosAnalise, c: 'text-cyber-cyan' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <p className={`text-xl font-data font-bold leading-tight ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-cyber-muted uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Comissão prevista x emitida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div><p className="text-[11px] text-cyber-muted uppercase tracking-wide">Comissão prevista (funil)</p><p className="text-xl font-bold text-cyber-cyan mt-0.5">{fmtMoeda(comissaoPrevistaFlow)}</p></div>
          <DollarSign size={22} className="text-cyber-cyan/40" />
        </div>
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div><p className="text-[11px] text-cyber-muted uppercase tracking-wide">Comissão emitida (pólises)</p><p className="text-xl font-bold text-cyber-green mt-0.5">{fmtMoeda(comissaoEmitida)}</p></div>
          <DollarSign size={22} className="text-cyber-green/40" />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Produção Mensal */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-display font-bold text-cyber-text tracking-wide uppercase">Produção Mensal</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">Prêmios emitidos (R$)</p>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-cyber-cyan/10 glow-cyan">
              <TrendingUp size={15} className="text-cyber-cyan" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={producaoMensal} barSize={26} margin={{ left: -8, right: 4 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip formatter={fmtMoeda} />} cursor={{ fill: 'rgba(6,182,212,0.04)' }} />
              <Bar dataKey="valor" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Comissões */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-display font-bold text-cyber-text tracking-wide uppercase">Comissões Recebidas</h3>
              <p className="text-[11px] text-cyber-muted mt-0.5">Últimos 6 meses (R$)</p>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-cyber-green/10 glow-green">
              <DollarSign size={15} className="text-cyber-green" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={producaoMensal} margin={{ left: -8, right: 4 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip formatter={fmtMoeda} />} />
              <Area type="monotone" dataKey="comissao" stroke="#22c55e" strokeWidth={2} fill="url(#areaGrad)"
                dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#22c55e', stroke: '#22c55e40', strokeWidth: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Renovações Próximas" onNavigate={() => navigate('/renovacoes')}>
          <div className="space-y-3">
            {renovacoesProximas.slice(0, 4).map(ap => (
              <div key={ap.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cyber-text truncate">{ap.cliente}</p>
                  <p className="text-[11px] text-cyber-muted truncate">{ap.tipoSeguro} · {ap.seguradora}</p>
                </div>
                <span className={`text-xs font-data font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                  ap.diasParaVencer <= 15
                    ? 'bg-cyber-red/10 text-cyber-red border-cyber-red/30'
                    : 'bg-cyber-amber/10 text-cyber-amber border-cyber-amber/30'
                }`}>
                  {ap.diasParaVencer}d
                </span>
              </div>
            ))}
            {renovacoesProximas.length === 0 && (
              <p className="text-sm text-cyber-muted text-center py-4">Nenhuma renovação urgente</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Tarefas Pendentes" onNavigate={() => navigate('/tarefas')}>
          <div className="space-y-3">
            {tarefasUrgentes.map(t => (
              <div key={t.id} className="flex items-start gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  t.status === 'atrasada' ? 'bg-cyber-red glow-red' : 'bg-cyber-cyan glow-cyan'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cyber-text truncate">{t.titulo}</p>
                  <p className="text-[11px] text-cyber-muted">{t.responsavel} · {t.data}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Propostas Recentes" onNavigate={() => navigate('/propostas')}>
          <div className="space-y-3">
            {propostas.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cyber-text truncate">{p.cliente}</p>
                  <p className="text-[11px] text-cyber-muted">{p.tipoSeguro}</p>
                </div>
                <StatusBadge status={p.status} type="proposta" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Ranking */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-display font-bold text-cyber-text tracking-wide uppercase flex items-center gap-2">
            <Activity size={14} className="text-cyber-cyan" />
            Ranking de Produção — {mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)}
          </h3>
          <span className="hud-label">Meta do mês</span>
        </div>
        <div className="space-y-4">
          {ranking.map((u, i) => {
            const pct = Math.round((u.realizado / u.meta) * 100)
            const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#06b6d4' : '#f59e0b'
            const barGlow  = pct >= 80 ? 'glow-green' : pct >= 50 ? 'glow-cyan' : 'glow-amber'
            return (
              <div key={u.nome} className="flex items-center gap-3">
                <span className="font-data text-xs font-bold text-cyber-dim w-5 text-center shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: rankGrads[i] }}>
                  {u.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-cyber-text">{u.nome}</span>
                    <span className="text-sm font-data font-semibold text-cyber-text tabular-nums">{fmtMoeda(u.realizado)}</span>
                  </div>
                  <div className="w-full bg-cyber-border/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${barGlow}`}
                      style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
                    />
                  </div>
                </div>
                <span className="font-data text-xs font-bold w-10 text-right tabular-nums shrink-0"
                  style={{ color: barColor }}>
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
