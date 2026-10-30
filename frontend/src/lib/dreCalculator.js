// ==============================================================================
// MOTOR DE CÁLCULO E CLASSIFICAÇÃO DA DRE — KAIRÓS CENTRO AUTOMOTIVO
// Baseado no Regime de Competência e Normas Contábeis
// ==============================================================================

export const CATEGORIAS_DRE = {
  // 1. Receita Operacional Bruta
  RECEITA_BRUTA_MO: {
    id: 'RECEITA_BRUTA_MO',
    nome: 'Receita de Mão de Obra (Serviços)',
    grupo: 'receita_bruta',
    sinal: '+'
  },
  RECEITA_BRUTA_PECAS: {
    id: 'RECEITA_BRUTA_PECAS',
    nome: 'Receita de Venda de Peças',
    grupo: 'receita_bruta',
    sinal: '+'
  },

  // 2. Deduções da Receita Bruta
  DEDUCOES_TRIBUTOS: {
    id: 'DEDUCOES_TRIBUTOS',
    nome: 'Tributos, Impostos e Taxas Municipais',
    grupo: 'deducoes',
    sinal: '-'
  },
  CANCELAMENTOS_DEVOLUCOES: {
    id: 'CANCELAMENTOS_DEVOLUCOES',
    nome: 'Cancelamentos, Reembolsos e Devoluções',
    grupo: 'deducoes',
    sinal: '-'
  },

  // 3. Custos Diretos dos Serviços Prestados (CSP / CMV)
  CUSTO_DIRETO_PECAS: {
    id: 'CUSTO_DIRETO_PECAS',
    nome: 'Custo de Aquisição de Peças Utilizadas',
    grupo: 'custo_direto',
    sinal: '-'
  },
  CUSTO_DIRETO_COMISSOES: {
    id: 'CUSTO_DIRETO_COMISSOES',
    nome: 'Comissões de Mecânicos por Serviço',
    grupo: 'custo_direto',
    sinal: '-'
  },
  CUSTO_DIRETO_TERCEIROS: {
    id: 'CUSTO_DIRETO_TERCEIROS',
    nome: 'Serviços Terceirizados em Veículos (Torno, Alinhamento, etc.)',
    grupo: 'custo_direto',
    sinal: '-'
  },
  CUSTO_PESSOAL_OPERACIONAL: {
    id: 'CUSTO_PESSOAL_OPERACIONAL',
    nome: 'Mão de Obra Operacional / Salários de Mecânicos',
    grupo: 'custo_direto',
    sinal: '-'
  },
  CUSTO_INSUMOS_OFICINA: {
    id: 'CUSTO_INSUMOS_OFICINA',
    nome: 'Materiais e Insumos de Oficina (Óleo, Desengraxante, Estopas)',
    grupo: 'custo_direto',
    sinal: '-'
  },

  // 4. Despesas Operacionais e Administrativas
  DESPESA_OCUPACAO: {
    id: 'DESPESA_OCUPACAO',
    nome: 'Ocupação da Oficina (Aluguel, Energia, Água, IPTU)',
    grupo: 'despesa_operacional',
    sinal: '-'
  },
  DESPESA_ADMINISTRATIVA: {
    id: 'DESPESA_ADMINISTRATIVA',
    nome: 'Despesas Administrativas (Sistemas, Contabilidade, Internet)',
    grupo: 'despesa_operacional',
    sinal: '-'
  },
  DESPESA_COMERCIAL: {
    id: 'DESPESA_COMERCIAL',
    nome: 'Comercial e Marketing (Anúncios, Tráfego, Identidade Visual)',
    grupo: 'despesa_operacional',
    sinal: '-'
  },
  DESPESA_BENEFICIOS_EQUIPE: {
    id: 'DESPESA_BENEFICIOS_EQUIPE',
    nome: 'Benefícios e Despesas da Equipe (Almoço, Lanche, VT, Uber)',
    grupo: 'despesa_operacional',
    sinal: '-'
  },
  PRO_LABORE_SOCIOS: {
    id: 'PRO_LABORE_SOCIOS',
    nome: 'Pró-Labore dos Sócios (Rafael, Thaís, Ákysa)',
    grupo: 'despesa_operacional',
    sinal: '-'
  },
  MANUTENCAO_FERRAMENTAL: {
    id: 'MANUTENCAO_FERRAMENTAL',
    nome: 'Manutenção de Equipamentos e Ferramental',
    grupo: 'despesa_operacional',
    sinal: '-'
  },

  // 5. Resultado Financeiro
  DESPESA_FINANCEIRA: {
    id: 'DESPESA_FINANCEIRA',
    nome: 'Despesas Financeiras (Taxas de Máquina de Cartão, Juros, Tarifas)',
    grupo: 'resultado_financeiro',
    sinal: '-'
  },
  RECEITA_FINANCEIRA: {
    id: 'RECEITA_FINANCEIRA',
    nome: 'Receitas Financeiras (Rendimentos de Aplicação, Descontos Obtidos)',
    grupo: 'resultado_financeiro',
    sinal: '+'
  },

  // 6. Movimentações Patrimoniais dos Sócios (NÃO entram no Lucro da DRE)
  DISTRIBUICAO_LUCROS: {
    id: 'DISTRIBUICAO_LUCROS',
    nome: 'Distribuição de Lucros aos Sócios',
    grupo: 'patrimonial',
    sinal: '•'
  },
  APORTE_EMPRESTIMO_SOCIO: {
    id: 'APORTE_EMPRESTIMO_SOCIO',
    nome: 'Aporte de Capital ou Empréstimo de Sócios',
    grupo: 'patrimonial',
    sinal: '•'
  },
  TRANSFERENCIA_CONTAS: {
    id: 'TRANSFERENCIA_CONTAS',
    nome: 'Transferência entre Contas da Empresa',
    grupo: 'patrimonial',
    sinal: '•'
  },
  ADIANTAMENTO_CLIENTE: {
    id: 'ADIANTAMENTO_CLIENTE',
    nome: 'Adiantamento / Sinal de Cliente (Passivo Transitório)',
    grupo: 'patrimonial',
    sinal: '•'
  },
  PENDENTE: {
    id: 'PENDENTE',
    nome: 'Pendente de Classificação',
    grupo: 'pendente',
    sinal: '?'
  }
};

