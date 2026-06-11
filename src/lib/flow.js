import api from '../api/client'

let _currentUser = 'Sistema'
export function setCurrentUser(name) { _currentUser = name }
export function getCurrentUser() { return _currentUser }

export function fmtMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0)
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function nowISO() {
  return new Date().toISOString()
}

export function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Gera o próximo número sequencial no formato PREFIXO-ANO-NNN
export function genNumero(prefix, list = [], pad = 3) {
  const year = new Date().getFullYear()
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const item of list) {
    const m = re.exec(item?.numero || '')
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${prefix}-${year}-${String(max + 1).padStart(pad, '0')}`
}

// Registra um evento no histórico (timeline). Não bloqueia o fluxo se falhar.
export async function logEvento(entityType, entityId, action, description, user) {
  user = user ?? _currentUser
  try {
    await api.post('historico', {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entity_type: entityType,
      entity_id: String(entityId),
      action,
      description,
      created_at: nowISO(),
      created_by: user,
    })
  } catch (e) {
    console.error('Falha ao registrar histórico:', e)
  }
}

// ─── STATUS ───────────────────────────────────────────────────────────────────
// stage = cor da etapa no fluxo: 'gray' | 'blue' | 'green' | 'red'

export const cotacaoStatus = {
  nova:               { label: 'Nova Cotação',       color: 'blue',   stage: 'blue'  },
  em_analise:         { label: 'Em Análise',         color: 'orange', stage: 'blue'  },
  aguardando_cliente: { label: 'Aguard. Cliente',    color: 'yellow', stage: 'blue'  },
  cotacao_enviada:    { label: 'Cotação Enviada',    color: 'purple', stage: 'blue'  },
  em_negociacao:      { label: 'Em Negociação',      color: 'pink',   stage: 'blue'  },
  aprovada:           { label: 'Aprovada',           color: 'green',  stage: 'green' },
  recusada:           { label: 'Recusada',           color: 'red',    stage: 'red'   },
  cancelada:          { label: 'Cancelada',          color: 'red',    stage: 'red'   },
  convertida:         { label: 'Convertida',         color: 'green',  stage: 'green' },
  // legados para compatibilidade com registros antigos
  levantamento:       { label: 'Levantamento',       color: 'orange', stage: 'blue'  },
  cotando:            { label: 'Cotando Seguradoras', color: 'yellow', stage: 'blue'  },
  aguardando_retorno: { label: 'Aguardando Retorno', color: 'purple', stage: 'blue'  },
  pronto:             { label: 'Pronto p/ Apresentar', color: 'blue', stage: 'blue'  },
  perdida:            { label: 'Perdida',            color: 'red',    stage: 'red'   },
  enviada:            { label: 'Enviada ao cliente', color: 'purple', stage: 'blue'  },
}
export const cotacaoKanbanList = ['nova', 'em_analise', 'aguardando_cliente', 'cotacao_enviada', 'em_negociacao', 'aprovada']
export const cotacaoStatusList = [...cotacaoKanbanList, 'recusada', 'cancelada', 'perdida', 'convertida']

export const propostaStatus = {
  em_analise:           { label: 'Em Análise',           color: 'blue',   stage: 'blue'  },
  aguardando_seguradora:{ label: 'Aguard. Seguradora',   color: 'yellow', stage: 'blue'  },
  proposta_enviada:     { label: 'Proposta Enviada',     color: 'purple', stage: 'blue'  },
  em_negociacao:        { label: 'Em Negociação',        color: 'pink',   stage: 'blue'  },
  aprovada:             { label: 'Aprovada',             color: 'green',  stage: 'green' },
  recusada:             { label: 'Recusada',             color: 'red',    stage: 'red'   },
  perdida:              { label: 'Perdida',              color: 'red',    stage: 'red'   },
  convertida:           { label: 'Convertida em apólice',color: 'green',  stage: 'green' },
  // legados
  cotando:              { label: 'Cotando',              color: 'orange', stage: 'blue'  },
  rascunho:             { label: 'Rascunho',             color: 'slate',  stage: 'blue'  },
}
export const propostaKanbanList = ['em_analise', 'aguardando_seguradora', 'proposta_enviada', 'em_negociacao', 'aprovada']
export const propostaStatusList = [...propostaKanbanList, 'recusada', 'perdida', 'convertida']

// mantido para compatibilidade
export const propostaStatusFlow = propostaStatus

export const apoliceStatusFlow = {
  emitida:      { label: 'Emitida',      color: 'blue',   stage: 'green' },
  ativa:        { label: 'Vigente',      color: 'green',  stage: 'green' },
  vigente:      { label: 'Vigente',      color: 'green',  stage: 'green' },
  vencida:      { label: 'Vencida',      color: 'red',    stage: 'red'  },
  cancelada:    { label: 'Cancelada',    color: 'red',    stage: 'red'  },
  renovada:     { label: 'Renovada',     color: 'blue',   stage: 'green' },
  com_endosso:  { label: 'Com endosso',  color: 'purple', stage: 'green' },
}

export const endossoStatusFlow = {
  rascunho:   { label: 'Rascunho',   color: 'slate'  },
  em_analise: { label: 'Em análise', color: 'blue'   },
  aprovado:   { label: 'Aprovado',   color: 'green'  },
  recusado:   { label: 'Recusado',   color: 'red'    },
  aplicado:   { label: 'Aplicado',   color: 'purple' },
  // legados
  pendente:   { label: 'Pendente',   color: 'yellow' },
  emitido:    { label: 'Emitido',    color: 'purple' },
  cancelado:  { label: 'Cancelado',  color: 'slate'  },
}

export const tiposEndosso = [
  'Alteração de dados',
  'Inclusão de cobertura',
  'Exclusão de cobertura',
  'Alteração de valor',
  'Cancelamento',
  'Substituição de item',
  'Correção cadastral',
  'Outro',
]

export const tiposSeguro = ['Auto', 'Moto', 'Caminhão', 'Frota', 'Residencial', 'Condomínio', 'Empresarial', 'Vida Individual', 'Vida Empresarial', 'Saúde', 'Odontológico', 'Viagem', 'Equipamentos', 'Celular', 'Rural', 'Náutico', 'Garantia', 'Fiança', 'RC', 'Previdência', 'Consórcio']

export const responsaveis = ['Carlos Silva', 'Ana Santos', 'Pedro Lima', 'Roberto Alves', 'Fernanda Costa']

export const seguradorasLista = ['Porto Seguro', 'Tokio Marine', 'Azul Seguros', 'Liberty Seguros', 'Mapfre', 'SulAmérica', 'Bradesco Seguros', 'Allianz']
