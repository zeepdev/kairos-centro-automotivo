import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { calcularDRE } from '../../lib/dreCalculator';
import { 
  calcularAtingimentoMetas, 
  calcularCenariosProjecao, 
  simularFaturamentoLucro, 
  calcularOrcadoVsRealizado 
} from '../../lib/planejamentoCalculator';
import { fetchFinanceiroMetas, saveFinanceiroMetas } from '../../lib/dreStorage';

const formatCurrency = (val) => {
  return (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const PlanejamentoManager = () => {
  // Período
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [activeSubTab, setActiveSubTab] = useState('metas'); // 'metas' | 'orcamento' | 'cenarios' | 'simulador'
  const [considerarSabado, setConsiderarSabado] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dados do banco
  const [orcamentos, setOrcamentos] = useState([]);
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [gastosFixos, setGastosFixos] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [classificacoes, setClassificacoes] = useState([]);

  // Configuração de Metas e Orçamento do Mês
  const [metasConfig, setMetasConfig] = useState({
    meta_faturamento: 45000,
    meta_lucro_liquido: 10000,
    dias_uteis_mes: 25,
    ticket_medio_alvo: 650,
    metas_atividades: {},
    metas_mecanicos: {},
    orcamento_categorias: {
      '1': 45000, // Receita Bruta
      '4': 13000, // Custos Diretos
      '6': 18000  // Despesas Operacionais
    }
  });

  // Estado do Simulador
  const [simLucroAlvo, setSimLucroAlvo] = useState(15000);

  // 1. Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: orcData },
        { data: fcData },
        { data: gfData },
        { data: mecData },
        { data: classData },
        metasData
      ] = await Promise.all([
        supabase.from('orcamentos').select('*'),
        supabase.from('fluxo_caixa').select('*'),
        supabase.from('gastos_fixos').select('*'),
        supabase.from('mecanicos').select('*').order('nome'),
        supabase.from('dre_classificacoes').select('*'),
        fetchFinanceiroMetas(selectedMonth)
      ]);

      setOrcamentos(orcData || []);
      setFluxoCaixa(fcData || []);
      setGastosFixos(gfData || []);
      setMecanicos(mecData || []);
      setClassificacoes(classData || []);

      if (metasData) {
        setMetasConfig(prev => ({
          ...prev,
          ...metasData,
          metas_atividades: metasData.metas_atividades || {},
          metas_mecanicos: metasData.metas_mecanicos || {},
          orcamento_categorias: metasData.orcamento_categorias || prev.orcamento_categorias
        }));
      }
    } catch (err) {
      console.warn('Erro ao carregar dados de planejamento:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Apurar DRE do mês para alimentar metas
  const dreData = useMemo(() => {
    return calcularDRE({
      orcamentos,
      fluxoCaixa,
      gastosFixos,
      classificacoes,
      ajustes: [],
      mesAno: selectedMonth
    });
  }, [orcamentos, fluxoCaixa, gastosFixos, classificacoes, selectedMonth]);

  // 3. Cálculos de Atingimento
  const atingimento = useMemo(() => {
    return calcularAtingimentoMetas({
      metasConfig,
      dreData,
      orcamentos,
      mecanicos,
      mesAno: selectedMonth,
      considerarSabado
    });
  }, [metasConfig, dreData, orcamentos, mecanicos, selectedMonth, considerarSabado]);

  // 4. Projeções de Cenários
  const cenarios = useMemo(() => {
    return calcularCenariosProjecao({
      receitaRealizada: atingimento.receitaRealizada,
      diasDecorridos: atingimento.diasDecorridos,
      diasRestantes: atingimento.diasRestantes,
      margemContribuicaoPercent: atingimento.margemContribuicaoPercent,
      despesasFixas: atingimento.despesasFixas
    });
  }, [atingimento]);

  // 5. Simulação de Lucro Desejado
  const simulacao = useMemo(() => {
    return simularFaturamentoLucro({
      despesasFixas: atingimento.despesasFixas,
      margemContribuicaoPercent: atingimento.margemContribuicaoPercent,
      lucroAlvo: simLucroAlvo,
      ticketMedio: atingimento.ticketMedioReal,
      receitaAtual: atingimento.receitaRealizada
    });
  }, [atingimento, simLucroAlvo]);

  // 6. Matriz Orçado vs Realizado
  const matrizOrcamento = useMemo(() => {
    return calcularOrcadoVsRealizado({
      orcamentoCategorias: metasConfig.orcamento_categorias || {},
      dreData
    });
  }, [metasConfig.orcamento_categorias, dreData]);

  // Salvar Metas e Orçamento no Supabase
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveFinanceiroMetas(selectedMonth, metasConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (e) {
      alert('Erro ao salvar metas: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleMetasConfigChange = (field, value) => {
    setMetasConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAtividadeMetaChange = (id, val) => {
    setMetasConfig(prev => ({
      ...prev,
      metas_atividades: {
        ...prev.metas_atividades,
        [id]: parseFloat(val) || 0
      }
    }));
  };

  const handleMecanicoMetaChange = (nome, val) => {
    setMetasConfig(prev => ({
      ...prev,
      metas_mecanicos: {
        ...prev.metas_mecanicos,
        [nome]: parseFloat(val) || 0
      }
    }));
  };

  const handleOrcamentoCategoriaChange = (linhaId, val) => {
    setMetasConfig(prev => ({
      ...prev,
      orcamento_categorias: {
        ...prev.orcamento_categorias,
        [linhaId]: parseFloat(val) || 0
      }
    }));
  };

  return (
    <div style={{ color: '#fff' }}>
      {/* Header com Controles e Período */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #2a2a35'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🎯</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Planejamento Financeiro, Metas & Orçamento</h2>
              <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Kairós Centro Automotivo • Projeções, Break-Even e Simulações Gerenciais
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Seletor Mês */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#181820', padding: '6px 12px', borderRadius: '8px', border: '1px solid #2a2a35' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Mês/Ano:</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                background: '#22222e',
                border: '1px solid #3b3b4f',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            />
          </div>

          {/* Toggle Sábado Útil */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer', background: '#181820', padding: '6px 12px', borderRadius: '8px', border: '1px solid #2a2a35' }}>
            <input 
              type="checkbox" 
              checked={considerarSabado}
              onChange={(e) => setConsiderarSabado(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Sábado Útil (Oficina)
          </label>

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: saveSuccess ? '#10b981' : '#3b82f6',
              color: '#fff',
              fontWeight: 'bold',
              cursor: saving ? 'wait' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {saving ? '⏳ Salvando...' : saveSuccess ? '✅ Metas Salvas!' : '💾 Salvar Metas & Orçamento'}
          </button>
        </div>
      </div>

      {/* Faixa de Calendário Operacional do Mês */}
      <div style={{
        background: '#13131a',
        padding: '10px 16px',
        borderRadius: '8px',
        border: '1px solid #232330',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#94a3b8' }}>
            🗓️ Calendário do Mês: <strong style={{ color: '#fff' }}>{atingimento.diasUteisTotal} dias úteis</strong>
          </span>
          <span style={{ color: '#94a3b8' }}>
            ⏱️ Decorridos: <strong style={{ color: '#38bdf8' }}>{atingimento.diasDecorridos} dias</strong>
          </span>
          <span style={{ color: '#94a3b8' }}>
            ⏳ Restantes: <strong style={{ color: '#f59e0b' }}>{atingimento.diasRestantes} dias úteis</strong>
          </span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>
            Média Diária Realizada: <strong style={{ color: '#10b981' }}>{formatCurrency(atingimento.mediaDiariaRealizada)}/dia</strong>
          </span>
        </div>
      </div>

      {/* Cards Executivos de Metas no Topo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        {/* Card 1: Meta de Faturamento */}
        <div style={{ background: '#181824', padding: '16px', borderRadius: '10px', border: '1px solid #2b2b3d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Meta de Faturamento</span>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: atingimento.percFaturamento >= 100 ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)', color: atingimento.percFaturamento >= 100 ? '#10b981' : '#3b82f6', fontWeight: 'bold' }}>
              {atingimento.percFaturamento.toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
            {formatCurrency(atingimento.receitaRealizada)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
            Alvo: {formatCurrency(atingimento.metaFaturamento)}
          </div>
          <div style={{ width: '100%', height: '6px', background: '#272738', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, atingimento.percFaturamento)}%`, height: '100%', background: atingimento.percFaturamento >= 100 ? '#10b981' : '#3b82f6', borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: atingimento.restanteFaturamento === 0 ? '#10b981' : '#f59e0b', marginTop: '6px', textAlign: 'right' }}>
            {atingimento.restanteFaturamento === 0 ? '🎉 Meta Atingida!' : `Faltam ${formatCurrency(atingimento.restanteFaturamento)}`}
          </div>
        </div>

        {/* Card 2: Meta Diária Restante */}
        <div style={{ background: '#181824', padding: '16px', borderRadius: '10px', border: '1px solid #2b2b3d' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>
            Meta Diária Restante
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
            {formatCurrency(atingimento.metaDiariaRestante)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Por dia útil restante ({atingimento.diasRestantes} dias)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px', borderTop: '1px solid #272738', paddingTop: '6px' }}>
            Ritmo Atual: <strong style={{ color: '#fff' }}>{formatCurrency(atingimento.mediaDiariaRealizada)}/dia</strong>
          </div>
        </div>

        {/* Card 3: Veículos / OS Necessárias */}
        <div style={{ background: '#181824', padding: '16px', borderRadius: '10px', border: '1px solid #2b2b3d' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>
            O.S. / Carros Alvo
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>
            {atingimento.osRestantesEstimadas} veículos
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Necessários p/ bater a meta
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px', borderTop: '1px solid #272738', paddingTop: '6px' }}>
            Ticket Médio: <strong style={{ color: '#fff' }}>{formatCurrency(atingimento.ticketMedioReal)}</strong> ({atingimento.totalOS} O.S. pagas)
          </div>
        </div>

        {/* Card 4: Meta de Lucro Líquido */}
        <div style={{ background: '#181824', padding: '16px', borderRadius: '10px', border: '1px solid #2b2b3d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Meta de Lucro</span>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: atingimento.percLucro >= 100 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: atingimento.percLucro >= 100 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
              {atingimento.percLucro.toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: atingimento.lucroRealizado >= 0 ? '#10b981' : '#ef4444', marginBottom: '4px' }}>
            {formatCurrency(atingimento.lucroRealizado)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
            Meta: {formatCurrency(atingimento.metaLucro)}
          </div>
          <div style={{ width: '100%', height: '6px', background: '#272738', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, atingimento.percLucro))}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
            Margem Líquida: <strong>{dreData?.indicadores?.margemLiquidaPercent ? dreData.indicadores.margemLiquidaPercent.toFixed(1) : 0}%</strong>
          </div>
        </div>

        {/* Card 5: Ponto de Equilíbrio (Break-Even) */}
        <div style={{ background: '#181824', padding: '16px', borderRadius: '10px', border: '1px solid #2b2b3d' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>
            Ponto de Equilíbrio
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#a855f7', marginBottom: '4px' }}>
            {formatCurrency(atingimento.pontoEquilibrio)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Despesas Fixas: {formatCurrency(atingimento.despesasFixas)}
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '12px', borderTop: '1px solid #272738', paddingTop: '6px', color: atingimento.receitaRealizada >= atingimento.pontoEquilibrio ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
            {atingimento.receitaRealizada >= atingimento.pontoEquilibrio 
              ? `✅ Ponto de Equilíbrio Batido (+${formatCurrency(atingimento.receitaRealizada - atingimento.pontoEquilibrio)})`
              : `⚠️ Faltam ${formatCurrency(atingimento.pontoEquilibrio - atingimento.receitaRealizada)} p/ cobrir custos fixos`}
          </div>
        </div>
      </div>

      {/* Navegação por Sub-Abas */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #2a2a35', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'metas', label: '🎯 Metas do Mês & Equipe' },
          { id: 'orcamento', label: '📊 Orçado vs Realizado (DRE)' },
          { id: 'cenarios', label: '🔮 Projeção de Cenários (Fim do Mês)' },
          { id: 'simulador', label: '🧮 Simulador de Metas & Lucro' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeSubTab === tab.id ? '#1e1e2d' : 'transparent',
              color: activeSubTab === tab.id ? '#38bdf8' : '#888',
              fontWeight: activeSubTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeSubTab === tab.id ? '3px solid #38bdf8' : 'none',
              fontSize: '0.9rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da Aba 1: Metas do Mês, Especialidades & Mecânicos */}
      {activeSubTab === 'metas' && (
        <div>
          {/* Configuração Geral das Metas */}
          <div style={{ background: '#181824', padding: '20px', borderRadius: '10px', border: '1px solid #2a2a35', marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚙️ Parâmetros Globais de Metas ({selectedMonth})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>Meta de Faturamento (R$)</label>
                <input 
                  type="number"
                  value={metasConfig.meta_faturamento}
                  onChange={(e) => handleMetasConfigChange('meta_faturamento', parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', background: '#22222f', border: '1px solid #3a3a4d', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.95rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>Meta de Lucro Líquido (R$)</label>
                <input 
                  type="number"
                  value={metasConfig.meta_lucro_liquido}
                  onChange={(e) => handleMetasConfigChange('meta_lucro_liquido', parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', background: '#22222f', border: '1px solid #3a3a4d', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.95rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>Dias Úteis Estimados</label>
                <input 
                  type="number"
                  value={metasConfig.dias_uteis_mes}
                  onChange={(e) => handleMetasConfigChange('dias_uteis_mes', parseInt(e.target.value, 10) || 22)}
                  style={{ width: '100%', background: '#22222f', border: '1px solid #3a3a4d', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.95rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>Ticket Médio Alvo (R$)</label>
                <input 
                  type="number"
                  value={metasConfig.ticket_medio_alvo}
                  onChange={(e) => handleMetasConfigChange('ticket_medio_alvo', parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', background: '#22222f', border: '1px solid #3a3a4d', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.95rem' }}
                />
              </div>
            </div>
          </div>

          {/* Metas por Especialidade Automotiva */}
          <div style={{ background: '#181824', padding: '20px', borderRadius: '10px', border: '1px solid #2a2a35', marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛠️ Metas por Especialidade Automotiva
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
              {atingimento.atividades.map(atv => (
                <div key={atv.id} style={{ background: '#13131c', padding: '14px', borderRadius: '8px', border: '1px solid #232332' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>{atv.icone}</span>
                      <span>{atv.nome}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: atv.percentual >= 100 ? '#10b981' : '#38bdf8', fontWeight: 'bold' }}>
                      {atv.percentual.toFixed(1)}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Meta (R$):</span>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={metasConfig.metas_atividades[atv.id] || ''}
                        onChange={(e) => handleAtividadeMetaChange(atv.id, e.target.value)}
                        style={{ width: '100%', background: '#1d1d29', border: '1px solid #2c2c3e', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Realizado:</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#10b981', paddingTop: '4px' }}>
                        {formatCurrency(atv.realizado)}
                      </div>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '5px', background: '#252538', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, atv.percentual)}%`, height: '100%', background: atv.percentual >= 100 ? '#10b981' : '#38bdf8' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '5px' }}>
                    <span>Peso na oficina: {atv.participacaoNaReceita.toFixed(1)}%</span>
                    <span>{atv.restante > 0 ? `Faltam ${formatCurrency(atv.restante)}` : 'Concluído'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metas por Mecânico */}
          <div style={{ background: '#181824', padding: '20px', borderRadius: '10px', border: '1px solid #2a2a35' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👨‍🔧 Metas de Produção por Mecânico
            </h3>
            {atingimento.mecanicos.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Nenhum mecânico ativo cadastrado no sistema.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                {atingimento.mecanicos.map(mec => (
                  <div key={mec.id} style={{ background: '#13131c', padding: '14px', borderRadius: '8px', border: '1px solid #232332' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>🔧 {mec.nome}</strong>
                      <span style={{ fontSize: '0.75rem', color: mec.percentual >= 100 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                        {mec.percentual.toFixed(1)}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Meta (R$):</span>
                        <input 
                          type="number"
                          placeholder="0.00"
                          value={metasConfig.metas_mecanicos[mec.nome] || ''}
                          onChange={(e) => handleMecanicoMetaChange(mec.nome, e.target.value)}
                          style={{ width: '100%', background: '#1d1d29', border: '1px solid #2c2c3e', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Produção ({mec.osQtd} O.S.):</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#38bdf8', paddingTop: '4px' }}>
                          {formatCurrency(mec.realizado)}
                        </div>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: '5px', background: '#252538', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, mec.percentual)}%`, height: '100%', background: mec.percentual >= 100 ? '#10b981' : '#f59e0b' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Orçado vs Realizado (DRE Orçamentária) */}
      {activeSubTab === 'orcamento' && (
        <div style={{ background: '#181824', padding: '20px', borderRadius: '10px', border: '1px solid #2a2a35' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#38bdf8' }}>📊 DRE Orçamentária: Orçado vs Realizado</h3>
              <p style={{ margin: '3px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Defina o teto orçamentário por linha contábil e acompanhe os desvios em tempo real.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>● No Alvo</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>● Atenção (+10%)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>● Estourado</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0e0e15', color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid #2a2a35' }}>
                  <th style={{ padding: '10px 12px' }}>Linha Contábil DRE</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: '150px' }}>Orçado (R$)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Realizado DRE (R$)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Desvio (R$)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Desvio (%)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Situação</th>
                </tr>
              </thead>
              <tbody>
                {matrizOrcamento.map(linha => {
                  const isPos = linha.desvio >= 0;
                  const isReceita = linha.id === '1' || linha.id === '3';
                  let statusBg = 'transparent';
                  let statusColor = '#94a3b8';
                  let statusLabel = 'Indefinido';

                  if (linha.status === 'atingido' || linha.status === 'dentro') {
                    statusBg = 'rgba(16,185,129,0.15)';
                    statusColor = '#10b981';
                    statusLabel = isReceita ? '✅ Atingido' : '✅ Sob Controle';
                  } else if (linha.status === 'atencao') {
                    statusBg = 'rgba(245,158,11,0.15)';
                    statusColor = '#f59e0b';
                    statusLabel = '⚠️ Atenção';
                  } else if (linha.status === 'abaixo' || linha.status === 'estourado') {
                    statusBg = 'rgba(239,68,68,0.15)';
                    statusColor = '#ef4444';
                    statusLabel = isReceita ? '🚨 Abaixo da Meta' : '🚨 Estourado';
                  }

                  return (
                    <React.Fragment key={linha.id}>
                      <tr style={{
                        borderBottom: '1px solid #242433',
                        background: linha.tipo.includes('header') ? '#151520' : 'transparent',
                        fontWeight: linha.tipo.includes('header') || linha.tipo.includes('total') ? 'bold' : 'normal'
                      }}>
                        <td style={{ padding: '10px 12px' }}>{linha.titulo}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={metasConfig.orcamento_categorias[linha.id] || ''}
                            onChange={(e) => handleOrcamentoCategoriaChange(linha.id, e.target.value)}
                            style={{
                              width: '100%',
                              maxWidth: '130px',
                              background: '#22222e',
                              border: '1px solid #38384d',
                              color: '#fff',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              textAlign: 'right',
                              fontSize: '0.85rem',
                              fontWeight: 'bold'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#fff' }}>
                          {formatCurrency(linha.realizado)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: isPos ? (isReceita ? '#10b981' : '#ef4444') : (isReceita ? '#ef4444' : '#10b981') }}>
                          {isPos ? '+' : ''}{formatCurrency(linha.desvio)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94a3b8' }}>
                          {linha.orcado > 0 ? `${linha.desvioPercent > 0 ? '+' : ''}${linha.desvioPercent.toFixed(1)}%` : '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '12px', background: statusBg, color: statusColor, fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>

                      {/* Sublinhas */}
                      {linha.sublinhas && linha.sublinhas.map((sub, sIdx) => (
                        <tr key={sIdx} style={{ borderBottom: '1px solid #1c1c28', fontSize: '0.8rem', color: '#94a3b8' }}>
                          <td style={{ padding: '6px 12px 6px 28px' }}>• {sub.nome}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>-</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right', color: '#cbd5e1' }}>{formatCurrency(sub.realizado)}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>-</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>-</td>
                          <td style={{ padding: '6px 12px', textAlign: 'center' }}>-</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: Projeção de Cenários (Conservador, Base, Otimista) */}
      {activeSubTab === 'cenarios' && (
        <div>
          <div style={{ background: '#181824', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a35', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#38bdf8' }}>🔮 Projeções Inteligentes de Fechamento do Mês</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              Baseado no ritmo diário atual ({formatCurrency(cenarios.ritmoDiario)}/dia) e nos {atingimento.diasRestantes} dias úteis restantes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {[cenarios.conservador, cenarios.base, cenarios.otimista].map((cen, cIdx) => (
              <div 
                key={cIdx} 
                style={{
                  background: '#181824',
                  borderRadius: '10px',
                  border: `2px solid ${cen.cor}`,
                  padding: '20px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: cen.cor, fontSize: '1.1rem' }}>{cen.nome}</h4>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                    {cen.atingiuPontoEquilibrio ? '✅ Cobre Custos Fixos' : '⚠️ Abaixo do Break-Even'}
                  </span>
                </div>
                <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.8rem' }}>{cen.descricao}</p>

                <div style={{ marginBottom: '15px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Receita Faturada Projetada:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                    {formatCurrency(cen.receitaProjetada)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: cen.receitaProjetada >= atingimento.metaFaturamento ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                    {cen.receitaProjetada >= atingimento.metaFaturamento 
                      ? `Bate a meta (+${formatCurrency(cen.receitaProjetada - atingimento.metaFaturamento)})`
                      : `Faltarão ${formatCurrency(atingimento.metaFaturamento - cen.receitaProjetada)}`}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #272738', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lucro Líquido Est.:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: cen.lucroProjetado >= 0 ? '#10b981' : '#ef4444' }}>
                      {formatCurrency(cen.lucroProjetado)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Margem Líquida Est.:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8' }}>
                      {cen.margemLiquidaProjetada.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Simulador de Metas & Lucro Desejado */}
      {activeSubTab === 'simulador' && (
        <div style={{ background: '#181824', padding: '25px', borderRadius: '10px', border: '1px solid #2a2a35' }}>
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#38bdf8' }}>
              🧮 Simulador: Quanto a oficina precisa vender para bater seus objetivos?
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              Utiliza a metodologia contábil de Margem de Contribuição ({atingimento.margemContribuicaoPercent.toFixed(1)}%) e Despesas Estruturais ({formatCurrency(atingimento.despesasFixas)}) para responder exatamente quanto faturar e quantos carros atender.
            </p>
          </div>

          {/* Seletor do Lucro Alvo */}
          <div style={{ background: '#12121a', padding: '20px', borderRadius: '8px', border: '1px solid #222230', marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 'bold', marginBottom: '10px' }}>
              Quanto de Lucro Líquido você quer que sobre para a Kairós no mês?
            </label>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="number" 
                value={simLucroAlvo}
                onChange={(e) => setSimLucroAlvo(parseFloat(e.target.value) || 0)}
                style={{
                  background: '#222230',
                  border: '1px solid #3d3d52',
                  color: '#10b981',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  width: '200px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[8000, 10000, 15000, 20000, 30000].map(val => (
                  <button
                    key={val}
                    onClick={() => setSimLucroAlvo(val)}
                    style={{
                      background: simLucroAlvo === val ? '#10b981' : '#222230',
                      color: simLucroAlvo === val ? '#000' : '#fff',
                      border: '1px solid #333345',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultados da Simulação */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#13131c', padding: '18px', borderRadius: '8px', border: '1px solid #232332' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Faturamento Total Exigido:</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>
                {formatCurrency(simulacao.faturamentoNecessario)}
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Fórmula: (Despesas Fixas + Lucro) ÷ % Margem Contribuição
              </p>
            </div>

            <div style={{ background: '#13131c', padding: '18px', borderRadius: '8px', border: '1px solid #232332' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Faturamento Adicional Necessário:</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
                {formatCurrency(simulacao.adicionalNecessario)}
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Além do que já foi faturado até hoje ({formatCurrency(atingimento.receitaRealizada)})
              </p>
            </div>

            <div style={{ background: '#13131c', padding: '18px', borderRadius: '8px', border: '1px solid #232332' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Veículos / O.S. Extras Necessárias:</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                {simulacao.veiculosNecessarios} veículos
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Considerando ticket médio de {formatCurrency(atingimento.ticketMedioReal)}
              </p>
            </div>

            <div style={{ background: '#13131c', padding: '18px', borderRadius: '8px', border: '1px solid #232332' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ritmo Restante Necessário:</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#a855f7', marginTop: '4px' }}>
                {atingimento.diasRestantes > 0 ? formatCurrency(simulacao.adicionalNecessario / atingimento.diasRestantes) : formatCurrency(0)}/dia
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Durante os {atingimento.diasRestantes} dias úteis restantes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanejamentoManager;
