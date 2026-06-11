const marcasAuto = ['Volkswagen', 'Fiat', 'Chevrolet', 'Ford', 'Toyota', 'Hyundai', 'Renault', 'Honda', 'Jeep', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi', 'Mitsubishi', 'Kia', 'Peugeot', 'Citroën', 'Subaru', 'Volvo', 'RAM']

export const insuranceTypeFields = {
  'Auto': {
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
CARRO ZERO: ( ) SIM ( ) NÃO
VEÍCULO: {{marca}} {{modelo}} | PLACA: {{placa}} | ANO: {{anoFab}}/{{anoMod}} | CHASSI: {{chassi}} | RENAVAM: {{renavam}} | COR: | COMBUSTÍVEL: {{combustivel}}
CONDUTOR PRINCIPAL: {{condutorPrincipal}} | CPF: {{cpfCondutor}}
ENDEREÇO PERNOITE: {{cepCondutor}}
COBERTURAS E VALORES:
  DANOS MATERIAIS: R$ {{coberturaRca}} / DANOS CORPORAIS: R$ {{coberturaRcf}} / DANOS MORAIS: / APP MORTE/INVALIDEZ: R$ {{coberturaApp}}
  ASSISTÊNCIA: ( ) Básica ( ) Intermediária ( ) Completa
  VIDROS: ( ) Básico ( ) Completo
  PEQUENOS REPAROS: ( ) Sim ( ) Não
  CARRO RESERVA: ( ) 7 dias ( ) 15 dias ( ) 30 dias ( ) Não
  AR CONDICIONADO: ( ) Sim ( ) Não
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
--- COTAÇÃO ---
COMISSÃO TOTAL %: {{comissaoTotal}} | COMISSÃO ATTENTI %: {{comissaoAttenti}} | PRÊMIO LÍQUIDO: R$ {{premioLiquido}} | PRÊMIO BRUTO: R$ {{premioBruto}}`,
    sections: [
      {
        id: 'veiculo',
        title: 'Dados do Veículo',
        fields: [
          { key: 'marca', label: 'Marca', type: 'select', required: true, options: marcasAuto },
          { key: 'modelo', label: 'Modelo', type: 'text', required: true, placeholder: 'Ex: Gol 1.6' },
          { key: 'anoFab', label: 'Ano de fabricação', type: 'number', required: true },
          { key: 'anoMod', label: 'Ano do modelo', type: 'number' },
          { key: 'placa', label: 'Placa', type: 'text', required: true, placeholder: 'ABC-1234' },
          { key: 'chassi', label: 'Chassi', type: 'text' },
          { key: 'renavam', label: 'Renavam', type: 'text' },
          { key: 'valorFipe', label: 'Valor FIPE', type: 'currency' },
          { key: 'uso', label: 'Uso do veículo', type: 'select', options: ['Lazer', 'Trabalho', 'Ambos', 'Motorista de aplicativo', 'Táxi', 'Escolar'] },
          { key: 'combustivel', label: 'Combustível', type: 'select', options: ['Flex', 'Gasolina', 'Álcool', 'Diesel', 'Elétrico', 'Híbrido', 'GNV'] },
          { key: 'zeroKm', label: 'Veículo zero km?', type: 'toggle' },
          { key: 'garagem', label: 'Possui garagem em casa e no trabalho?', type: 'toggle' },
        ],
      },
      {
        id: 'condutor',
        title: 'Condutor Principal',
        fields: [
          { key: 'condutorPrincipal', label: 'Nome do condutor', type: 'text', required: true },
          { key: 'cpfCondutor', label: 'CPF do condutor', type: 'text', placeholder: '000.000.000-00' },
          { key: 'dataNascCondutor', label: 'Data de nascimento', type: 'date' },
          { key: 'sexoCondutor', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino', 'Não informado'] },
          { key: 'estadoCivilCondutor', label: 'Estado civil', type: 'select', options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'] },
          { key: 'cepCondutor', label: 'CEP de pernoite', type: 'text', placeholder: '00000-000' },
          { key: 'classeBonus', label: 'Classe de bônus', type: 'select', options: Array.from({ length: 11 }, (_, i) => `Classe ${i}`) },
          { key: 'menorCondutor', label: 'Há condutor menor de 26 anos?', type: 'toggle' },
        ],
      },
      {
        id: 'coberturas_auto',
        title: 'Coberturas',
        fields: [
          { key: 'coberturaTotal', label: 'Cobertura total (casco)', type: 'toggle' },
          { key: 'coberturaRca', label: 'RCA – Danos materiais a terceiros (R$)', type: 'currency' },
          { key: 'coberturaRcf', label: 'RCF – Danos corporais a terceiros (R$)', type: 'currency' },
          { key: 'coberturaApp', label: 'APP – Acidentes pessoais por passageiro (R$)', type: 'currency' },
          { key: 'assistencia24h', label: 'Assistência 24h', type: 'toggle' },
          { key: 'carroReserva', label: 'Carro reserva', type: 'toggle' },
          { key: 'carroReservaDias', label: 'Dias de carro reserva', type: 'number' },
          { key: 'franquia', label: 'Franquia (R$)', type: 'currency' },
          { key: 'tipoFranquia', label: 'Tipo de franquia', type: 'select', options: ['Obrigatória reduzida', 'Obrigatória normal', 'Obrigatória majorada'] },
        ],
      },
    ],
  },

  'Moto': {
    sections: [
      {
        id: 'moto',
        title: 'Dados da Moto',
        fields: [
          { key: 'marcaMoto', label: 'Marca', type: 'select', required: true, options: ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'BMW', 'Ducati', 'Harley-Davidson', 'Royal Enfield', 'Triumph', 'KTM'] },
          { key: 'modeloMoto', label: 'Modelo', type: 'text', required: true },
          { key: 'anoFabMoto', label: 'Ano de fabricação', type: 'number' },
          { key: 'placaMoto', label: 'Placa', type: 'text', required: true },
          { key: 'cilindradaMoto', label: 'Cilindrada (cc)', type: 'number' },
          { key: 'valorFipeMoto', label: 'Valor FIPE', type: 'currency' },
          { key: 'usoMoto', label: 'Uso', type: 'select', options: ['Lazer', 'Trabalho', 'Delivery', 'Motoboy'] },
          { key: 'garaemMoto', label: 'Possui garagem?', type: 'toggle' },
        ],
      },
      {
        id: 'condutor_moto',
        title: 'Condutor',
        fields: [
          { key: 'condutorMoto', label: 'Nome do condutor', type: 'text', required: true },
          { key: 'cpfCondutorMoto', label: 'CPF do condutor', type: 'text' },
          { key: 'dataNascCondutorMoto', label: 'Data de nascimento', type: 'date' },
          { key: 'classeBonusMoto', label: 'Classe de bônus', type: 'select', options: Array.from({ length: 6 }, (_, i) => `Classe ${i}`) },
        ],
      },
      {
        id: 'coberturas_moto',
        title: 'Coberturas',
        fields: [
          { key: 'coberturaCascoMoto', label: 'Cobertura de casco', type: 'toggle' },
          { key: 'coberturaRcaMoto', label: 'RCA (R$)', type: 'currency' },
          { key: 'assistenciaMoto', label: 'Assistência 24h', type: 'toggle' },
          { key: 'franquiaMoto', label: 'Franquia (R$)', type: 'currency' },
        ],
      },
    ],
  },

  'Caminhão': {
    sections: [
      {
        id: 'caminhao',
        title: 'Dados do Caminhão',
        fields: [
          { key: 'marcaCaminhao', label: 'Marca', type: 'select', required: true, options: ['Volvo', 'Scania', 'Mercedes-Benz', 'DAF', 'MAN', 'Iveco', 'Ford', 'Volkswagen', 'Agrale'] },
          { key: 'modeloCaminhao', label: 'Modelo', type: 'text', required: true },
          { key: 'anoCaminhao', label: 'Ano', type: 'number' },
          { key: 'placaCaminhao', label: 'Placa', type: 'text', required: true },
          { key: 'tipoCaminhao', label: 'Tipo', type: 'select', options: ['Leve', 'Médio', 'Semipesado', 'Pesado', 'Extrapesado'] },
          { key: 'valorFipeCaminhao', label: 'Valor FIPE', type: 'currency' },
          { key: 'rotaCaminhao', label: 'Rota principal', type: 'select', options: ['Local/Municipal', 'Regional', 'Nacional'] },
          { key: 'carretaCaminhao', label: 'Possui carreta/implemento?', type: 'toggle' },
          { key: 'cargaCaminhao', label: 'Tipo de carga transportada', type: 'text', placeholder: 'Ex: granel seco, frigorificado' },
        ],
      },
      {
        id: 'coberturas_caminhao',
        title: 'Coberturas',
        fields: [
          { key: 'coberturaCascoCaminhao', label: 'Cobertura de casco', type: 'toggle' },
          { key: 'coberturaCargaCaminhao', label: 'Cobertura de carga', type: 'toggle' },
          { key: 'valorCargaCaminhao', label: 'Valor médio da carga (R$)', type: 'currency' },
          { key: 'coberturaRcaCaminhao', label: 'RCA (R$)', type: 'currency' },
          { key: 'rctrCaminhao', label: 'RCTR-C (R$)', type: 'currency' },
          { key: 'assistenciaCaminhao', label: 'Assistência 24h', type: 'toggle' },
        ],
      },
    ],
  },

  'Frota': {
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
[Para cada veículo — incluir planilha anexa]
  VEÍCULO / PLACA / ANO / CHASSI / RENAVAM / COR / COMBUSTÍVEL
  CONDUTOR PRINCIPAL: {{condutorPrincipal}} / CPF: {{cpfCondutor}} / ENDEREÇO PERNOITE: {{cepCondutor}}
COBERTURAS E VALORES:
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
--- COTAÇÃO ---
COMISSÃO TOTAL %: {{comissaoTotal}} | COMISSÃO ATTENTI %: {{comissaoAttenti}} | PRÊMIO LÍQUIDO: R$ {{premioLiquido}} | PRÊMIO BRUTO: R$ {{premioBruto}}`,
    sections: [
      {
        id: 'frota',
        title: 'Dados da Frota',
        fields: [
          { key: 'empresaFrota', label: 'Empresa', type: 'text', required: true },
          { key: 'cnpjFrota', label: 'CNPJ', type: 'text', required: true },
          { key: 'qtdVeiculos', label: 'Quantidade de veículos', type: 'number', required: true },
          { key: 'tipoFrota', label: 'Tipo predominante', type: 'select', options: ['Passeio', 'Utilitário', 'Caminhão', 'Misto'] },
          { key: 'valorMedioFrota', label: 'Valor médio por veículo (R$)', type: 'currency' },
          { key: 'estadoFrota', label: 'Estado de circulação principal', type: 'text' },
        ],
      },
      {
        id: 'coberturas_frota',
        title: 'Coberturas',
        fields: [
          { key: 'coberturaCascoFrota', label: 'Casco', type: 'toggle' },
          { key: 'coberturaRcaFrota', label: 'RCA (R$)', type: 'currency' },
          { key: 'rastreamentoFrota', label: 'Rastreamento obrigatório?', type: 'toggle' },
          { key: 'assistenciaFrota', label: 'Assistência 24h', type: 'toggle' },
          { key: 'gerenciamentoRisco', label: 'Gerenciamento de risco', type: 'toggle' },
        ],
      },
    ],
  },

  'Residencial': {
    sections: [
      {
        id: 'imovel',
        title: 'Dados do Imóvel',
        fields: [
          { key: 'tipoImovel', label: 'Tipo de imóvel', type: 'select', required: true, options: ['Apartamento', 'Casa', 'Sobrado', 'Flat', 'Sítio', 'Chácara', 'Cobertura'] },
          { key: 'enderecoImovel', label: 'Endereço completo', type: 'text', required: true, colSpan: 2 },
          { key: 'areaConstruida', label: 'Área construída (m²)', type: 'number' },
          { key: 'tipoConstrucao', label: 'Tipo de construção', type: 'select', options: ['Alvenaria', 'Madeira', 'Mista', 'Metálica'] },
          { key: 'anoConstImovel', label: 'Ano de construção', type: 'number' },
          { key: 'valorImovel', label: 'Valor do imóvel (R$)', type: 'currency' },
          { key: 'imovelAlugado', label: 'Imóvel alugado?', type: 'toggle' },
          { key: 'imovelDesabitado', label: 'Imóvel desabitado?', type: 'toggle' },
        ],
      },
      {
        id: 'coberturas_res',
        title: 'Coberturas',
        fields: [
          { key: 'coberturaIncendio', label: 'Incêndio / Raio / Explosão (R$)', type: 'currency', required: true },
          { key: 'coberturaRoubo', label: 'Roubo de bens (R$)', type: 'currency' },
          { key: 'coberturaDanosEletricos', label: 'Danos elétricos (R$)', type: 'currency' },
          { key: 'coberturaAlagamento', label: 'Alagamento / Inundação (R$)', type: 'currency' },
          { key: 'coberturaVendaval', label: 'Vendaval / Granizo (R$)', type: 'currency' },
          { key: 'coberturaRC', label: 'RC Residencial (R$)', type: 'currency' },
          { key: 'coberturaAluguel', label: 'Perda de aluguel (R$)', type: 'currency' },
          { key: 'assistenciaResidencial', label: 'Assistência 24h', type: 'toggle' },
        ],
      },
    ],
  },

  'Condomínio': {
    sections: [
      {
        id: 'condominio',
        title: 'Dados do Condomínio',
        fields: [
          { key: 'nomeCondominio', label: 'Nome do condomínio', type: 'text', required: true },
          { key: 'enderecoCondominio', label: 'Endereço', type: 'text', required: true, colSpan: 2 },
          { key: 'cnpjCondominio', label: 'CNPJ do condomínio', type: 'text' },
          { key: 'tipoCondominio', label: 'Tipo', type: 'select', options: ['Residencial', 'Comercial', 'Misto', 'Industrial'] },
          { key: 'qtdUnidades', label: 'Nº de unidades', type: 'number' },
          { key: 'qtdPavimentos', label: 'Nº de pavimentos', type: 'number' },
          { key: 'areaCondominioTotal', label: 'Área total (m²)', type: 'number' },
          { key: 'nomeSindico', label: 'Nome do síndico', type: 'text' },
          { key: 'valorConstrucao', label: 'Valor de reconstrução (R$)', type: 'currency' },
        ],
      },
      {
        id: 'coberturas_cond',
        title: 'Coberturas',
        fields: [
          { key: 'cobIncendioCond', label: 'Incêndio / Raio (R$)', type: 'currency', required: true },
          { key: 'cobRouboCond', label: 'Roubo (R$)', type: 'currency' },
          { key: 'cobDanosEletricosCond', label: 'Danos elétricos (R$)', type: 'currency' },
          { key: 'cobVendavalCond', label: 'Vendaval / Granizo (R$)', type: 'currency' },
          { key: 'cobRCCond', label: 'RC Condomínio (R$)', type: 'currency' },
          { key: 'cobRCElevadorCond', label: 'RC Elevador (R$)', type: 'currency' },
          { key: 'vidrosCond', label: 'Vidros / Letreiros (R$)', type: 'currency' },
          { key: 'assistenciaCond', label: 'Assistência 24h', type: 'toggle' },
        ],
      },
    ],
  },

  'Empresarial': {
    sections: [
      {
        id: 'empresa',
        title: 'Dados da Empresa',
        fields: [
          { key: 'nomeEmpresa', label: 'Razão social', type: 'text', required: true, colSpan: 2 },
          { key: 'cnpjEmpresa', label: 'CNPJ', type: 'text', required: true },
          { key: 'atividadeEmpresa', label: 'Ramo de atividade', type: 'text', required: true },
          { key: 'enderecoSegurado', label: 'Endereço do risco', type: 'text', colSpan: 2 },
          { key: 'areaEstabelecimento', label: 'Área do estabelecimento (m²)', type: 'number' },
          { key: 'numFuncionarios', label: 'Nº de funcionários', type: 'number' },
          { key: 'faturamentoMensal', label: 'Faturamento mensal (R$)', type: 'currency' },
          { key: 'tipoConstrucaoEmp', label: 'Tipo de construção', type: 'select', options: ['Alvenaria', 'Madeira', 'Mista', 'Metálica'] },
          { key: 'estoqueMedio', label: 'Estoque médio (R$)', type: 'currency' },
        ],
      },
      {
        id: 'coberturas_emp',
        title: 'Coberturas',
        fields: [
          { key: 'cobIncendioEmp', label: 'Incêndio / Explosão / Raio (R$)', type: 'currency', required: true },
          { key: 'cobRouboEmp', label: 'Roubo de mercadorias (R$)', type: 'currency' },
          { key: 'cobEquipamentos', label: 'Equipamentos eletrônicos (R$)', type: 'currency' },
          { key: 'cobRCEmpresarial', label: 'RC Geral (R$)', type: 'currency' },
          { key: 'cobLucros', label: 'Lucros cessantes', type: 'toggle' },
          { key: 'cobVidrosEmp', label: 'Vidros (R$)', type: 'currency' },
          { key: 'cobVendavalEmp', label: 'Vendaval (R$)', type: 'currency' },
          { key: 'assistenciaEmp', label: 'Assistência 24h', type: 'toggle' },
        ],
      },
    ],
  },

  'Vida Individual': {
    sections: [
      {
        id: 'segurado_vida',
        title: 'Dados do Segurado',
        fields: [
          { key: 'seguradoPrincipal', label: 'Nome do segurado', type: 'text', required: true },
          { key: 'cpfSegurado', label: 'CPF', type: 'text', required: true },
          { key: 'dataNascSegurado', label: 'Data de nascimento', type: 'date', required: true },
          { key: 'sexoSegurado', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino'] },
          { key: 'profissaoSegurado', label: 'Profissão', type: 'text' },
          { key: 'fumanteSegurado', label: 'É fumante?', type: 'toggle' },
          { key: 'beneficiario1', label: 'Beneficiário 1', type: 'text' },
          { key: 'beneficiario2', label: 'Beneficiário 2', type: 'text' },
        ],
      },
      {
        id: 'coberturas_vida',
        title: 'Coberturas',
        fields: [
          { key: 'capitalSegurado', label: 'Capital segurado (R$)', type: 'currency', required: true },
          { key: 'cobMorte', label: 'Morte por qualquer causa', type: 'toggle' },
          { key: 'cobMorteAcidental', label: 'Morte acidental', type: 'toggle' },
          { key: 'cobInvalidez', label: 'Invalidez permanente total ou parcial', type: 'toggle' },
          { key: 'cobDoencasGraves', label: 'Doenças graves', type: 'toggle' },
          { key: 'cobFuneral', label: 'Assistência funeral', type: 'toggle' },
          { key: 'cobDiarias', label: 'Diárias por incapacidade (R$)', type: 'currency' },
          { key: 'cobDesemprego', label: 'Proteção ao desemprego', type: 'toggle' },
        ],
      },
    ],
  },

  'Vida Empresarial': {
    sections: [
      {
        id: 'empresa_vida',
        title: 'Dados da Empresa',
        fields: [
          { key: 'nomeEmpresaVida', label: 'Razão social', type: 'text', required: true, colSpan: 2 },
          { key: 'cnpjEmpresaVida', label: 'CNPJ', type: 'text', required: true },
          { key: 'qtdVidasEmpresa', label: 'Nº de vidas', type: 'number', required: true },
          { key: 'massaSalarial', label: 'Massa salarial (R$)', type: 'currency' },
        ],
      },
      {
        id: 'coberturas_vida_emp',
        title: 'Coberturas',
        fields: [
          { key: 'capitalVidaEmp', label: 'Capital por morte (R$)', type: 'currency', required: true },
          { key: 'cobMorteEmp', label: 'Morte por qualquer causa', type: 'toggle' },
          { key: 'cobInvalidezEmp', label: 'Invalidez permanente', type: 'toggle' },
          { key: 'cobDoencasGravesEmp', label: 'Doenças graves', type: 'toggle' },
          { key: 'cobFuneralEmp', label: 'Assistência funeral', type: 'toggle' },
          { key: 'cobDesempregoEmp', label: 'Proteção ao desemprego', type: 'toggle' },
        ],
      },
    ],
  },

  'Saúde': {
    sections: [
      {
        id: 'titular',
        title: 'Dados do Titular',
        fields: [
          { key: 'titular', label: 'Nome do titular', type: 'text', required: true },
          { key: 'cpfTitular', label: 'CPF do titular', type: 'text', required: true },
          { key: 'dataNascTitular', label: 'Data de nascimento', type: 'date', required: true },
          { key: 'sexoTitular', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino'] },
          { key: 'emailTitular', label: 'E-mail', type: 'text' },
          { key: 'telefoneTitular', label: 'Telefone', type: 'text' },
        ],
      },
      {
        id: 'vidas',
        title: 'Vidas / Dependentes',
        fields: [
          { key: 'qtdVidas', label: 'Total de vidas', type: 'number', required: true },
          { key: 'dependentes', label: 'Dependentes (nomes, separados por vírgula)', type: 'textarea' },
          { key: 'faixasEtarias', label: 'Faixas etárias', type: 'textarea', placeholder: 'Ex: 2 de 0-18 anos, 1 de 30-39 anos' },
        ],
      },
      {
        id: 'plano_saude',
        title: 'Dados do Plano',
        fields: [
          { key: 'operadora', label: 'Operadora', type: 'select', options: ['Bradesco Saúde', 'Amil', 'SulAmérica Saúde', 'Unimed', 'NotreDame', 'Hapvida', 'Porto Seguro Saúde', 'Prevent Senior'] },
          { key: 'tipoPlano', label: 'Tipo de plano', type: 'select', options: ['Individual', 'Familiar', 'Empresarial', 'Adesão'] },
          { key: 'abrangencia', label: 'Abrangência', type: 'select', options: ['Nacional', 'Estadual', 'Municipal', 'Grupo de municípios'] },
          { key: 'acomodacao', label: 'Acomodação', type: 'select', options: ['Enfermaria', 'Apartamento'] },
          { key: 'coparticipacao', label: 'Com coparticipação?', type: 'toggle' },
          { key: 'odontologicoIncluido', label: 'Odontológico incluído?', type: 'toggle' },
          { key: 'valorMensal', label: 'Valor mensal (R$)', type: 'currency' },
          { key: 'diaPagamento', label: 'Dia de pagamento', type: 'number' },
        ],
      },
    ],
  },

  'Odontológico': {
    sections: [
      {
        id: 'titular_odonto',
        title: 'Dados do Titular',
        fields: [
          { key: 'titularOdonto', label: 'Nome do titular', type: 'text', required: true },
          { key: 'cpfOdonto', label: 'CPF', type: 'text', required: true },
          { key: 'dataNascOdonto', label: 'Data de nascimento', type: 'date' },
        ],
      },
      {
        id: 'plano_odonto',
        title: 'Dados do Plano',
        fields: [
          { key: 'operadoraOdonto', label: 'Operadora', type: 'select', options: ['OdontoPrev', 'Amil Dental', 'Bradesco Dental', 'SulAmérica Odonto', 'Unimed Odonto', 'Porto Seguro Odonto'] },
          { key: 'tipoPlanoOdonto', label: 'Tipo', type: 'select', options: ['Individual', 'Familiar', 'Empresarial'] },
          { key: 'qtdVidasOdonto', label: 'Nº de vidas', type: 'number' },
          { key: 'cobPreventivo', label: 'Cobertura preventiva', type: 'toggle' },
          { key: 'cobOrtodontia', label: 'Ortodontia', type: 'toggle' },
          { key: 'cobProtese', label: 'Prótese dentária', type: 'toggle' },
          { key: 'valorOdonto', label: 'Valor mensal (R$)', type: 'currency' },
        ],
      },
    ],
  },

  'Viagem': {
    sections: [
      {
        id: 'passageiro',
        title: 'Dados do Passageiro',
        fields: [
          { key: 'nomePassageiro', label: 'Nome do passageiro', type: 'text', required: true },
          { key: 'cpfPassageiro', label: 'CPF', type: 'text' },
          { key: 'dataNascPassageiro', label: 'Data de nascimento', type: 'date', required: true },
          { key: 'passaportePassageiro', label: 'Nº do passaporte', type: 'text' },
        ],
      },
      {
        id: 'viagem',
        title: 'Dados da Viagem',
        fields: [
          { key: 'destinoViagem', label: 'Destino(s)', type: 'text', required: true, colSpan: 2 },
          { key: 'tipoViagem', label: 'Tipo de viagem', type: 'select', required: true, options: ['Nacional', 'Internacional', 'América do Sul', 'Europa', 'Américas', 'Mundo'] },
          { key: 'dataPartidaViagem', label: 'Data de partida', type: 'date', required: true },
          { key: 'dataRetornoViagem', label: 'Data de retorno', type: 'date', required: true },
          { key: 'qtdPassageiros', label: 'Nº de passageiros', type: 'number' },
          { key: 'motivoViagem', label: 'Motivo', type: 'select', options: ['Lazer', 'Negócios', 'Estudos', 'Intercâmbio', 'Mochilão'] },
        ],
      },
      {
        id: 'coberturas_viagem',
        title: 'Coberturas',
        fields: [
          { key: 'cobMedicaViagem', label: 'Despesas médicas/hospitalares (US$)', type: 'number' },
          { key: 'cobBagagem', label: 'Extravio de bagagem (US$)', type: 'number' },
          { key: 'cobCancelamento', label: 'Cancelamento de viagem', type: 'toggle' },
          { key: 'cobAtrasoVoo', label: 'Atraso de voo', type: 'toggle' },
          { key: 'cobEsportes', label: 'Esportes de aventura', type: 'toggle' },
          { key: 'cobRcViagem', label: 'RC pessoal', type: 'toggle' },
        ],
      },
    ],
  },

  'Equipamentos': {
    sections: [
      {
        id: 'equipamentos',
        title: 'Dados dos Equipamentos',
        fields: [
          { key: 'tipoEquipamento', label: 'Tipo de equipamento', type: 'select', required: true, options: ['Eletrônicos', 'Máquinas industriais', 'Equipamentos médicos', 'Ferramentas', 'Câmeras profissionais', 'Instrumentos musicais', 'Equipamentos agrícolas', 'Outros'] },
          { key: 'descricaoEquipamentos', label: 'Descrição dos equipamentos', type: 'textarea', required: true, colSpan: 2 },
          { key: 'marcaEquipamento', label: 'Marca principal', type: 'text' },
          { key: 'localEquipamento', label: 'Local de uso', type: 'select', options: ['Fixo (empresa/residência)', 'Portátil (itinerante)', 'Ambos'] },
          { key: 'valorEquipamentos', label: 'Valor total (R$)', type: 'currency', required: true },
        ],
      },
      {
        id: 'coberturas_equip',
        title: 'Coberturas',
        fields: [
          { key: 'cobDanosEquip', label: 'Danos acidentais', type: 'toggle' },
          { key: 'cobRouboEquip', label: 'Roubo', type: 'toggle' },
          { key: 'cobDanosEletricosEquip', label: 'Danos elétricos', type: 'toggle' },
          { key: 'cobTransporteEquip', label: 'Durante transporte', type: 'toggle' },
          { key: 'franquiaEquip', label: 'Franquia (%)', type: 'number' },
        ],
      },
    ],
  },

  'Celular': {
    sections: [
      {
        id: 'celular',
        title: 'Dados do Aparelho',
        fields: [
          { key: 'marcaCelular', label: 'Marca', type: 'select', required: true, options: ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'LG', 'Huawei', 'Sony', 'Nokia', 'Google', 'OnePlus'] },
          { key: 'modeloCelular', label: 'Modelo', type: 'text', required: true },
          { key: 'imeiCelular', label: 'IMEI', type: 'text', required: true },
          { key: 'corCelular', label: 'Cor', type: 'text' },
          { key: 'notaFiscalCelular', label: 'Possui nota fiscal?', type: 'toggle' },
          { key: 'valorCelular', label: 'Valor (R$)', type: 'currency', required: true },
          { key: 'dataCompraCelular', label: 'Data de compra', type: 'date' },
        ],
      },
      {
        id: 'coberturas_celular',
        title: 'Coberturas',
        fields: [
          { key: 'cobRouboCelular', label: 'Roubo / Furto', type: 'toggle' },
          { key: 'cobQuebraCelular', label: 'Danos acidentais', type: 'toggle' },
          { key: 'cobTelaQuebrada', label: 'Tela quebrada', type: 'toggle' },
          { key: 'cobLiquidoCelular', label: 'Danos por líquidos', type: 'toggle' },
          { key: 'franquiaCelular', label: 'Franquia (R$)', type: 'currency' },
        ],
      },
    ],
  },

  'Rural': {
    sections: [
      {
        id: 'rural',
        title: 'Dados da Propriedade',
        fields: [
          { key: 'nomePropriedade', label: 'Nome da propriedade', type: 'text', required: true },
          { key: 'municipioRural', label: 'Município', type: 'text', required: true },
          { key: 'estadoRural', label: 'Estado (UF)', type: 'text', required: true },
          { key: 'areaHectares', label: 'Área total (hectares)', type: 'number' },
          { key: 'tipoRural', label: 'Tipo de atividade', type: 'select', options: ['Agricultura', 'Pecuária', 'Fruticultura', 'Avicultura', 'Suinocultura', 'Aquicultura', 'Mista'] },
          { key: 'culturaRural', label: 'Cultura principal', type: 'text', placeholder: 'Ex: Soja, Milho, Cana' },
          { key: 'valorBenfeitorias', label: 'Valor das benfeitorias (R$)', type: 'currency' },
        ],
      },
      {
        id: 'coberturas_rural',
        title: 'Coberturas',
        fields: [
          { key: 'cobIncendioRural', label: 'Incêndio de instalações', type: 'toggle' },
          { key: 'cobAnimaisRural', label: 'Morte de animais', type: 'toggle' },
          { key: 'cobProdutosRural', label: 'Produtos agrícolas (R$)', type: 'currency' },
          { key: 'cobMaquinasRural', label: 'Máquinas e implementos (R$)', type: 'currency' },
          { key: 'cobRcRural', label: 'RC Rural (R$)', type: 'currency' },
          { key: 'cobVendavalRural', label: 'Vendaval', type: 'toggle' },
        ],
      },
    ],
  },

  'Náutico': {
    sections: [
      {
        id: 'embarcacao',
        title: 'Dados da Embarcação',
        fields: [
          { key: 'tipoEmbarcacao', label: 'Tipo', type: 'select', required: true, options: ['Lancha', 'Veleiro', 'Barco a remo', 'Jet ski', 'Catamarã', 'Iate', 'Barco de pesca'] },
          { key: 'marcaEmbarcacao', label: 'Marca', type: 'text' },
          { key: 'modeloEmbarcacao', label: 'Modelo', type: 'text', required: true },
          { key: 'anoEmbarcacao', label: 'Ano', type: 'number' },
          { key: 'comprimentoEmbarcacao', label: 'Comprimento (m)', type: 'number' },
          { key: 'potenciaMotor', label: 'Potência do motor (HP)', type: 'number' },
          { key: 'valorEmbarcacao', label: 'Valor da embarcação (R$)', type: 'currency', required: true },
          { key: 'localGuarda', label: 'Local de guarda', type: 'select', options: ['Marina', 'Garagem', 'Residência', 'Condomínio náutico'] },
        ],
      },
      {
        id: 'coberturas_nautico',
        title: 'Coberturas',
        fields: [
          { key: 'cobCascoNautico', label: 'Casco', type: 'toggle' },
          { key: 'cobMaquinasNautico', label: 'Máquinas / Motores', type: 'toggle' },
          { key: 'cobEquipamentosNautico', label: 'Equipamentos de navegação', type: 'toggle' },
          { key: 'cobRcNautico', label: 'RC Aquaviário (R$)', type: 'currency' },
          { key: 'cobAssistenciaNautica', label: 'Assistência náutica', type: 'toggle' },
          { key: 'cobTripulacaoNautica', label: 'Acidentes com tripulantes', type: 'toggle' },
          { key: 'franquiaNautico', label: 'Franquia (%)', type: 'number' },
        ],
      },
    ],
  },

  'Garantia': {
    sections: [
      {
        id: 'garantia_modalidade',
        title: 'Modalidade da Garantia',
        fields: [
          { key: 'ramoGarantia', label: 'Ramo / segmento', type: 'select', required: true, options: ['Setor Público', 'Setor Privado', 'Judicial', 'Aduaneiro', 'Concessões / PPP', 'Ambiental', 'Tributário', 'Setor Elétrico'] },
          {
            key: 'tipoGarantia', label: 'Modalidade (tipo de seguro garantia)', type: 'select', required: true,
            optionGroups: [
              {
                label: 'Setor Público',
                options: [
                  'Garantia de Licitante (Bid Bond)',
                  'Garantia de Executante Construtor (Performance Bond)',
                  'Garantia de Executante Fornecedor',
                  'Garantia de Executante Prestador de Serviços',
                  'Garantia de Adiantamento de Pagamento',
                  'Garantia de Retenção de Pagamentos',
                  'Garantia de Perfeito Funcionamento / Manutenção',
                  'Garantia Imobiliária (Setor Público)',
                  'Garantia de Concessão Pública / PPP',
                ],
              },
              {
                label: 'Setor Privado',
                options: [
                  'Garantia do Executante Construtor (Privado)',
                  'Garantia do Executante Fornecedor (Privado)',
                  'Garantia do Executante Prestador de Serviços (Privado)',
                  'Garantia de Adiantamento de Pagamento (Privado)',
                  'Garantia de Retenção de Pagamentos (Privado)',
                  'Garantia de Perfeito Funcionamento (Privado)',
                  'Garantia Imobiliária / Conclusão de Obra (Privado)',
                  'Garantia de Pagamento / Financeira (Privado)',
                ],
              },
              {
                label: 'Judicial',
                options: [
                  'Garantia Judicial Cível',
                  'Garantia Judicial Trabalhista',
                  'Garantia Judicial Fiscal (Execução Fiscal)',
                  'Garantia de Recurso / Depósito Recursal',
                ],
              },
              {
                label: 'Especiais / Setoriais',
                options: [
                  'Garantia Aduaneira (Trânsito / Regimes Aduaneiros)',
                  'Garantia Ambiental',
                  'Garantia Tributária / ICMS / Parcelamento Fiscal',
                  'Garantia do Setor Elétrico (CCEE / ANEEL)',
                  'Garantia de Energia (Leilões)',
                  'Garantia de Crédito / Financeira',
                ],
              },
            ],
          },
          { key: 'cosseguroGarantia', label: 'Possui cosseguro / resseguro?', type: 'toggle' },
        ],
      },
      {
        id: 'garantia',
        title: 'Dados do Risco',
        fields: [
          { key: 'tomadorGarantia', label: 'Tomador (afiançado)', type: 'text', required: true },
          { key: 'cnpjTomador', label: 'CNPJ / CPF do tomador', type: 'text' },
          { key: 'beneficiarioGarantia', label: 'Beneficiário (segurado/credor)', type: 'text', required: true },
          { key: 'cnpjBeneficiario', label: 'CNPJ / CPF do beneficiário', type: 'text' },
          { key: 'numeroEditalContrato', label: 'Nº do edital / contrato / processo', type: 'text' },
          { key: 'objetoGarantia', label: 'Objeto do contrato / da obrigação', type: 'textarea', colSpan: 2 },
          { key: 'valorGarantia', label: 'Importância segurada / valor garantido (R$)', type: 'currency', required: true },
          { key: 'valorContrato', label: 'Valor do contrato (R$)', type: 'currency' },
          { key: 'percentualGarantido', label: '% garantido do contrato', type: 'number' },
          { key: 'prazoVigenciaGarantia', label: 'Prazo de vigência (meses)', type: 'number' },
          { key: 'dataInicioVigenciaGarantia', label: 'Início de vigência', type: 'date' },
          { key: 'dataFimVigenciaGarantia', label: 'Fim de vigência', type: 'date' },
        ],
      },
    ],
  },

  'Fiança': {
    sections: [
      {
        id: 'fianca',
        title: 'Dados do Locatário',
        fields: [
          { key: 'locatario', label: 'Nome do locatário', type: 'text', required: true },
          { key: 'cpfLocatario', label: 'CPF do locatário', type: 'text', required: true },
          { key: 'dataNascLocatario', label: 'Data de nascimento', type: 'date' },
          { key: 'profissaoLocatario', label: 'Profissão', type: 'text' },
          { key: 'rendaLocatario', label: 'Renda mensal (R$)', type: 'currency' },
        ],
      },
      {
        id: 'imovel_fianca',
        title: 'Dados do Imóvel Locado',
        fields: [
          { key: 'enderecoImovelLocado', label: 'Endereço do imóvel locado', type: 'text', colSpan: 2, required: true },
          { key: 'tipoImovelLocado', label: 'Tipo do imóvel', type: 'select', options: ['Residencial', 'Comercial'] },
          { key: 'valorAluguel', label: 'Valor do aluguel (R$)', type: 'currency', required: true },
          { key: 'prazoContrato', label: 'Prazo do contrato (meses)', type: 'number' },
          { key: 'multasIncluidas', label: 'Inclui multas e encargos?', type: 'toggle' },
          { key: 'pinturaIncluida', label: 'Inclui pintura?', type: 'toggle' },
        ],
      },
    ],
  },

  'RC': {
    sections: [
      {
        id: 'rc',
        title: 'Dados do Risco RC',
        fields: [
          { key: 'tipoRC', label: 'Tipo de RC', type: 'select', required: true, options: ['RC Geral', 'RC Profissional', 'RC Médico', 'RC Produtos', 'D&O (Diretores e Administradores)', 'RC Empregador', 'RC Ambiental', 'RC Obras'] },
          { key: 'atividadeRC', label: 'Atividade / profissão', type: 'text', required: true },
          { key: 'faturamentoRC', label: 'Faturamento anual (R$)', type: 'currency' },
          { key: 'limiteMinimoRC', label: 'Limite de indenização (R$)', type: 'currency', required: true },
          { key: 'descricaoRiscoRC', label: 'Descrição do risco', type: 'textarea', colSpan: 2 },
          { key: 'retroatividadeRC', label: 'Retroatividade (anos)', type: 'number' },
          { key: 'franquiaRC', label: 'Franquia (R$)', type: 'currency' },
        ],
      },
    ],
  },

  'Previdência': {
    sections: [
      {
        id: 'previdente',
        title: 'Dados do Participante',
        fields: [
          { key: 'nomeParticipante', label: 'Nome do participante', type: 'text', required: true },
          { key: 'cpfParticipante', label: 'CPF', type: 'text', required: true },
          { key: 'dataNascParticipante', label: 'Data de nascimento', type: 'date', required: true },
          { key: 'profissaoParticipante', label: 'Profissão', type: 'text' },
          { key: 'rendaParticipante', label: 'Renda mensal (R$)', type: 'currency' },
          { key: 'beneficiarioPrev', label: 'Beneficiários', type: 'textarea' },
        ],
      },
      {
        id: 'plano_prev',
        title: 'Dados do Plano',
        fields: [
          { key: 'tipoPrev', label: 'Tipo de plano', type: 'select', required: true, options: ['PGBL', 'VGBL'] },
          { key: 'operadoraPrev', label: 'Operadora', type: 'select', options: ['Bradesco Vida', 'Brasilprev', 'SulAmérica Previdência', 'Itaú Previdência', 'Zurich', 'Mongeral Aegon', 'Porto Seguro Previdência'] },
          { key: 'tributacaoPrev', label: 'Regime de tributação', type: 'select', options: ['Progressivo', 'Regressivo'] },
          { key: 'contribuicaoPrev', label: 'Contribuição mensal (R$)', type: 'currency', required: true },
          { key: 'aporteInicial', label: 'Aporte inicial (R$)', type: 'currency' },
          { key: 'prazoAcumulacao', label: 'Prazo de acumulação (anos)', type: 'number' },
          { key: 'perfilRisco', label: 'Perfil de risco', type: 'select', options: ['Conservador', 'Moderado', 'Arrojado'] },
        ],
      },
    ],
  },

  'Consórcio': {
    sections: [
      {
        id: 'consorciado',
        title: 'Dados do Consorciado',
        fields: [
          { key: 'nomeConsorciado', label: 'Nome', type: 'text', required: true },
          { key: 'cpfConsorciado', label: 'CPF', type: 'text', required: true },
          { key: 'dataNascConsorciado', label: 'Data de nascimento', type: 'date' },
          { key: 'telefoneConsorciado', label: 'Telefone', type: 'text' },
        ],
      },
      {
        id: 'grupo_consorcio',
        title: 'Dados do Consórcio',
        fields: [
          { key: 'tipoConsorcio', label: 'Tipo', type: 'select', required: true, options: ['Imóvel', 'Automóvel', 'Caminhão', 'Moto', 'Serviços'] },
          { key: 'administradoraConsorcio', label: 'Administradora', type: 'text', required: true },
          { key: 'grupoConsorcio', label: 'Número do grupo', type: 'text' },
          { key: 'cotaConsorcio', label: 'Cota', type: 'text' },
          { key: 'valorCreditoConsorcio', label: 'Valor do crédito (R$)', type: 'currency', required: true },
          { key: 'prazoConsorcio', label: 'Prazo (meses)', type: 'number' },
          { key: 'parcelaConsorcio', label: 'Parcela mensal (R$)', type: 'currency' },
          { key: 'taxaAdmConsorcio', label: 'Taxa de administração (%)', type: 'number' },
          { key: 'fundoReservaConsorcio', label: 'Fundo de reserva (%)', type: 'number' },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
TIPO DE CONSÓRCIO: {{tipoConsorcio}}
VALOR DO CRÉDITO SOLICITADO CLIENTE: R$ {{valorCreditoConsorcio}}
NÚMERO DE MESES: {{prazoConsorcio}}
--- SIMULAÇÃO ---
COMISSÃO TOTAL %: 1,5 fixo | COMISSÃO ATTENTI %: 1,5 | PRÊMIO: R$ {{premioLiquido}}`,
  },

  // ══════════════════════════════════════════════════════════════
  // TIPOS ATTENTI — adicionados conforme Manual de Operações 2026
  // ══════════════════════════════════════════════════════════════

  'Patrimoniais': {
    sections: [
      {
        id: 'risco_pat',
        title: 'Endereço do Risco',
        fields: [
          { key: 'enderecoRisco', label: 'Endereço do risco', type: 'text', required: true, colSpan: 2 },
          { key: 'temBeneficiario', label: 'Tem beneficiário no seguro?', type: 'toggle' },
          { key: 'beneficiarioNome', label: 'Nome/Razão Social do beneficiário', type: 'text' },
          { key: 'beneficiarioCpfCnpj', label: 'CPF/CNPJ do beneficiário', type: 'text' },
          { key: 'valorImovel', label: 'Valor do imóvel (R$)', type: 'currency' },
          { key: 'itemNovo', label: 'Item novo?', type: 'toggle' },
        ],
      },
      {
        id: 'coberturas_pat',
        title: 'Coberturas',
        fields: [
          { key: 'assistencia', label: 'Assistência', type: 'select', options: ['Básica', 'Completa', 'Sem assistência'] },
          { key: 'cobIncendio', label: 'Incêndio', type: 'toggle' },
          { key: 'cobDanosMorais', label: 'Danos Morais', type: 'toggle' },
          { key: 'cobRcf', label: 'RCF', type: 'toggle' },
          { key: 'cobDanosEletricos', label: 'Danos Elétricos', type: 'toggle' },
          { key: 'cobEquipamentos', label: 'Equipamentos', type: 'toggle' },
          { key: 'cobAluguel', label: 'Aluguel', type: 'toggle' },
          { key: 'cobVidros', label: 'Vidros', type: 'toggle' },
          { key: 'cobRouboFurto', label: 'Roubo e Furto', type: 'toggle' },
          { key: 'cobVazamentos', label: 'Vazamentos', type: 'toggle' },
          { key: 'cobVendaval', label: 'Vendaval', type: 'toggle' },
          { key: 'cobDesmoronamento', label: 'Desmoronamento', type: 'toggle' },
          { key: 'cobTumulto', label: 'Tumulto/Greve', type: 'toggle' },
          { key: 'cobImpactoVeiculos', label: 'Impacto de Veículos', type: 'toggle' },
          { key: 'cobRecomposicaoDocs', label: 'Recomposição de Documentos', type: 'toggle' },
        ],
      },
      {
        id: 'vigencia_pat',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigencia', label: 'Início da vigência', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim da vigência', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
TEM BENEFICIÁRIO NO SEGURO? ( ) SIM ( ) NÃO
SE SIM: {{beneficiarioNome}} / {{beneficiarioCpfCnpj}}
ENDEREÇO DO RISCO: {{enderecoRisco}}
VALOR DO IMÓVEL: R$ {{valorImovel}}
COBERTURAS:
  Assistência: ( ) Básica ( ) Completa
  Cobertura Incêndio / Danos Morais / RCF / Danos Elétricos / Equipamento(s)
  Aluguel / Vidros / Roubo e Furto / Vazamentos / Vendaval
  Desmoronamento / Tumulto/Greve / Impacto de Veículos / Recomposição de Documentos
ITEM NOVO: ( ) SIM ( ) NÃO
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
--- COTAÇÃO ---
COMISSÃO TOTAL %: {{comissaoTotal}} | COMISSÃO ATTENTI %: {{comissaoAttenti}} | PRÊMIO LÍQUIDO: R$ {{premioLiquido}} | PRÊMIO BRUTO: R$ {{premioBruto}}`,
  },

  'Vida PF': {
    sections: [
      {
        id: 'segurado_vidapf',
        title: 'Dados do Segurado',
        fields: [
          { key: 'nomeSegurado', label: 'Nome do segurado', type: 'text', required: true },
          { key: 'cpfSegurado', label: 'CPF', type: 'text', required: true },
          { key: 'dataNascSegurado', label: 'Data de nascimento', type: 'date', required: true },
          { key: 'idadeSegurado', label: 'Idade', type: 'number' },
          { key: 'estadoCivilSegurado', label: 'Estado civil', type: 'select', options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'] },
          { key: 'profissaoSegurado', label: 'Profissão', type: 'text' },
          { key: 'rendaMensalSegurado', label: 'Renda mensal (R$)', type: 'currency' },
          { key: 'fumante', label: 'Fumante?', type: 'toggle' },
          { key: 'praticaEsporte', label: 'Pratica esporte?', type: 'toggle' },
          { key: 'tipoEsporte', label: 'Qual esporte?', type: 'text' },
          { key: 'aposentado', label: 'Aposentado?', type: 'toggle' },
        ],
      },
      {
        id: 'coberturas_vidapf',
        title: 'Coberturas',
        fields: [
          { key: 'cobMorte', label: 'Morte', type: 'toggle' },
          { key: 'cobMorteAcidental', label: 'Morte Acidental', type: 'toggle' },
          { key: 'capitalMorte', label: 'Capital morte (R$)', type: 'currency' },
          { key: 'cobIpa', label: 'IPA — Invalidez Perm. por Acidente', type: 'toggle' },
          { key: 'cobIfpd', label: 'IFPD — Invalidez Func. Perm. Total por Doença', type: 'toggle' },
          { key: 'cobDit', label: 'DIT — Diária Incapacidade Temporária (R$/dia)', type: 'currency' },
          { key: 'cobDih', label: 'DIH — Diária Internação Hospitalar (R$/dia)', type: 'currency' },
          { key: 'cobDoencasGraves', label: 'Doenças Graves', type: 'toggle' },
          { key: 'cobFuneral', label: 'Assistência Funeral', type: 'toggle' },
        ],
      },
      {
        id: 'vigencia_vidapf',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigencia', label: 'Início da vigência', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim da vigência', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
DATA DE NASCIMENTO: {{dataNascSegurado}} | IDADE: {{idadeSegurado}} | ESTADO CIVIL: {{estadoCivilSegurado}} | PROFISSÃO: {{profissaoSegurado}} | RENDA MENSAL: R$ {{rendaMensalSegurado}}
FUMANTE: ( ) SIM ( ) NÃO
PRATICA ESPORTE: ( ) SIM ( ) NÃO — Qual? {{tipoEsporte}}
APOSENTADO: ( ) SIM ( ) NÃO
COBERTURAS:
  MORTE / MORTE ACIDENTAL
  INVALIDEZ PERM. TOTAL OU PARCIAL POR ACIDENTE (IPA)
  INVALIDEZ FUNCIONAL PERM. TOTAL POR DOENÇA (IFPD)
  DIT / DIH / DOENÇAS GRAVES / ASSISTÊNCIA FUNERAL
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
--- COTAÇÃO ---
COMISSÃO VITALÍCIA TOTAL %: {{comissaoTotal}} | COMISSÃO VITALÍCIA ATTENTI %: {{comissaoAttenti}}
COMISSÃO AGENCIAMENTO TOTAL %: | COMISSÃO AGENCIAMENTO ATTENTI %:
PRÊMIO: R$ {{premioLiquido}}`,
  },

  'Vida PJ': {
    sections: [
      {
        id: 'empresa_vidapj',
        title: 'Dados da Empresa',
        fields: [
          { key: 'razaoSocial', label: 'Razão social', type: 'text', required: true, colSpan: 2 },
          { key: 'cnpj', label: 'CNPJ', type: 'text', required: true },
          { key: 'qtdVidasColaboradores', label: 'Nº de vidas colaboradores', type: 'number', required: true },
          { key: 'qtdVidasSocios', label: 'Nº de vidas sócios', type: 'number' },
          { key: 'tipoPlanoVidaPj', label: 'Tipo', type: 'select', options: ['Global', 'PME'], required: true },
          { key: 'acordoClt', label: 'De acordo com CLT?', type: 'toggle' },
        ],
      },
      {
        id: 'vidas_vidapj',
        title: 'Relação de Vidas',
        fields: [
          { key: 'relaçãoVidas', label: 'Relação de vidas (nome, CPF, nascimento, idade, afastado)', type: 'textarea', colSpan: 2, placeholder: 'Nome Completo | CPF | Data Nasc. | Idade | Afastado (S/N) | CID se afastado' },
        ],
      },
      {
        id: 'coberturas_vidapj',
        title: 'Coberturas',
        fields: [
          { key: 'cobMortePj', label: 'Morte', type: 'toggle' },
          { key: 'cobMorteAcidentalPj', label: 'Morte Acidental', type: 'toggle' },
          { key: 'capitalMortePj', label: 'Capital morte (R$)', type: 'currency' },
          { key: 'cobIpaPj', label: 'IPA — Invalidez por Acidente', type: 'toggle' },
          { key: 'cobIfpdPj', label: 'IFPD — Invalidez por Doença', type: 'toggle' },
          { key: 'cobFuneralPj', label: 'Assistência Funeral', type: 'toggle' },
        ],
      },
      {
        id: 'vigencia_vidapj',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigencia', label: 'Início da vigência', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim da vigência', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
Nº DE VIDAS COLABORADORES: {{qtdVidasColaboradores}} | Nº DE VIDAS SÓCIOS: {{qtdVidasSocios}}
[Relação de vidas — incluir planilha]
TIPO: GLOBAL ( ) | PME ( )
DE ACORDO COM CLT? ( ) SIM ( ) NÃO
COBERTURAS: MORTE / MORTE ACIDENTAL / IPA / IFPD / ASSISTÊNCIA FUNERAL
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
--- COTAÇÃO ---
COMISSÃO VITALÍCIA TOTAL %: {{comissaoTotal}} / ATTENTI %: {{comissaoAttenti}}
COMISSÃO AGENCIAMENTO TOTAL %:  / ATTENTI %:
PRÊMIO MENSAL: R$ {{premioLiquido}} | PRÊMIO ANUAL: R$ {{premioAnual}}`,
  },

  'Seguro Garantia': {
    sections: [
      {
        id: 'partes_garantia',
        title: 'Partes do Contrato',
        fields: [
          { key: 'modalidade', label: 'Modalidade', type: 'select', required: true, options: ['Performance', 'Adiantamento de Pagamento', 'Pagamento', 'Compra e Venda de Energia'] },
          { key: 'razaoSocialSegurado', label: 'Razão Social do Segurado', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjSegurado', label: 'CPF / CNPJ do Segurado', type: 'text', required: true },
          { key: 'razaoSocialTomador', label: 'Razão Social do Tomador', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjTomador', label: 'CPF / CNPJ do Tomador', type: 'text', required: true },
        ],
      },
      {
        id: 'contrato_garantia',
        title: 'Dados do Contrato / Obrigação',
        fields: [
          { key: 'contrato', label: 'Contrato', type: 'text' },
          { key: 'processo', label: 'Processo', type: 'text' },
          { key: 'edital', label: 'Edital', type: 'text' },
          { key: 'objetoContrato', label: 'Objeto do Contrato/Pedido', type: 'textarea', colSpan: 2 },
          { key: 'objetoAdiantamento', label: 'Objeto (nos casos de Adiantamento de Pagamento)', type: 'textarea', colSpan: 2 },
          { key: 'valorEstimadoContrato', label: 'Valor Estimado do Contrato (R$)', type: 'currency' },
          { key: 'valorContrato', label: 'Valor do Contrato (R$)', type: 'currency', required: true },
          { key: 'valorDiferenca', label: 'Valor da Diferença (estimado + contrato) (R$)', type: 'currency' },
          { key: 'isContrato', label: 'IS (5% do contrato) (R$)', type: 'currency' },
          { key: 'isGarantiaAdicional', label: 'IS Garantia Adicional (R$)', type: 'currency' },
          { key: 'isTotal', label: 'IS Total (R$)', type: 'currency', required: true },
          { key: 'percentualGarantia', label: '% garantido do contrato', type: 'number' },
          { key: 'clausulaGarantia', label: 'Cláusula sobre garantia no contrato', type: 'text' },
          { key: 'numeroPaginaClausula', label: 'Número da página', type: 'text' },
          { key: 'condicoesParticulares', label: 'Condições Particulares', type: 'textarea', colSpan: 2 },
        ],
      },
      {
        id: 'vigencia_garantia',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigenciaContrato', label: 'Início vigência do contrato', type: 'date' },
          { key: 'fimVigenciaContrato', label: 'Fim vigência do contrato', type: 'date' },
          { key: 'inicioVigencia', label: 'Início vigência do seguro', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim vigência do seguro', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ: {{razaoSocialSegurado}} / {{cpfCnpjSegurado}}
CONTRATO: {{contrato}}
PROCESSO: {{processo}}
EDITAL: {{edital}}
OBJETO NOS CASOS DE ADIANTAMENTO DE PAGAMENTO: {{objetoAdiantamento}}
OBJETO DO CONTRATO/PEDIDO: {{objetoContrato}}
VALOR ESTIMADO DO CONTRATO: R$ {{valorEstimadoContrato}}
VALOR DO CONTRATO: R$ {{valorContrato}}
VALOR DA DIFERENÇA ESTIMADO CONTRATO + CONTRATO: R$ {{valorDiferenca}}
IS (5%) DO CONTRATO: R$ {{isContrato}}
IS DA GARANTIA ADICIONAL: R$ {{isGarantiaAdicional}}
IS TOTAL: R$ {{isTotal}}
VIGÊNCIA DO CONTRATO/ORDEM OU PEDIDO DE COMPRA: {{inicioVigenciaContrato}} A {{fimVigenciaContrato}}
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
CLÁUSULA SOBRE GARANTIA NO CONTRATO: {{clausulaGarantia}}
NÚMERO DA PÁGINA: {{numeroPaginaClausula}}
CONDIÇÕES PARTICULARES: {{condicoesParticulares}}
--- COTAÇÃO ---
{{dataHoraCotacao}} - SUBSCRITOR OU EMISSOR: {{subscritor}} - COMERCIAL: {{comercial}} - MINUTA SEGURADORA: {{seguradora}}
COMISSÃO TOTAL %: {{comissaoTotal}}
COM CO-CORRETAGEM ATTENTI %: {{comissaoAttenti}}
GRUPO MEGA %: {{comissaoMega}}
PRÊMIO: R$ {{premioLiquido}}`,
  },

  'Seguro Licitante': {
    sections: [
      {
        id: 'partes_licitante',
        title: 'Partes',
        fields: [
          { key: 'razaoSocialSegurado', label: 'Razão Social do Segurado', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjSegurado', label: 'CPF / CNPJ do Segurado', type: 'text', required: true },
          { key: 'razaoSocialTomador', label: 'Razão Social do Tomador', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjTomador', label: 'CPF / CNPJ do Tomador', type: 'text', required: true },
        ],
      },
      {
        id: 'licitacao',
        title: 'Dados da Licitação',
        fields: [
          { key: 'processo', label: 'Processo', type: 'text' },
          { key: 'edital', label: 'Edital', type: 'text', required: true },
          { key: 'objeto', label: 'Objeto', type: 'textarea', colSpan: 2, required: true },
          { key: 'valorEstimadoContrato', label: 'Valor Estimado do Contrato (R$)', type: 'currency', required: true },
          { key: 'percentualIs', label: '% IS', type: 'number' },
          { key: 'isTotal', label: 'IS (R$)', type: 'currency', required: true },
          { key: 'clausulaGarantia', label: 'Cláusula sobre garantia no edital', type: 'text' },
          { key: 'numeroPaginaClausula', label: 'Número da página', type: 'text' },
          { key: 'condicoesParticulares', label: 'Condições Particulares', type: 'textarea', colSpan: 2 },
        ],
      },
      {
        id: 'vigencia_licitante',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigenciaProposta', label: 'Início vigência da proposta', type: 'date' },
          { key: 'fimVigenciaProposta', label: 'Fim vigência da proposta', type: 'date' },
          { key: 'inicioVigencia', label: 'Início vigência do seguro', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim vigência do seguro', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ: {{razaoSocialSegurado}} / {{cpfCnpjSegurado}}
PROCESSO: {{processo}}
EDITAL: {{edital}}
OBJETO: {{objeto}}
VALOR ESTIMADO CONTRATO: R$ {{valorEstimadoContrato}}
IS ({{percentualIs}}%): R$ {{isTotal}}
VIGÊNCIA DA PROPOSTA: {{inicioVigenciaProposta}} A {{fimVigenciaProposta}}
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
CLÁUSULA SOBRE GARANTIA NO EDITAL: {{clausulaGarantia}} | NÚMERO DA PÁGINA: {{numeroPaginaClausula}}
CONDIÇÕES PARTICULARES: {{condicoesParticulares}}
--- COTAÇÃO ---
{{dataHoraCotacao}} - SUBSCRITOR OU EMISSOR: {{subscritor}} - COMERCIAL: {{comercial}} - MINUTA SEGURADORA: {{seguradora}}
COMISSÃO TOTAL %: {{comissaoTotal}}
COM CO-CORRETAGEM ATTENTI %: {{comissaoAttenti}}
GRUPO MEGA %: {{comissaoMega}}
PRÊMIO: R$ {{premioLiquido}}`,
  },

  'Seguro Judicial': {
    sections: [
      {
        id: 'partes_judicial',
        title: 'Partes',
        fields: [
          { key: 'tipoAcao', label: 'Tipo de Ação', type: 'select', required: true, options: ['Execução Fiscal', 'Execução Civil', 'Execução Tributária', 'Execução Criminal', 'Trabalhista', 'Depósito Recursal'] },
          { key: 'razaoSocialSegurado', label: 'Razão Social do Segurado', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjSegurado', label: 'CPF / CNPJ do Segurado', type: 'text', required: true },
        ],
      },
      {
        id: 'processo_judicial',
        title: 'Dados do Processo',
        fields: [
          { key: 'numeroProcesso', label: 'Número do Processo', type: 'text', required: true },
          { key: 'cda', label: 'CDA', type: 'text' },
          { key: 'tribunal', label: 'Tribunal', type: 'text' },
          { key: 'vara', label: 'Vara', type: 'text' },
          { key: 'isMais30', label: 'Valor da IS + 30% (R$)', type: 'currency', required: true },
          // Trabalhista extras
          { key: 'enderecoReclamante', label: 'Endereço do Reclamante', type: 'text', colSpan: 2 },
          { key: 'identidadeReclamante', label: 'Identidade do Reclamante', type: 'text' },
          { key: 'telefoneReclamante', label: 'Telefone do Reclamante', type: 'text' },
          { key: 'emailReclamante', label: 'E-mail do Reclamante', type: 'text' },
          // Depósito Recursal extra
          { key: 'tipoRecurso', label: 'Tipo de Recurso', type: 'text' },
        ],
      },
      {
        id: 'vigencia_judicial',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigencia', label: 'Início da vigência', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim da vigência', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ: {{razaoSocialSegurado}} / {{cpfCnpjSegurado}}
NÚMERO DO PROCESSO: {{numeroProcesso}}
CDA: {{cda}}
TIPO DE AÇÃO: {{tipoAcao}}
TRIBUNAL: {{tribunal}}
VARA: {{vara}}
VALOR DA IS + 30%: R$ {{isMais30}}
CNPJ/CPF SEGURADO: {{cpfCnpjSegurado}}
ENDEREÇO DO RECLAMANTE: {{enderecoReclamante}}
TIPO DE RECURSO: {{tipoRecurso}}
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
--- COTAÇÃO ---
{{dataHoraCotacao}} - SUBSCRITOR OU EMISSOR: {{subscritor}} - COMERCIAL: {{comercial}} - MINUTA SEGURADORA: {{seguradora}}
COMISSÃO TOTAL %: {{comissaoTotal}}
COM CO-CORRETAGEM ATTENTI %: {{comissaoAttenti}}
GRUPO MEGA %: {{comissaoMega}}
PRÊMIO: R$ {{premioLiquido}}`,
  },

  'Fiança Locatícia': {
    sections: [
      {
        id: 'partes_fianca',
        title: 'Partes',
        fields: [
          { key: 'razaoSocialSegurado', label: 'Locador (Razão Social / Nome)', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjSegurado', label: 'CPF / CNPJ do Locador', type: 'text', required: true },
          { key: 'nomeLocatario', label: 'Locatário (Nome / Razão Social)', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjLocatario', label: 'CPF / CNPJ do Locatário', type: 'text', required: true },
          { key: 'imobiliaria', label: 'Imobiliária', type: 'text' },
          { key: 'cnpjImobiliaria', label: 'CNPJ da Imobiliária', type: 'text' },
        ],
      },
      {
        id: 'imovel_fianca',
        title: 'Imóvel e Coberturas',
        fields: [
          { key: 'enderecoRisco', label: 'Endereço do risco', type: 'text', required: true, colSpan: 2 },
          { key: 'tipoImovelLocado', label: 'Tipo do imóvel', type: 'select', options: ['Residencial', 'Comercial'] },
          { key: 'cobAluguel', label: 'Aluguel (R$)', type: 'currency' },
          { key: 'cobIptu', label: 'IPTU (R$)', type: 'currency' },
          { key: 'cobAgua', label: 'Água (R$)', type: 'currency' },
          { key: 'cobLuz', label: 'Luz (R$)', type: 'currency' },
          { key: 'cobCondominio', label: 'Condomínio (R$)', type: 'currency' },
          { key: 'cobGas', label: 'Gás (R$)', type: 'currency' },
          { key: 'cobDanosImovel', label: 'Danos ao Imóvel (R$)', type: 'currency' },
          { key: 'cobMultaRescisao', label: 'Multa por Rescisão (R$)', type: 'currency' },
          { key: 'cobPinturaInterna', label: 'Pintura Interna (R$)', type: 'currency' },
          { key: 'cobPinturaExterna', label: 'Pintura Externa (R$)', type: 'currency' },
          { key: 'clausulaGarantia', label: 'Nº cláusula sobre garantia', type: 'text' },
          { key: 'numeroPaginaClausula', label: 'Número da página', type: 'text' },
          { key: 'condicoesParticulares', label: 'Condições Particulares', type: 'textarea', colSpan: 2 },
        ],
      },
      {
        id: 'vigencia_fianca',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigenciaContrato', label: 'Início vigência contrato de locação', type: 'date' },
          { key: 'fimVigenciaContrato', label: 'Fim vigência contrato de locação', type: 'date' },
          { key: 'inicioVigencia', label: 'Início vigência do seguro', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim vigência do seguro', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
RAZÃO SOCIAL DO SEGURADO / CPF OU CNPJ: {{razaoSocialSegurado}} / {{cpfCnpjSegurado}}
IMOBILIÁRIA: {{imobiliaria}}
CNPJ IMOBILIÁRIA: {{cnpjImobiliaria}}
ENDEREÇO DO RISCO: {{enderecoRisco}}
COBERTURAS:
  ALUGUEL: R$ {{cobAluguel}}
  IPTU: R$ {{cobIptu}}
  ÁGUA: R$ {{cobAgua}}
  LUZ: R$ {{cobLuz}}
  CONDOMÍNIO: R$ {{cobCondominio}}
  GÁS: R$ {{cobGas}}
  DANOS AO IMÓVEL: R$ {{cobDanosImovel}}
  MULTA POR RESCISÃO: R$ {{cobMultaRescisao}}
  PINTURA INTERNA: R$ {{cobPinturaInterna}} | PINTURA EXTERNA: R$ {{cobPinturaExterna}}
VIGÊNCIA DO CONTRATO DE LOCAÇÃO: {{inicioVigenciaContrato}} A {{fimVigenciaContrato}}
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
NÚMERO CLÁUSULA SOBRE GARANTIA: {{clausulaGarantia}} | NÚMERO DA PÁGINA: {{numeroPaginaClausula}}
CONDIÇÕES PARTICULARES: {{condicoesParticulares}}
--- COTAÇÃO ---
{{dataHoraCotacao}} - SUBSCRITOR OU EMISSOR: {{subscritor}} - COMERCIAL: {{comercial}} - MINUTA SEGURADORA: {{seguradora}}
COMISSÃO TOTAL %: {{comissaoTotal}}
COM CO-CORRETAGEM ATTENTI %: {{comissaoAttenti}}
GRUPO MEGA %: {{comissaoMega}}
PRÊMIO: R$ {{premioLiquido}}`,
  },

  'Capitalização Aluguel': {
    sections: [
      {
        id: 'partes_cap',
        title: 'Partes',
        fields: [
          { key: 'razaoSocialSegurado', label: 'Nome / Razão Social do Cliente', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjSegurado', label: 'CPF / CNPJ', type: 'text', required: true },
          { key: 'imobiliariaEstipulante', label: 'Imobiliária Estipulante', type: 'text' },
        ],
      },
      {
        id: 'dados_cap',
        title: 'Dados do Título',
        fields: [
          { key: 'enderecoRisco', label: 'Endereço do risco', type: 'text', required: true, colSpan: 2 },
          { key: 'valorAluguelMensal', label: 'Valor do aluguel mensal (R$)', type: 'currency', required: true },
          { key: 'valorTitulo', label: 'Valor do título (R$)', type: 'currency', required: true },
          { key: 'prazoCap', label: 'Prazo', type: 'select', required: true, options: ['12 meses (3% comissão total)', '15 meses (4% comissão total)', 'Acima de 15 meses (5% comissão total)'] },
        ],
      },
      {
        id: 'vigencia_cap',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigenciaContrato', label: 'Início vigência contrato de locação', type: 'date' },
          { key: 'fimVigenciaContrato', label: 'Fim vigência contrato de locação', type: 'date' },
          { key: 'inicioVigencia', label: 'Início vigência do seguro', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim vigência do seguro', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
RAZÃO SOCIAL / CPF OU CNPJ: {{razaoSocialSegurado}} / {{cpfCnpjSegurado}}
ENDEREÇO DO RISCO: {{enderecoRisco}}
VALOR ALUGUEL MENSAL: R$ {{valorAluguelMensal}}
VALOR DO TÍTULO: R$ {{valorTitulo}}
IMOBILIÁRIA ESTIPULANTE: {{imobiliariaEstipulante}}
VIGÊNCIA DO CONTRATO DE LOCAÇÃO: {{inicioVigenciaContrato}} A {{fimVigenciaContrato}}
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
--- PROPOSTA ---
{{dataHoraCotacao}} - EMISSOR: {{subscritor}} - PROPOSTA SEGURADORA: {{seguradora}}
COMISSÃO TOTAL %: {{comissaoTotal}} | COMISSÃO ATTENTI %: {{comissaoAttenti}}
PRÊMIO: R$ {{premioLiquido}}`,
  },

  'Risco Engenharia': {
    sections: [
      {
        id: 'partes_re',
        title: 'Partes',
        fields: [
          { key: 'tipoRisco', label: 'Tipo de Risco', type: 'select', required: true, options: ['Risco de Engenharia (Obra)', 'RC Obras', 'Risco de Engenharia + RC Obras'] },
          { key: 'beneficiario', label: 'Beneficiário', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjBeneficiario', label: 'CPF / CNPJ do Beneficiário', type: 'text', required: true },
        ],
      },
      {
        id: 'contrato_re',
        title: 'Dados do Contrato / Obra',
        fields: [
          { key: 'contrato', label: 'Contrato', type: 'text' },
          { key: 'processo', label: 'Processo', type: 'text' },
          { key: 'edital', label: 'Edital', type: 'text' },
          { key: 'objeto', label: 'Objeto', type: 'textarea', colSpan: 2, required: true },
          { key: 'enderecoRisco', label: 'Endereço do Risco', type: 'text', colSpan: 2, required: true },
          { key: 'valorContrato', label: 'Valor do Contrato (R$)', type: 'currency', required: true },
          { key: 'lmi', label: 'LMI — Limite Máximo de Indenização (R$)', type: 'currency', required: true },
          { key: 'clausulaGarantia', label: 'Nº cláusula sobre o seguro', type: 'text' },
          { key: 'numeroPaginaClausula', label: 'Número da página', type: 'text' },
          { key: 'condicoesParticulares', label: 'Condições Particulares', type: 'textarea', colSpan: 2 },
        ],
      },
      {
        id: 'vigencia_re',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigenciaContrato', label: 'Início vigência do contrato', type: 'date' },
          { key: 'fimVigenciaContrato', label: 'Fim vigência do contrato', type: 'date' },
          { key: 'inicioVigencia', label: 'Início vigência do seguro', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim vigência do seguro', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
BENEFICIÁRIO / CPF OU CNPJ: {{beneficiario}} / {{cpfCnpjBeneficiario}}
CONTRATO: {{contrato}} | PROCESSO: {{processo}} | EDITAL: {{edital}}
OBJETO: {{objeto}}
ENDEREÇO DO RISCO: {{enderecoRisco}}
VALOR CONTRATO: R$ {{valorContrato}}
LMI: R$ {{lmi}}
VIGÊNCIA DO CONTRATO: {{inicioVigenciaContrato}} A {{fimVigenciaContrato}}
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
NÚMERO CLÁUSULA SOBRE O SEGURO: {{clausulaGarantia}} | NÚMERO DA PÁGINA: {{numeroPaginaClausula}}
CONDIÇÕES PARTICULARES: {{condicoesParticulares}}
--- COTAÇÃO ---
{{dataHoraCotacao}} - COTAÇÃO SEGURADORA: {{seguradora}}
COMISSÃO TOTAL %: {{comissaoTotal}} | COMISSÃO ATTENTI %: {{comissaoAttenti}} | PRÊMIO LÍQUIDO: R$ {{premioLiquido}} | PRÊMIO BRUTO: R$ {{premioBruto}}`,
  },

  'Responsabilidade Civil': {
    sections: [
      {
        id: 'tipo_rc',
        title: 'Tipo de RC',
        fields: [
          { key: 'tipoRc', label: 'Tipo de RC', type: 'select', required: true, options: ['RC Obras — Vinculada por Contrato', 'RC Profissional', 'RC Geral'] },
          { key: 'beneficiario', label: 'Beneficiário / Segurado', type: 'text', required: true, colSpan: 2 },
          { key: 'cpfCnpjBeneficiario', label: 'CPF / CNPJ', type: 'text', required: true },
        ],
      },
      {
        id: 'risco_rc',
        title: 'Dados do Risco',
        fields: [
          { key: 'contrato', label: 'Contrato', type: 'text' },
          { key: 'processo', label: 'Processo', type: 'text' },
          { key: 'edital', label: 'Edital', type: 'text' },
          { key: 'objeto', label: 'Objeto', type: 'textarea', colSpan: 2, required: true },
          { key: 'enderecoRisco', label: 'Endereço do Risco', type: 'text', colSpan: 2 },
          { key: 'valorContrato', label: 'Valor do Contrato (R$)', type: 'currency' },
          { key: 'lmi', label: 'LMI — Limite Máximo de Indenização (R$)', type: 'currency', required: true },
          { key: 'clausulaGarantia', label: 'Nº cláusula', type: 'text' },
          { key: 'numeroPaginaClausula', label: 'Número da página', type: 'text' },
          { key: 'condicoesParticulares', label: 'Condições Particulares', type: 'textarea', colSpan: 2 },
        ],
      },
      {
        id: 'vigencia_rc',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigenciaContrato', label: 'Início vigência do contrato', type: 'date' },
          { key: 'fimVigenciaContrato', label: 'Fim vigência do contrato', type: 'date' },
          { key: 'inicioVigencia', label: 'Início vigência do seguro', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim vigência do seguro', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
BENEFICIÁRIO / CPF OU CNPJ: {{beneficiario}} / {{cpfCnpjBeneficiario}}
CONTRATO: {{contrato}} | PROCESSO: {{processo}} | EDITAL: {{edital}}
OBJETO: {{objeto}}
ENDEREÇO DO RISCO: {{enderecoRisco}}
VALOR CONTRATO: R$ {{valorContrato}}
LMI: R$ {{lmi}}
VIGÊNCIA DO CONTRATO: {{inicioVigenciaContrato}} A {{fimVigenciaContrato}}
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
NÚMERO CLÁUSULA: {{clausulaGarantia}} | NÚMERO DA PÁGINA: {{numeroPaginaClausula}}
CONDIÇÕES PARTICULARES: {{condicoesParticulares}}
--- COTAÇÃO ---
COMISSÃO TOTAL %: {{comissaoTotal}} / COMISSÃO ATTENTI %: {{comissaoAttenti}} / PRÊMIO LÍQUIDO: R$ {{premioLiquido}} / PRÊMIO BRUTO: R$ {{premioBruto}}`,
  },

  'Eventos': {
    sections: [
      {
        id: 'evento',
        title: 'Dados do Evento',
        fields: [
          { key: 'nomeEvento', label: 'Nome do Evento', type: 'text', required: true, colSpan: 2 },
          { key: 'organizador', label: 'Organizador', type: 'text', required: true },
          { key: 'enderecoEvento', label: 'Endereço do Evento', type: 'text', required: true, colSpan: 2 },
          { key: 'periodoInicio', label: 'Início do Evento', type: 'date', required: true },
          { key: 'periodoFim', label: 'Fim do Evento', type: 'date', required: true },
          { key: 'dataMontagem', label: 'Data de Montagem', type: 'date' },
          { key: 'dataDesmontagem', label: 'Data de Desmontagem', type: 'date' },
        ],
      },
      {
        id: 'coberturas_eventos',
        title: 'Coberturas',
        fields: [
          { key: 'cobRcEvento', label: 'RC do Evento (R$)', type: 'currency' },
          { key: 'cobCancelamento', label: 'Cancelamento/Interrupção', type: 'toggle' },
          { key: 'cobEquipamentosEvento', label: 'Equipamentos de Produção (R$)', type: 'currency' },
          { key: 'cobEstrutura', label: 'Estrutura (Tendas, Palcos, Arquibancadas) (R$)', type: 'currency' },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
NOME DO EVENTO: {{nomeEvento}}
ENDEREÇO DO EVENTO: {{enderecoEvento}}
ORGANIZADOR: {{organizador}}
COBERTURAS E VALORES: RC: R$ {{cobRcEvento}} | CANCELAMENTO: | EQUIPAMENTOS: R$ {{cobEquipamentosEvento}} | ESTRUTURA: R$ {{cobEstrutura}}
PERÍODO DO EVENTO: {{periodoInicio}} A {{periodoFim}}
DATA MONTAGEM: {{dataMontagem}} | DATA DESMONTAGEM: {{dataDesmontagem}}
--- COTAÇÃO ---
COMISSÃO TOTAL %: {{comissaoTotal}} | COMISSÃO ATTENTI %: {{comissaoAttenti}} | PRÊMIO LÍQUIDO: R$ {{premioLiquido}} | PRÊMIO BRUTO: R$ {{premioBruto}}`,
  },

  'Diversos': {
    sections: [
      {
        id: 'bem_segurado',
        title: 'Bem Segurado',
        fields: [
          { key: 'tipoBemSegurado', label: 'Tipo de bem segurado', type: 'select', required: true, options: ['Celular', 'Transporte de Carga', 'Animais Equinos', 'Outros'] },
          { key: 'descricaoBem', label: 'Descrição do bem segurado', type: 'textarea', required: true, colSpan: 2 },
          { key: 'valorBem', label: 'Valor do bem (R$)', type: 'currency', required: true },
        ],
      },
      {
        id: 'vigencia_div',
        title: 'Vigência',
        fields: [
          { key: 'inicioVigencia', label: 'Início da vigência', type: 'date', required: true },
          { key: 'fimVigencia', label: 'Fim da vigência', type: 'date', required: true },
        ],
      },
    ],
    observacaoTemplate: `ENTRADA: {{entrada}} | PROT VENDA: {{protVenda}} | PRODUTOR DO CLIENTE: {{produtorCliente}} | PRODUTOR DE REPASSE: {{produtorRepasse}}
TIPO DE BEM SEGURADO: {{tipoBemSegurado}}
DESCRIÇÃO DO BEM SEGURADO: {{descricaoBem}}
VIGÊNCIA DO SEGURO: {{inicioVigencia}} A {{fimVigencia}}
--- COTAÇÃO ---
COMISSÃO TOTAL %: {{comissaoTotal}} | COMISSÃO ATTENTI %: {{comissaoAttenti}} | PRÊMIO: R$ {{premioLiquido}}`,
  },
}

export const sinistroTypeFields = {
  'Auto': {
    sections: [
      {
        id: 'auto_sin',
        title: 'Informações do Sinistro Auto',
        fields: [
          { key: 'placaVeiculo', label: 'Placa do veículo', type: 'text' },
          { key: 'condutorOcorrido', label: 'Condutor no momento do sinistro', type: 'text' },
          { key: 'cpfCondutorOcorrido', label: 'CPF do condutor', type: 'text' },
          { key: 'localOcorrido', label: 'Local do ocorrido', type: 'text', colSpan: 2 },
          { key: 'terceiro', label: 'Houve terceiro envolvido?', type: 'toggle' },
          { key: 'terceiroNome', label: 'Nome do terceiro', type: 'text' },
          { key: 'terceiroPlaca', label: 'Placa do terceiro', type: 'text' },
          { key: 'terceiroCpf', label: 'CPF do terceiro', type: 'text' },
          { key: 'boRegistrado', label: 'Boletim de ocorrência registrado?', type: 'toggle' },
          { key: 'numeroBo', label: 'Número do BO', type: 'text' },
          { key: 'veiculoOficina', label: 'Veículo já em oficina?', type: 'toggle' },
          { key: 'nomeOficina', label: 'Nome da oficina', type: 'text' },
          { key: 'enderecoOficina', label: 'Endereço da oficina', type: 'text', colSpan: 2 },
        ],
      },
    ],
  },

  'Residencial': {
    sections: [
      {
        id: 'res_sin',
        title: 'Informações do Sinistro Residencial',
        fields: [
          { key: 'enderecoSinistroRes', label: 'Endereço do sinistro', type: 'text', colSpan: 2 },
          { key: 'comodoAfetado', label: 'Cômodo(s) afetado(s)', type: 'text' },
          { key: 'isCondominio', label: 'Envolveu área comum do condomínio?', type: 'toggle' },
          { key: 'nomeSindicoRes', label: 'Nome do síndico', type: 'text' },
          { key: 'telefoneSindico', label: 'Telefone do síndico', type: 'text' },
          { key: 'vizinhosAfetados', label: 'Vizinhos afetados?', type: 'toggle' },
          { key: 'bensAfetados', label: 'Bens afetados (lista)', type: 'textarea', colSpan: 2 },
        ],
      },
    ],
  },

  'Saúde': {
    sections: [
      {
        id: 'saude_sin',
        title: 'Informações do Sinistro Saúde',
        fields: [
          { key: 'pacienteSaude', label: 'Paciente', type: 'text' },
          { key: 'procedimento', label: 'Procedimento / Diagnóstico', type: 'text', colSpan: 2 },
          { key: 'cid', label: 'CID', type: 'text' },
          { key: 'hospitalClinica', label: 'Hospital / Clínica', type: 'text' },
          { key: 'medicoResponsavel', label: 'Médico responsável', type: 'text' },
          { key: 'crm', label: 'CRM do médico', type: 'text' },
          { key: 'dataInternacao', label: 'Data de internação', type: 'date' },
          { key: 'dataAlta', label: 'Data de alta (prevista)', type: 'date' },
          { key: 'valorProcedimento', label: 'Valor estimado (R$)', type: 'currency' },
        ],
      },
    ],
  },

  'Odontológico': {
    sections: [
      {
        id: 'odonto_sin',
        title: 'Informações do Sinistro Odontológico',
        fields: [
          { key: 'pacienteOdonto', label: 'Paciente', type: 'text' },
          { key: 'procedimentoOdonto', label: 'Procedimento', type: 'text', colSpan: 2 },
          { key: 'dentistaResponsavel', label: 'Dentista responsável', type: 'text' },
          { key: 'cro', label: 'CRO do dentista', type: 'text' },
          { key: 'valorOdontoSin', label: 'Valor estimado (R$)', type: 'currency' },
        ],
      },
    ],
  },

  'Empresarial': {
    sections: [
      {
        id: 'emp_sin',
        title: 'Informações do Sinistro Empresarial',
        fields: [
          { key: 'enderecoSinistroEmp', label: 'Endereço do sinistro', type: 'text', colSpan: 2 },
          { key: 'areaAfetadaEmp', label: 'Área afetada (m²)', type: 'number' },
          { key: 'paralisacaoAtividade', label: 'Houve paralisação das atividades?', type: 'toggle' },
          { key: 'diasParalisados', label: 'Dias parados', type: 'number' },
          { key: 'equipamentosAfetados', label: 'Equipamentos danificados (lista)', type: 'textarea', colSpan: 2 },
          { key: 'funcionariosEnvolvidos', label: 'Funcionários envolvidos', type: 'number' },
          { key: 'responsavelEmpresa', label: 'Responsável na empresa', type: 'text' },
          { key: 'telefoneResponsavel', label: 'Telefone do responsável', type: 'text' },
        ],
      },
    ],
  },

  'Vida Individual': {
    sections: [
      {
        id: 'vida_sin',
        title: 'Informações do Sinistro Vida',
        fields: [
          { key: 'tipoEventoVida', label: 'Tipo de evento', type: 'select', options: ['Morte', 'Invalidez', 'Doença grave', 'Acidente'] },
          { key: 'dataEventoVida', label: 'Data do evento', type: 'date' },
          { key: 'nomeSinistranteVida', label: 'Nome do sinistrado', type: 'text' },
          { key: 'relacaoSegurado', label: 'Relação com o segurado', type: 'text' },
          { key: 'hospitalVida', label: 'Hospital (se aplicável)', type: 'text' },
          { key: 'medicoVida', label: 'Médico responsável', type: 'text' },
          { key: 'beneficiarioRequerente', label: 'Beneficiário requerente', type: 'text' },
        ],
      },
    ],
  },
}
