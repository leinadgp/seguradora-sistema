import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Eye, Edit2, FileText, ArrowRight, LayoutGrid, List, ClipboardList, Trash2, FolderUp } from 'lucide-react'
import { input as inputCls } from '../lib/styles'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import FluxoSeguro from '../components/ui/FluxoSeguro'
import Timeline from '../components/ui/Timeline'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import { validarEmail, validarTelefone } from '../lib/validators'
import {
  fmtMoeda, todayISO, genNumero, logEvento,
  cotacaoStatus, cotacaoStatusList, cotacaoKanbanList, tiposSeguro,
} from '../lib/flow'
import { useCatalogo } from '../hooks/useCatalogo'
import SolicitarDocumentosModal from '../components/ui/SolicitarDocumentosModal'

const emptyForm = {
  cliente: '', cpfCnpj: '', telefone: '', whatsapp: '', email: '',
  tipoSeguro: 'Auto', subcategorias: [], coberturas: [], ramo: '',
  seguradorasCotadas: [], seguradora: '', seguradoraId: '', produto: '',
  corretora: '', corretoraId: '', produtor: '', produtorId: '',
  valorEstimado: '', premioLiquido: '', premioBruto: '',
  validadeCotacao: new Date().toISOString().split('T')[0],
  percentualComissaoTotal: '', percentualComissaoAttenti: '75', percentualComissaoMega: '',
  coCorretagem: false, comissao: '',
  responsavel: 'Carlos Silva', status: 'nova', observacoes: '',
}

// Canal de cotação sugerido por tipo de seguro (manual seção 5)
const CANAL_COTACAO = {
  'Seguro Garantia': 'ATTENTI c/ co-corretagem (POTTENCIAL, AVLA, EXCELSIOR, EZZE, TOKIO, PORTO SEGURO) | AGB (BERKLEY, DAYCOVAL, FATOR, JUNTO, SOMBRERO…) | Assessoria Garantia (ALLSEG)',
  'Seguro Licitante': 'ATTENTI c/ co-corretagem | Assessoria AGB ou Garantia',
  'Seguro Judicial': 'ATTENTI c/ co-corretagem | Portal direto: EXCELSIOR, EZZE, POTTENCIAL | AGB / Assessoria Garantia',
  'Risco Engenharia': 'Assessoria AGB / Garantia | AVLA, BERKLEY, FATOR, POTTENCIAL, SOMPO, TOKIO',
  'Fiança Locatícia': 'ATTENTI c/ co-corretagem | FIANZA (Luciana) | NYHAVN (Nathiele)',
  'Capitalização Aluguel': 'Grupo MEGA (emissão) — enviar dados ao backoffice',
  'Auto': 'AGGER (sistema cotador)',
  'Frota': 'Grupo MEGA — e-mail ao backoffice',
  'Residencial': 'AGGER (sistema cotador)',
  'Empresarial': 'AGGER (sistema cotador)',
  'Patrimoniais': 'AGGER (sistema cotador)',
  'Responsabilidade Civil': 'Obras: AGB/Garantia | Profissional (MEGA): AIG, BRADESCO, PORTO SEGUROS, TOKIO',
  'Vida': 'AGGER (Individual) | MEGA — e-mail (Global/PME) | MONGERAL | PRUDENTIAL',
  'Saúde': 'MONGERAL | PRUDENTIAL (somente ATTENTI)',
  'Consórcio': 'Grupo MEGA — WhatsApp ao backoffice',
  'Equipamentos': 'Grupo MEGA — e-mail ao backoffice',
}

const _CABEC = `ENTRADA: DD/MM/202X – NOME DO CLIENTE POR (WHATSAPP OU EMAIL)
PROT VENDA: DD/MM/202X
PRODUTOR DO CLIENTE:
PRODUTOR DE REPASSE:`

const _COT_GAR = `--- COTAÇÃO ---
DD/MM/202X - SUBSCRITOR OU EMISSOR: [nome] - MINUTA [SEGURADORA]: [nome]
COMISSÃO TOTAL %
COM CO-CORRETAGEM ATTENTI %
GRUPO MEGA %
PRÊMIO: R$`

const _COT_STD = `--- COTAÇÃO ---
DD/MM/202X - SUBSCRITOR OU EMISSOR: [nome]
COMISSÃO TOTAL %
COMISSÃO ATTENTI %
PRÊMIO LÍQUIDO: R$
PRÊMIO BRUTO: R$`

