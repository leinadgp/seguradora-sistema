import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import useResource from '../hooks/useResource'

function fmtMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0) }

const COLORS = ['#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16', '#38bdf8']

const TOOLTIP_STYLE = { background: '#0f172a', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', color: '#f8fafc' }

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="text-xs font-display font-bold text-cyber-text tracking-wide uppercase">{title}</h3>
        {subtitle && <p className="text-xs text-cyber-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="glass rounded-2xl p-5 text-center">
      <p className="text-2xl font-data font-bold text-cyber-cyan">{value}</p>
      <p className="text-sm font-medium text-cyber-muted mt-1">{label}</p>
      {sub && <p className="text-xs text-cyber-muted mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Relatorios() {
  const { data: producaoMensal } = useResource('producaoMensal')
  const { data: apolices }       = useResource('apolices')
  const { data: comissoes }      = useResource('comissoes')
  const { data: sinistros }      = useResource('sinistros')
  const { data: propostas }      = useResource('propostas')
  const { data: leads }          = useResource('leads')

  // ── KPIs ──────────────────────────────────────────────────────────────
  const totalPremios  = apolices.reduce((a, ap) => a + (ap.premioBruto || 0), 0)
  const totalComissao = comissoes.reduce((a, c) => a + (c.valor || 0), 0)
  const sinistrosAbertos = sinistros.filter(s => !['encerrado', 'indenizado'].includes(s.status)).length

  const propostasConvertidas = propostas.filter(p => p.converted_policy_id || p.status === 'aprovada').length
  const txConversao = propostas.length > 0 ? Math.round((propostasConvertidas / propostas.length) * 100) : 0

  // ── Apólices por tipo ──────────────────────────────────────────────────
  const apolicesPorTipo = useMemo(() =>
    Object.entries(apolices.reduce((acc, a) => { acc[a.tipoSeguro] = (acc[a.tipoSeguro] || 0) + 1; return acc }, {}))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  , [apolices])

  // ── Comissão por corretor ──────────────────────────────────────────────
  const comissaoPorCorretor = useMemo(() => {
    const por = {}
    comissoes.forEach(c => { por[c.corretor] = (por[c.corretor] || 0) + (c.valor || 0) })
    return Object.entries(por).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor)
  }, [comissoes])

  // ── Taxa de conversão mensal (últimos 6 meses) ─────────────────────────
  const taxaConversao = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const anoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const props = propostas.filter(p => (p.dataSolicitacao || p.dataCriacao || '').startsWith(anoMes)).length
      const conv  = apolices.filter(a => (a.dataEmissao || '').startsWith(anoMes)).length
      return { mes, propostas: props, convertidas: conv }
    })
  }, [propostas, apolices])

  // ── Leads por origem ───────────────────────────────────────────────────
  const leadsPorOrigem = useMemo(() => {
    const por = {}
    leads.forEach(l => { const o = l.origem || 'Outros'; por[o] = (por[o] || 0) + 1 })
    return Object.entries(por).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [leads])

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Prêmios emitidos (total)" value={fmtMoeda(totalPremios)} sub="Carteira ativa" />
        <StatCard label="Comissão total gerada" value={fmtMoeda(totalComissao)} sub="Histórico" />
        <StatCard label="Taxa de conversão" value={`${txConversao}%`} sub="Propostas → Apólices" />
        <StatCard label="Sinistros em aberto" value={sinistrosAbertos} sub="Requerem acompanhamento" />
      </div>

      {/* Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Produção Mensal" subtitle="Prêmios emitidos em R$ (últimos 6 meses)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={producaoMensal} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmtMoeda(v)} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="valor" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Produção" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Apólices por Tipo de Seguro" subtitle="Distribuição da carteira atual">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={apolicesPorTipo} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {apolicesPorTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {apolicesPorTipo.map((t, i) => (
                <div key={t.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-cyber-muted">{t.name}</span>
                  </div>
                  <span className="font-semibold text-cyber-text">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Taxa de Conversão" subtitle="Propostas × Apólices emitidas por mês">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={taxaConversao}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Line type="monotone" dataKey="propostas" stroke="#475569" strokeWidth={2} dot={{ r: 3 }} name="Propostas" />
              <Line type="monotone" dataKey="convertidas" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} name="Convertidas" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Comissão por Corretor" subtitle="Total gerado no período">
          {comissaoPorCorretor.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comissaoPorCorretor} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={v => fmtMoeda(v)} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="valor" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Comissão" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-cyber-muted text-center py-10">Nenhuma comissão registrada.</p>
          )}
        </ChartCard>
      </div>

      {/* Linha 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Leads por Origem" subtitle="De onde vêm os leads">
          {leadsPorOrigem.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={leadsPorOrigem} cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={3}>
                    {leadsPorOrigem.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {leadsPorOrigem.map((o, i) => (
                  <div key={o.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-cyber-muted">{o.name}</span>
                    <span className="font-semibold text-cyber-text">{o.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-cyber-muted text-center py-10">Nenhum lead registrado.</p>
          )}
        </ChartCard>

        <ChartCard title="Sinistros por Status">
          {sinistros.length > 0 ? (
            <div className="space-y-3 pt-2">
              {Object.entries(sinistros.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc }, {})).map(([k, v], i) => {
                const pct = Math.round((v / sinistros.length) * 100)
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-cyber-muted">{k.replace(/_/g, ' ')}</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                    <div className="w-full bg-cyber-surface rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-cyber-muted text-center py-10">Nenhum sinistro registrado.</p>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
