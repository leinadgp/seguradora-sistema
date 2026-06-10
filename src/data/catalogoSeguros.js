/**
 * Catálogo hierárquico de seguros: Ramo → Tipo → Subcategoria → Coberturas
 *
 * Decisões de modelagem:
 *  - Um registro por "tipo de seguro" (Auto, Moto, etc.), com subcategorias embedded.
 *    Isso evita múltiplas requisições e simplifica o CRUD de subcategorias.
 *  - `modulo` separa domínios incompatíveis: 'seguro' | 'saude' | 'previdencia' | 'consorcio'.
 *    Consórcio não é seguro e não entra no fluxo normal de cotação/proposta/apólice.
 *  - Statuses legados (tipoSeguro sem subcategoria) continuam funcionando — subcategoria
 *    simplesmente fica vazia e o sistema não quebra.
 *  - `ordem` controla a sequência nos selects; permite reordenar sem mexer no código.
 */

export const catalogoSeguros = [
  // ── AUTOMÓVEL ──────────────────────────────────────────────────────────────
  {
    id: 'auto',
    ramo: 'AUTOMÓVEL',
    tipo: 'Auto',
    modulo: 'seguro',
    ordem: 1,
    ativo: true,
    subcategorias: [
      { id: 'auto-casco',   nome: 'Casco',         coberturas: ['Colisão', 'Roubo/Furto', 'Incêndio', 'Casco Completo'], ordem: 1, ativo: true },
      { id: 'auto-rc',      nome: 'RC Veicular',   coberturas: ['Danos Materiais', 'Danos Corporais', 'Danos Morais'], ordem: 2, ativo: true },
      { id: 'auto-app',     nome: 'APP',           coberturas: ['Morte Acidental', 'Invalidez Permanente'], ordem: 3, ativo: true },
      { id: 'auto-assist',  nome: 'Assistência',   coberturas: ['Guincho', 'Pane Elétrica', 'Chaveiro', 'Combustível'], ordem: 4, ativo: true },
      { id: 'auto-vidros',  nome: 'Vidros',        coberturas: ['Parabrisa', 'Retrovisores', 'Vidros Laterais'], ordem: 5, ativo: true },
      { id: 'auto-reserva', nome: 'Carro Reserva', coberturas: ['24h', '48h', '72h', '7 dias'], ordem: 6, ativo: true },
    ],
  },
  {
    id: 'moto',
    ramo: 'AUTOMÓVEL',
    tipo: 'Moto',
    modulo: 'seguro',
    ordem: 2,
    ativo: true,
    subcategorias: [
      { id: 'moto-casco',   nome: 'Casco',       coberturas: ['Colisão', 'Roubo/Furto', 'Incêndio'], ordem: 1, ativo: true },
      { id: 'moto-rc',      nome: 'RC Veicular', coberturas: ['Danos Materiais', 'Danos Corporais'], ordem: 2, ativo: true },
      { id: 'moto-app',     nome: 'APP',         coberturas: ['Morte Acidental', 'Invalidez Permanente'], ordem: 3, ativo: true },
      { id: 'moto-assist',  nome: 'Assistência', coberturas: ['Guincho', 'Pane Elétrica', 'Combustível'], ordem: 4, ativo: true },
      { id: 'moto-roubo',   nome: 'Roubo/Furto', coberturas: ['Rastreador', 'Recuperação de Veículo'], ordem: 5, ativo: true },
    ],
  },
  {
    id: 'caminhao',
    ramo: 'AUTOMÓVEL',
    tipo: 'Caminhão',
    modulo: 'seguro',
    ordem: 3,
    ativo: true,
    subcategorias: [
      { id: 'cam-casco',  nome: 'Casco',       coberturas: ['Colisão', 'Roubo/Furto', 'Incêndio'], ordem: 1, ativo: true },
      { id: 'cam-rc',     nome: 'RC Veicular', coberturas: ['Danos Materiais', 'Danos Corporais'], ordem: 2, ativo: true },
      { id: 'cam-carga',  nome: 'Carga',       coberturas: ['RCTR-C', 'RCF-DC', 'Carga Própria'], ordem: 3, ativo: true },
      { id: 'cam-app',    nome: 'APP',         coberturas: ['Morte Acidental', 'Invalidez Permanente'], ordem: 4, ativo: true },
      { id: 'cam-assist', nome: 'Assistência', coberturas: ['Guincho Pesado', 'Borracharia', 'Pernoite'], ordem: 5, ativo: true },
    ],
  },
  {
    id: 'frota',
    ramo: 'AUTOMÓVEL',
    tipo: 'Frota',
    modulo: 'seguro',
    ordem: 4,
    ativo: true,
    subcategorias: [
      { id: 'fro-casco',  nome: 'Casco',           coberturas: ['Colisão', 'Roubo/Furto', 'Incêndio'], ordem: 1, ativo: true },
      { id: 'fro-rc',     nome: 'RC Veicular',     coberturas: ['Danos Materiais', 'Danos Corporais'], ordem: 2, ativo: true },
      { id: 'fro-assist', nome: 'Assistência',     coberturas: ['Guincho', '24h', 'Pernoite'], ordem: 3, ativo: true },
      { id: 'fro-gestao', nome: 'Gestão de Frota', coberturas: ['Rastreamento', 'Telemetria', 'Relatórios'], ordem: 4, ativo: true },
    ],
  },

  // ── PATRIMONIAL ────────────────────────────────────────────────────────────
  {
    id: 'residencial',
    ramo: 'PATRIMONIAL',
    tipo: 'Residencial',
    modulo: 'seguro',
    ordem: 5,
    ativo: true,
    subcategorias: [
      { id: 'res-incendio', nome: 'Incêndio',             coberturas: ['Incêndio', 'Raio', 'Explosão'], ordem: 1, ativo: true },
      { id: 'res-roubo',    nome: 'Roubo',                coberturas: ['Bens Residenciais', 'Joias', 'Equipamentos'], ordem: 2, ativo: true },
      { id: 'res-eletrico', nome: 'Danos Elétricos',      coberturas: ['Equipamentos', 'Instalações', 'Surto Elétrico'], ordem: 3, ativo: true },
      { id: 'res-vendaval', nome: 'Vendaval',             coberturas: ['Vendaval', 'Granizo', 'Chuva de Pedra'], ordem: 4, ativo: true },
      { id: 'res-rc',       nome: 'Responsabilidade Civil', coberturas: ['RC Familiar', 'Danos a Terceiros'], ordem: 5, ativo: true },
    ],
  },
  {
    id: 'condominio',
    ramo: 'PATRIMONIAL',
    tipo: 'Condomínio',
    modulo: 'seguro',
    ordem: 6,
    ativo: true,
    subcategorias: [
      { id: 'con-incendio', nome: 'Incêndio',          coberturas: ['Incêndio', 'Raio', 'Explosão'], ordem: 1, ativo: true },
      { id: 'con-rc',       nome: 'RC',                coberturas: ['RC Síndico', 'RC Condôminos', 'RC Terceiros'], ordem: 2, ativo: true },
      { id: 'con-eletrico', nome: 'Danos Elétricos',   coberturas: ['Motores', 'Bombas', 'Elevadores'], ordem: 3, ativo: true },
      { id: 'con-equip',    nome: 'Equipamentos',      coberturas: ['Caldeiras', 'Compressores', 'Geradores'], ordem: 4, ativo: true },
      { id: 'con-vendaval', nome: 'Vendaval',          coberturas: ['Vendaval', 'Granizo', 'Danos ao Telhado'], ordem: 5, ativo: true },
    ],
  },
  {
    id: 'empresarial',
    ramo: 'PATRIMONIAL',
    tipo: 'Empresarial',
    modulo: 'seguro',
    ordem: 7,
    ativo: true,
    subcategorias: [
      { id: 'emp-incendio', nome: 'Incêndio',         coberturas: ['Incêndio', 'Raio', 'Explosão', 'Fumaça'], ordem: 1, ativo: true },
      { id: 'emp-lucros',   nome: 'Lucros Cessantes', coberturas: ['Interrupção de Negócios', 'Despesas Extras'], ordem: 2, ativo: true },
      { id: 'emp-rc',       nome: 'RC Operações',     coberturas: ['RC Empregador', 'RC Estabelecimento', 'RC Produtos'], ordem: 3, ativo: true },
      { id: 'emp-equip',    nome: 'Equipamentos',     coberturas: ['Máquinas', 'Computadores', 'Estoque'], ordem: 4, ativo: true },
    ],
  },
  {
    id: 'equipamentos',
    ramo: 'PATRIMONIAL',
    tipo: 'Equipamentos',
    modulo: 'seguro',
    ordem: 13,
    ativo: true,
    subcategorias: [
      { id: 'eqp-port',  nome: 'Portáteis',   coberturas: ['Notebook', 'Tablet', 'Câmeras', 'Drones'], ordem: 1, ativo: true },
      { id: 'eqp-ind',   nome: 'Industriais', coberturas: ['Máquinas', 'Caldeiras', 'Compressores'], ordem: 2, ativo: true },
      { id: 'eqp-med',   nome: 'Médicos',     coberturas: ['Equipamentos de Diagnóstico', 'Equipamentos Cirúrgicos'], ordem: 3, ativo: true },
      { id: 'eqp-agr',   nome: 'Agrícolas',   coberturas: ['Tratores', 'Colheitadeiras', 'Implementos'], ordem: 4, ativo: true },
    ],
  },
  {
    id: 'celular',
    ramo: 'PATRIMONIAL',
    tipo: 'Celular',
    modulo: 'seguro',
    ordem: 14,
    ativo: true,
    subcategorias: [
      { id: 'cel-roubo',    nome: 'Roubo/Furto',      coberturas: ['Roubo', 'Furto Qualificado', 'Recuperação'], ordem: 1, ativo: true },
      { id: 'cel-quebra',   nome: 'Quebra Acidental',  coberturas: ['Danos Físicos', 'Tela Quebrada'], ordem: 2, ativo: true },
      { id: 'cel-eletrico', nome: 'Danos Elétricos',   coberturas: ['Curto-circuito', 'Queima por Raio'], ordem: 3, ativo: true },
    ],
  },
  {
    id: 'nautico',
    ramo: 'PATRIMONIAL',
    tipo: 'Náutico',
    modulo: 'seguro',
    ordem: 16,
    ativo: true,
    subcategorias: [
      { id: 'nau-emb',    nome: 'Embarcação',             coberturas: ['Lancha', 'Veleiro', 'Jet Ski', 'Barco'], ordem: 1, ativo: true },
      { id: 'nau-casco',  nome: 'Casco',                  coberturas: ['Colisão', 'Naufrágio', 'Incêndio'], ordem: 2, ativo: true },
      { id: 'nau-rc',     nome: 'Responsabilidade Civil',  coberturas: ['RC Marina', 'RC Terceiros', 'Poluição'], ordem: 3, ativo: true },
      { id: 'nau-assist', nome: 'Assistência',             coberturas: ['Reboque Marítimo', 'Socorro', '24h'], ordem: 4, ativo: true },
    ],
  },

  // ── VIDA ───────────────────────────────────────────────────────────────────
  {
    id: 'vida-individual',
    ramo: 'VIDA',
    tipo: 'Vida Individual',
    modulo: 'seguro',
    ordem: 8,
    ativo: true,
    subcategorias: [
      { id: 'vi-temp',    nome: 'Temporário',     coberturas: ['Morte', 'Indenização Especial por Morte'], ordem: 1, ativo: true },
      { id: 'vi-inteiro', nome: 'Vida Inteiro',   coberturas: ['Morte', 'Sobrevivência'], ordem: 2, ativo: true },
      { id: 'vi-acid',    nome: 'Acidental',      coberturas: ['Morte Acidental', 'Invalidez Permanente', 'IPA'], ordem: 3, ativo: true },
      { id: 'vi-doenca',  nome: 'Doenças Graves', coberturas: ['Câncer', 'IAM', 'AVC', 'Transplante'], ordem: 4, ativo: true },
    ],
  },
  {
    id: 'vida-empresarial',
    ramo: 'VIDA',
    tipo: 'Vida Empresarial',
    modulo: 'seguro',
    ordem: 9,
    ativo: true,
    subcategorias: [
      { id: 've-grupo', nome: 'Vida em Grupo',      coberturas: ['Morte', 'Invalidez', 'DIT'], ordem: 1, ativo: true },
      { id: 've-prest', nome: 'Prestamista',        coberturas: ['Quitação de Dívida', 'Desemprego'], ordem: 2, ativo: true },
      { id: 've-fun',   nome: 'Funeral',            coberturas: ['Titular', 'Cônjuge', 'Filhos'], ordem: 3, ativo: true },
      { id: 've-ap',    nome: 'Acidentes Pessoais', coberturas: ['Morte Acidental', 'Invalidez', 'Despesas Médicas'], ordem: 4, ativo: true },
    ],
  },

  // ── SAÚDE (módulo separado) ────────────────────────────────────────────────
  {
    id: 'saude',
    ramo: 'SAÚDE',
    tipo: 'Saúde',
    modulo: 'saude',
    ordem: 10,
    ativo: true,
    subcategorias: [
      { id: 'sau-individual',  nome: 'Individual',   coberturas: ['Enfermaria', 'Apartamento', 'Coparticipação'], ordem: 1, ativo: true },
      { id: 'sau-familiar',    nome: 'Familiar',     coberturas: ['Sem Coparticipação', 'Com Coparticipação'], ordem: 2, ativo: true },
      { id: 'sau-empresarial', nome: 'Empresarial',  coberturas: ['PME', 'Grande Empresa', 'Coletivo por Adesão'], ordem: 3, ativo: true },
      { id: 'sau-adesao',      nome: 'Por Adesão',   coberturas: ['Associação', 'Sindicato', 'Entidade de Classe'], ordem: 4, ativo: true },
    ],
  },
  {
    id: 'odontologico',
    ramo: 'SAÚDE',
    tipo: 'Odontológico',
    modulo: 'saude',
    ordem: 11,
    ativo: true,
    subcategorias: [
      { id: 'odo-basico',    nome: 'Básico',       coberturas: ['Consultas', 'Limpeza', 'Radiografia'], ordem: 1, ativo: true },
      { id: 'odo-completo',  nome: 'Completo',     coberturas: ['Canal', 'Extrações', 'Próteses'], ordem: 2, ativo: true },
      { id: 'odo-ortodont',  nome: 'Ortodôntico',  coberturas: ['Aparelho', 'Contenção', 'Manutenção'], ordem: 3, ativo: true },
      { id: 'odo-prevent',   nome: 'Preventivo',   coberturas: ['Profilaxia', 'Flúor', 'Orientação'], ordem: 4, ativo: true },
    ],
  },

  // ── VIAGEM ─────────────────────────────────────────────────────────────────
  {
    id: 'viagem',
    ramo: 'VIAGEM',
    tipo: 'Viagem',
    modulo: 'seguro',
    ordem: 12,
    ativo: true,
    subcategorias: [
      { id: 'via-nacional', nome: 'Nacional',     coberturas: ['Despesas Médicas', 'Extravio de Bagagem', 'Cancelamento'], ordem: 1, ativo: true },
      { id: 'via-intern',   nome: 'Internacional', coberturas: ['Despesas Médicas', 'Repatriação', 'Bagagem', 'RC'], ordem: 2, ativo: true },
      { id: 'via-familiar', nome: 'Familiar',     coberturas: ['Cobertura Familiar', 'Crianças Grátis', 'Assistência'], ordem: 3, ativo: true },
      { id: 'via-corp',     nome: 'Corporativo',  coberturas: ['Franquia Coletiva', 'Cobertura Estendida', 'Cancelamento'], ordem: 4, ativo: true },
    ],
  },

  // ── RURAL ──────────────────────────────────────────────────────────────────
  {
    id: 'rural',
    ramo: 'RURAL',
    tipo: 'Rural',
    modulo: 'seguro',
    ordem: 15,
    ativo: true,
    subcategorias: [
      { id: 'rur-agric',  nome: 'Agrícola',     coberturas: ['Soja', 'Milho', 'Trigo', 'Algodão', 'Multiperil'], ordem: 1, ativo: true },
      { id: 'rur-pec',    nome: 'Pecuário',     coberturas: ['Bovinos', 'Suínos', 'Avicultura'], ordem: 2, ativo: true },
      { id: 'rur-flor',   nome: 'Florestal',    coberturas: ['Eucalipto', 'Pinus', 'Seringueira'], ordem: 3, ativo: true },
      { id: 'rur-aquic',  nome: 'Aquícola',     coberturas: ['Peixes', 'Camarões', 'Ostras'], ordem: 4, ativo: true },
      { id: 'rur-penhor', nome: 'Penhor Rural', coberturas: ['Penhor Agrícola', 'Penhor Pecuário'], ordem: 5, ativo: true },
    ],
  },

  // ── GARANTIA ───────────────────────────────────────────────────────────────
  {
    id: 'garantia',
    ramo: 'GARANTIA',
    tipo: 'Garantia',
    modulo: 'seguro',
    ordem: 17,
    ativo: true,
    subcategorias: [
      { id: 'gar-licit',  nome: 'Licitante',           coberturas: ['Proposta', 'Habilitação'], ordem: 1, ativo: true },
      { id: 'gar-exec',   nome: 'Execução Contratual', coberturas: ['Adiantamento de Pagamento', 'Retenção', 'Obrigações Trabalhistas'], ordem: 2, ativo: true },
      { id: 'gar-jud',    nome: 'Judicial',            coberturas: ['Garantia Recursal', 'Depósito Judicial'], ordem: 3, ativo: true },
      { id: 'gar-aduan',  nome: 'Aduaneira',           coberturas: ['Trânsito Aduaneiro', 'Regime Especial'], ordem: 4, ativo: true },
      { id: 'gar-imob',   nome: 'Imobiliária',         coberturas: ['Entrega de Imóvel', 'Habite-se'], ordem: 5, ativo: true },
    ],
  },
  {
    id: 'fianca',
    ramo: 'GARANTIA',
    tipo: 'Fiança',
    modulo: 'seguro',
    ordem: 18,
    ativo: true,
    subcategorias: [
      { id: 'fia-loc',  nome: 'Locatícia',             coberturas: ['Aluguel', 'IPTU', 'Condomínio', 'Encargos'], ordem: 1, ativo: true },
      { id: 'fia-serv', nome: 'Prestação de Serviços', coberturas: ['Garantia de Execução', 'Multas Contratuais'], ordem: 2, ativo: true },
      { id: 'fia-alug', nome: 'Aluguel',               coberturas: ['Residencial', 'Comercial', 'Industrial'], ordem: 3, ativo: true },
      { id: 'fia-cont', nome: 'Contratual',            coberturas: ['Serviços', 'Obras', 'Fornecimento'], ordem: 4, ativo: true },
    ],
  },

  // ── RESPONSABILIDADE CIVIL ─────────────────────────────────────────────────
  {
    id: 'rc',
    ramo: 'RESPONSABILIDADE CIVIL',
    tipo: 'RC',
    modulo: 'seguro',
    ordem: 19,
    ativo: true,
    subcategorias: [
      { id: 'rc-geral', nome: 'RC Geral',        coberturas: ['Danos Materiais', 'Danos Corporais', 'Danos Morais'], ordem: 1, ativo: true },
      { id: 'rc-prof',  nome: 'RC Profissional', coberturas: ['Erros e Omissões', 'Negligência', 'Imperícia'], ordem: 2, ativo: true },
      { id: 'rc-do',    nome: 'D&O',             coberturas: ['Atos Ilícitos', 'Danos a Terceiros', 'Custas Processuais'], ordem: 3, ativo: true },
      { id: 'rc-prod',  nome: 'Produtos',        coberturas: ['Recall', 'Danos por Produto', 'Retirada de Circulação'], ordem: 4, ativo: true },
      { id: 'rc-amb',   nome: 'Ambiental',       coberturas: ['Poluição Gradual', 'Poluição Súbita', 'Remediação'], ordem: 5, ativo: true },
      { id: 'rc-cyber', nome: 'Cyber',           coberturas: ['Violação de Dados', 'Ransomware', 'RC Cibernética'], ordem: 6, ativo: true },
    ],
  },

  // ── PREVIDÊNCIA (módulo separado) ──────────────────────────────────────────
  {
    id: 'previdencia',
    ramo: 'PREVIDÊNCIA',
    tipo: 'Previdência',
    modulo: 'previdencia',
    ordem: 20,
    ativo: true,
    subcategorias: [
      { id: 'prev-pgbl',  nome: 'PGBL',        coberturas: ['Renda Mensal', 'Resgate', 'Portabilidade'], ordem: 1, ativo: true },
      { id: 'prev-vgbl',  nome: 'VGBL',        coberturas: ['Renda Mensal', 'Resgate', 'Portabilidade'], ordem: 2, ativo: true },
      { id: 'prev-trad',  nome: 'Tradicional', coberturas: ['Benefício Definido', 'Contribuição Definida'], ordem: 3, ativo: true },
      { id: 'prev-aport', nome: 'Aporte',      coberturas: ['Aporte Único', 'Aporte Periódico'], ordem: 4, ativo: true },
      { id: 'prev-renda', nome: 'Renda',       coberturas: ['Vitalícia', 'Temporária', 'Renda Certa'], ordem: 5, ativo: true },
    ],
  },

  // ── CONSÓRCIO (módulo separado — não é seguro) ─────────────────────────────
  {
    id: 'consorcio',
    ramo: 'CONSÓRCIO',
    tipo: 'Consórcio',
    modulo: 'consorcio',
    ordem: 21,
    ativo: true,
    subcategorias: [
      { id: 'con-auto',  nome: 'Automóvel', coberturas: ['Cota Ativa', 'Cota Lance'], ordem: 1, ativo: true },
      { id: 'con-imob',  nome: 'Imóvel',   coberturas: ['Cota Ativa', 'Cota Lance', 'Terreno'], ordem: 2, ativo: true },
      { id: 'con-serv',  nome: 'Serviços', coberturas: ['Reforma', 'Viagem', 'Cirurgia'], ordem: 3, ativo: true },
    ],
  },
]
