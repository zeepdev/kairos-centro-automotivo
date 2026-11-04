/**
 * CALCULADORA E MOTOR DE PLANEJAMENTO FINANCEIRO, METAS E ORÇAMENTO
 * Kairós Centro Automotivo | Athenas Growth Marketing
 */

/**
 * Calcula dias úteis de um determinado mês (YYYY-MM)
 * @param {string} mesAno - 'YYYY-MM'
 * @param {boolean} considerarSabado - oficinas costumam abrir aos sábados
 * @param {Date} [dataRef] - Data para calcular dias decorridos e restantes
 */
export function calcularDiasUteisMes(mesAno, considerarSabado = true, dataRef = new Date()) {
  if (!mesAno || mesAno.length < 7) {
    const now = new Date();
    mesAno = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const [anoStr, mesStr] = mesAno.split('-');
  const ano = parseInt(anoStr, 10);
  const mesIndex = parseInt(mesStr, 10) - 1; // 0-indexed

  const ultimoDia = new Date(ano, mesIndex + 1, 0).getDate();
  let totalDiasUteis = 0;
  let diasDecorridos = 0;
  let diasRestantes = 0;

  const anoRef = dataRef.getFullYear();
  const mesRef = dataRef.getMonth();
  const diaRef = dataRef.getDate();

  const isMesPassado = ano < anoRef || (ano === anoRef && mesIndex < mesRef);
  const isMesFuturo = ano > anoRef || (ano === anoRef && mesIndex > mesRef);
  const isMesAtual = ano === anoRef && mesIndex === mesRef;

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mesIndex, dia);
    const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
    const isDiaUtil = considerarSabado ? (diaSemana !== 0) : (diaSemana !== 0 && diaSemana !== 6);

    if (isDiaUtil) {
      totalDiasUteis++;
      if (isMesPassado) {
        diasDecorridos++;
      } else if (isMesFuturo) {
        diasRestantes++;
      } else if (isMesAtual) {
        if (dia <= diaRef) {
          diasDecorridos++;
        } else {
          diasRestantes++;
        }
      }
    }
  }

  return {
    totalDiasUteis: totalDiasUteis || 22,
    diasDecorridos: Math.max(1, diasDecorridos),
    diasRestantes: Math.max(0, diasRestantes),
    isMesAtual,
    isMesPassado,
    isMesFuturo
  };
}

/**
 * Calcula o atingimento das metas gerais, por atividade e por mecânico
 */
