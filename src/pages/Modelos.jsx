import { useState, useMemo } from 'react'
import { Copy, Check, MessageSquare, Mail, ChevronDown, ChevronUp, Plus, Edit2, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import useResource from '../hooks/useResource'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const MODELOS_PADRAO = [
  // ─── WhatsApp ─────────────────────────────────────────────────
  {
    id: 'wa-entrada',
    categoria: 'WhatsApp',
    titulo: 'Entrada de Demanda (WhatsApp)',
    tipoSeguro: 'Todos',
    assunto: null,
    corpo: `PRODUTOR DO CLIENTE:
PRODUTOR DE REPASSE:
TIPO DE DEMANDA:
RAZÃO SOCIAL OU NOME CLIENTE:
CPF OU CNPJ:
ENTRADA POR WHATSAPP
DATA ENTRADA: DD/MM/2025
NOME CLIENTE QUE SOLICITOU:
TELEFONE:
DATA PARA RETORNO: DD/MM/2025
HORÁRIO RETORNO:
OBS:`,
  },
  {
    id: 'wa-simulacao-consorcio',
    categoria: 'WhatsApp',
    titulo: 'Dados para Simulação de Consórcio',
    tipoSeguro: 'Consórcio',
    assunto: null,
    corpo: `Olá, tudo bem?
Envie por favor:
- Qual o valor do crédito?
- Para quando pretende ser contemplado?
- Terá algum valor para dar de lance?`,
  },
  {
    id: 'wa-garantia-vencer',
    categoria: 'WhatsApp',
    titulo: 'Aviso de Garantia a Vencer',
    tipoSeguro: 'Seguro Garantia',
    assunto: null,
    corpo: `Somos da equipe Attenti Corretora de Seguros.
O contato refere-se ao final de vigência do seu seguro:
- Segurado:
- Tomador:
- Item segurado:
- Número da apólice:
- Seguradora:
- Final da vigência do seguro:

[PARA GARANTIA DE CONTRATO:] Gentileza verificar se os contratos ainda demandam garantia...
[PARA LICITANTE:] Caso tenham ganho a licitação, estamos à disposição para cotação do seguro do contrato...`,
  },
  {
    id: 'wa-dados-consorcio-bradesco',
    categoria: 'WhatsApp',
    titulo: 'Dados Cadastrais — Consórcio Bradesco',
    tipoSeguro: 'Consórcio',
    assunto: null,
    corpo: `CPF / Nome completo / RG / Data de emissão / Órgão Emissor / Data de Nascimento / Sexo / Nacionalidade
UF Naturalidade / Naturalidade / Estado Civil / Nome do Pai / Nome da Mãe
Nome da Empresa / Data da Admissão / Renda / Categoria Profissional / Profissão
Tipo Residência (Alugada ou Própria?) / Emancipado (Sim ou Não?) / Tempo de Residência
Cônjuge: Nome / CPF
Endereço: Tipo (Residencial ou Comercial?) / CEP / Estado / Cidade / Endereço / Nº / Bairro / Telefone`,
  },
  {
    id: 'wa-docs-pf-garantia',
    categoria: 'WhatsApp',
    titulo: 'Documentos PF para Seguro Garantia',
    tipoSeguro: 'Seguro Garantia',
    assunto: null,
    corpo: `Documentos necessários para Seguro Garantia (PF):
- Identidade
- CPF
- Declaração de Imposto de Renda (declaração + recibo)
- Comprovante de Renda
- Identidade dos cônjuges (se houver)
- Certidão de casamento dos sócios (se houver)`,
  },

  // ─── E-mail ────────────────────────────────────────────────────
  {
    id: 'email-confirmacao-entrada',
    categoria: 'E-mail',
    titulo: 'Confirmação de Recebimento (entrada)',
    tipoSeguro: 'Todos',
    assunto: '[MODALIDADE DE SEGURO] – [CONTRATO] – [NOME/RAZÃO SOCIAL] – [ID PRE ATTENTI]',
    corpo: `Prezado(a), bom dia/boa tarde.

A demanda foi encaminhada para cotação. Em breve retornaremos.`,
  },
  {
    id: 'email-envio-cotacao',
    categoria: 'E-mail',
    titulo: 'Envio de Cotação ao Cliente',
    tipoSeguro: 'Todos',
    assunto: 'SEGURO [MODALIDADE] - [CONTRATO/ENDEREÇO/PLACA] - [NOME/RAZÃO SOCIAL] - [ID PRE ATTENTI]',
    corpo: `Prezado(a) [NOME], bom dia/boa tarde.

Segue a cotação/proposta para conferência e validação.

Condição de pagamento: R$ [VALOR] (à vista ou parcelado conforme negociação)

[PARA SEGURO GARANTIA:]
Caso esteja de acordo com a minuta, gentileza assinar o link ZAPSIGN abaixo, para que possamos solicitar a emissão da apólice.

[PARA OUTROS SEGUROS:]
Caso esteja de acordo com a cotação, responder com "DE ACORDO" para que possamos encaminhar o link ZAPSIGN da proposta para assinatura.

[SE HOUVER CONDICIONANTES:]
Condicionantes para emissão da apólice:
1. Minuta assinada por ZAPSIGN
2. Contrato Contra Garantia (CCG) assinado com certificação digital
3. Envio de Declaração de não sinistralidade (conforme anexo)

Qualquer dúvida, à disposição.`,
  },
  {
    id: 'email-agb-re-nova',
    categoria: 'E-mail',
    titulo: 'AGB — Risco Engenharia + RC Obras (Nova)',
    tipoSeguro: 'Risco Engenharia',
    assunto: 'AGB - RISCO ENGENHARIA + RC OBRAS - CONTRATO [X] - TOMADOR: [RAZÃO SOCIAL] - ID PRE ATTENTI [X]',
    corpo: `PARA: AGB ASSESSORIA MEGA
CC: rebeca.paula@megasegurpe.com.br / carlinelima.cl@gmail.com

ENVIAR:
1) Contrato com demanda
2) Cronograma Físico-Financeiro
3) Projeto
4) Questionário de Risco Engenharia
5) Documentos de cadastro (cliente novo)

CORRETORA: LAGOON OU MEGA
MODALIDADE:
SEGURADO:
CNPJ SEGURADO:
BENEFICIÁRIO:
CNPJ BENEFICIÁRIO:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO:
ENDEREÇO DO RISCO:
VALOR CONTRATO: R$
LMI: R$
VIGÊNCIA DO CONTRATO:
VIGÊNCIA DO SEGURO:`,
  },
  {
    id: 'email-agb-re-endosso',
    categoria: 'E-mail',
    titulo: 'AGB — Risco Engenharia + RC Obras (Endosso)',
    tipoSeguro: 'Risco Engenharia',
    assunto: 'AGB - RISCO ENGENHARIA + RC OBRAS - CONTRATO [X] - TOMADOR: [RAZÃO SOCIAL] - ID PRE ATTENTI [X] - ENDOSSO',
    corpo: `PARA: AGB ASSESSORIA MEGA
CC: rebeca.paula@megasegurpe.com.br / carlinelima.cl@gmail.com

ENVIAR:
1) Contrato com demanda
2) Cronograma Físico-Financeiro
3) Projeto
4) Documentos de cadastro (se cliente novo)
5) Apólice ou Endosso a endossar

CORRETORA: LAGOON OU MEGA
[campos iguais ao modelo Nova, acrescido de:]
TIPO DE ENDOSSO:
SEGURADORA DA APÓLICE A SER ENDOSSADA:
Nº APÓLICE A SER ENDOSSADA:
TERMO ADITIVO: (se houver)
VIGÊNCIA DO TERMO ADITIVO:`,
  },
  {
    id: 'email-agb-garantia-nova',
    categoria: 'E-mail',
    titulo: 'AGB — Seguro Garantia (Nova)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'AGB - SEGURO GARANTIA - CONTRATO [X] - TOMADOR: [RAZÃO SOCIAL] - ID PRE ATTENTI [X]',
    corpo: `PARA: AGB ASSESSORIA MEGA
CC: rebeca.paula@megasegurpe.com.br / carlinelima.cl@gmail.com

ATTENTI CORRETORA DE SEGUROS LTDA com co-corretagem:
PARTICIPAÇÃO ATTENTI: 80% / PARTICIPAÇÃO LAGOON OU MEGA: 20%

MODALIDADE:
TOMADOR:
CNPJ TOMADOR:
SEGURADO:
CNPJ SEGURADO:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO:
VALOR CONTRATO: R$
IS (%): R$
VIGÊNCIA DO CONTRATO:
VIGÊNCIA DO SEGURO:
COBERTURA TRABALHISTA E PREVIDENCIÁRIA: ( ) SIM ( ) NÃO
COBERTURA DE MULTAS: ( ) SIM ( ) NÃO
OUTRAS COBERTURAS:`,
  },
  {
    id: 'email-agb-garantia-endosso',
    categoria: 'E-mail',
    titulo: 'AGB — Seguro Garantia (Endosso)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'AGB - SEGURO GARANTIA - CONTRATO [X] - TOMADOR: [RAZÃO SOCIAL] - ID PRE ATTENTI [X] - ENDOSSO',
    corpo: `PARA: AGB ASSESSORIA MEGA
CC: rebeca.paula@megasegurpe.com.br / carlinelima.cl@gmail.com

ATTENTI CORRETORA DE SEGUROS LTDA com co-corretagem:
PARTICIPAÇÃO ATTENTI: 80% / PARTICIPAÇÃO LAGOON OU MEGA: 20%

[campos iguais ao modelo Nova, acrescido de:]
ENDOSSO APÓLICE:
TIPO DE ENDOSSO:
SEGURADORA DA APÓLICE A SER ENDOSSADA:
Nº APÓLICE A SER ENDOSSADA:
TERMO ADITIVO:
VALOR CONTRATO ATUAL: R$
IS ATUAL (%): R$`,
  },
  {
    id: 'email-dank-nova',
    categoria: 'E-mail',
    titulo: 'DANK — Seguro Garantia (Nova)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'DANK - SEGURO GARANTIA - [RAZÃO SOCIAL] - ID PRE ATTENTI [X]',
    corpo: `PARA: fernanda@dankbrasil.com.br
CORRETORA: ATTENTI CORRETORA DE SEGUROS LTDA

MODALIDADE:
TOMADOR:
CNPJ TOMADOR:
SEGURADO:
CNPJ SEGURADO:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO:
VALOR CONTRATO: R$
IS (%): R$
VIGÊNCIA DO CONTRATO:
VIGÊNCIA DO SEGURO:`,
  },
  {
    id: 'email-dank-endosso',
    categoria: 'E-mail',
    titulo: 'DANK — Seguro Garantia (Endosso)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'DANK - SEGURO GARANTIA - [RAZÃO SOCIAL] - ID PRE ATTENTI [X] - ENDOSSO',
    corpo: `PARA: fernanda@dankbrasil.com.br
CORRETORA: ATTENTI CORRETORA DE SEGUROS LTDA

[campos iguais ao modelo Nova, acrescido de:]
ENDOSSO CARTA DANK:
TIPO DE ENDOSSO:
Nº APÓLICE A SER ENDOSSADA:`,
  },
  {
    id: 'email-assessoria-garantia-nova',
    categoria: 'E-mail',
    titulo: 'Assessoria Garantia — Seguro Garantia (Nova)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'ASSESSORIA GARANTIA - SEGURO GARANTIA - CONTRATO [X] - TOMADOR: [RAZÃO SOCIAL] - ID PRE ATTENTI [X]',
    corpo: `PARA: nucleo1@garantiaseguros.com.br
CC: rebeca.paula@megasegurpe.com.br / carlinelima.cl@gmail.com

ATTENTI CORRETORA DE SEGUROS LTDA com co-corretagem:
PARTICIPAÇÃO ATTENTI: 80% / PARTICIPAÇÃO MEGA: 20%

MODALIDADE:
TOMADOR:
CNPJ TOMADOR:
SEGURADO:
CNPJ SEGURADO:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO:
VALOR CONTRATO: R$
IS (%): R$
VIGÊNCIA DO CONTRATO:
VIGÊNCIA DO SEGURO:
COBERTURA TRABALHISTA E PREVIDENCIÁRIA: ( ) SIM ( ) NÃO
COBERTURA DE MULTAS: ( ) SIM ( ) NÃO`,
  },
  {
    id: 'email-assessoria-garantia-endosso',
    categoria: 'E-mail',
    titulo: 'Assessoria Garantia — Seguro Garantia (Endosso)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'ASSESSORIA GARANTIA - SEGURO GARANTIA - CONTRATO [X] - TOMADOR: [RAZÃO SOCIAL] - ID PRE ATTENTI [X] - ENDOSSO',
    corpo: `PARA: nucleo1@garantiaseguros.com.br
CC: rebeca.paula@megasegurpe.com.br / carlinelima.cl@gmail.com

ATTENTI CORRETORA DE SEGUROS LTDA com co-corretagem:
PARTICIPAÇÃO ATTENTI: 80% / PARTICIPAÇÃO MEGA: 20%

[campos iguais ao modelo Nova, acrescido de:]
ENDOSSO APÓLICE:
TIPO DE ENDOSSO:
Nº APÓLICE A SER ENDOSSADA:
TERMO ADITIVO:`,
  },
  {
    id: 'email-assessoria-garantia-re-nova',
    categoria: 'E-mail',
    titulo: 'Assessoria Garantia — Risco Engenharia + RC Obras (Nova)',
    tipoSeguro: 'Risco Engenharia',
    assunto: 'ASSESSORIA GARANTIA - RISCO ENGENHARIA + RC OBRAS - CONTRATO [X] - SEGURADO: [RAZÃO SOCIAL] - ID PRE ATTENTI [X]',
    corpo: `PARA: nucleo1@garantiaseguros.com.br
CC: rebeca.paula@megasegurpe.com.br / carlinelima.cl@gmail.com

MODALIDADE:
SEGURADO:
CNPJ SEGURADO:
BENEFICIÁRIO:
CNPJ BENEFICIÁRIO:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO:
ENDEREÇO DO RISCO:
VALOR CONTRATO: R$
LMI: R$
VIGÊNCIA DO CONTRATO:
VIGÊNCIA DO SEGURO:`,
  },
  {
    id: 'email-assessoria-garantia-re-endosso',
    categoria: 'E-mail',
    titulo: 'Assessoria Garantia — Risco Engenharia + RC Obras (Endosso)',
    tipoSeguro: 'Risco Engenharia',
    assunto: 'ASSESSORIA GARANTIA - RISCO ENGENHARIA + RC OBRAS - CONTRATO [X] - SEGURADO: [RAZÃO SOCIAL] - ID PRE ATTENTI [X] - ENDOSSO',
    corpo: `PARA: nucleo1@garantiaseguros.com.br
CC: rebeca.paula@megasegurpe.com.br / carlinelima.cl@gmail.com

[campos iguais ao modelo Nova, acrescido de:]
TIPO DE ENDOSSO:
SEGURADORA DA APÓLICE A SER ENDOSSADA:
Nº APÓLICE A SER ENDOSSADA:
TERMO ADITIVO: (se houver)`,
  },
  {
    id: 'email-fianza-nova',
    categoria: 'E-mail',
    titulo: 'FIANZA — Seguro Garantia (Nova)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'FIANZA - SEGURO GARANTIA - [RAZÃO SOCIAL] - ID PRE ATTENTI [X]',
    corpo: `PARA: luciana.brito@fianzacaucao.com.br
CORRETORA: ATTENTI CORRETORA DE SEGUROS LTDA

MODALIDADE:
TOMADOR:
CNPJ TOMADOR:
SEGURADO:
CNPJ SEGURADO:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO:
VALOR CONTRATO: R$
IS (%): R$
VIGÊNCIA DO CONTRATO:
VIGÊNCIA DO SEGURO:`,
  },
  {
    id: 'email-fianza-endosso',
    categoria: 'E-mail',
    titulo: 'FIANZA — Seguro Garantia (Endosso)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'FIANZA - SEGURO GARANTIA - [RAZÃO SOCIAL] - ID PRE ATTENTI [X] - ENDOSSO',
    corpo: `PARA: luciana.brito@fianzacaucao.com.br
CORRETORA: ATTENTI CORRETORA DE SEGUROS LTDA

[campos iguais ao modelo Nova, acrescido de:]
ENDOSSO CARTA FIANZA:
TIPO DE ENDOSSO:
Nº APÓLICE A SER ENDOSSADA:`,
  },
  {
    id: 'email-nyhavn-nova',
    categoria: 'E-mail',
    titulo: 'NYHAVN — Seguro Garantia (Nova)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'NYHAVN - SEGURO GARANTIA - [RAZÃO SOCIAL] - ID PRE ATTENTI [X]',
    corpo: `PARA: nathalie.milano@nyhavn.com.br
CC: subscricao@nyhavn.com.br
CORRETORA: ATTENTI CORRETORA DE SEGUROS LTDA

MODALIDADE:
TOMADOR:
CNPJ TOMADOR:
SEGURADO:
CNPJ SEGURADO:
CONTRATO:
PROCESSO:
EDITAL:
OBJETO:
VALOR CONTRATO: R$
IS (%): R$
VIGÊNCIA DO CONTRATO:
VIGÊNCIA DO SEGURO:`,
  },
  {
    id: 'email-nyhavn-endosso',
    categoria: 'E-mail',
    titulo: 'NYHAVN — Seguro Garantia (Endosso)',
    tipoSeguro: 'Seguro Garantia',
    assunto: 'NYHAVN - SEGURO GARANTIA - [RAZÃO SOCIAL] - ID PRE ATTENTI [X] - ENDOSSO',
    corpo: `PARA: nathalie.milano@nyhavn.com.br
CC: subscricao@nyhavn.com.br
CORRETORA: ATTENTI CORRETORA DE SEGUROS LTDA

[campos iguais ao modelo Nova, acrescido de:]
ENDOSSO CARTA NYHAVN:
TIPO DE ENDOSSO:
Nº APÓLICE A SER ENDOSSADA:`,
  },
  {
    id: 'email-mega-emissao',
    categoria: 'E-mail',
    titulo: 'Confirmação de Emissão pelo Grupo MEGA',
    tipoSeguro: 'Todos',
    assunto: 'APÓLICE/PROPOSTA [SEGURADORA] [Nº APÓLICE] – [NOME COMPLETO SEGURADO] – ID PRE [XXXX]',
    corpo: `[Responder e-mail recebido da pasta "EMITIDAS GRUPO MEGA" em financeiro@attentiseguros.com.br]

Prezado(a), bom dia/boa tarde.

Segue em anexo a apólice/proposta emitida para conferência.

Qualquer dúvida, à disposição.

[Após enviar: mover e-mail para pasta "EMITIDAS GRUPO MEGA"]`,
  },
]

const CATEGORIAS = ['Todos', 'WhatsApp', 'E-mail']
const TIPOS_SEGURO = ['Todos', 'Seguro Garantia', 'Risco Engenharia', 'Consórcio', 'Auto', 'Vida', 'Saúde', 'Patrimonial', 'Responsabilidade Civil']

const emptyForm = { titulo: '', categoria: 'WhatsApp', tipoSeguro: 'Todos', assunto: '', corpo: '' }

function ModeloCard({ modelo, onEdit, onDelete }) {
  const { showToast } = useApp()
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopied(true)
      showToast('Texto copiado!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Erro ao copiar.', 'error')
    }
  }

  const textoCompleto = modelo.assunto
    ? `ASSUNTO: ${modelo.assunto}\n\n${modelo.corpo}`
    : modelo.corpo

  return (
    <div className="bg-cyber-card border border-cyber-border/40 rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${modelo.categoria === 'WhatsApp' ? 'bg-green-500/10 text-green-400' : 'bg-cyber-cyan/10 text-cyber-cyan'}`}>
            {modelo.categoria === 'WhatsApp' ? <MessageSquare size={16} /> : <Mail size={16} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-cyber-text text-sm leading-snug">{modelo.titulo}</p>
              {modelo._custom && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 uppercase tracking-wide">Personalizado</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${modelo.categoria === 'WhatsApp' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20'}`}>
                {modelo.categoria}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyber-surface/60 text-cyber-muted border border-cyber-border/30">
                {modelo.tipoSeguro}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(modelo)} className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors cursor-pointer" title="Editar">
              <Edit2 size={13} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(modelo.id)} className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/10 transition-colors cursor-pointer" title="Excluir">
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={() => copiar(textoCompleto)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${copied ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/30' : 'bg-cyber-surface/60 text-cyber-muted border-cyber-border/40 hover:text-cyber-cyan hover:border-cyber-cyan/40'}`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-cyber-muted hover:text-cyber-text transition-colors p-1 cursor-pointer"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-cyber-border/30 px-4 pb-4 pt-3">
          {modelo.assunto && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-cyber-muted uppercase tracking-wide mb-1">Assunto</p>
              <div className="flex items-start gap-2">
                <p className="text-xs text-cyber-cyan font-mono bg-cyber-surface/60 rounded-lg px-3 py-2 flex-1 break-all">{modelo.assunto}</p>
                <button onClick={() => copiar(modelo.assunto)} className="text-cyber-muted hover:text-cyber-cyan p-1.5 rounded-lg hover:bg-cyber-cyan/10 transition-colors shrink-0 cursor-pointer" title="Copiar assunto">
                  <Copy size={12} />
                </button>
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-cyber-muted uppercase tracking-wide">{modelo.categoria === 'E-mail' ? 'Corpo do e-mail' : 'Mensagem'}</p>
              <button onClick={() => copiar(modelo.corpo)} className="text-[10px] text-cyber-muted hover:text-cyber-cyan flex items-center gap-1 cursor-pointer">
                <Copy size={10} /> só o corpo
              </button>
            </div>
            <pre className="text-xs text-cyber-text/85 font-mono bg-cyber-surface/40 border border-cyber-border/30 rounded-lg px-3 py-3 whitespace-pre-wrap leading-relaxed overflow-x-auto">{modelo.corpo}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Modelos() {
  const { showToast } = useApp()
  const { data: modelosDB, create, update, remove } = useResource('modelos')

  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todos')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pendingDelete, setPendingDelete] = useState(null)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  function abrirNovo() {
    setEditando(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function abrirEditar(modelo) {
    setEditando(modelo)
    setForm({ titulo: modelo.titulo, categoria: modelo.categoria, tipoSeguro: modelo.tipoSeguro || 'Todos', assunto: modelo.assunto || '', corpo: modelo.corpo || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.titulo.trim() || !form.corpo.trim()) {
      showToast('Título e corpo são obrigatórios.', 'error')
      return
    }
    const payload = { ...form, id: editando ? editando.id : `mod_${Date.now()}`, _custom: true }
    try {
      if (editando) {
        await update(editando.id, payload)
        showToast('Modelo atualizado!')
      } else {
        await create(payload)
        showToast('Modelo criado!')
      }
      setShowModal(false)
    } catch {
      showToast('Erro ao salvar modelo.', 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await remove(id)
      setPendingDelete(null)
      showToast('Modelo removido.')
    } catch {
      showToast('Erro ao remover.', 'error')
    }
  }

  const todosModelos = useMemo(() => [
    ...modelosDB.map(m => ({ ...m, _custom: true })),
    ...MODELOS_PADRAO,
  ], [modelosDB])

  const filtrados = useMemo(() => {
    const q = search.toLowerCase()
    return todosModelos.filter(m => {
      const matchSearch = !q || m.titulo.toLowerCase().includes(q) || (m.corpo || '').toLowerCase().includes(q) || (m.assunto || '').toLowerCase().includes(q)
      const matchCat = filtroCategoria === 'Todos' || m.categoria === filtroCategoria
      const matchTipo = filtroTipo === 'Todos' || m.tipoSeguro === filtroTipo
      return matchSearch && matchCat && matchTipo
    })
  }, [todosModelos, search, filtroCategoria, filtroTipo])

  const porCategoria = useMemo(() => {
    const mapa = {}
    filtrados.forEach(m => {
      if (!mapa[m.categoria]) mapa[m.categoria] = []
      mapa[m.categoria].push(m)
    })
    return mapa
  }, [filtrados])

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">Modelos de Comunicação</h1>
          <p className="text-sm text-cyber-muted mt-1">{todosModelos.length} modelos · {modelosDB.length} personalizados</p>
        </div>
        <Button onClick={abrirNovo} icon={<Plus size={16} />}>Novo Modelo</Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar modelo..."
            className="w-full text-sm border border-cyber-border/50 rounded-xl px-4 py-2.5 bg-cyber-card focus:outline-none focus:border-cyber-cyan/50 text-cyber-text placeholder:text-cyber-muted"
          />
        </div>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="text-sm border border-cyber-border/50 rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none text-cyber-text">
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="text-sm border border-cyber-border/50 rounded-xl px-3 py-2.5 bg-cyber-card focus:outline-none text-cyber-text">
          <option>Todos</option>
          {['Seguro Garantia', 'Risco Engenharia', 'Consórcio', 'Auto', 'Vida', 'Saúde', 'Patrimonial'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-cyber-muted">Nenhum modelo encontrado.</p>
        </div>
      )}

      {Object.entries(porCategoria).map(([cat, lista]) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-3">
            {cat === 'WhatsApp' ? <MessageSquare size={16} className="text-green-400" /> : <Mail size={16} className="text-cyber-cyan" />}
            <h2 className="text-sm font-semibold text-cyber-text">{cat}</h2>
            <span className="text-xs text-cyber-muted">({lista.length})</span>
          </div>
          <div className="space-y-2">
            {lista.map(m => (
              <ModeloCard
                key={m.id}
                modelo={m}
                onEdit={m._custom ? abrirEditar : undefined}
                onDelete={m._custom ? () => setPendingDelete(m.id) : undefined}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Modal criar/editar */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editando ? 'Editar Modelo' : 'Novo Modelo'} size="lg"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editando ? 'Salvar' : 'Criar'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-cyber-muted mb-1">Título *</label>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)} className="w-full text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-surface focus:outline-none focus:border-cyber-cyan/50" placeholder="Ex: Aviso de vencimento — Auto" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-cyber-muted mb-1">Canal</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="w-full text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-surface focus:outline-none">
                <option value="WhatsApp">WhatsApp</option>
                <option value="E-mail">E-mail</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-cyber-muted mb-1">Tipo de Seguro</label>
              <select value={form.tipoSeguro} onChange={e => set('tipoSeguro', e.target.value)} className="w-full text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-surface focus:outline-none">
                {TIPOS_SEGURO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {form.categoria === 'E-mail' && (
            <div>
              <label className="block text-xs font-medium text-cyber-muted mb-1">Assunto do e-mail</label>
              <input value={form.assunto} onChange={e => set('assunto', e.target.value)} className="w-full text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-surface focus:outline-none focus:border-cyber-cyan/50" placeholder="Assunto padrão..." />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-cyber-muted mb-1">Corpo / Mensagem *</label>
            <textarea value={form.corpo} onChange={e => set('corpo', e.target.value)} rows={10} className="w-full text-sm border border-cyber-border rounded-xl px-3 py-2.5 bg-cyber-surface focus:outline-none focus:border-cyber-cyan/50 font-mono resize-y" placeholder="Texto do modelo..." />
          </div>
        </div>
      </Modal>

      {/* Modal confirmação de exclusão */}
      <Modal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Excluir Modelo" size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => handleDelete(pendingDelete)}>Excluir</Button>
          </div>
        }
      >
        <p className="text-sm text-cyber-text">Tem certeza que deseja excluir este modelo personalizado?</p>
      </Modal>
    </div>
  )
}
