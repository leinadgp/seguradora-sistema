import { useState } from 'react'
import { Search, DollarSign, Filter } from 'lucide-react'
import MetricCard from '../components/ui/MetricCard'
import { StatusBadge } from '../components/ui/Badge'
import useResource from '../hooks/useResource'

function fmtMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0) }

const corretores = ['Todos', 'Carlos Silva', 'Ana Santos', 'Pedro Lima', 'Roberto Alves']
const statusOpcoes = ['todos', 'prevista', 'recebida', 'paga_corretor', 'atrasada']

export default function Comissoes() {
  const { data: comissoes } = useResource('comissoes')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterCorretor, setFilterCorretor] = useState('Todos')

  const filtered = comissoes.filter(c => {
    const q = search.toLowerCase()
    const match = !q || c.cliente.toLowerCase().includes(q) || c.seguradora.toLowerCase().includes(q) || c.apolice.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    const matchCorretor = filterCorretor === 'Todos' || c.corretor === filterCorretor
    return match && matchStatus && matchCorretor
  })

  const prevista = comissoes.filter(c => c.status === 'prevista').reduce((a, c) => a + c.valor, 0)
  const recebida = comissoes.filter(c => ['recebida', 'paga_corretor'].includes(c.status)).reduce((a, c) => a + c.valor, 0)
  const pendente = comissoes.filter(c => c.status === 'prevista').reduce((a, c) => a + c.valor, 0)
  const atrasada = comissoes.filter(c => c.status === 'atrasada').reduce((a, c) => a + c.valor, 0)

  const porCorretor = corretores.filter(c => c !== 'Todos').map(nome => ({
    nome,
    total: comissoes.filter(c => c.corretor === nome).reduce((a, c) => a + c.valor, 0),
    qtd: comissoes.filter(c => c.corretor === nome).length,
  })).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-5">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Comissão Prevista" value={fmtMoeda(prevista)} icon={<DollarSign size={18} />} color="blue" subtitle="A receber" />
        <MetricCard title="Comissão Recebida" value={fmtMoeda(recebida)} icon={<DollarSign size={18} />} color="green" subtitle="No período" />
        <MetricCard title="Pendente" value={fmtMoeda(pendente)} icon={<DollarSign size={18} />} color="yellow" />
        <MetricCard title="Atrasada" value={fmtMoeda(atrasada)} icon={<DollarSign size={18} />} color="red" />
      </div>

      {/* Por corretor */}
      <div className="bg-cyber-card rounded-2xl p-5 shadow-card border border-cyber-border/40">
        <h3 className="text-sm font-semibold text-cyber-text mb-4">Comissão por Corretor</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {porCorretor.map(c => (
            <div key={c.nome} className="text-center p-3 bg-cyber-surface/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                {c.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <p className="text-xs text-cyber-muted mb-0.5">{c.nome.split(' ')[0]}</p>
              <p className="text-sm font-bold text-cyber-text">{fmtMoeda(c.total)}</p>
              <p className="text-xs text-cyber-muted">{c.qtd} comissões</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, apólice, seguradora..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          {statusOpcoes.map(s => <option key={s} value={s}>{s === 'todos' ? 'Todos os status' : s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterCorretor} onChange={e => setFilterCorretor(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          {corretores.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-cyber-card rounded-2xl shadow-card border border-cyber-border/40 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border/40">
                {['Apólice', 'Cliente', 'Seguradora', 'Corretor', 'Prêmio', 'Comissão %', 'Valor', 'Data Prevista', 'Recebimento', 'Status'].map(h => (
                  <th key={h} className="text-left hud-label px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/20">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-data text-cyber-muted">{c.apolice}</td>
                  <td className="px-4 py-3 text-sm font-medium text-cyber-text">{c.cliente}</td>
                  <td className="px-4 py-3 text-sm text-cyber-muted">{c.seguradora}</td>
                  <td className="px-4 py-3 text-sm text-cyber-muted">{c.corretor.split(' ')[0]}</td>
                  <td className="px-4 py-3 text-sm text-cyber-text/80">{fmtMoeda(c.valorPremio)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-cyber-text/80">{c.percentual}%</td>
                  <td className="px-4 py-3 text-sm font-bold text-cyber-green">{fmtMoeda(c.valor)}</td>
                  <td className="px-4 py-3 text-xs text-cyber-muted">{c.dataPrevista}</td>
                  <td className="px-4 py-3 text-xs text-cyber-muted">{c.dataRecebimento || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} type="comissao" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-cyber-border/30">
          {filtered.map(c => (
            <div key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-medium text-cyber-text">{c.cliente}</p>
                  <p className="text-xs text-cyber-muted">{c.apolice} · {c.seguradora}</p>
                </div>
                <StatusBadge status={c.status} type="comissao" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-cyber-muted">Prêmio: {fmtMoeda(c.valorPremio)}</span>
                <span className="text-sm font-bold text-cyber-green">{fmtMoeda(c.valor)}</span>
              </div>
              <p className="text-xs text-cyber-muted mt-1">Corretor: {c.corretor} · {c.percentual}%</p>
            </div>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-cyber-muted text-sm">Nenhuma comissão encontrada.</div>
      )}
    </div>
  )
}