export const LISTA_SOCIOS = ['Rafael', 'Thaís', 'Ákysa'];

// ==============================================================================
// SUGESTÃO INTELIGENTE DE CLASSIFICAÇÃO (AUTO-CATEGORIZAÇÃO)
// ==============================================================================

export function sugerirClassificacao(item, tipoOrigem = 'fluxo_caixa_saida') {
  const desc = (item.descricao || '').trim().toLowerCase();
  const valor = parseFloat(item.valor) || 0;

  // 1. Detectar Sócios
  let socioDetectado = null;
  if (desc.includes('rafael')) socioDetectado = 'Rafael';
  else if (desc.includes('thais') || desc.includes('thaís')) socioDetectado = 'Thaís';
  else if (desc.includes('akysa') || desc.includes('ákysa')) socioDetectado = 'Ákysa';

  // Se for movimentação de sócio
  if (socioDetectado) {
    if (desc.includes('semana') || desc.includes('quinzena') || desc.includes('pro labore') || desc.includes('pró-labore') || desc.includes('salario')) {
      return {
        categoria_dre: 'PRO_LABORE_SOCIOS',
        subcategoria_dre: `Pró-Labore — ${socioDetectado}`,
        socio_nome: socioDetectado,
        confianca: 'alta'
      };
    }
    if (desc.includes('lucro') || desc.includes('distribui') || desc.includes('retirada')) {
      return {
        categoria_dre: 'DISTRIBUICAO_LUCROS',
        subcategoria_dre: `Distribuição de Lucros — ${socioDetectado}`,
        socio_nome: socioDetectado,
        confianca: 'alta'
      };
    }
    if (desc.includes('aporte') || desc.includes('emprestimo') || desc.includes('auxilio') || desc.includes('devolu')) {
      return {
        categoria_dre: 'APORTE_EMPRESTIMO_SOCIO',
        subcategoria_dre: `Movimentação Patrimonial — ${socioDetectado}`,
        socio_nome: socioDetectado,
        confianca: 'alta'
      };
    }
    // Padrão semanal para sócio
    return {
      categoria_dre: 'PRO_LABORE_SOCIOS',
      subcategoria_dre: `Retirada Periódica — ${socioDetectado}`,
      socio_nome: socioDetectado,
      confianca: 'media'
    };
  }

  // 2. Se for Entrada no Caixa
  if (tipoOrigem === 'fluxo_caixa_entrada') {
    if (desc.includes('entrada') || desc.includes('sinal')) {
      return {
        categoria_dre: 'ADIANTAMENTO_CLIENTE',
        subcategoria_dre: 'Sinal / Adiantamento de Cliente',
        confianca: 'alta'
      };
    }
    if (desc.includes('auxilio') || desc.includes('aporte') || desc.includes('emprestimo')) {
      return {
        categoria_dre: 'APORTE_EMPRESTIMO_SOCIO',
        subcategoria_dre: 'Aporte Financeiro / Empréstimo',
        confianca: 'alta'
      };
    }
    if (desc.includes('orçamento') || desc.includes('orcamento') || desc.includes('quitação') || desc.includes('serviço')) {
      // Recebimento de serviço faturado
      return {
        categoria_dre: 'RECEITA_BRUTA_MO',
        subcategoria_dre: 'Recebimento de Atendimento',
        confianca: 'alta'
      };
    }
    return {
      categoria_dre: 'PENDENTE',
      subcategoria_dre: 'Entrada a Identificar',
      confianca: 'baixa'
    };
  }

  // 3. Regras para Saídas e Despesas
  if (desc.includes('aluguel')) {
    return { categoria_dre: 'DESPESA_OCUPACAO', subcategoria_dre: 'Aluguel do Imóvel', confianca: 'alta' };
  }
  if (desc.includes('enel') || desc.includes('energia') || desc.includes('luz') || desc.includes('compressor')) {
    return { categoria_dre: 'DESPESA_OCUPACAO', subcategoria_dre: 'Energia Elétrica / Instalações', confianca: 'alta' };
  }
  if (desc.includes('saneago') || desc.includes('água') || desc.includes('agua')) {
    return { categoria_dre: 'DESPESA_OCUPACAO', subcategoria_dre: 'Água e Saneamento', confianca: 'alta' };
  }

  // Peças
  if (desc.includes('peça') || desc.includes('peca') || desc.includes('auto peça') || desc.includes('escapamento') || desc.includes('oleo') || desc.includes('óleo') || desc.includes('filtro') || desc.includes('amortecedor') || desc.includes('pastilha') || desc.includes('correia')) {
    return { categoria_dre: 'CUSTO_DIRETO_PECAS', subcategoria_dre: 'Peça Aplicada em Serviço', confianca: 'alta' };
  }

  // Terceirizados
  if (desc.includes('alinhamento') || desc.includes('balanceamento') || desc.includes('torno') || desc.includes('retifica') || desc.includes('guincho')) {
    return { categoria_dre: 'CUSTO_DIRETO_TERCEIROS', subcategoria_dre: 'Serviço Terceirizado', confianca: 'alta' };
  }

  // Pessoal Operacional (ex: Eduardo, Enzo, ajudantes)
  if (desc.includes('eduardo') || desc.includes('enzo') || desc.includes('mecanico') || desc.includes('quinzena')) {
    if (desc.includes('almoço') || desc.includes('almoco') || desc.includes('vt') || desc.includes('transporte')) {
      return { categoria_dre: 'DESPESA_BENEFICIOS_EQUIPE', subcategoria_dre: 'Alimentação e Vale Transporte', confianca: 'alta' };
    }
    return { categoria_dre: 'CUSTO_PESSOAL_OPERACIONAL', subcategoria_dre: 'Salário / Adiantamento Operacional', confianca: 'alta' };
  }

  // Benefícios e Alimentação
  if (desc.includes('lanche') || desc.includes('almoço') || desc.includes('almoco') || desc.includes('cafe') || desc.includes('café') || desc.includes('uber')) {
    return { categoria_dre: 'DESPESA_BENEFICIOS_EQUIPE', subcategoria_dre: 'Alimentação / Deslocamento Equipe', confianca: 'alta' };
  }

  // Tributos e Taxas
  if (desc.includes('taxa') || desc.includes('juceg') || desc.includes('imposto') || desc.includes('simples') || desc.includes('prefeitura') || desc.includes('solo') || desc.includes('alvara')) {
    return { categoria_dre: 'DEDUCOES_TRIBUTOS', subcategoria_dre: 'Tributos e Taxas Oficiais', confianca: 'alta' };
  }

  // Reembolsos e cancelamentos
  if (desc.includes('reembolso') || desc.includes('estorno') || desc.includes('devolucao') || desc.includes('devolução')) {
    return { categoria_dre: 'CANCELAMENTOS_DEVOLUCOES', subcategoria_dre: 'Reembolso de Serviço', confianca: 'alta' };
  }

  // Sistemas e Software
  if (desc.includes('sistema') || desc.includes('software') || desc.includes('contabilidade') || desc.includes('contador') || desc.includes('internet') || desc.includes('celular')) {
    return { categoria_dre: 'DESPESA_ADMINISTRATIVA', subcategoria_dre: 'Gestão, Contabilidade & Conectividade', confianca: 'alta' };
  }

  // Ferramentas e Mobilia
  if (desc.includes('ferramenta') || desc.includes('mobilia') || desc.includes('mesa') || desc.includes('armario')) {
    return { categoria_dre: 'MANUTENCAO_FERRAMENTAL', subcategoria_dre: 'Ferramental e Infraestrutura', confianca: 'media' };
  }

  // Despesa Financeira
  if (desc.includes('tarifa') || desc.includes('juros') || desc.includes('cartao') || desc.includes('taxa maquina')) {
    return { categoria_dre: 'DESPESA_FINANCEIRA', subcategoria_dre: 'Tarifas e Taxas Financeiras', confianca: 'alta' };
  }

  return {
    categoria_dre: 'PENDENTE',
    subcategoria_dre: 'Aguardando Classificação Manual',
    confianca: 'baixa'
  };
}

