import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { Download } from 'lucide-react'
import useResource from '../hooks/useResource'

function fmtMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0) }

const COLORS = ['#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16', '#38bdf8']
const TOOLTIP_STYLE = { background: '#0f172a', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', color: '#f8fafc' }

function exportCSV(rows, campos, filename) {
  const header = campos.map(c => c.label).join(';')
  const body = rows.map(r =>
    campos.map(c => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(';')
  ).join('\n')
  const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function ChartCard({ title, subtitle, children, onExport }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xs font-display font-bold text-cyber-text tracking-wide uppercase">{title}</h3>
          {subtitle && <p className="text-xs text-cyber-muted">{subtitle}</p>}
        </div>
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-cyber-border/50 text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/30 transition-colors cursor-pointer">
            <Download size={11} /> CSV
          </button>
        )}
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

const btnCls = 'text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer'
const btnActive = 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/30'
const btnIdle = 'bg-cyber-surface text-cyber-muted border-cyber-border/50 hover:border-cyber-cyan/30 hover:text-cyber-cyan'

export default function Relatorios() {
  const { data: producaoMensal } = useResource('producaoMensal')
  const { data: apolices }       = useResource('apolices')
  const { data: comissoes }      = useResource('comissoes')
  const { data: sinistros }      = useResource('sinistros')
  const { data: propostas }      = useResource('propostas')
  const { data: leads }          = useResource('leads')

  const [periodo, setPeriodo] = useState({ inicio: '', fim: '', quick: '' })

  function setQuick(label, days) {
    const fim = new Date()
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - days)
    setPeriodo({ inicio: inicio.toISOString().split('T')[0], fim: fim.toISOString().split('T')[0], quick: label })
  }

  function setAno() {
    const ano = new Date().getFullYear()
    setPeriodo({ inicio: `${ano}-01-01`, fim: `${ano}-12-31`, quick: 'ano' })
  }

  function limparPeriodo() {
    setPeriodo({ inicio: '', fim: '', quick: '' })
  }

  function inP(dateStr) {
    if (!periodo.inicio && !periodo.fim) return true
    if (!dateStr) return true
    const d = new Date(dateStr)
    if (periodo.inicio && d < new Date(periodo.inicio)) return false
    if (periodo.fim && d > new Date(periodo.fim + 'T23:59:59')) return false
    return true
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const apolicesFilt  = useMemo(() => apolices.filter(a  => inP(a.dataEmissao || a.createdAt)),                                   [apolices,  periodo.inicio, periodo.fim])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const comissoesFilt = useMemo(() => comissoes.filter(c  => inP(c.dataPrevista || c.createdAt)),                                  [comissoes, periodo.inicio, periodo.fim])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sinistrosFilt = useMemo(() => sinistros.filter(s  => inP(s.dataAbertura || s.createdAt)),                                  [sinistros, periodo.inicio, periodo.fim])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const propostasFilt = useMemo(() => propostas.filter(p  => inP(p.dataSolicitacao || p.dataCriacao || p.createdAt)),              [propostas, periodo.inicio, periodo.fim])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const leadsFilt     = useMemo(() => leads.filter(l      => inP(l.createdAt || l.dataCriacao)),                                   [leads,     periodo.inicio, periodo.fim])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalPremios  = apolicesFilt.reduce((a, ap) => a + (ap.premioBruto || 0), 0)
  const totalComissao = comissoesFilt.reduce((a, c) => a + (c.valor || 0), 0)
  const sinistrosAbertos = sinistrosFilt.filter(s => !['encerrado', 'indenizado'].includes(s.status)).length
  const propostasConvertidas = propostasFilt.filter(p => p.converted_policy_id || p.status === 'aprovada').length
  const txConversao = propostasFilt.length > 0 ? Math.round((propostasConvertidas / propostasFilt.length) * 100) : 0

  // ── Apólices por tipo ──────────────────────────────────────────────────────
  const apolicesPorTipo = useMemo(() =>
    Object.entries(apolicesFilt.reduce((acc, a) => { acc[a.tipoSeguro] = (acc[a.tipoSeguro] || 0) + 1; return acc }, {}))
      .map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  , [apolicesFilt])

  // ── Comissão por corretor ──────────────────────────────────────────────────
  const comissaoPorCorretor = useMemo(() => {
    const por = {}
    comissoesFilt.forEach(c => { por[c.corretor] = (por[c.corretor] || 0) + (c.valor || 0) })
    return Object.entries(por).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor)
  }, [comissoesFilt])

  // ── Taxa de conversão mensal ───────────────────────────────────────────────
  const taxaConversao = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const anoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const props = propostasFilt.filter(p => (p.dataSolicitacao || p.dataCriacao || '').startsWith(anoMes)).length
      const conv  = apolicesFilt.filter(a => (a.dataEmissao || '').startsWith(anoMes)).length
      return { mes, propostas: props, convertidas: conv }
    })
  }, [propostasFilt, apolicesFilt])

  // ── Leads por origem ───────────────────────────────────────────────────────
  const leadsPorOrigem = useMemo(() => {
    const por = {}
    leadsFilt.forEach(l => { const o = l.origem || 'Outros'; por[o] = (por[o] || 0) + 1 })
    return Object.entries(por).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [leadsFilt])

  const hasPeriodo = periodo.inicio || periodo.fim

  return (
    <div className="space-y-5">
      {/* Filtro de período */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-cyber-muted uppercase tracking-wide">Período</span>
          <input
            type="date"
            value={periodo.inicio}
            onChange={e => setPeriodo(p => ({ ...p, inicio: e.target.value, quick: '' }))}
            className="text-xs border border-cyber-border/50 rounded-lg px-2.5 py-1.5 bg-cyber-card focus:outline-none focus:border-cyber-cyan/50 text-cyber-text"
          />
          <span className="text-xs text-cyber-muted">até</span>
          <input
            type="date"
            value={periodo.fim}
            onChange={e => setPeriodo(p => ({ ...p, fim: e.target.value, quick: '' }))}
            className="text-xs border border-cyber-border/50 rounded-lg px-2.5 py-1.5 bg-cyber-card focus:outline-none focus:border-cyber-cyan/50 text-cyber-text"
          />
          <div className="flex gap-1.5 ml-2">
            <button onClick={() => setQuick('30', 30)} className={`${btnCls} ${periodo.quick === '30' ? btnActive : btnIdle}`}>30d</button>
            <button onClick={() => setQuick('90', 90)} className={`${btnCls} ${periodo.quick === '90' ? btnActive : btnIdle}`}>90d</button>
            <button onClick={setAno} className={`${btnCls} ${periodo.quick === 'ano' ? btnActive : btnIdle}`}>Este ano</button>
            {hasPeriodo && <button onClick={limparPeriodo} className={`${btnCls} ${btnIdle}`}>Tudo</button>}
          </div>
          {hasPeriodo && <span className="text-xs text-cyber-cyan font-medium ml-auto">Filtrado: {apolicesFilt.length} apólices · {comissoesFilt.length} comissões</span>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Prêmios emitidos" value={fmtMoeda(totalPremios)} sub={hasPeriodo ? 'Período filtrado' : 'Carteira total'} />
        <StatCard label="Comissão gerada" value={fmtMoeda(totalComissao)} sub={hasPeriodo ? 'Período filtrado' : 'Histórico'} />
        <StatCard label="Taxa de conversão" value={`${txConversao}%`} sub="Propostas → Apólices" />
        <StatCard label="Sinistros em aberto" value={sinistrosAbertos} sub="Requerem acompanhamento" />
      </div>

      {/* Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Produção Mensal" subtitle="Prêmios emitidos em R$ (últimos 6 meses)"
          onExport={() => exportCSV(producaoMensal, [{ key: 'mes', label: 'Mês' }, { key: 'valor', label: 'Valor (R$)' }], 'producao_mensal.csv')}
        >
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

        <ChartCard title="Apólices por Tipo de Seguro" subtitle={`${apolicesFilt.length} apólices no período`}
          onExport={() => exportCSV(apolicesFilt,
            [{ key: 'numero', label: 'Número' }, { key: 'cliente', label: 'Cliente' }, { key: 'seguradora', label: 'Seguradora' },
             { key: 'tipoSeguro', label: 'Tipo' }, { key: 'premioBruto', label: 'Prêmio (R$)' }, { key: 'status', label: 'Status' },
             { key: 'inicioVigencia', label: 'Início' }, { key: 'fimVigencia', label: 'Fim' }],
            'apolices.csv')}
        >
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
        <ChartCard title="Taxa de Conversão" subtitle="Propostas × Apólices emitidas por mês"
          onExport={() => exportCSV(propostasFilt,
            [{ key: 'numero', label: 'Número' }, { key: 'cliente', label: 'Cliente' }, { key: 'status', label: 'Status' },
             { key: 'dataSolicitacao', label: 'Data' }, { key: 'valor', label: 'Valor (R$)' }],
            'propostas.csv')}
        >
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

        <ChartCard title="Comissão por Corretor" subtitle={`${comissoesFilt.length} comissões · Total: ${fmtMoeda(totalComissao)}`}
          onExport={() => exportCSV(comissoesFilt,
            [{ key: 'apolice', label: 'Apólice' }, { key: 'cliente', label: 'Cliente' }, { key: 'seguradora', label: 'Seguradora' },
             { key: 'corretor', label: 'Corretor' }, { key: 'valorPremio', label: 'Prêmio (R$)' }, { key: 'percentual', label: '% Comissão' },
             { key: 'valor', label: 'Valor Comissão (R$)' }, { key: 'status', label: 'Status' }, { key: 'dataPrevista', label: 'Prevista' }],
            'comissoes.csv')}
        >
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
            <p className="text-sm text-cyber-muted text-center py-10">Nenhuma comissão no período.</p>
          )}
        </ChartCard>
      </div>

      {/* Linha 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Leads por Origem" subtitle={`${leadsFilt.length} leads no período`}
          onExport={() => exportCSV(leadsFilt,
            [{ key: 'nome', label: 'Nome' }, { key: 'origem', label: 'Origem' }, { key: 'status', label: 'Status' },
             { key: 'responsavel', label: 'Responsável' }, { key: 'temperatura', label: 'Temperatura' }, { key: 'createdAt', label: 'Data' }],
            'leads.csv')}
        >
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
            <p className="text-sm text-cyber-muted text-center py-10">Nenhum lead no período.</p>
          )}
        </ChartCard>

        <ChartCard title="Sinistros por Status" subtitle={`${sinistrosFilt.length} sinistros no período`}
          onExport={() => exportCSV(sinistrosFilt,
            [{ key: 'numero', label: 'Número' }, { key: 'cliente', label: 'Cliente' }, { key: 'apolice', label: 'Apólice' },
             { key: 'tipo', label: 'Tipo' }, { key: 'status', label: 'Status' }, { key: 'valorEstimado', label: 'Valor Est. (R$)' },
             { key: 'valorIndenizado', label: 'Valor Indenizado (R$)' }, { key: 'dataAbertura', label: 'Abertura' }],
            'sinistros.csv')}
        >
          {sinistrosFilt.length > 0 ? (
            <div className="space-y-3 pt-2">
              {Object.entries(sinistrosFilt.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc }, {})).map(([k, v], i) => {
                const pct = Math.round((v / sinistrosFilt.length) * 100)
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
            <p className="text-sm text-cyber-muted text-center py-10">Nenhum sinistro no período.</p>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