export function calcularAtingimentoMetas({
  metasConfig = {},
  dreData = null,
  orcamentos = [],
  mecanicos = [],
  mesAno = '',
  considerarSabado = true
}) {
  const metaFaturamento = parseFloat(metasConfig.meta_faturamento) || 0;
  const metaLucro = parseFloat(metasConfig.meta_lucro_liquido) || 0;
  const ticketMedioAlvo = parseFloat(metasConfig.ticket_medio_alvo) || 0;
  const metasAtividades = metasConfig.metas_atividades || {};
  const metasMecanicos = metasConfig.metas_mecanicos || {};

  const diasInfo = calcularDiasUteisMes(mesAno, considerarSabado);
  const diasUteisTotal = metasConfig.dias_uteis_mes || diasInfo.totalDiasUteis;
  const diasDecorridos = diasInfo.diasDecorridos;
  const diasRestantes = diasInfo.diasRestantes;

  // Realizado da DRE
  const receitaRealizada = dreData?.indicadores?.receitaLiquida || 0;
  const lucroRealizado = dreData?.indicadores?.lucroLiquido || 0;
  const margemContribuicao = dreData?.indicadores?.margemContribuicao || 0;
  const margemContribuicaoPercent = dreData?.indicadores?.margemContribuicaoPercent || 0;
  const despesasFixas = dreData?.indicadores?.despesasFixasEstruturais || 0;
  const pontoEquilibrio = dreData?.indicadores?.pontoEquilibrio || 0;

  // Atingimento Geral
  const percFaturamento = metaFaturamento > 0 ? (receitaRealizada / metaFaturamento) * 100 : 0;
  const restanteFaturamento = Math.max(0, metaFaturamento - receitaRealizada);
  const percFaturamentoRestante = metaFaturamento > 0 ? (restanteFaturamento / metaFaturamento) * 100 : 0;
  const desvioFaturamento = receitaRealizada - metaFaturamento;

  const percLucro = metaLucro > 0 ? (lucroRealizado / metaLucro) * 100 : 0;
  const restanteLucro = Math.max(0, metaLucro - lucroRealizado);

  // Média Diária Realizada e Necessária
  const mediaDiariaRealizada = diasDecorridos > 0 ? (receitaRealizada / diasDecorridos) : 0;
  const metaDiariaRestante = diasRestantes > 0 ? (restanteFaturamento / diasRestantes) : 0;

  // Contagem de O.S. e Ticket Médio
  const orcamentosMes = (orcamentos || []).filter(o => {
    const rawDate = o.data_conclusao || o.data_pagamento || o.created_at;
    if (!rawDate) return false;
    const match = rawDate.startsWith(mesAno);
    const status = (o.status || '').toLowerCase();
    const isFinalizado = status.includes('finalizado') || status.includes('conclu') || o.pago;
    return match && isFinalizado;
  });

  const totalOS = orcamentosMes.length;
  const ticketMedioReal = totalOS > 0 ? (receitaRealizada / totalOS) : (ticketMedioAlvo > 0 ? ticketMedioAlvo : 500);
  const osRestantesEstimadas = ticketMedioReal > 0 ? Math.ceil(restanteFaturamento / ticketMedioReal) : 0;

  // Metas por Atividade Operacional
  const atividadesDRE = dreData?.atividades || [];
  const atingimentoAtividades = atividadesDRE.map(atv => {
    const metaAtv = parseFloat(metasAtividades[atv.id]) || 0;
    const realizadoAtv = atv.faturamento || 0;
    const percAtv = metaAtv > 0 ? (realizadoAtv / metaAtv) * 100 : 0;
    const restanteAtv = Math.max(0, metaAtv - realizadoAtv);
    return {
      id: atv.id,
      nome: atv.nome,
      icone: atv.icone,
      meta: metaAtv,
      realizado: realizadoAtv,
      percentual: percAtv,
      restante: restanteAtv,
      participacaoNaReceita: atv.percentual || 0
    };
  });

  // Metas por Mecânico
  const producaoPorMecanico = {};
  orcamentosMes.forEach(o => {
    const mecNome = (o.mecanico_nome || 'Não Atribuído').trim();
    const valMO = parseFloat(o.valor_mao_obra) || 0;
    const valTotal = parseFloat(o.valor_total) || valMO;
    if (!producaoPorMecanico[mecNome]) {
      producaoPorMecanico[mecNome] = { faturamento: 0, osQtd: 0 };
    }
    producaoPorMecanico[mecNome].faturamento += valTotal;
    producaoPorMecanico[mecNome].osQtd += 1;
  });

  const atingimentoMecanicos = (mecanicos || []).map(m => {
    const nomeMec = m.nome;
    const metaMec = parseFloat(metasMecanicos[nomeMec]) || 0;
    const prod = producaoPorMecanico[nomeMec] || { faturamento: 0, osQtd: 0 };
    const percMec = metaMec > 0 ? (prod.faturamento / metaMec) * 100 : 0;
    return {
      id: m.id,
      nome: nomeMec,
      meta: metaMec,
      realizado: prod.faturamento,
      osQtd: prod.osQtd,
      percentual: percMec,
      restante: Math.max(0, metaMec - prod.faturamento)
    };
  });

  return {
    metaFaturamento,
    metaLucro,
    receitaRealizada,
    lucroRealizado,
    percFaturamento,
    restanteFaturamento,
    percFaturamentoRestante,
    desvioFaturamento,
    percLucro,
    restanteLucro,
    diasUteisTotal,
    diasDecorridos,
    diasRestantes,
    mediaDiariaRealizada,
    metaDiariaRestante,
    totalOS,
    ticketMedioReal,
    osRestantesEstimadas,
    margemContribuicao,
    margemContribuicaoPercent,
    despesasFixas,
    pontoEquilibrio,
    atividades: atingimentoAtividades,
    mecanicos: atingimentoMecanicos
  };
}

/**
 * Simulação de Cenários de Projeção para Fechamento do Mês
 */
