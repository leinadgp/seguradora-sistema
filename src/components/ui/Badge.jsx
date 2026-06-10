const variants = {
  green:  'bg-cyber-green/10  text-cyber-green  border-cyber-green/30',
  red:    'bg-cyber-red/10    text-cyber-red    border-cyber-red/30',
  yellow: 'bg-cyber-amber/10  text-cyber-amber  border-cyber-amber/30',
  blue:   'bg-cyber-cyan/10   text-cyber-cyan   border-cyber-cyan/30',
  purple: 'bg-cyber-purple/10 text-cyber-purple border-cyber-purple/30',
  slate:  'bg-white/5         text-cyber-muted  border-white/10',
  orange: 'bg-cyber-amber/10  text-cyber-amber  border-cyber-amber/30',
  pink:   'bg-cyber-pink/10   text-cyber-pink   border-cyber-pink/30',
}

export default function Badge({ children, color = 'slate', dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border tracking-wide ${variants[color]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  )
}

const statusApolice = {
  ativa:                 { label: 'Ativa',            color: 'green'  },
  vencida:               { label: 'Vencida',          color: 'red'    },
  cancelada:             { label: 'Cancelada',         color: 'red'    },
  em_renovacao:          { label: 'Em Renovação',      color: 'blue'   },
  suspensa:              { label: 'Suspensa',          color: 'yellow' },
  aguardando_pagamento:  { label: 'Aguard. Pagamento', color: 'yellow' },
  aguardando_emissao:    { label: 'Aguard. Emissão',   color: 'orange' },
}

const statusCliente = {
  ativo:   { label: 'Ativo',   color: 'green' },
  inativo: { label: 'Inativo', color: 'slate' },
  prospect:{ label: 'Prospect',color: 'blue'  },
}

const statusLead = {
  novo:             { label: 'Novo',             color: 'slate'  },
  primeiro_contato: { label: '1º Contato',        color: 'blue'   },
  qualificacao:     { label: 'Qualificação',      color: 'purple' },
  cotacao:          { label: 'Cotação',           color: 'orange' },
  proposta_enviada: { label: 'Proposta Enviada',  color: 'yellow' },
  negociacao:       { label: 'Negociação',        color: 'pink'   },
  fechado:          { label: 'Fechado',           color: 'green'  },
  perdido:          { label: 'Perdido',           color: 'red'    },
}

const statusProposta = {
  em_analise:             { label: 'Em Análise',         color: 'blue'   },
  cotando:                { label: 'Cotando',             color: 'orange' },
  aguardando_seguradora:  { label: 'Aguard. Seguradora',  color: 'yellow' },
  proposta_enviada:       { label: 'Proposta Enviada',    color: 'purple' },
  em_negociacao:          { label: 'Em Negociação',       color: 'pink'   },
  aprovada:               { label: 'Aprovada',            color: 'green'  },
  recusada:               { label: 'Recusada',            color: 'red'    },
  perdida:                { label: 'Perdida',             color: 'red'    },
  convertida:             { label: 'Convertida',          color: 'green'  },
}

const statusSinistro = {
  aberto:                 { label: 'Aberto',              color: 'blue'   },
  em_analise:             { label: 'Em Análise',          color: 'orange' },
  aguardando_documentos:  { label: 'Aguard. Documentos',  color: 'yellow' },
  aguardando_seguradora:  { label: 'Aguard. Seguradora',  color: 'purple' },
  aprovado:               { label: 'Aprovado',            color: 'green'  },
  negado:                 { label: 'Negado',              color: 'red'    },
  indenizado:             { label: 'Indenizado',          color: 'green'  },
  encerrado:              { label: 'Encerrado',           color: 'slate'  },
}

const statusComissao = {
  prevista:       { label: 'Prevista',        color: 'blue'  },
  recebida:       { label: 'Recebida',        color: 'green' },
  paga_corretor:  { label: 'Paga ao Corretor',color: 'slate' },
  atrasada:       { label: 'Atrasada',        color: 'red'   },
}

const statusDocumento = {
  pendente: { label: 'Pendente', color: 'yellow' },
  enviado:  { label: 'Enviado',  color: 'blue'   },
  aprovado: { label: 'Aprovado', color: 'green'  },
  recusado: { label: 'Recusado', color: 'red'    },
}

const statusTarefa = {
  pendente:  { label: 'Pendente',  color: 'blue'  },
  concluida: { label: 'Concluída', color: 'green' },
  atrasada:  { label: 'Atrasada',  color: 'red'   },
}

const temperatura = {
  frio:   { label: 'Frio',   color: 'blue'   },
  morno:  { label: 'Morno',  color: 'orange' },
  quente: { label: 'Quente', color: 'red'    },
}

export function StatusBadge({ status, type }) {
  const maps = { apolice: statusApolice, cliente: statusCliente, lead: statusLead, proposta: statusProposta, sinistro: statusSinistro, comissao: statusComissao, documento: statusDocumento, tarefa: statusTarefa, temperatura }
  const map = maps[type] || {}
  const item = map[status] || { label: status, color: 'slate' }
  return <Badge color={item.color} dot>{item.label}</Badge>
}