// ==============================================================================
// FUNÇÃO PRINCIPAL DE APURAÇÃO DA DRE (MENSAL OU ANUAL)
// ==============================================================================

export function calcularDRE({
  orcamentos = [],
  fluxoCaixa = [],
  gastosFixos = [],
  classificacoes = [],
  ajustes = [],
  mesAno = '' // 'YYYY-MM' ou 'YYYY'
}) {
  const isAnual = mesAno.length === 4;

  // Map rápido de classificações salvas por id
  const classMap = new Map();
  classificacoes.forEach(c => classMap.set(c.id, c));

  // 1. Filtrar e Processar Orçamentos por Competência (Data de Conclusão / Pagamento)
  const orcamentosCompetencia = (orcamentos || []).filter(o => {
    // Competência contábil: data_conclusao > data_pagamento > created_at
    const rawDate = o.data_conclusao || o.data_pagamento || o.created_at;
    if (!rawDate) return false;
    const dateStr = rawDate.substring(0, isAnual ? 4 : 7);
    if (dateStr !== mesAno) return false;

    // Apenas orçamentos finalizados ou com serviço concluído contam como receita do período
    const status = (o.status || '').toLowerCase();
    const isFinalizado = status.includes('finalizado') || status.includes('conclu') || o.pago;
    return isFinalizado;
  });

  let receitaMO = 0;
  let receitaPecas = 0;
  let comissoesMecanicos = 0;
  let custoPecasOrcamento = 0;

  const itensReceitaMO = [];
  const itensReceitaPecas = [];
  const itensComissoes = [];
  const itensCustoPecas = [];

  orcamentosCompetencia.forEach(o => {
    const mo = parseFloat(o.valor_mao_obra) || 0;
    const pecas = parseFloat(o.valor_pecas) || 0;
    const comissao = parseFloat(o.valor_comissao) || 0;
    const custoPeca = parseFloat(o.custo_pecas) || 0;

    if (mo > 0) {
      receitaMO += mo;
      itensReceitaMO.push({
        id: `orc_mo_${o.id}`,
        origem: `Orçamento #${o.id}`,
        descricao: `${o.nome || 'Cliente'} (${o.placa || 'Sem placa'}) — ${o.servicoDesejado || 'Mão de Obra'}`,
        valor: mo,
        data: (o.data_conclusao || o.data_pagamento || o.created_at).substring(0, 10)
      });
    }

    if (pecas > 0) {
      receitaPecas += pecas;
      itensReceitaPecas.push({
        id: `orc_pecas_${o.id}`,
        origem: `Orçamento #${o.id}`,
        descricao: `${o.nome || 'Cliente'} (${o.placa || 'Sem placa'}) — Peças Faturadas`,
        valor: pecas,
        data: (o.data_conclusao || o.data_pagamento || o.created_at).substring(0, 10)
      });
    }

    if (comissao > 0) {
      comissoesMecanicos += comissao;
      itensComissoes.push({
        id: `orc_comissao_${o.id}`,
        origem: `Orçamento #${o.id}`,
        descricao: `Comissão: ${o.mecanico_nome || 'Mecânico'} (OS #${o.id} - ${o.nome || 'Cliente'})`,
        valor: comissao,
        data: (o.data_conclusao || o.data_pagamento || o.created_at).substring(0, 10)
      });
    }

    if (custoPeca > 0) {
      custoPecasOrcamento += custoPeca;
      itensCustoPecas.push({
        id: `orc_custo_peca_${o.id}`,
        origem: `Orçamento #${o.id}`,
        descricao: `Custo Peças OS #${o.id} - ${o.nome || 'Cliente'}`,
        valor: custoPeca,
        data: (o.data_conclusao || o.data_pagamento || o.created_at).substring(0, 10)
      });
    }
  });

  // 2. Extrair e Classificar todas as movimentações do Fluxo de Caixa do mês
  const itensClassificadosPorCategoria = {};
  Object.keys(CATEGORIAS_DRE).forEach(k => {
    itensClassificadosPorCategoria[k] = [];
  });

  const pendencias = [];
  const movimentacoesSocios = {
    Rafael: { proLabore: 0, distribuicao: 0, aporte: 0, itens: [] },
    Thaís: { proLabore: 0, distribuicao: 0, aporte: 0, itens: [] },
    Ákysa: { proLabore: 0, distribuicao: 0, aporte: 0, itens: [] }
  };

  let totalEntradasCaixaMes = 0;
  let totalSaidasCaixaMes = 0;

  // Filtrar fluxo de caixa do período
  const diasCaixa = (fluxoCaixa || []).filter(fc => {
    if (!fc.data) return false;
    const match = isAnual ? fc.data.startsWith(mesAno) : fc.data.startsWith(mesAno);
    return match;
  });

  diasCaixa.forEach(dia => {
    // Processar Saídas
    (dia.saidas || []).forEach((s, idx) => {
      const val = parseFloat(s.valor) || 0;
      if (val <= 0) return;
      totalSaidasCaixaMes += val;

      const launchId = `fc_saida_${dia.data}_${idx}`;
      const savedClass = classMap.get(launchId);
      const autoSuggestion = sugerirClassificacao(s, 'fluxo_caixa_saida');

      const categoriaFinal = savedClass ? savedClass.categoria_dre : autoSuggestion.categoria_dre;
      const subcategoriaFinal = savedClass ? savedClass.subcategoria_dre : autoSuggestion.subcategoria_dre;
      const socioFinal = savedClass ? savedClass.socio_nome : autoSuggestion.socio_nome;
      const isPendente = categoriaFinal === 'PENDENTE';

      const itemObj = {
        id: launchId,
        origem: `Caixa ${dia.data.split('-').reverse().join('/')}`,
        descricao: s.descricao || 'Saída sem descrição',
        valor: val,
        conta: s.conta || 'Caixa',
        data: dia.data,
        categoria_dre: categoriaFinal,
        subcategoria_dre: subcategoriaFinal,
        socio_nome: socioFinal,
        isAuto: !savedClass,
        confianca: autoSuggestion.confianca
      };

      if (isPendente) {
        pendencias.push(itemObj);
      } else {
        if (!itensClassificadosPorCategoria[categoriaFinal]) {
          itensClassificadosPorCategoria[categoriaFinal] = [];
        }
        itensClassificadosPorCategoria[categoriaFinal].push(itemObj);

        // Agrupamento de Sócios
        if (socioFinal && movimentacoesSocios[socioFinal]) {
          movimentacoesSocios[socioFinal].itens.push(itemObj);
          if (categoriaFinal === 'PRO_LABORE_SOCIOS') {
            movimentacoesSocios[socioFinal].proLabore += val;
          } else if (categoriaFinal === 'DISTRIBUICAO_LUCROS') {
            movimentacoesSocios[socioFinal].distribuicao += val;
          } else if (categoriaFinal === 'APORTE_EMPRESTIMO_SOCIO') {
            movimentacoesSocios[socioFinal].aporte += val;
          }
        }
      }
    });

    // Processar Entradas
    (dia.entradas || []).forEach((e, idx) => {
      const val = parseFloat(e.valor) || 0;
      if (val <= 0) return;
      totalEntradasCaixaMes += val;

      const launchId = `fc_entrada_${dia.data}_${idx}`;
      const savedClass = classMap.get(launchId);
      const autoSuggestion = sugerirClassificacao(e, 'fluxo_caixa_entrada');

      const categoriaFinal = savedClass ? savedClass.categoria_dre : autoSuggestion.categoria_dre;
      const subcategoriaFinal = savedClass ? savedClass.subcategoria_dre : autoSuggestion.subcategoria_dre;
      const socioFinal = savedClass ? savedClass.socio_nome : autoSuggestion.socio_nome;

      const itemObj = {
        id: launchId,
        origem: `Caixa ${dia.data.split('-').reverse().join('/')}`,
        descricao: e.descricao || 'Entrada sem descrição',
        valor: val,
        conta: e.conta || 'Caixa',
        metodo: e.metodo || 'PIX',
        data: dia.data,
        categoria_dre: categoriaFinal,
        subcategoria_dre: subcategoriaFinal,
        socio_nome: socioFinal,
        isAuto: !savedClass,
        confianca: autoSuggestion.confianca
      };

      // Entradas que são movimentações de aportes ou empréstimos de sócios
      if (categoriaFinal === 'APORTE_EMPRESTIMO_SOCIO') {
        itensClassificadosPorCategoria.APORTE_EMPRESTIMO_SOCIO.push(itemObj);
        if (socioFinal && movimentacoesSocios[socioFinal]) {
          movimentacoesSocios[socioFinal].itens.push(itemObj);
          movimentacoesSocios[socioFinal].aporte += val;
        }
      } else if (categoriaFinal === 'RECEITA_FINANCEIRA') {
        itensClassificadosPorCategoria.RECEITA_FINANCEIRA.push(itemObj);
      }
      // Nota: Recebimentos de orçamentos no caixa NÃO somam na receita da DRE para não duplicar,
      // pois a receita por competência já foi apurada no bloco 1 (orçamentos concluídos)!
    });
  });

  // 3. Processar Gastos Fixos Pagos no Período (que não tenham sido duplicados no caixa)
  const gastosPeriodo = (gastosFixos || []).filter(g => {
    const d = g.mes_competencia || g.data_pagamento || g.data_vencimento;
    if (!d) return false;
    const match = isAnual ? d.startsWith(mesAno) : d.startsWith(mesAno);
    return match && (g.status === 'pago' || g.valor_pago_real > 0);
  });

  gastosPeriodo.forEach(g => {
    // Verificar se já não está registrado nas saídas do caixa
    const val = parseFloat(g.valor_pago_real || g.valor) || 0;
    if (val <= 0) return;

    const launchId = `gf_${g.id}`;
    const savedClass = classMap.get(launchId);
    const autoSuggestion = sugerirClassificacao(g, 'gasto_fixo');

    const categoriaFinal = savedClass ? savedClass.categoria_dre : (g.dre_categoria || autoSuggestion.categoria_dre);
    const subcategoriaFinal = savedClass ? savedClass.subcategoria_dre : autoSuggestion.subcategoria_dre;
    const socioFinal = savedClass ? savedClass.socio_nome : autoSuggestion.socio_nome;

    // Para evitar contagem dupla: se já houver uma saída no caixa com mesma data e valor aproximado, ignoramos ou sinalizamos
    const existeNoCaixa = (itensClassificadosPorCategoria[categoriaFinal] || []).some(
      item => Math.abs(item.valor - val) < 0.01 && (item.data === g.data_pagamento || item.descricao.toLowerCase().includes(g.descricao.toLowerCase().slice(0, 8)))
    );

    if (!existeNoCaixa) {
      const itemObj = {
        id: launchId,
        origem: 'Gastos Fixos',
        descricao: g.descricao,
        valor: val,
        data: g.data_pagamento || g.data_vencimento,
        categoria_dre: categoriaFinal,
        subcategoria_dre: subcategoriaFinal,
        socio_nome: socioFinal,
        isAuto: !savedClass
      };

      if (!itensClassificadosPorCategoria[categoriaFinal]) {
        itensClassificadosPorCategoria[categoriaFinal] = [];
      }
      itensClassificadosPorCategoria[categoriaFinal].push(itemObj);

      if (socioFinal && movimentacoesSocios[socioFinal]) {
        movimentacoesSocios[socioFinal].itens.push(itemObj);
        if (categoriaFinal === 'PRO_LABORE_SOCIOS') {
          movimentacoesSocios[socioFinal].proLabore += val;
        } else if (categoriaFinal === 'DISTRIBUICAO_LUCROS') {
          movimentacoesSocios[socioFinal].distribuicao += val;
        }
      }
    }
  });

  // 4. Somar Ajustes Contábeis Auditáveis do Mês
  const ajustesPeriodo = (ajustes || []).filter(a => a.mes_ano === mesAno);
  ajustesPeriodo.forEach(a => {
    const val = parseFloat(a.valor) || 0;
    const itemObj = {
      id: `ajuste_${a.id}`,
      origem: `Ajuste Contábil (${a.tipo})`,
      descricao: `${a.descricao} [Resp: ${a.responsavel}]`,
      valor: val,
      categoria_dre: a.categoria_dre,
      data: a.created_at ? a.created_at.substring(0, 10) : mesAno + '-01'
    };
    if (!itensClassificadosPorCategoria[a.categoria_dre]) {
      itensClassificadosPorCategoria[a.categoria_dre] = [];
    }
    itensClassificadosPorCategoria[a.categoria_dre].push(itemObj);
  });

  // Inserir os itens dos orçamentos nas respectivas categorias
  itensReceitaMO.forEach(i => itensClassificadosPorCategoria.RECEITA_BRUTA_MO.push(i));
  itensReceitaPecas.forEach(i => itensClassificadosPorCategoria.RECEITA_BRUTA_PECAS.push(i));
  itensComissoes.forEach(i => itensClassificadosPorCategoria.CUSTO_DIRETO_COMISSOES.push(i));
  itensCustoPecas.forEach(i => itensClassificadosPorCategoria.CUSTO_DIRETO_PECAS.push(i));

  // ==============================================================================
  // 5. CÁLCULO DOS TOTAIS DA DRE SEGUNDO PADRÃO CONTÁBIL
  // ==============================================================================

  const sumCat = (catId) => (itensClassificadosPorCategoria[catId] || []).reduce((acc, i) => acc + (parseFloat(i.valor) || 0), 0);

  // 1. Receita Operacional Bruta
  const totReceitaMO = sumCat('RECEITA_BRUTA_MO');
  const totReceitaPecas = sumCat('RECEITA_BRUTA_PECAS');
  const receitaOperacionalBruta = totReceitaMO + totReceitaPecas;

  // 2. Deduções da Receita Bruta
  const totTributos = sumCat('DEDUCOES_TRIBUTOS');
  const totCancelamentos = sumCat('CANCELAMENTOS_DEVOLUCOES');
  const deducoesReceita = totTributos + totCancelamentos;

  // 3. Receita Operacional Líquida
  const receitaOperacionalLiquida = Math.max(0, receitaOperacionalBruta - deducoesReceita);

  // 4. Custos Diretos dos Serviços (CSP / CMV)
  const totCustoPecas = sumCat('CUSTO_DIRETO_PECAS');
  const totComissoes = sumCat('CUSTO_DIRETO_COMISSOES');
  const totTerceiros = sumCat('CUSTO_DIRETO_TERCEIROS');
  const totPessoalOperacional = sumCat('CUSTO_PESSOAL_OPERACIONAL');
  const totInsumosOficina = sumCat('CUSTO_INSUMOS_OFICINA');
  const custosDiretosTotal = totCustoPecas + totComissoes + totTerceiros + totPessoalOperacional + totInsumosOficina;

  // 5. Lucro Bruto (Margem Bruta)
  const lucroBruto = receitaOperacionalLiquida - custosDiretosTotal;
  const margemBrutaPercent = receitaOperacionalLiquida > 0 ? (lucroBruto / receitaOperacionalLiquida) * 100 : 0;

  // 6. Despesas Operacionais e Administrativas
  const totOcupacao = sumCat('DESPESA_OCUPACAO');
  const totAdmin = sumCat('DESPESA_ADMINISTRATIVA');
  const totComercial = sumCat('DESPESA_COMERCIAL');
  const totBeneficiosEquipe = sumCat('DESPESA_BENEFICIOS_EQUIPE');
  const totProLabore = sumCat('PRO_LABORE_SOCIOS');
  const totManutencao = sumCat('MANUTENCAO_FERRAMENTAL');
  const despesasOperacionaisTotal = totOcupacao + totAdmin + totComercial + totBeneficiosEquipe + totProLabore + totManutencao;

  // 7. Resultado Operacional (EBITDA / LAJIDA)
  const resultadoOperacional = lucroBruto - despesasOperacionaisTotal;
  const margemOperacionalPercent = receitaOperacionalLiquida > 0 ? (resultadoOperacional / receitaOperacionalLiquida) * 100 : 0;

  // 8. Resultado Financeiro
  const totReceitaFin = sumCat('RECEITA_FINANCEIRA');
  const totDespesaFin = sumCat('DESPESA_FINANCEIRA');
  const resultadoFinanceiro = totReceitaFin - totDespesaFin;

  // 9. Lucro Líquido do Exercício
  const lucroLiquido = resultadoOperacional + resultadoFinanceiro;
  const margemLiquidaPercent = receitaOperacionalLiquida > 0 ? (lucroLiquido / receitaOperacionalLiquida) * 100 : 0;

  // 10. Movimentações dos Sócios
  const totDistribuicaoLucros = sumCat('DISTRIBUICAO_LUCROS');
  const totAportesSocios = sumCat('APORTE_EMPRESTIMO_SOCIO');
  const saldoLucroRetido = lucroLiquido - totDistribuicaoLucros;

  // 11. Conciliação com o Fluxo de Caixa (DRE vs Caixa)
  const resultadoFinanceiroCaixa = totalEntradasCaixaMes - totalSaidasCaixaMes;
  const diferencaCompetenciaCaixa = lucroLiquido - resultadoFinanceiroCaixa;

  return {
    periodo: mesAno,
    isAnual,
    indicadores: {
      receitaBruta: receitaOperacionalBruta,
      receitaLiquida: receitaOperacionalLiquida,
      lucroBruto,
      margemBrutaPercent,
      resultadoOperacional,
      margemOperacionalPercent,
      resultadoFinanceiro,
      lucroLiquido,
      margemLiquidaPercent,
      totalDistribuicaoLucros: totDistribuicaoLucros,
      saldoLucroRetido
    },
    linhasDRE: [
      {
        id: '1',
        titulo: '1. RECEITA OPERACIONAL BRUTA',
        valor: receitaOperacionalBruta,
        percentual: 100,
        tipo: 'header_positivo',
        sublinhas: [
          { nome: 'Receita de Mão de Obra (Serviços Concluídos)', valor: totReceitaMO, itens: itensClassificadosPorCategoria.RECEITA_BRUTA_MO },
          { nome: 'Receita de Venda de Peças Faturadas', valor: totReceitaPecas, itens: itensClassificadosPorCategoria.RECEITA_BRUTA_PECAS }
        ]
      },
      {
        id: '2',
        titulo: '2. DEDUÇÕES E TRIBUTOS SOBRE VENDAS',
        valor: deducoesReceita,
        percentual: receitaOperacionalBruta > 0 ? (deducoesReceita / receitaOperacionalBruta) * 100 : 0,
        tipo: 'header_negativo',
        sublinhas: [
          { nome: 'Tributos, Impostos e Taxas Oficiais', valor: totTributos, itens: itensClassificadosPorCategoria.DEDUCOES_TRIBUTOS },
          { nome: 'Cancelamentos, Reembolsos e Devoluções', valor: totCancelamentos, itens: itensClassificadosPorCategoria.CANCELAMENTOS_DEVOLUCOES }
        ]
      },
      {
        id: '3',
        titulo: '3. (=) RECEITA OPERACIONAL LÍQUIDA',
        valor: receitaOperacionalLiquida,
        percentual: receitaOperacionalBruta > 0 ? (receitaOperacionalLiquida / receitaOperacionalBruta) * 100 : 0,
        tipo: 'subtotal_destaque'
      },
      {
        id: '4',
        titulo: '4. (-) CUSTOS DIRETOS DOS SERVIÇOS (CSP / CMV)',
        valor: custosDiretosTotal,
        percentual: receitaOperacionalLiquida > 0 ? (custosDiretosTotal / receitaOperacionalLiquida) * 100 : 0,
        tipo: 'header_negativo',
        sublinhas: [
          { nome: 'Custo de Peças Utilizadas', valor: totCustoPecas, itens: itensClassificadosPorCategoria.CUSTO_DIRETO_PECAS },
          { nome: 'Comissões de Mecânicos por Serviço', valor: totComissoes, itens: itensClassificadosPorCategoria.CUSTO_DIRETO_COMISSOES },
          { nome: 'Serviços Terceirizados (Torno, Alinhamento, etc.)', valor: totTerceiros, itens: itensClassificadosPorCategoria.CUSTO_DIRETO_TERCEIROS },
          { nome: 'Mão de Obra Operacional / Salários', valor: totPessoalOperacional, itens: itensClassificadosPorCategoria.CUSTO_PESSOAL_OPERACIONAL },
          { nome: 'Materiais e Insumos de Oficina', valor: totInsumosOficina, itens: itensClassificadosPorCategoria.CUSTO_INSUMOS_OFICINA }
        ]
      },
      {
        id: '5',
        titulo: '5. (=) LUCRO BRUTO (Margem Bruta)',
        valor: lucroBruto,
        percentual: margemBrutaPercent,
        tipo: 'subtotal_destaque'
      },
      {
        id: '6',
        titulo: '6. (-) DESPESAS OPERACIONAIS E ADMINISTRATIVAS',
        valor: despesasOperacionaisTotal,
        percentual: receitaOperacionalLiquida > 0 ? (despesasOperacionaisTotal / receitaOperacionalLiquida) * 100 : 0,
        tipo: 'header_negativo',
        sublinhas: [
          { nome: 'Ocupação (Aluguel, Energia, Água, IPTU)', valor: totOcupacao, itens: itensClassificadosPorCategoria.DESPESA_OCUPACAO },
          { nome: 'Despesas Administrativas (Sistemas, Contabilidade, Internet)', valor: totAdmin, itens: itensClassificadosPorCategoria.DESPESA_ADMINISTRATIVA },
          { nome: 'Comercial e Marketing (Anúncios e Divulgação)', valor: totComercial, itens: itensClassificadosPorCategoria.DESPESA_COMERCIAL },
          { nome: 'Benefícios e Despesas da Equipe (Almoço, Lanche, VT)', valor: totBeneficiosEquipe, itens: itensClassificadosPorCategoria.DESPESA_BENEFICIOS_EQUIPE },
          { nome: 'Pró-Labore dos Sócios (Rafael, Thaís, Ákysa)', valor: totProLabore, itens: itensClassificadosPorCategoria.PRO_LABORE_SOCIOS },
          { nome: 'Manutenção de Ferramentas e Estrutura', valor: totManutencao, itens: itensClassificadosPorCategoria.MANUTENCAO_FERRAMENTAL }
        ]
      },
      {
        id: '7',
        titulo: '7. (=) RESULTADO OPERACIONAL (EBITDA / LAJIDA)',
        valor: resultadoOperacional,
        percentual: margemOperacionalPercent,
        tipo: 'subtotal_destaque'
      },
      {
        id: '8',
        titulo: '8. (+/-) RESULTADO FINANCEIRO LÍQUIDO',
        valor: resultadoFinanceiro,
        percentual: receitaOperacionalLiquida > 0 ? (resultadoFinanceiro / receitaOperacionalLiquida) * 100 : 0,
        tipo: resultadoFinanceiro >= 0 ? 'header_positivo' : 'header_negativo',
        sublinhas: [
          { nome: 'Receitas Financeiras / Descontos Obtidos', valor: totReceitaFin, itens: itensClassificadosPorCategoria.RECEITA_FINANCEIRA },
          { nome: 'Despesas Financeiras (Taxas de Cartão, Juros)', valor: totDespesaFin, itens: itensClassificadosPorCategoria.DESPESA_FINANCEIRA }
        ]
      },
      {
        id: '9',
        titulo: '9. (=) LUCRO LÍQUIDO DO EXERCÍCIO',
        valor: lucroLiquido,
        percentual: margemLiquidaPercent,
        tipo: lucroLiquido >= 0 ? 'total_positivo' : 'total_negativo'
      }
    ],
    socios: movimentacoesSocios,
    conciliacao: {
      entradasCaixa: totalEntradasCaixaMes,
      saidasCaixa: totalSaidasCaixaMes,
      resultadoCaixa: resultadoFinanceiroCaixa,
      lucroDRE: lucroLiquido,
      diferenca: diferencaCompetenciaCaixa
    },
    pendencias,
    itensPorCategoria: itensClassificadosPorCategoria
  };
}