export function calcularCenariosProjecao({
  receitaRealizada = 0,
  diasDecorridos = 1,
  diasRestantes = 0,
  margemContribuicaoPercent = 70,
  despesasFixas = 0
}) {
  const ritmoDiario = diasDecorridos > 0 ? (receitaRealizada / diasDecorridos) : 0;

  // Projeção Receita por Cenário
  const baseReceita = receitaRealizada + (ritmoDiario * diasRestantes);
  const conservadorReceita = receitaRealizada + (ritmoDiario * 0.80 * diasRestantes);
  const otimistaReceita = receitaRealizada + (ritmoDiario * 1.20 * diasRestantes);

  const calcCenario = (rec, nome, desc, cor) => {
    const mcIndice = (margemContribuicaoPercent || 70) / 100;
    const margemContribuicaoEst = rec * mcIndice;
    const lucroEst = margemContribuicaoEst - despesasFixas;
    const margemLiquidaEst = rec > 0 ? (lucroEst / rec) * 100 : 0;
    return {
      nome,
      descricao: desc,
      cor,
      receitaProjetada: rec,
      lucroProjetado: lucroEst,
      margemLiquidaProjetada: margemLiquidaEst,
      atingiuPontoEquilibrio: margemContribuicaoEst >= despesasFixas
    };
  };

  return {
    ritmoDiario,
    conservador: calcCenario(conservadorReceita, 'Conservador (-20%)', 'Retração no ritmo diário na reta final', '#ef4444'),
    base: calcCenario(baseReceita, 'Cenário Base (Tendência)', 'Manutenção exata do ritmo diário atual', '#3b82f6'),
    otimista: calcCenario(otimistaReceita, 'Otimista (+20%)', 'Aceleração de fluxo de serviços e ticket médio', '#10b981')
  };
}

/**
 * Simulador de Faturamento Necessário para Lucro Desejado
 * Fórmula: Receita Necessária = (Custos & Despesas Fixas + Lucro Desejado) / % Margem de Contribuição
 */
export function simularFaturamentoLucro({
  despesasFixas = 0,
  margemContribuicaoPercent = 70,
  lucroAlvo = 10000,
  ticketMedio = 500,
  receitaAtual = 0
}) {
  const mcIndice = (margemContribuicaoPercent || 70) / 100;
  if (mcIndice <= 0) {
    return {
      faturamentoNecessario: 0,
      adicionalNecessario: 0,
      veiculosNecessarios: 0,
      erro: 'Margem de contribuição inválida ou zerada'
    };
  }

  const faturamentoNecessario = (despesasFixas + Math.max(0, lucroAlvo)) / mcIndice;
  const adicionalNecessario = Math.max(0, faturamentoNecessario - receitaAtual);
  const veiculosNecessarios = ticketMedio > 0 ? Math.ceil(adicionalNecessario / ticketMedio) : 0;

  return {
    faturamentoNecessario,
    adicionalNecessario,
    veiculosNecessarios,
    margemContribuicaoIndice: mcIndice,
    pontoEquilibrio: despesasFixas / mcIndice
  };
}

/**
 * Comparativo Orçado vs Realizado (Matriz da DRE Orçamentária)
 */
export function calcularOrcadoVsRealizado({
  orcamentoCategorias = {},
  dreData = null
}) {
  if (!dreData || !dreData.linhasDRE) return [];

  return dreData.linhasDRE.map(linha => {
    const orcado = parseFloat(orcamentoCategorias[linha.id]) || 0;
    const realizado = linha.valor || 0;
    const desvio = realizado - orcado;
    const desvioPercent = orcado !== 0 ? (desvio / Math.abs(orcado)) * 100 : 0;

    // Linhas de receita (id 1, 3) vs despesa/custo
    const isReceita = linha.id === '1' || linha.id === '3';
    let status = 'neutro';

    if (orcado > 0) {
      if (isReceita) {
        status = realizado >= orcado ? 'atingido' : (realizado >= orcado * 0.85 ? 'atencao' : 'abaixo');
      } else {
        // Custo ou despesa
        status = realizado <= orcado ? 'dentro' : (realizado <= orcado * 1.10 ? 'atencao' : 'estourado');
      }
    }

    return {
      id: linha.id,
      titulo: linha.titulo,
      tipo: linha.tipo,
      orcado,
      realizado,
      desvio,
      desvioPercent,
      status,
      sublinhas: (linha.sublinhas || []).map(sub => {
        const subOrcado = parseFloat(orcamentoCategorias[sub.id || sub.nome]) || 0;
        const subRealizado = sub.valor || 0;
        const subDesvio = subRealizado - subOrcado;
        return {
          nome: sub.nome,
          orcado: subOrcado,
          realizado: subRealizado,
          desvio: subDesvio,
          desvioPercent: subOrcado !== 0 ? (subDesvio / Math.abs(subOrcado)) * 100 : 0
        };
      })
    };
  });
}