const TEMPLATES_OBS = {
  'Seguro Garantia': [
    { label: 'Nova', text: `${_CABEC}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO DO CONTRATO/PEDIDO:
VALOR ESTIMADO DO CONTRATO: R$
VALOR DO CONTRATO: R$
IS (5%) DO CONTRATO: R$
VIGÊNCIA DO CONTRATO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
CLÁUSULA SOBRE GARANTIA NO CONTRATO:
NÚMERO DA PÁGINA:
CONDIÇÕES PARTICULARES:
${_COT_GAR}` },
    { label: 'Endosso', text: `${_CABEC}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ:
TIPO DE ENDOSSO:
SEGURADORA DA APÓLICE A SER ENDOSSADA:
Nº APÓLICE A SER ENDOSSADA:
CONTRATO:
PROCESSO:
EDITAL:
TERMO ADITIVO:
DESCRIÇÃO DA DEMANDA:
OBJETO DO CONTRATO/PEDIDO:
VIGÊNCIA DO TERMO ADITIVO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
CLÁUSULA SOBRE GARANTIA / NÚMERO DA PÁGINA:
CONDIÇÕES PARTICULARES:
${_COT_GAR}` },
  ],
  'Seguro Licitante': [
    { label: 'Nova', text: `${_CABEC}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ:
PROCESSO:
EDITAL:
OBJETO:
VALOR ESTIMADO CONTRATO: R$
IS (%): R$
VIGÊNCIA DA PROPOSTA: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
CLÁUSULA SOBRE GARANTIA NO EDITAL / NÚMERO DA PÁGINA:
CONDIÇÕES PARTICULARES:
${_COT_GAR}` },
  ],
  'Fiança Locatícia': [
    { label: 'Nova', text: `${_CABEC}
IMOBILIÁRIA:
CNPJ IMOBILIÁRIA:
ENDEREÇO DO RISCO:
COBERTURAS:
  ALUGUEL: R$
  IPTU: R$
  ÁGUA: R$
  LUZ: R$
  CONDOMÍNIO: R$
  GÁS: R$
  DANOS AO IMÓVEL: R$
  MULTA POR RESCISÃO: R$
  PINTURA INTERNA OU EXTERNA: R$
VIGÊNCIA DO CONTRATO DE LOCAÇÃO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
NÚMERO CLÁUSULA / NÚMERO DA PÁGINA:
CONDIÇÕES PARTICULARES:
${_COT_GAR}` },
    { label: 'Endosso / Renovação', text: `${_CABEC}
TIPO DE ENDOSSO:
SEGURADORA DA APÓLICE A SER ENDOSSADA:
Nº APÓLICE A SER ENDOSSADA:
IMOBILIÁRIA:
CNPJ IMOBILIÁRIA:
ENDEREÇO DO RISCO:
COBERTURAS: (mesmas da nova)
VIGÊNCIA DO CONTRATO DE LOCAÇÃO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_GAR}` },
  ],
  'Capitalização Aluguel': [
    { label: 'Nova', text: `${_CABEC}
ENDEREÇO DO RISCO:
VALOR ALUGUEL MENSAL: R$
VALOR DO TÍTULO: R$
IMOBILIÁRIA ESTIPULANTE:
VIGÊNCIA DO CONTRATO DE LOCAÇÃO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
--- PROPOSTA ---
DD/MM/202X - PROPOSTA [SEGURADORA]: [nome]
COMISSÃO TOTAL %
COMISSÃO ATTENTI %
PRÊMIO: R$` },
    { label: 'Renovação', text: `${_CABEC}
SEGURADORA DA APÓLICE A SER RENOVADA:
Nº TÍTULO A SER RENOVADO:
VALOR DO TÍTULO A SER RENOVADO: R$
ENDEREÇO DO RISCO:
VALOR ALUGUEL MENSAL: R$
VALOR DO TÍTULO: R$
VIGÊNCIA DO CONTRATO DE LOCAÇÃO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
--- PROPOSTA ---
COMISSÃO TOTAL %  COMISSÃO ATTENTI %  PRÊMIO: R$` },
  ],
  'Seguro Judicial': [
    { label: 'Nova (Execução Fiscal/Civil/Tributária)', text: `${_CABEC}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ:
NÚMERO DO PROCESSO:
CDA:
TIPO DE AÇÃO:
TRIBUNAL:
VARA:
VALOR DA IS + 30%: R$
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_GAR}` },
    { label: 'Nova (Trabalhista)', text: `${_CABEC}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ:
NÚMERO DO PROCESSO:
CDA:
TIPO DE AÇÃO: TRABALHISTA
TRIBUNAL:
VARA:
VALOR DA IS + 30%: R$
ENDEREÇO DO RECLAMANTE:
NÚMERO IDENTIDADE DO RECLAMANTE:
TELEFONE DO RECLAMANTE:
EMAIL DO RECLAMANTE:
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_GAR}` },
    { label: 'Nova (Depósito Recursal)', text: `${_CABEC}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ:
NÚMERO DO PROCESSO:
TIPO DE RECURSO:
TRIBUNAL:
VARA:
VALOR DA IS + 30%: R$
ENDEREÇO DO RECLAMANTE:
NÚMERO IDENTIDADE DO RECLAMANTE:
TELEFONE DO RECLAMANTE:
EMAIL DO RECLAMANTE:
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_GAR}` },
  ],
  'Risco Engenharia': [
    { label: 'Nova', text: `${_CABEC}
BENEFICIÁRIO / CPF OU CNPJ:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO:
ENDEREÇO DO RISCO:
VALOR CONTRATO: R$
LMI: R$
VIGÊNCIA DO CONTRATO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
NÚMERO CLÁUSULA SOBRE O SEGURO / NÚMERO DA PÁGINA:
CONDIÇÕES PARTICULARES:
${_COT_GAR}` },
    { label: 'Endosso', text: `${_CABEC}
BENEFICIÁRIO / CPF OU CNPJ:
TIPO DE ENDOSSO:
SEGURADORA DA APÓLICE A SER ENDOSSADA:
Nº APÓLICE A SER ENDOSSADA:
CONTRATO:
TERMO ADITIVO: (se houver)
OBJETO:
ENDEREÇO DO RISCO:
VALOR CONTRATO: R$
LMI: R$
VIGÊNCIA DO CONTRATO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_GAR}` },
  ],
  'Responsabilidade Civil': [
    { label: 'Nova (Obras / Vinculado)', text: `${_CABEC}
BENEFICIÁRIO / CPF OU CNPJ:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO:
ENDEREÇO DO RISCO:
VALOR CONTRATO: R$
LMI: R$
VIGÊNCIA DO CONTRATO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
NÚMERO CLÁUSULA / NÚMERO DA PÁGINA:
CONDIÇÕES PARTICULARES:
${_COT_STD}` },
    { label: 'Nova (Profissional / Geral)', text: `${_CABEC}
BENEFICIÁRIO / CPF OU CNPJ:
OBJETO:
ENDEREÇO DO RISCO:
LMI: R$
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
    { label: 'Endosso', text: `${_CABEC}
BENEFICIÁRIO / CPF OU CNPJ:
TIPO DE ENDOSSO:
SEGURADORA DA APÓLICE A SER ENDOSSADA:
Nº APÓLICE A SER ENDOSSADA:
CONTRATO:
TERMO ADITIVO: (se houver)
OBJETO:
ENDEREÇO DO RISCO:
VALOR CONTRATO: R$
LMI: R$
VIGÊNCIA DO CONTRATO: DD/MM/202X A DD/MM/202X
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
  ],
  'Auto': [
    { label: 'Nova', text: `${_CABEC}
CARRO ZERO: ( ) SIM ( ) NÃO
VEÍCULO:       PLACA:       ANO:
CHASSI:        RENAVAM:     COR:        COMBUSTÍVEL:
CONDUTOR PRINCIPAL NOME/CPF:
ENDEREÇO PERNOITE:
COBERTURAS E VALORES:
  DANOS MATERIAIS: R$   DANOS CORPORAIS: R$   DANOS MORAIS: R$   APP MORTE/INVALIDEZ: R$
  ASSISTÊNCIA: ( ) Básica ( ) Intermediária ( ) Completa
  VIDROS: ( ) Básico ( ) Completo
  PEQUENOS REPAROS: ( ) Sim ( ) Não
  CARRO RESERVA: ( ) 7 dias ( ) 15 dias ( ) 30 dias ( ) Não
  AR CONDICIONADO: ( ) Sim ( ) Não
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
    { label: 'Renovação / Endosso', text: `${_CABEC}
CARRO ZERO: ( ) SIM ( ) NÃO
VEÍCULO:       PLACA:       ANO:
CHASSI:        RENAVAM:     COR:        COMBUSTÍVEL:
CONDUTOR PRINCIPAL NOME/CPF:
ENDEREÇO PERNOITE:
SEGURADORA DA APÓLICE A SER RENOVADA OU ENDOSSADA:
Nº APÓLICE A SER RENOVADA OU ENDOSSADA:
CI:
BÔNUS DA RENOVAÇÃO:
VALOR PAGO ANTERIORMENTE: R$
COBERTURAS E VALORES: (manter ou alterar?)
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
  ],
  'Frota': [
    { label: 'Nova', text: `${_CABEC}
VEÍCULOS DA FROTA:
  VEÍCULO:  PLACA:  ANO:  CHASSI:  RENAVAN:  COR:  COMBUSTÍVEL:
  CONDUTOR PRINCIPAL NOME/CPF:  ENDEREÇO PERNOITE:
(repetir por veículo)
COBERTURAS E VALORES:
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
    { label: 'Renovação / Endosso', text: `${_CABEC}
SEGURADORA DA APÓLICE A SER RENOVADA OU ENDOSSADA:
Nº APÓLICE A SER RENOVADA OU ENDOSSADA:
VALOR PAGO ANTERIORMENTE: R$
VEÍCULOS DA FROTA: (alterar ou manter?)
COBERTURAS E VALORES:
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
  ],
  'Patrimoniais': [
    { label: 'Nova', text: `${_CABEC}
TEM BENEFICIÁRIO NO SEGURO? ( ) SIM ( ) NÃO
SE SIM: NOME/RAZÃO SOCIAL E CPF/CNPJ:
ENDEREÇO DO RISCO:
VALOR DO IMÓVEL: R$
COBERTURAS:
  INCÊNDIO: R$   DANOS ELÉTRICOS: R$   EQUIPAMENTOS: R$
  ALUGUEL: R$    VIDROS: R$             ROUBO E FURTO: R$
  VENDAVAL: R$   VAZAMENTOS: R$         DANOS MORAIS: R$
  ASSISTÊNCIA: ( ) Básica ( ) Completa
ITEM NOVO: ( ) SIM ( ) NÃO
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
    { label: 'Renovação / Endosso', text: `${_CABEC}
SEGURADORA DA APÓLICE A SER RENOVADA OU ENDOSSADA:
Nº APÓLICE:
VALOR PAGO ANTERIORMENTE: R$
ENDEREÇO DO RISCO:
COBERTURAS: (manter ou alterar?)
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
  ],
  'Equipamentos': [
    { label: 'Novo', text: `${_CABEC}
Nº DE EQUIPAMENTOS:
RELACIONAR OS TIPOS DE EQUIPAMENTOS:
DESCRIÇÃO DOS EQUIPAMENTOS:
COBERTURAS E VALORES:
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
--- COTAÇÃO ---
COMISSÃO TOTAL %  COMISSÃO ATTENTI %  PRÊMIO LÍQUIDO: R$` },
    { label: 'Renovação / Endosso', text: `${_CABEC}
SEGURADORA DA APÓLICE A SER RENOVADA OU ENDOSSADA:
Nº APÓLICE:
VALOR PAGO ANTERIORMENTE: R$
EQUIPAMENTOS: (manter ou alterar?)
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
  ],
  'Eventos': [
    { label: 'Nova', text: `${_CABEC}
NOME DO EVENTO:
ENDEREÇO DO EVENTO:
ORGANIZADOR:
COBERTURAS E VALORES:
PERÍODO DO EVENTO: DD/MM/202X A DD/MM/202X
DATA MONTAGEM:    DATA DESMONTAGEM:
${_COT_STD}` },
    { label: 'Renovação / Endosso', text: `${_CABEC}
SEGURADORA DA APÓLICE A SER RENOVADA OU ENDOSSADA:
Nº APÓLICE:
VALOR PAGO ANTERIORMENTE: R$
NOME DO EVENTO:
PERÍODO DO EVENTO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
  ],
  'Vida PF': [
    { label: 'Nova', text: `${_CABEC}
DATA DE NASCIMENTO:   IDADE:   ESTADO CIVIL:
PROFISSÃO:   RENDA MENSAL: R$
FUMANTE: ( ) SIM ( ) NÃO
PRATICA ESPORTE: ( ) SIM ( ) NÃO — Qual?
APOSENTADO: ( ) SIM ( ) NÃO
COBERTURAS:
  MORTE: R$         MORTE ACIDENTAL: R$
  IPA: R$           IFPD: R$
  DIT: R$           DIH: R$           DOENÇAS GRAVES: R$
  ASSISTÊNCIA FUNERAL: R$
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
--- COTAÇÃO ---
COMISSÃO VITALÍCIA TOTAL %    COMISSÃO VITALÍCIA ATTENTI %
COMISSÃO AGENCIAMENTO TOTAL % COMISSÃO AGENCIAMENTO ATTENTI %
PRÊMIO: R$` },
    { label: 'Renovação / Endosso', text: `${_CABEC}
SEGURADORA DA APÓLICE A SER RENOVADA OU ENDOSSADA:
Nº APÓLICE:   VALOR PAGO ANTERIORMENTE: R$
COBERTURAS: (manter ou alterar?)
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
--- COTAÇÃO ---
COMISSÃO VITALÍCIA TOTAL %    COMISSÃO VITALÍCIA ATTENTI %
COMISSÃO AGENCIAMENTO TOTAL % COMISSÃO AGENCIAMENTO ATTENTI %
PRÊMIO: R$` },
  ],
  'Vida PJ': [
    { label: 'Nova', text: `${_CABEC}
Nº DE VIDAS COLABORADORES:   Nº DE VIDAS SÓCIOS:
TIPO: GLOBAL ( )  PME ( )
DE ACORDO COM CLT? ( ) SIM ( ) NÃO
[Para cada vida:]
  NOME COMPLETO / CPF / DATA DE NASCIMENTO / IDADE
  AFASTADO? ( ) SIM ( ) NÃO — CID se afastado
COBERTURAS:
  MORTE: R$   MORTE ACIDENTAL: R$   IPA: R$   IFPD: R$   ASSISTÊNCIA FUNERAL: R$
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
--- COTAÇÃO ---
COMISSÃO VITALÍCIA TOTAL %    COMISSÃO VITALÍCIA ATTENTI %
COMISSÃO AGENCIAMENTO TOTAL % COMISSÃO AGENCIAMENTO ATTENTI %
PRÊMIO MENSAL: R$   PRÊMIO ANUAL: R$` },
    { label: 'Renovação / Endosso', text: `${_CABEC}
SEGURADORA DA APÓLICE A SER RENOVADA OU ENDOSSADA:
Nº APÓLICE:   VALOR PAGO ANTERIORMENTE: R$
COBERTURAS: (manter ou alterar?)
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
--- COTAÇÃO ---
COMISSÃO VITALÍCIA TOTAL %  COMISSÃO AGENCIAMENTO TOTAL %
PRÊMIO MENSAL: R$  PRÊMIO ANUAL: R$` },
  ],
  'Consórcio': [
    { label: 'Nova', text: `${_CABEC}
TIPO DE CONSÓRCIO:
VALOR DO CRÉDITO SOLICITADO CLIENTE: R$
NÚMERO DE MESES:
--- SIMULAÇÃO ---
COMISSÃO TOTAL %   COMISSÃO ATTENTI %   PRÊMIO: R$` },
  ],
  'Diversos': [
    { label: 'Novo', text: `${_CABEC}
TIPO DE BEM SEGURADO:
DESCRIÇÃO DO BEM SEGURADO:
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
--- COTAÇÃO ---
COMISSÃO TOTAL %   COMISSÃO ATTENTI %   PRÊMIO: R$` },
    { label: 'Renovação / Endosso', text: `${_CABEC}
SEGURADORA DA APÓLICE A SER RENOVADA OU ENDOSSADA:
Nº APÓLICE:   VALOR PAGO ANTERIORMENTE: R$
TIPO DE BEM SEGURADO:
VIGÊNCIA DO SEGURO: DD/MM/202X A DD/MM/202X
${_COT_STD}` },
  ],
}

function StatusChip({ status }) {
  const s = cotacaoStatus[status] || { label: status, color: 'slate' }
  return <Badge color={s.color}>{s.label}</Badge>
}

export default function Cotacoes() {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: cotacoes, create, update, remove } = useResource('cotacoes')
  const { data: seguradoras } = useResource('seguradoras')
  const { data: corretoras } = useResource('corretoras')
  const { data: produtores } = useResource('produtores')
  const { data: usuarios } = useResource('usuarios')
  const { data: configs } = useResource('configuracoes')
  const { data: leads, update: updateLead } = useResource('leads')
  const { data: propostas, create: createProposta } = useResource('propostas')
  const { data: solicitacoes, update: updateSolicitation } = useResource('solicitacoes_documentos')
  const { data: apolices } = useResource('apolices')
  const { data: endossos } = useResource('endossos')
  const { data: historico, refetch: refetchHist } = useResource('historico')

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [view, setView] = useState('kanban')
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [convertConfirm, setConvertConfirm] = useState(null) // { cot } para confirmar gerar proposta
  const [showSolicitar, setShowSolicitar] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { getTipos, getSubcategorias, getCoberturasDaSelecao, getRamo, getEntrada } = useCatalogo()
  const [expandCobs, setExpandCobs] = useState(false)

  function comissaoDaConfig(tipoSeguro) {
    const cfg = configs?.find(c => c.id === 'config')
    if (!cfg?.comissoes) return ''
    const t = (tipoSeguro || '').toLowerCase()
    const map = [['auto', 'auto'], ['automóvel', 'auto'], ['residencial', 'residencial'], ['empresarial', 'empresarial'], ['comercial', 'empresarial'], ['vida', 'vida'], ['saúde', 'saude'], ['odontológico', 'saude'], ['frota', 'frota'], ['rural', 'rural'], ['civil', 'rc'], ['viagem', 'viagem'], ['cons', 'consorcio']]
    for (const [k, v] of map) {
      if (t.includes(k)) return String(cfg.comissoes[v] ?? '')
    }
    return ''
  }

  // Participação ATTENTI na comissão por tipo (manual Seção 4)
  function participacaoAttentiDefault(tipo) {
    const t = (tipo || '').toLowerCase()
    if (/garantia|licitante|judicial|fiança|capitaliz/.test(t)) return '80'
    if (/patrimonial|risco engenh|responsabilidade|equipament/.test(t)) return '70'
    if (/cons[oó]rcio/.test(t)) return '100' // sem co-corretagem MEGA
    return '75'
  }

  function aplicarComissaoDoTipo(tipo, formAtual = {}) {
    const entrada = getEntrada(tipo)
    const attenti = entrada?.comissaoAttenti != null
      ? String(entrada.comissaoAttenti)
      : participacaoAttentiDefault(tipo)
    return {
      ...formAtual,
      percentualComissaoAttenti: attenti,
      coCorretagem: entrada?.coCorretagem !== undefined ? !!entrada.coCorretagem : formAtual.coCorretagem,
      percentualComissaoMega: entrada?.coCorretagem
        ? String(entrada.comissaoMega ?? (100 - Number(attenti)))
        : formAtual.percentualComissaoMega,
    }
  }

  function autoCarregarSeguradoras(tipo) {
    return seguradoras
      .filter(s => s.status !== 'inativa' && (s.segmentos || []).includes(tipo))
      .map(s => ({
        seguradoraId: s.id,
        seguradora: s.nome,
        premioLiquido: '',
        premioBruto: '',
        percentualComissao: s.comissaoMedia ? String(s.comissaoMedia) : '',
        selecionada: false,
      }))
  }

  // Auto-abrir detalhe via ?focus=<id>
  useEffect(() => {
    const focus = searchParams.get('focus')
    if (focus && cotacoes.length) {
      const c = cotacoes.find(x => x.id === focus)
      if (c) { setSelected(c); setShowDetalhes(true) }
      searchParams.delete('focus'); setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, cotacoes]) // eslint-disable-line

  const filtered = cotacoes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.cliente.toLowerCase().includes(q) || (c.numero || '').toLowerCase().includes(q) || (c.cpfCnpj || '').includes(q)
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  function openNew() {
    const tipo = emptyForm.tipoSeguro
    setForm({ ...emptyForm, seguradorasCotadas: autoCarregarSeguradoras(tipo) })
    setIsEditing(false); setShowModal(true)
  }
  function openEdit(c) {
    const segId = c.seguradoraId || seguradoras.find(s => s.nome === c.seguradora)?.id || ''
    const corrId = c.corretoraId || corretoras.find(cor => cor.nome === c.corretora)?.id || ''
    const prodId = c.produtorId || produtores.find(p => p.nome === c.produtor)?.id || ''
    const segCotadas = c.seguradorasCotadas?.length
      ? c.seguradorasCotadas
      : c.seguradora
        ? [{ seguradoraId: segId, seguradora: c.seguradora, premioLiquido: c.premioLiquido || '', premioBruto: c.premioBruto || '', percentualComissao: c.percentualComissaoTotal || '', selecionada: true }]
        : autoCarregarSeguradoras(c.tipoSeguro || emptyForm.tipoSeguro)
    setForm({ ...emptyForm, ...c, seguradoraId: segId, corretoraId: corrId, produtorId: prodId, seguradorasCotadas: segCotadas })
    setIsEditing(true); setShowModal(true); setShowDetalhes(false)
  }
  function openDetalhes(c) { setSelected(c); setShowDetalhes(true) }

  async function handleDelete(id) {
    try {
      await remove(id)
      showToast('Cotação excluída!')
      setConfirmDelete(null)
      if (selected?.id === id) { setShowDetalhes(false); setSelected(null) }
    } catch {
      showToast('Erro ao excluir.', 'error')
    }
  }

  function recalcComissao(premio, pct) {
    const p = Number(premio) || 0, c = Number(pct) || 0
    return p && c ? parseFloat((p * c / 100).toFixed(2)) : ''
  }

  async function handleSave() {
    if (!form.cliente) { showToast('Preencha o nome do cliente.', 'error'); return }
    if (form.email && !validarEmail(form.email)) { showToast('E-mail inválido.', 'error'); return }
    if (form.telefone && !validarTelefone(form.telefone)) { showToast('Telefone inválido.', 'error'); return }
    if (form.coCorretagem) {
      const total = parseFloat(form.percentualComissaoAttenti || 0) + parseFloat(form.percentualComissaoMega || 0)
      if (Math.abs(total - 100) > 0.01) { showToast(`Co-corretagem: ${total.toFixed(1)}% — ATTENTI + MEGA devem somar 100%.`, 'error'); return }
    }
    const winner = form.seguradorasCotadas?.find(s => s.selecionada) || form.seguradorasCotadas?.[0]
    const extraWinner = winner ? {
      seguradora: winner.seguradora,
      seguradoraId: winner.seguradoraId,
      premioLiquido: winner.premioLiquido || form.premioLiquido,
      premioBruto: winner.premioBruto || form.premioBruto,
      percentualComissaoTotal: winner.percentualComissao || form.percentualComissaoTotal,
    } : {}
    const formFinal = { ...form, ...extraWinner }
    const premio = formFinal.premioLiquido || formFinal.premioBruto || 0
    const comissao = recalcComissao(premio, formFinal.percentualComissaoAttenti)
    try {
      if (isEditing) {
        const updated = await update(selected.id, { ...selected, ...formFinal, comissao })
        await logEvento('cotacao', selected.id, 'Cotação atualizada', `Dados da cotação ${selected.numero} atualizados.`)
        showToast('Cotação atualizada!')
        if (selected?.id) setSelected(updated)
      } else {
        const numero = genNumero('COT', cotacoes)
        const novo = await create({
          ...formFinal, comissao, id: Date.now().toString(), numero,
          dataCriacao: todayISO(), converted_proposal_id: null, anexos: [],
        })
        await logEvento('cotacao', novo.id, 'Cotação criada', `Cotação ${numero} criada para ${formFinal.cliente} (${formFinal.tipoSeguro}).`)
        showToast(`Cotação ${numero} criada!`)
      }
      refetchHist()
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar. Verifique a conexão com o servidor.', 'error')
    }
  }

  async function alterarStatus(cot, novoStatus) {
    try {
      const updated = await update(cot.id, { ...cot, status: novoStatus })
      await logEvento('cotacao', cot.id, 'Status atualizado', `Status alterado para "${cotacaoStatus[novoStatus]?.label || novoStatus}".`)
      refetchHist()
      if (selected?.id === cot.id) setSelected(updated)
      if (novoStatus === 'aprovada' && !cot.converted_proposal_id) setConvertConfirm(updated)
    } catch {
      showToast('Erro ao atualizar status.', 'error')
    }
  }

  async function gerarProposta(cot) {
    // Já possui proposta vinculada → oferecer abrir
    if (cot.converted_proposal_id) {
      const existe = propostas.find(p => p.id === cot.converted_proposal_id)
      if (existe) {
        if (window.confirm('Essa cotação já possui uma proposta vinculada. Deseja abrir a proposta existente?')) {
          navigate(`/propostas?focus=${existe.id}`)
        }
        return
      }
    }
    try {
      const numero = genNumero('PROP', propostas)
      const id = Date.now().toString()
      const novaProposta = await createProposta({
        id, numero,
        quote_id: cot.id, cotacaoNumero: cot.numero,
        clienteId: cot.clienteId || '',
        lead_id: cot.lead_id || '',
        cliente: cot.cliente, cpfCnpj: cot.cpfCnpj || '',
        telefone: cot.telefone || '', whatsapp: cot.whatsapp || '', email: cot.email || '',
        tipoSeguro: cot.tipoSeguro, ramo: cot.ramo || '', subcategorias: cot.subcategorias || [], coberturas: cot.coberturas || [],
        seguradora: cot.seguradora, seguradoraId: cot.seguradoraId || '', produto: cot.produto,
        corretora: cot.corretora || '', corretoraId: cot.corretoraId || '',
        produtor: cot.produtor || '', produtorId: cot.produtorId || '',
        seguradorasCotadas: cot.seguradorasCotadas?.map(s => s.seguradora).filter(Boolean) || (cot.seguradora ? [cot.seguradora] : []),
        premio: cot.premioLiquido || cot.premioBruto || cot.premio, melhorValor: cot.premioLiquido || cot.premioBruto || cot.premio, valorApresentado: cot.premioLiquido || cot.premioBruto || cot.premio,
        comissao: cot.comissao,
        percentualComissao: cot.percentualComissaoTotal || cot.percentualComissaoAttenti || cot.percentualComissao || '',
        percentualComissaoTotal: cot.percentualComissaoTotal || '',
        percentualComissaoAttenti: cot.percentualComissaoAttenti || '',
        percentualComissaoMega: cot.percentualComissaoMega || '',
        coCorretagem: cot.coCorretagem || false,
        responsavel: cot.responsavel,
        status: 'em_analise', statusFlow: 'rascunho',
        dataSolicitacao: todayISO(), dataCriacao: todayISO(), dataEnvio: '', dataAprovacao: '',
        observacoes: cot.observacoes || '', anexos: cot.anexos || [],
        converted_policy_id: null,
      })
      // Avança lead para 'proposta_enviada' na pipeline de Leads
      if (cot.lead_id) {
        const linkedLead = leads.find(l => l.id === cot.lead_id)
        if (linkedLead && !['proposta_enviada', 'negociacao', 'ganho'].includes(linkedLead.status)) {
          await updateLead(cot.lead_id, { ...linkedLead, status: 'proposta_enviada' })
        }
      }
      // Cotação permanece em 'aprovada' até a apólice ser gerada (gerarPolice marca como convertida)
      const cotAtualizada = await update(cot.id, { ...cot, converted_proposal_id: id })
      await logEvento('cotacao', cot.id, 'Proposta gerada', `Proposta ${numero} criada a partir da cotação ${cot.numero}.`)
      await logEvento('proposta', id, 'Proposta criada', `Proposta ${numero} criada automaticamente a partir da cotação ${cot.numero}.`)
      refetchHist()
      setSelected(cotAtualizada)
      setConvertConfirm(null)
      setShowDetalhes(false)
      showToast('Proposta criada com sucesso a partir da cotação')
      navigate(`/propostas?focus=${id}`)
    } catch {
      showToast('Erro ao gerar proposta.', 'error')
    }
  }

  // Calcula as etapas do fluxo para o stepper
  function stagesFor(cot) {
    const cs = cotacaoStatus[cot.status] || {}
    const proposta = cot.converted_proposal_id ? propostas.find(p => p.id === cot.converted_proposal_id) : null
    const apolice = proposta?.converted_policy_id ? apolices.find(a => a.id === proposta.converted_policy_id) : null
    const ends = apolice ? endossos.filter(e => e.policy_id === apolice.id || e.apoliceId === apolice.id) : []
    return [
      { key: 'cotacao', label: 'Cotação', stage: cs.stage || 'blue', sub: cs.label },
      proposta
        ? { key: 'proposta', label: 'Proposta', stage: ['aprovada','convertida'].includes(proposta.status) ? 'green' : ['recusada','perdida'].includes(proposta.status) ? 'red' : 'blue', sub: proposta.numero || 'Criada', onClick: () => navigate(`/propostas?focus=${proposta.id}`) }
        : { key: 'proposta', label: 'Proposta', stage: 'gray', sub: 'Não criada' },
      apolice
        ? { key: 'apolice', label: 'Apólice', stage: ['cancelada','vencida'].includes(apolice.status) ? 'red' : 'green', sub: apolice.numero || 'Emitida', onClick: () => navigate(`/apolices?focus=${apolice.id}`) }
        : { key: 'apolice', label: 'Apólice', stage: 'gray', sub: 'Não criada' },
      { key: 'endosso', label: 'Endosso', stage: ends.length ? 'green' : 'gray', sub: ends.length ? `${ends.length} endosso(s)` : 'Nenhum', onClick: apolice ? () => navigate(`/endossos?apolice=${apolice.id}`) : undefined },
    ]
  }

  const eventos = selected ? historico.filter(h => h.entity_type === 'cotacao' && h.entity_id === selected.id) : []

  // Indicadores
  const totalAprovadas = cotacoes.filter(c => c.status === 'aprovada').length
  const totalConvertidas = cotacoes.filter(c => c.converted_proposal_id).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente, número ou CPF/CNPJ..." className={`${inputCls} pl-9 pr-4 py-2.5 rounded-xl`} />
        </div>
        <div className="flex gap-2 shrink-0">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${inputCls} rounded-xl px-3 py-2.5 cursor-pointer`}>
            <option value="todos">Todos os status</option>
            {cotacaoStatusList.map(s => <option key={s} value={s}>{cotacaoStatus[s].label}</option>)}
          </select>
          <div className="flex border border-cyber-border rounded-xl overflow-hidden">
            <button onClick={() => setView('lista')} className={`px-3 py-2.5 ${view === 'lista' ? 'bg-cyber-cyan/10 text-cyber-cyan' : 'text-cyber-muted hover:bg-slate-100'}`} title="Lista"><List size={16} /></button>
            <button onClick={() => setView('kanban')} className={`px-3 py-2.5 ${view === 'kanban' ? 'bg-cyber-cyan/10 text-cyber-cyan' : 'text-cyber-muted hover:bg-slate-100'}`} title="Kanban"><LayoutGrid size={16} /></button>
          </div>
          <Button onClick={openNew} icon={<Plus size={16} />}>Nova Cotação</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm text-cyber-muted">
        <span>{filtered.length} cotações</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-green font-medium">{totalAprovadas} aprovadas</span>
        <span className="text-cyber-dim">·</span>
        <span className="text-cyber-cyan font-medium">{totalConvertidas} convertidas em proposta</span>
      </div>

      {/* Lista */}
      {view === 'lista' && (
        filtered.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title="Nenhuma cotação" description="Crie a primeira cotação para iniciar o fluxo." action={<Button onClick={openNew} icon={<Plus size={16} />}>Nova Cotação</Button>} />
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-cyber-card rounded-2xl p-4 shadow-card border border-cyber-border/40 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyber-cyan">{c.numero}</span>
                      <p className="font-semibold text-cyber-text">{c.cliente}</p>
                      <StatusChip status={c.status} />
                      {c.converted_proposal_id && <Badge color="purple">Proposta vinculada</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-cyber-muted">
                      <span>{c.tipoSeguro} · {c.seguradora}</span>
                      <span>·</span>
                      <span>Resp: {c.responsavel?.split(' ')[0]}</span>
                      {c.dataCriacao && <><span>·</span><span>{c.dataCriacao}</span></>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {(c.premioLiquido || c.premioBruto || c.premio) && <p className="text-lg font-bold text-cyber-text">{fmtMoeda(c.premioLiquido || c.premioBruto || c.premio)}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => openDetalhes(c)} className="flex items-center gap-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 px-3 py-1.5 rounded-lg transition-colors"><Eye size={14} /> Ver</button>
                      <button onClick={() => openEdit(c)} className="text-sm text-cyber-muted hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">Editar</button>
                      {c.converted_proposal_id ? (
                        <button onClick={() => navigate(`/propostas?focus=${c.converted_proposal_id}`)} className="flex items-center gap-1.5 text-sm text-cyber-purple hover:bg-cyber-purple/10 px-3 py-1.5 rounded-lg transition-colors font-medium">Ver Proposta <ArrowRight size={14} /></button>
                      ) : (
                        <button onClick={() => gerarProposta(c)} className="flex items-center gap-1.5 text-sm text-cyber-green hover:bg-cyber-green/10 px-3 py-1.5 rounded-lg transition-colors font-medium"><ClipboardList size={14} /> Gerar Proposta</button>
                      )}
                      <button onClick={() => setConfirmDelete(c)} className="p-1.5 text-cyber-muted hover:text-cyber-red hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Kanban */}
      {view === 'kanban' && (
        <>
          <KanbanCotacoes
            cotacoes={filtered.filter(c => !['recusada', 'cancelada', 'perdida'].includes(c.status))}
            solicitacoes={solicitacoes}
            onDropStatus={(cot, status) => alterarStatus(cot, status)}
            onOpen={openDetalhes}
          />
          <PerdidosCotacoes
            cotacoes={filtered.filter(c => ['recusada', 'cancelada', 'perdida'].includes(c.status))}
            onReativar={cot => alterarStatus(cot, 'nova')}
            onOpen={openDetalhes}
          />
        </>
      )}

      {/* Modal Detalhes */}
      <Modal isOpen={showDetalhes && !!selected} onClose={() => setShowDetalhes(false)} title={selected ? `Cotação ${selected.numero}` : ''} size="lg"
        footer={
          <div className="flex flex-wrap gap-2 justify-between">
            <Button variant="secondary" onClick={() => setShowDetalhes(false)}>Voltar</Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={<FolderUp size={14} />} onClick={() => setShowSolicitar(true)}>Solicitar Documentos</Button>
              <Button variant="secondary" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Editar</Button>
              {selected?.converted_proposal_id ? (
                <Button onClick={() => navigate(`/propostas?focus=${selected.converted_proposal_id}`)} icon={<ArrowRight size={14} />}>Ver Proposta</Button>
              ) : (
                <Button variant="success" icon={<ClipboardList size={14} />} onClick={() => gerarProposta(selected)}>Gerar Proposta</Button>
              )}
            </div>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <FluxoSeguro stages={stagesFor(selected)} />
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-cyber-text text-lg">{selected.cliente}</h3>
                <p className="text-sm text-cyber-muted">{selected.tipoSeguro} · {selected.produto || '—'}</p>
              </div>
              <StatusChip status={selected.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ['CPF/CNPJ', selected.cpfCnpj], ['Telefone', selected.telefone], ['E-mail', selected.email],
                ['Seguradora', selected.seguradora], ['Valor estimado', fmtMoeda(selected.valorEstimado)], ['Prêmio', fmtMoeda(selected.premioLiquido || selected.premioBruto || selected.premio)],
                ['Comissão', `${selected.percentualComissao || 0}% · ${fmtMoeda(selected.comissao)}`], ['Responsável', selected.responsavel], ['Criada em', selected.dataCriacao],
                ['Validade do cálculo', selected.validadeCotacao || '—'],
              ].map(([k, v]) => (
                <div key={k}><p className="text-xs text-cyber-muted mb-0.5">{k}</p><p className="text-sm font-medium text-cyber-text">{v || '—'}</p></div>
              ))}
            </div>
            {selected.seguradorasCotadas?.length > 0 && (
              <div>
                <p className="hud-label mb-2">Seguradoras Cotadas</p>
                <div className="border border-cyber-border/40 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-cyber-surface/60 border-b border-cyber-border/40">
                        <th className="text-left px-3 py-2 text-cyber-muted font-medium">Seguradora</th>
                        <th className="text-left px-3 py-2 text-cyber-muted font-medium">Prêm. Líq.</th>
                        <th className="text-left px-3 py-2 text-cyber-muted font-medium">Prêm. Bruto</th>
                        <th className="text-left px-3 py-2 text-cyber-muted font-medium">Com%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-border/20">
                      {selected.seguradorasCotadas.map((seg, i) => (
                        <tr key={i} className={seg.selecionada ? 'bg-cyber-cyan/5' : ''}>
                          <td className="px-3 py-2 font-medium text-cyber-text flex items-center gap-1.5">
                            {seg.selecionada && <span className="text-cyber-amber text-xs">★</span>}
                            {seg.seguradora}
                          </td>
                          <td className="px-3 py-2 text-cyber-text">{seg.premioLiquido ? fmtMoeda(seg.premioLiquido) : '—'}</td>
                          <td className="px-3 py-2 text-cyber-text">{seg.premioBruto ? fmtMoeda(seg.premioBruto) : '—'}</td>
                          <td className="px-3 py-2 text-cyber-text">{seg.percentualComissao ? `${seg.percentualComissao}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selected.observacoes && <div className="p-3 bg-cyber-surface/60 rounded-xl"><p className="text-xs text-cyber-muted mb-1">Observações</p><p className="text-sm text-cyber-text/80">{selected.observacoes}</p></div>}

            {/* Documentos do Portal */}
            {(() => {
              const sols = solicitacoes.filter(s => s.origemId === selected.id)
              if (!sols.length) return null
              return (
                <div>
                  <p className="hud-label mb-2 flex items-center gap-1.5"><FolderUp size={12} /> Documentos do Portal</p>
                  <div className="space-y-2">
                    {sols.map(sol => {
                      const total = sol.documentos?.length || 0
                      const aprovados = sol.documentos?.filter(d => d.status === 'aprovado').length || 0
                      const pendentes = sol.documentos?.filter(d => d.status === 'enviado').length || 0
                      return (
                        <div key={sol.id} className="border border-cyber-border/40 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 bg-cyber-surface/50">
                            <p className="text-xs font-semibold text-cyber-text">Solicitação de {sol.createdAt}</p>
                            <div className="flex items-center gap-2">
                              {pendentes > 0 && <span className="text-[10px] font-semibold text-cyber-cyan bg-cyber-cyan/10 px-2 py-0.5 rounded-full">{pendentes} aguardando revisão</span>}
                              <span className="text-[10px] text-cyber-muted">{aprovados}/{total} aprovados</span>
                            </div>
                          </div>
                          <div className="divide-y divide-cyber-border/20">
                            {(sol.documentos || []).map((doc, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-1.5">
                                <span className="flex-1 text-xs text-cyber-text truncate">{doc.tipo}</span>
                                {doc.status === 'aprovado' && <span className="text-[10px] text-cyber-green font-medium">✓ Aprovado</span>}
                                {doc.status === 'pendente' && <span className="text-[10px] text-cyber-muted">Aguardando</span>}
                                {doc.status === 'enviado' && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-cyber-cyan font-medium">Enviado</span>
                                    <button onClick={() => { const nd = sol.documentos.map((d, i) => i === idx ? { ...d, status: 'aprovado' } : d); updateSolicitation(sol.id, { ...sol, documentos: nd }) }} className="text-[10px] text-cyber-green hover:underline">Aprovar</button>
                                    <button onClick={() => { const nd = sol.documentos.map((d, i) => i === idx ? { ...d, status: 'recusado' } : d); updateSolicitation(sol.id, { ...sol, documentos: nd }) }} className="text-[10px] text-cyber-red hover:underline">Recusar</button>
                                  </div>
                                )}
                                {doc.status === 'recusado' && <span className="text-[10px] text-cyber-red font-medium">✗ Recusado</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div>
              <p className="hud-label mb-2">Alterar status</p>
              <div className="flex flex-wrap gap-2">
                {cotacaoStatusList.filter(s => s !== selected.status && s !== 'convertida').map(s => (
                  <button key={s} onClick={() => alterarStatus(selected, s)} className="text-[11px] px-2.5 py-1 rounded-full border border-cyber-border hover:border-cyber-cyan/40 text-cyber-muted hover:text-cyber-cyan transition-colors cursor-pointer">
                    {cotacaoStatus[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="hud-label mb-2">Histórico</p>
              <Timeline events={eventos} />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Cadastro/Edição */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'Editar Cotação' : 'Nova Cotação'} size="lg"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>{isEditing ? 'Salvar' : 'Criar Cotação'}</Button></div>}
      >
        <div className="space-y-4">
          <Section title="Dados do Cliente">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FF label="Nome do cliente *" span><input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} className={inputCls} /></FF>
              <FF label="CPF/CNPJ"><input value={form.cpfCnpj} onChange={e => setForm(f => ({ ...f, cpfCnpj: e.target.value }))} className={inputCls} /></FF>
              <FF label="Telefone"><input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className={inputCls} placeholder="(00) 00000-0000" /></FF>
              <FF label="WhatsApp"><input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className={inputCls} placeholder="(00) 00000-0000" /></FF>
              <FF label="E-mail" span><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></FF>
            </div>
          </Section>
          <Section title="Dados do Seguro">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FF label="Tipo de seguro">
                <select
                  value={form.tipoSeguro}
                  onChange={e => {
                    const tipo = e.target.value
                    setExpandCobs(false)
                    setForm(f => {
                      const base = aplicarComissaoDoTipo(tipo, { ...f, tipoSeguro: tipo, subcategorias: [], coberturas: [], ramo: getRamo(tipo) })
                      const cfgComissao = comissaoDaConfig(tipo)
                      return {
                        ...base,
                        percentualComissaoTotal: f.seguradoraId ? f.percentualComissaoTotal : (cfgComissao || f.percentualComissaoTotal),
                        seguradorasCotadas: autoCarregarSeguradoras(tipo),
                        seguradora: '', seguradoraId: '',
                      }
                    })
                  }}
                  className={inputCls}
                >
                  {getTipos(['seguro', 'saude', 'previdencia', 'consorcio']).map(t => <option key={t}>{t}</option>)}
                </select>
                {CANAL_COTACAO[form.tipoSeguro] && (
                  <p className="mt-1 text-[10px] text-cyber-cyan/70 leading-relaxed">📌 {CANAL_COTACAO[form.tipoSeguro]}</p>
                )}
              </FF>
              <FF label="Subtipo / Ramo">
                <div className="flex flex-wrap gap-1.5 mt-1 min-h-[32px]">
                  {getSubcategorias(form.tipoSeguro).map(s => {
                    const sel = (form.subcategorias || []).includes(s.nome)
                    return (
                      <button key={s.id} type="button"
                        onClick={() => setForm(f => {
                          const arr = f.subcategorias || []
                          const newSubs = arr.includes(s.nome) ? arr.filter(x => x !== s.nome) : [...arr, s.nome]
                          const validCobs = getCoberturasDaSelecao(f.tipoSeguro, newSubs)
                          return { ...f, subcategorias: newSubs, coberturas: (f.coberturas || []).filter(c => validCobs.includes(c)) }
                        })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${sel ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/40' : 'bg-cyber-surface/50 text-cyber-muted border-cyber-border/40 hover:border-cyber-cyan/30'}`}>
                        {s.nome}
                      </button>
                    )
                  })}
                  {getSubcategorias(form.tipoSeguro).length === 0 && (
                    <span className="text-xs text-cyber-muted self-center">Selecione o tipo acima</span>
                  )}
                </div>
              </FF>
              {(form.subcategorias || []).length > 0 && (() => {
                const todas = getCoberturasDaSelecao(form.tipoSeguro, form.subcategorias || [])
                if (!todas.length) return null
                const visiveis = expandCobs ? todas : todas.slice(0, 8)
                return (
                  <FF label={<>Coberturas{(form.coberturas || []).length > 0 && <span className="ml-2 text-cyber-purple font-normal normal-case">{(form.coberturas || []).length} selecionada(s)</span>}</>}>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {visiveis.map(c => {
                        const sel = (form.coberturas || []).includes(c)
                        return (
                          <button key={c} type="button"
                            onClick={() => setForm(f => { const arr = f.coberturas || []; return { ...f, coberturas: arr.includes(c) ? arr.filter(x => x !== c) : [...arr, c] } })}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${sel ? 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/40' : 'bg-cyber-surface/40 text-cyber-muted border-cyber-border/30 hover:border-cyber-purple/30'}`}>
                            {c}
                          </button>
                        )
                      })}
                      {todas.length > 8 && (
                        <button type="button" onClick={() => setExpandCobs(v => !v)}
                          className="px-2 py-0.5 rounded-md text-[10px] text-cyber-cyan border border-cyber-cyan/30 hover:bg-cyber-cyan/10 transition-colors">
                          {expandCobs ? 'Ver menos ▲' : `+${todas.length - 8} Ver mais ▼`}
                        </button>
                      )}
                    </div>
                  </FF>
                )
              })()}
              <FF label={<>Seguradoras para Cotar <span className="text-cyber-cyan/60 font-normal normal-case">(carregadas pelo tipo de seguro)</span></>} span>
                {(form.seguradorasCotadas || []).length === 0 ? (
                  <p className="text-xs text-cyber-muted py-2 italic">Nenhuma seguradora encontrada para o tipo "{form.tipoSeguro}". Verifique os segmentos cadastrados nas seguradoras.</p>
                ) : (
                  <div className="border border-cyber-border/40 rounded-xl overflow-hidden mt-1">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-cyber-surface/60 border-b border-cyber-border/40">
                          <th className="text-left px-3 py-2 text-cyber-muted font-medium">Seguradora</th>
                          <th className="text-left px-3 py-2 text-cyber-muted font-medium w-28">Prêm. Líq.</th>
                          <th className="text-left px-3 py-2 text-cyber-muted font-medium w-28">Prêm. Bruto</th>
                          <th className="text-left px-3 py-2 text-cyber-muted font-medium w-20">Com%</th>
                          <th className="px-3 py-2 text-cyber-muted font-medium text-center w-16">Escolha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/20">
                        {(form.seguradorasCotadas || []).map((seg, i) => (
                          <tr key={seg.seguradoraId} className={seg.selecionada ? 'bg-cyber-cyan/5' : 'hover:bg-cyber-surface/30'}>
                            <td className="px-3 py-2 font-medium text-cyber-text">{seg.seguradora}</td>
                            <td className="px-2 py-1.5">
                              <input type="number" value={seg.premioLiquido}
                                onChange={e => setForm(f => { const arr = [...f.seguradorasCotadas]; arr[i] = { ...arr[i], premioLiquido: e.target.value }; return { ...f, seguradorasCotadas: arr } })}
                                className={inputCls + ' py-1 text-xs'} placeholder="R$" />
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" value={seg.premioBruto}
                                onChange={e => setForm(f => { const arr = [...f.seguradorasCotadas]; arr[i] = { ...arr[i], premioBruto: e.target.value }; return { ...f, seguradorasCotadas: arr } })}
                                className={inputCls + ' py-1 text-xs'} placeholder="R$" />
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" step="0.01" value={seg.percentualComissao}
                                onChange={e => setForm(f => { const arr = [...f.seguradorasCotadas]; arr[i] = { ...arr[i], percentualComissao: e.target.value }; return { ...f, seguradorasCotadas: arr } })}
                                className={inputCls + ' py-1 text-xs'} placeholder="%" />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button type="button"
                                onClick={() => setForm(f => {
                                  const arr = f.seguradorasCotadas.map((s, j) => ({ ...s, selecionada: j === i }))
                                  const w = arr[i]
                                  return {
                                    ...f,
                                    seguradorasCotadas: arr,
                                    seguradora: w.seguradora,
                                    seguradoraId: w.seguradoraId,
                                    premioLiquido: w.premioLiquido || f.premioLiquido,
                                    premioBruto: w.premioBruto || f.premioBruto,
                                    percentualComissaoTotal: w.percentualComissao || f.percentualComissaoTotal,
                                  }
                                })}
                                className={`text-lg leading-none transition-colors ${seg.selecionada ? 'text-cyber-amber' : 'text-cyber-border hover:text-cyber-amber/60'}`}
                                title="Marcar como seguradora escolhida"
                              >★</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(form.seguradorasCotadas || []).some(s => s.selecionada) && (
                      <div className="px-3 py-1.5 bg-cyber-amber/5 border-t border-cyber-border/30 text-[10px] text-cyber-amber/80">
                        ★ Escolhida: {(form.seguradorasCotadas || []).find(s => s.selecionada)?.seguradora}
                      </div>
                    )}
                  </div>
                )}
              </FF>
              <FF label="Produto / Plano">
                <select value={form.produto} onChange={e => setForm(f => ({ ...f, produto: e.target.value }))} className={inputCls}>
                  <option value="">Selecione o subtipo...</option>
                  {getSubcategorias(form.tipoSeguro).map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
              </FF>
              <FF label="Corretora (co-corretagem)">
                <select value={form.corretoraId} onChange={e => {
                  const cor = corretoras.find(c => c.id === e.target.value)
                  setForm(f => ({
                    ...f,
                    corretoraId: e.target.value,
                    corretora: cor?.nome || '',
                    coCorretagem: !!cor,
                    percentualComissaoMega: cor?.percentualCocorretagem ? String(cor.percentualCocorretagem) : f.percentualComissaoMega,
                    percentualComissaoAttenti: cor?.percentualCocorretagem
                      ? String(100 - Number(cor.percentualCocorretagem))
                      : f.percentualComissaoAttenti,
                  }))
                }} className={inputCls}>
                  <option value="">Sem co-corretagem</option>
                  {corretoras.filter(c => c.status !== 'inativa').map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </FF>
              <FF label="Produtor / Corretor">
                <select value={form.produtorId} onChange={e => {
                  const prod = produtores.find(p => p.id === e.target.value)
                  setForm(f => ({
                    ...f,
                    produtorId: e.target.value,
                    produtor: prod?.nome || '',
                  }))
                }} className={inputCls}>
                  <option value="">Selecione o produtor...</option>
                  {produtores.filter(p => p.status !== 'inativo').map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </FF>
            </div>
          </Section>
          <Section title="Valores">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FF label="Valor estimado (R$)"><input type="number" value={form.valorEstimado} onChange={e => setForm(f => ({ ...f, valorEstimado: e.target.value }))} className={inputCls} /></FF>
              <FF label="Validade do cálculo"><input type="date" value={form.validadeCotacao} onChange={e => setForm(f => ({ ...f, validadeCotacao: e.target.value }))} className={inputCls} /></FF>
              <FF label="Prêmio líquido (R$)"><input type="number" value={form.premioLiquido} onChange={e => setForm(f => ({ ...f, premioLiquido: e.target.value }))} className={inputCls} /></FF>
              <FF label="Prêmio bruto (R$)"><input type="number" value={form.premioBruto} onChange={e => setForm(f => ({ ...f, premioBruto: e.target.value }))} className={inputCls} /></FF>
              <FF label="Comissão total (%)">
                <input type="number" step="0.01" value={form.percentualComissaoTotal}
                  onChange={e => setForm(f => ({ ...f, percentualComissaoTotal: e.target.value }))}
                  className={inputCls} placeholder="Ex: 15" />
              </FF>
              <FF label={`Comissão ATTENTI (%) ${form.percentualComissaoAttenti ? `— ${form.percentualComissaoAttenti}%` : ''}`}>
                <input type="number" step="0.01" value={form.percentualComissaoAttenti}
                  onChange={e => setForm(f => ({ ...f, percentualComissaoAttenti: e.target.value }))}
                  className={inputCls + ' bg-cyber-cyan/5'} placeholder="Auto-preenchido pelo tipo" />
              </FF>
              {form.coCorretagem && (
                <FF label="Co-corretagem Grupo MEGA (%)">
                  <input type="number" step="0.01" value={form.percentualComissaoMega}
                    onChange={e => setForm(f => ({ ...f, percentualComissaoMega: e.target.value }))}
                    className={inputCls + ' bg-violet-500/5'} />
                </FF>
              )}
            </div>
          </Section>
          <Section title="Gestão">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FF label="Responsável"><select value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className={inputCls}>{usuarios.map(u => <option key={u.id}>{u.nome}</option>)}</select></FF>
              <FF label="Status"><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>{cotacaoStatusList.filter(s => s !== 'convertida').map(s => <option key={s} value={s}>{cotacaoStatus[s].label}</option>)}</select></FF>
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-xs font-medium text-cyber-muted">Observações</label>
                  {(TEMPLATES_OBS[form.tipoSeguro]?.length ?? 0) > 0 && (
                    <select
                      value=""
                      onChange={e => {
                        if (!e.target.value) return
                        const tmpl = TEMPLATES_OBS[form.tipoSeguro]?.find(t => t.label === e.target.value)
                        if (tmpl) setForm(f => ({ ...f, observacoes: tmpl.text }))
                      }}
                      className="text-xs border border-cyber-cyan/30 rounded-lg px-2 py-1 bg-cyber-cyan/5 text-cyber-cyan focus:outline-none cursor-pointer"
                    >
                      <option value="">📋 Template...</option>
                      {TEMPLATES_OBS[form.tipoSeguro].map(t => (
                        <option key={t.label} value={t.label}>{t.label}</option>
                      ))}
                    </select>
                  )}
                </div>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={5}
                  className={inputCls + ' resize-y font-mono text-xs'}
                />
              </div>
            </div>
          </Section>
        </div>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      {confirmDelete && (
        <Modal isOpen title="Confirmar exclusão" onClose={() => setConfirmDelete(null)} size="sm"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete.id)}>Excluir</Button>
            </div>
          }
        >
          <p className="text-sm text-cyber-text">Excluir a cotação <strong className="text-cyber-red">"{confirmDelete.numero || confirmDelete.cliente}"</strong>?</p>
          <p className="text-xs text-cyber-muted mt-2">Esta ação não pode ser desfeita.</p>
        </Modal>
      )}

      {/* Confirmar gerar proposta (após arrastar p/ Aprovada) */}
      <Modal isOpen={!!convertConfirm} onClose={() => setConvertConfirm(null)} title="Gerar proposta?" size="sm"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setConvertConfirm(null)}>Agora não</Button><Button variant="success" onClick={() => gerarProposta(convertConfirm)}>Gerar Proposta</Button></div>}
      >
        <div className="text-center py-3">
          <div className="w-14 h-14 bg-cyber-green/10 rounded-full flex items-center justify-center mx-auto mb-3"><ClipboardList size={26} className="text-cyber-green" /></div>
          <p className="text-sm text-cyber-muted">A cotação de <strong className="text-cyber-text">{convertConfirm?.cliente}</strong> foi aprovada. Deseja gerar a proposta agora?</p>
        </div>
      </Modal>

      {selected && (
        <SolicitarDocumentosModal
          isOpen={showSolicitar}
          onClose={() => setShowSolicitar(false)}
          cliente={selected.cliente}
          clienteId={selected.clienteId || ''}
          whatsapp={selected.whatsapp || ''}
          tipoSeguro={selected.tipoSeguro}
          origem="cotacao"
          origemId={selected.id}
          origemNumero={selected.numero}
        />
      )}
    </div>
  )
}

function Section({ title, children }) {
  return <div><p className="hud-label mb-2">{title}</p>{children}</div>
}
function FF({ label, children, span }) {
  return <div className={span ? 'sm:col-span-2' : ''}><label className="block text-xs font-medium text-cyber-muted mb-1">{label}</label>{children}</div>
}

function KanbanCotacoes({ cotacoes, onDropStatus, onOpen, solicitacoes = [] }) {
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const scrollRef = useRef(null)
  const scrollState = useRef({ dragging: false, startX: 0, scrollLeft: 0 })
  const touchState = useRef({ cardId: null })

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto pb-2 -mx-1 px-1 select-none"
      style={{ cursor: dragId ? 'default' : 'grab' }}
      onMouseDown={e => {
        if (e.button !== 0 || e.target.closest('[data-drag-card]')) return
        scrollState.current = { dragging: true, startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft }
        e.currentTarget.style.cursor = 'grabbing'
      }}
      onMouseMove={e => {
        if (!scrollState.current.dragging) return
        if (scrollRef.current) scrollRef.current.scrollLeft = scrollState.current.scrollLeft - (e.clientX - scrollState.current.startX)
      }}
      onMouseUp={e => { scrollState.current.dragging = false; e.currentTarget.style.cursor = dragId ? 'default' : 'grab' }}
      onMouseLeave={() => { scrollState.current.dragging = false }}
    >
      <div className="flex gap-3 min-w-max">
        {cotacaoKanbanList.map(col => {
          const items = cotacoes.filter(c => c.status === col)
          const isOver = dragOver === col
          return (
            <div key={col} className="w-64 shrink-0"
              data-kanban-col={col}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOver !== col) setDragOver(col) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
              onDrop={e => {
                e.preventDefault()
                const c = cotacoes.find(x => x.id === dragId)
                if (c && c.status !== col) onDropStatus(c, col)
                setDragId(null); setDragOver(null)
              }}
            >
              <div className={`bg-cyber-surface/60 border rounded-2xl p-2.5 transition-all duration-150 ${isOver ? 'border-cyber-cyan/50 bg-cyber-cyan/5 ring-2 ring-cyber-cyan/20' : 'border-cyber-border/60'}`}>
                <div className="flex items-center justify-between px-1.5 mb-2.5">
                  <span className="text-xs font-semibold text-cyber-text">{cotacaoStatus[col]?.label || col}</span>
                  <span className={`text-[10px] bg-cyber-card border rounded-full px-2 py-0.5 transition-colors ${isOver ? 'border-cyber-cyan/40 text-cyber-cyan' : 'border-cyber-border text-cyber-muted'}`}>{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[52px]">
                  {items.map(c => (
                    <div key={c.id}
                      data-drag-card="true"
                      draggable
                      onDragStart={e => { setDragId(c.id); e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => { setDragId(null); setDragOver(null) }}
                      onTouchStart={() => { touchState.current.cardId = c.id }}
                      onTouchMove={e => e.preventDefault()}
                      onTouchEnd={e => {
                        const t = e.changedTouches[0]
                        const el = document.elementFromPoint(t.clientX, t.clientY)
                        const tc = el?.closest('[data-kanban-col]')?.getAttribute('data-kanban-col')
                        if (tc && touchState.current.cardId) {
                          const item = cotacoes.find(x => x.id === touchState.current.cardId)
                          if (item && item.status !== tc) onDropStatus(item, tc)
                        }
                        touchState.current.cardId = null; setDragOver(null)
                      }}
                      onClick={() => onOpen(c)}
                      className={`bg-cyber-card border border-cyber-border/50 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-cyber-cyan/40 hover:shadow-card-md transition-all duration-200 ${dragId === c.id ? 'opacity-40 scale-95 shadow-none' : ''}`}
                    >
                      <p className="font-mono text-[10px] text-cyber-cyan mb-0.5">{c.numero}</p>
                      <p className="text-sm font-semibold text-cyber-text leading-tight">{c.cliente}</p>
                      <p className="text-xs text-cyber-muted mt-0.5">{c.tipoSeguro} · {c.seguradora || '—'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-cyber-text">{fmtMoeda(c.premioLiquido || c.premioBruto || c.premio)}</span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {c.lead_id && <span className="text-[10px] text-cyber-amber/90 bg-cyber-amber/10 px-1.5 py-0.5 rounded font-medium">🔗 Lead</span>}
                          {c.seguradorasCotadas?.length > 1 && <span className="text-[10px] text-cyber-cyan/90 bg-cyber-cyan/10 px-1.5 py-0.5 rounded font-medium">{c.seguradorasCotadas.length} seg.</span>}
                          {c.converted_proposal_id && <Badge color="purple">Proposta</Badge>}
                          {(() => {
                            const sol = solicitacoes.find(s => s.origemId === c.id)
                            if (!sol) return null
                            const pend = sol.documentos?.filter(d => d.status === 'enviado').length || 0
                            return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${pend > 0 ? 'text-cyber-cyan bg-cyber-cyan/10' : 'text-cyber-muted bg-cyber-surface'}`}>📄 {pend > 0 ? `${pend} p/ revisar` : 'Docs'}</span>
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className={`border-2 border-dashed rounded-xl py-5 text-center transition-colors duration-150 ${isOver ? 'border-cyber-cyan/50 bg-cyber-cyan/5' : 'border-cyber-border/40'}`}>
                      <p className={`text-[10px] font-medium ${isOver ? 'text-cyber-cyan' : 'text-cyber-muted'}`}>{isOver ? '↓ Soltar aqui' : '—'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PerdidosCotacoes({ cotacoes, onReativar, onOpen }) {
  const [open, setOpen] = useState(false)
  if (cotacoes.length === 0) return null
  return (
    <div className="border border-cyber-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/40 transition-colors">
        <span className="flex items-center gap-2">
          Perdidas / Recusadas
          <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold">{cotacoes.length}</span>
        </span>
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {cotacoes.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-cyber-card/60 border border-cyber-border/30 rounded-xl px-3 py-2.5 cursor-pointer" onClick={() => onOpen(c)}>
              <div>
                <p className="text-xs font-mono text-cyber-muted">{c.numero}</p>
                <p className="text-sm font-medium text-cyber-text/70">{c.cliente}</p>
                <p className="text-xs text-cyber-muted">{c.tipoSeguro}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); onReativar(c) }} className="text-xs text-cyber-cyan hover:underline ml-2 shrink-0">Reativar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
