import { useState, useMemo } from 'react'
import { Search, RefreshCw, CheckCircle, XCircle, Phone, FileText } from 'lucide-react'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'

const STATUS_RENOV = {
  nao_iniciada: { label: 'Não Iniciada', color: 'bg-cyber-surface text-cyber-muted' },
  contato_feito: { label: 'Contato Feito', color: 'bg-cyber-cyan/10 text-cyber-cyan' },
  cotando: { label: 'Cotando', color: 'bg-cyber-amber/10 text-cyber-amber' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-cyber-amber/10 text-cyber-amber' },
  renovada: { label: 'Renovada', color: 'bg-cyber-green/10 text-cyber-green' },
  perdida: { label: 'Perdida', color: 'bg-cyber-red/10 text-cyber-red' },
}

function fmtMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0) }

export default function Renovacoes() {
  const { showToast } = useApp()
  const { data: apolices, update } = useResource('apolices')
  const { create: createCotacao } = useResource('cotacoes')
  const renovacoes = useMemo(() =>
    apolices
      .filter(a => a.status === 'ativa' || a.status === 'em_renovacao')
      .sort((a, b) => (a.diasParaVencer || 0) - (b.diasParaVencer || 0))
      .map(a => ({ ...a, statusRenovacao: a.statusRenovacao || (a.status === 'em_renovacao' ? 'cotando' : 'nao_iniciada') })),
    [apolices]
  )
  const [search, setSearch] = useState('')
  const [filterDias, setFilterDias] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')

  const filtered = renovacoes.filter(r => {
    const q = search.toLowerCase()
    const match = !q || r.cliente.toLowerCase().includes(q) || r.tipoSeguro.toLowerCase().includes(q) || r.seguradora.toLowerCase().includes(q)
    const matchDias = filterDias === 'Todos' || (filterDias === '30' && r.diasParaVencer <= 30) || (filterDias === '60' && r.diasParaVencer <= 60) || (filterDias === '90' && r.diasParaVencer <= 90)
    const matchStatus = filterStatus === 'Todos' || r.statusRenovacao === filterStatus
    return match && matchDias && matchStatus
  })

  async function gerarCotacaoRenovacao(apolice) {
    try {
      const cotId = `cot_${Date.now()}`
      await createCotacao({
        id: cotId,
        clienteId: apolice.clienteId || '',
        cliente: apolice.cliente || '',
        tipoSeguro: apolice.tipoSeguro || '',
        seguradora: apolice.seguradora || '',
        status: 'nova',
        origem: 'renovacao',
        apoliceOrigemId: apolice.id,
        apoliceOrigem: apolice.numero || '',
        observacoes: `Renovação da apólice ${apolice.numero || apolice.id} — vencimento: ${apolice.fimVigencia || ''}`,
        createdAt: new Date().toISOString(),
      })
      await update(apolice.id, { ...apolice, statusRenovacao: 'cotando', cotacaoRenovacaoId: cotId })
      showToast(`Cotação criada para renovação de ${apolice.cliente}!`)
    } catch {
      showToast('Erro ao gerar cotação.', 'error')
    }
  }

  async function atualizarStatus(id, novoStatus) {
    try {
      const apolice = apolices.find(a => a.id === id)
      if (apolice) await update(id, { ...apolice, statusRenovacao: novoStatus })
      const labels = { contato_feito: 'Contato feito', cotando: 'Cotação iniciada', proposta_enviada: 'Proposta enviada', renovada: 'Marcada como renovada', perdida: 'Marcada como perdida' }
      showToast(labels[novoStatus] || 'Status atualizado!')
    } catch {
      showToast('Erro ao atualizar status.', 'error')
    }
  }

  const urgentes = renovacoes.filter(r => r.diasParaVencer <= 30 && r.statusRenovacao !== 'renovada' && r.statusRenovacao !== 'perdida').length
  const renovadas = renovacoes.filter(r => r.statusRenovacao === 'renovada').length

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-cyber-red">{urgentes}</p>
          <p className="text-sm font-medium text-cyber-red">Urgentes (≤30d)</p>
        </div>
        <div className="bg-cyber-cyan/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-cyber-cyan">{renovacoes.filter(r => !['renovada','perdida'].includes(r.statusRenovacao)).length}</p>
          <p className="text-sm font-medium text-cyber-cyan">Em aberto</p>
        </div>
        <div className="bg-cyber-green/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-cyber-green">{renovadas}</p>
          <p className="text-sm font-medium text-cyber-green">Renovadas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, seguro, seguradora..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-cyber-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/70 bg-cyber-card" />
        </div>
        <select value={filterDias} onChange={e => setFilterDias(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option>Todos</option>
          <option value="30">Vence em 30d</option>
          <option value="60">Vence em 60d</option>
          <option value="90">Vence em 90d</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none">
          <option>Todos</option>
          {Object.entries(STATUS_RENOV).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState icon={<RefreshCw size={28} />} title="Nenhuma renovação" description="Não há apólices para renovar no período selecionado." />
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const st = STATUS_RENOV[r.statusRenovacao]
            const isUrgente = r.diasParaVencer <= 15
            return (
              <div key={r.id} className={`bg-cyber-card rounded-2xl p-4 shadow-card border transition-all duration-200 hover:shadow-card-md hover:-translate-y-0.5 ${isUrgente ? 'border-red-200' : 'border-cyber-border/40'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-cyber-text">{r.cliente}</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isUrgente ? 'bg-cyber-red/10 text-cyber-red' : r.diasParaVencer <= 30 ? 'bg-cyber-amber/10 text-cyber-amber' : 'bg-cyber-surface text-cyber-muted'}`}>
                        {r.diasParaVencer} dias
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-cyber-muted">{r.tipoSeguro} · {r.seguradora}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-cyber-muted">
                      <span>Vence: {r.fimVigencia}</span>
                      <span>·</span>
                      <span>Prêmio atual: {fmtMoeda(r.premioBruto)}</span>
                      <span>·</span>
                      <span>Resp: {r.corretor}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {r.statusRenovacao === 'nao_iniciada' && (
                      <Button size="sm" onClick={() => atualizarStatus(r.id, 'contato_feito')} icon={<Phone size={13} />}>Iniciar</Button>
                    )}
                    {['nao_iniciada', 'contato_feito'].includes(r.statusRenovacao) && !r.cotacaoRenovacaoId && (
                      <Button size="sm" variant="secondary" onClick={() => gerarCotacaoRenovacao(r)} icon={<FileText size={13} />}>Gerar Cotação</Button>
                    )}
                    {r.cotacaoRenovacaoId && r.statusRenovacao === 'cotando' && (
                      <span className="text-xs text-cyber-cyan font-medium flex items-center gap-1 px-2 py-1 bg-cyber-cyan/10 rounded-lg">
                        <FileText size={12} /> Cotação em andamento
                      </span>
                    )}
                    {r.statusRenovacao === 'cotando' && (
                      <Button size="sm" onClick={() => atualizarStatus(r.id, 'proposta_enviada')}>Proposta Enviada</Button>
                    )}
                    {!['renovada', 'perdida'].includes(r.statusRenovacao) && (
                      <>
                        <Button size="sm" variant="success" icon={<CheckCircle size={13} />} onClick={() => atualizarStatus(r.id, 'renovada')}>Renovada</Button>
                        <Button size="sm" variant="secondary" icon={<XCircle size={13} />} onClick={() => atualizarStatus(r.id, 'perdida')}>Perdida</Button>
                      </>
                    )}
                    {r.statusRenovacao === 'renovada' && <span className="text-sm text-cyber-green font-semibold flex items-center gap-1"><CheckCircle size={14} /> Renovada</span>}
                    {r.statusRenovacao === 'perdida' && <span className="text-sm text-cyber-red font-semibold flex items-center gap-1"><XCircle size={14} /> Perdida</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
