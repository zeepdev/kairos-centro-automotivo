import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { pdf } from '@react-pdf/renderer';
import { DREPDF } from './DREPDF';
import {
  CATEGORIAS_DRE,
  LISTA_SOCIOS,
  calcularDRE,
  sugerirClassificacao
} from '../../lib/dreCalculator';
import {
  fetchDREClassificacoes,
  saveDREClassificacao,
  saveDREClassificacoesBatch,
  fetchDREFechamento,
  saveDREFechamento,
  reabrirDREFechamento,
  fetchDREAJustes,
  saveDREAJuste,
  deleteDREAJuste
} from '../../lib/dreStorage';

const formatCurrency = (val) => {
  return (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const DREManager = () => {
  // Estado de Período
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [viewMode, setViewMode] = useState('mensal'); // 'mensal' | 'anual'

  // Dados brutos
  const [orcamentos, setOrcamentos] = useState([]);
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [gastosFixos, setGastosFixos] = useState([]);
  const [classificacoes, setClassificacoes] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [fechamento, setFechamento] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de UI
  const [expandedRows, setExpandedRows] = useState({ '1': true, '4': true, '6': true });
  const [showClassifyModal, setShowClassifyModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Form de Ajuste
  const [novoAjuste, setNovoAjuste] = useState({
    tipo: 'depreciacao',
    descricao: '',
    valor: '',
    categoria_dre: 'DESPESA_ADMINISTRATIVA',
    natureza: 'despesa',
    responsavel: 'Administração'
  });

  // 1. Carregar todos os dados necessários
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: orcData },
        { data: fcData },
        { data: gfData },
        classData,
        fechData,
        ajustData
      ] = await Promise.all([
        supabase.from('orcamentos').select('*'),
        supabase.from('fluxo_caixa').select('*'),
        supabase.from('gastos_fixos').select('*'),
        fetchDREClassificacoes(viewMode === 'mensal' ? selectedMonth : ''),
        fetchDREFechamento(selectedMonth),
        fetchDREAJustes(selectedMonth)
      ]);

      setOrcamentos(orcData || []);
      setFluxoCaixa(fcData || []);
      setGastosFixos(gfData || []);
      setClassificacoes(classData || []);
      setFechamento(fechData || null);
      setAjustes(ajustData || []);
    } catch (err) {
      console.warn('Erro ao carregar dados para a DRE:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Apuração da DRE em tempo real (ou leitura do fechamento congelado se houver)
  const dreResult = useMemo(() => {
    const periodoAlvo = viewMode === 'mensal' ? selectedMonth : selectedMonth.substring(0, 4);

    // Se o mês estiver oficialmente encerrado e tiver dados congelados, usa a foto congelada
    if (viewMode === 'mensal' && fechamento && fechamento.status === 'encerrado' && fechamento.dados_dre) {
      return fechamento.dados_dre;
    }

    return calcularDRE({
      orcamentos,
      fluxoCaixa,
      gastosFixos,
      classificacoes,
      ajustes,
      mesAno: periodoAlvo
    });
  }, [orcamentos, fluxoCaixa, gastosFixos, classificacoes, ajustes, selectedMonth, viewMode, fechamento]);

  // Alternar expansão de linha
  const toggleRow = (rowId) => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  // Navegação de mês
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  // Fechar Mês Oficial
  const handleFecharMes = async () => {
    if (!window.confirm(`Deseja encerrar e CONGELAR a DRE de ${selectedMonth}? Isso gerará um registro oficial auditável.`)) {
      return;
    }
    const resp = prompt('Informe seu nome para o registro de encerramento:', 'Rafael Taveira');
    if (!resp) return;

    try {
      const closed = await saveDREFechamento(selectedMonth, dreResult, resp, 'Fechamento contábil mensal gerencial');
      setFechamento(closed);
      alert('✓ Mês encerrado e congelado com sucesso para auditoria contábil!');
    } catch (e) {
      alert('Erro ao fechar mês: ' + e.message);
    }
  };

  // Reabrir Mês
  const handleReabrirMes = async () => {
    if (!window.confirm(`Deseja reabrir a DRE de ${selectedMonth} para novas edições e reclassificações?`)) {
      return;
    }
    await reabrirDREFechamento(selectedMonth);
    setFechamento(null);
    loadData();
    alert('✓ Mês reaberto para edição!');
  };

  // Salvar Classificação Individual
  const handleClassificarItem = async (item, categoriaNova, socioNovo = null) => {
    const updated = {
      id: item.id,
      origem_tipo: item.id.startsWith('fc_saida') ? 'fluxo_caixa_saida' : (item.id.startsWith('fc_entrada') ? 'fluxo_caixa_entrada' : 'gasto_fixo'),
      origem_id: item.id,
      origem_ref: item.origem,
      descricao: item.descricao,
      valor: item.valor,
      categoria_dre: categoriaNova,
      subcategoria_dre: CATEGORIAS_DRE[categoriaNova]?.nome || categoriaNova,
      socio_nome: socioNovo,
      mes_competencia: selectedMonth,
      status: 'classificado'
    };

    await saveDREClassificacao(updated);
    setClassificacoes(prev => {
      const next = prev.filter(c => c.id !== updated.id);
      next.push(updated);
      return next;
    });
  };

  // Aceitar todas as sugestões automáticas em lote
  const handleAprovarSugestoes = async () => {
    const lote = dreResult.pendencias.map(p => ({
      id: p.id,
      origem_tipo: p.id.startsWith('fc_saida') ? 'fluxo_caixa_saida' : 'fluxo_caixa_entrada',
      origem_id: p.id,
      origem_ref: p.origem,
      descricao: p.descricao,
      valor: p.valor,
      categoria_dre: p.categoria_dre !== 'PENDENTE' ? p.categoria_dre : 'DESPESA_ADMINISTRATIVA',
      subcategoria_dre: p.subcategoria_dre,
      socio_nome: p.socio_nome,
      mes_competencia: selectedMonth,
      status: 'classificado'
    }));

    await saveDREClassificacoesBatch(lote);
    loadData();
    alert(`✓ ${lote.length} lançamentos aprovados e classificados!`);
  };

  // Criar Ajuste
  const handleCriarAjuste = async (e) => {
    e.preventDefault();
    if (!novoAjuste.descricao || !novoAjuste.valor) {
      alert('Preencha a descrição e o valor do ajuste.');
      return;
    }

    await saveDREAJuste({
      mes_ano: selectedMonth,
      tipo: novoAjuste.tipo,
      descricao: novoAjuste.descricao,
      valor: parseFloat(novoAjuste.valor) || 0,
      categoria_dre: novoAjuste.categoria_dre,
      natureza: novoAjuste.natureza,
      responsavel: novoAjuste.responsavel
    });

    setNovoAjuste({
      tipo: 'depreciacao',
      descricao: '',
      valor: '',
      categoria_dre: 'DESPESA_ADMINISTRATIVA',
      natureza: 'despesa',
      responsavel: 'Administração'
    });
    setShowAdjustModal(false);
    loadData();
  };

  // Deletar Ajuste
  const handleRemoverAjuste = async (id) => {
    if (!window.confirm('Remover este ajuste contábil?')) return;
    await deleteDREAJuste(id);
    loadData();
  };

  // Exportar PDF
  const handleExportPDF = async () => {
    setGeneratingPdf(true);
    try {
      const blob = await pdf(<DREPDF dreData={dreResult} emitidoPor="Administração Kairós" />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DRE_Kairos_${selectedMonth}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao gerar PDF da DRE:', e);
      alert('Erro ao gerar PDF: ' + e.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const isEncerrado = fechamento && fechamento.status === 'encerrado';

  return (
    <div className="dre-container" style={{ paddingBottom: '60px' }}>
      {/* 1. BARRA SUPERIOR DE CONTROLES */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        background: '#111116',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #22222a'
      }}>
        {/* Seletor de Período e Navegação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handlePrevMonth}
            style={{
              background: '#1a1a22',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ◀
          </button>

          <input
            type={viewMode === 'mensal' ? 'month' : 'number'}
            value={viewMode === 'mensal' ? selectedMonth : selectedMonth.substring(0, 4)}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              background: '#0a0a0c',
              color: '#fff',
              border: '1px solid #dc2743',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '1rem',
              fontWeight: 'bold',
              outline: 'none',
              cursor: 'pointer'
            }}
          />

          <button
            onClick={handleNextMonth}
            style={{
              background: '#1a1a22',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ▶
          </button>

          {/* Toggle Mensal / Anual */}
          <div style={{ display: 'flex', background: '#0a0a0c', borderRadius: '8px', padding: '3px', border: '1px solid #2a2a35', marginLeft: '6px' }}>
            <button
              onClick={() => setViewMode('mensal')}
              style={{
                background: viewMode === 'mensal' ? '#dc2743' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode('anual')}
              style={{
                background: viewMode === 'anual' ? '#dc2743' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Anual
            </button>
          </div>

          {/* Badge de Status Oficial */}
          {isEncerrado ? (
            <span style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid #ef4444',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              🔒 MÊS ENCERRADO ({fechamento.encerrado_por})
            </span>
          ) : (
            <span style={{
              background: 'rgba(74, 222, 128, 0.15)',
              color: '#4ade80',
              border: '1px solid #4ade80',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              🟢 EM ABERTO (Apuração em tempo real)
            </span>
          )}
        </div>

        {/* Ações: PDF, Ajustes, Encerramento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowAdjustModal(true)}
            style={{
              background: '#1a1a24',
              color: '#cbd5e1',
              border: '1px solid #3b3b4f',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⚖️ Ajustes Contábeis {ajustes.length > 0 && `(${ajustes.length})`}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={generatingPdf}
            style={{
              background: '#1a1a24',
              color: '#fff',
              border: '1px solid #dc2743',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {generatingPdf ? 'Gerando...' : '📄 Exportar PDF Oficial'}
          </button>

          {isEncerrado ? (
            <button
              onClick={handleReabrirMes}
              style={{
                background: '#2a1a1a',
                color: '#f87171',
                border: '1px solid #ef4444',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔓 Reabrir Mês
            </button>
          ) : (
            <button
              onClick={handleFecharMes}
              style={{
                background: '#dc2743',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔒 Fechar e Congelar Mês
            </button>
          )}
        </div>
      </div>

      {/* 2. ALERTA DE PENDÊNCIAS DE CLASSIFICAÇÃO */}
      {dreResult.pendencias.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.95rem' }}>
              ⚠️ Existem {dreResult.pendencias.length} lançamentos do caixa pendentes de classificação contábil.
            </span>
            <p style={{ color: '#aaa', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
              Para precisão máxima na DRE, revise os lançamentos não identificados.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowClassifyModal(true)}
              style={{
                background: '#f59e0b',
                color: '#000',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Revisar Lançamentos ({dreResult.pendencias.length})
            </button>
            <button
              onClick={handleAprovarSugestoes}
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                border: '1px solid #f59e0b',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Aprovar Sugestões em Lote
            </button>
          </div>
        </div>
      )}

      {/* 3. CARDS DE INDICADORES EXECUTIVOS (KPIs) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '26px'
      }}>
        {/* Receita Líquida */}
        <div style={{
          background: '#111116',
          border: '1px solid #22222c',
          borderRadius: '12px',
          padding: '18px 20px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>
            Receita Operacional Líquida
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#fff', marginTop: '6px' }}>
            {formatCurrency(dreResult.indicadores.receitaLiquida)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Bruta: {formatCurrency(dreResult.indicadores.receitaBruta)}
          </div>
        </div>

        {/* Lucro Bruto & Margem Bruta */}
        <div style={{
          background: '#111116',
          border: '1px solid #22222c',
          borderRadius: '12px',
          padding: '18px 20px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>
            Lucro Bruto (Margem Bruta)
          </span>
          <div style={{
            fontSize: '1.45rem',
            fontWeight: '800',
            color: dreResult.indicadores.lucroBruto >= 0 ? '#f59e0b' : '#ef4444',
            marginTop: '6px'
          }}>
            {formatCurrency(dreResult.indicadores.lucroBruto)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Margem Bruta: {dreResult.indicadores.margemBrutaPercent.toFixed(1)}%
          </div>
        </div>

        {/* Resultado Operacional (EBITDA) */}
        <div style={{
          background: '#111116',
          border: '1px solid #22222c',
          borderRadius: '12px',
          padding: '18px 20px',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>
            Resultado Operacional (EBITDA)
          </span>
          <div style={{
            fontSize: '1.45rem',
            fontWeight: '800',
            color: dreResult.indicadores.resultadoOperacional >= 0 ? '#8b5cf6' : '#ef4444',
            marginTop: '6px'
          }}>
            {formatCurrency(dreResult.indicadores.resultadoOperacional)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Margem Operacional: {dreResult.indicadores.margemOperacionalPercent.toFixed(1)}%
          </div>
        </div>

        {/* Lucro Líquido do Exercício */}
        <div style={{
          background: '#111116',
          border: '1px solid #22222c',
          borderRadius: '12px',
          padding: '18px 20px',
          borderLeft: `4px solid ${dreResult.indicadores.lucroLiquido >= 0 ? '#10b981' : '#dc2626'}`
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>
            Lucro Líquido do Exercício
          </span>
          <div style={{
            fontSize: '1.45rem',
            fontWeight: '800',
            color: dreResult.indicadores.lucroLiquido >= 0 ? '#10b981' : '#ef4444',
            marginTop: '6px'
          }}>
            {formatCurrency(dreResult.indicadores.lucroLiquido)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Margem Líquida: {dreResult.indicadores.margemLiquidaPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 4. TABELA HIERÁRQUICA ESTRUTURADA DA DRE */}
      <div style={{
        background: '#111116',
        borderRadius: '12px',
        border: '1px solid #22222c',
        overflow: 'hidden',
        marginBottom: '26px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 180px',
          padding: '14px 20px',
          background: '#0d0d12',
          borderBottom: '1px solid #22222c',
          color: '#94a3b8',
          fontSize: '0.78rem',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          <div>Estrutura de Resultados (Regime de Competência)</div>
          <div style={{ textAlign: 'right' }}>Análise Vertical</div>
          <div style={{ textAlign: 'right' }}>Valor (R$)</div>
        </div>

        {dreResult.linhasDRE.map((linha) => {
          const isExpanded = !!expandedRows[linha.id];
          const hasSublinhas = linha.sublinhas && linha.sublinhas.length > 0;

          let bg = 'transparent';
          let textColor = '#fff';
          let fontW = 'normal';

          if (linha.tipo === 'header_positivo') {
            bg = '#14141d';
            fontW = 'bold';
          } else if (linha.tipo === 'header_negativo') {
            bg = '#14141d';
            fontW = 'bold';
            textColor = '#fca5a5';
          } else if (linha.tipo === 'subtotal_destaque') {
            bg = '#1a1a24';
            fontW = '800';
            textColor = '#f8fafc';
          } else if (linha.tipo === 'total_positivo') {
            bg = 'rgba(16, 185, 129, 0.12)';
            fontW = '900';
            textColor = '#34d399';
          } else if (linha.tipo === 'total_negativo') {
            bg = 'rgba(239, 68, 68, 0.12)';
            fontW = '900';
            textColor = '#f87171';
          }

          return (
            <React.Fragment key={linha.id}>
              <div
                onClick={() => hasSublinhas && toggleRow(linha.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 180px',
                  padding: '12px 20px',
                  background: bg,
                  borderBottom: '1px solid #1c1c24',
                  alignItems: 'center',
                  cursor: hasSublinhas ? 'pointer' : 'default',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: fontW, color: textColor }}>
                  {hasSublinhas && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b', width: '14px' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  )}
                  <span>{linha.titulo}</span>
                </div>

                <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.82rem' }}>
                  {linha.percentual != null ? `${linha.percentual.toFixed(1)}%` : '-'}
                </div>

                <div style={{ textAlign: 'right', fontWeight: fontW, color: textColor, fontSize: '0.98rem' }}>
                  {formatCurrency(linha.valor)}
                </div>
              </div>

              {/* Sublinhas Expansíveis */}
              {hasSublinhas && isExpanded && (
                <div style={{ background: '#0a0a0e', borderBottom: '1px solid #1c1c24' }}>
                  {linha.sublinhas.map((sub, sIdx) => {
                    const subExpanded = !!expandedRows[`${linha.id}_${sIdx}`];
                    const hasItens = sub.itens && sub.itens.length > 0;

                    return (
                      <div key={sIdx}>
                        <div
                          onClick={() => hasItens && toggleRow(`${linha.id}_${sIdx}`)}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 100px 180px',
                            padding: '10px 20px 10px 42px',
                            borderBottom: '1px dashed #1a1a24',
                            fontSize: '0.85rem',
                            color: '#cbd5e1',
                            cursor: hasItens ? 'pointer' : 'default'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {hasItens && (
                              <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                                {subExpanded ? '▼' : '▶'}
                              </span>
                            )}
                            <span>{sub.nome}</span>
                            {hasItens && (
                              <span style={{
                                background: '#1e1e28',
                                color: '#94a3b8',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {sub.itens.length} {sub.itens.length === 1 ? 'item' : 'itens'}
                              </span>
                            )}
                          </div>

                          <div style={{ textAlign: 'right', color: '#475569', fontSize: '0.8rem' }}>
                            {dreResult.indicadores.receitaLiquida > 0
                              ? `${((sub.valor / dreResult.indicadores.receitaLiquida) * 100).toFixed(1)}%`
                              : '-'}
                          </div>

                          <div style={{ textAlign: 'right', fontWeight: '600', color: '#e2e8f0' }}>
                            {formatCurrency(sub.valor)}
                          </div>
                        </div>

                        {/* Itens detalhados do lançamento */}
                        {hasItens && subExpanded && (
                          <div style={{ background: '#07070a', padding: '10px 20px 10px 60px' }}>
                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                              {sub.itens.map((it, itIdx) => (
                                <div
                                  key={it.id || itIdx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 0',
                                    borderBottom: '1px solid #14141a',
                                    fontSize: '0.78rem',
                                    color: '#94a3b8'
                                  }}
                                >
                                  <div>
                                    <span style={{ color: '#fff', fontWeight: '500' }}>{it.descricao}</span>
                                    <span style={{ color: '#555', marginLeft: '8px' }}>({it.origem})</span>
                                    {it.data && <span style={{ color: '#444', marginLeft: '6px' }}>• {it.data}</span>}
                                  </div>
                                  <div style={{ fontWeight: 'bold', color: '#cbd5e1' }}>
                                    {formatCurrency(it.valor)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 5. BLOCO DOS SÓCIOS & CONCILIAÇÃO CAIXA */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '26px'
      }}>
        {/* Painel dos Sócios */}
        <div style={{
          background: '#111116',
          borderRadius: '12px',
          border: '1px solid #22222c',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👥 Movimentações dos Sócios
          </h3>
          <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 16px 0' }}>
            Pró-labore é despesa operacional. Distribuição de lucros fica abaixo da apuração líquida.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {LISTA_SOCIOS.map((nome) => {
              const data = dreResult.socios[nome] || { proLabore: 0, distribuicao: 0, aporte: 0 };
              return (
                <div
                  key={nome}
                  style={{
                    background: '#16161e',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    border: '1px solid #252532'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{nome}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Total Repassado: {formatCurrency(data.proLabore + data.distribuicao)}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: '#888', display: 'block' }}>Pró-Labore</span>
                      <strong style={{ color: '#e2e8f0' }}>{formatCurrency(data.proLabore)}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#888', display: 'block' }}>Distrib. Lucro</span>
                      <strong style={{ color: '#10b981' }}>{formatCurrency(data.distribuicao)}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#888', display: 'block' }}>Aporte/Empr.</span>
                      <strong style={{ color: '#38bdf8' }}>{formatCurrency(data.aporte)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conciliação DRE x Caixa */}
        <div style={{
          background: '#111116',
          borderRadius: '12px',
          border: '1px solid #22222c',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔄 Conciliação DRE (Econômico) x Fluxo de Caixa (Financeiro)
          </h3>
          <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 16px 0' }}>
            Explicação contábil da diferença entre o Lucro Apurado e a Variação do Caixa.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a24' }}>
              <span style={{ color: '#aaa' }}>Total Entradas no Caixa:</span>
              <strong style={{ color: '#fff' }}>{formatCurrency(dreResult.conciliacao.entradasCaixa)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a24' }}>
              <span style={{ color: '#aaa' }}>Total Saídas no Caixa:</span>
              <strong style={{ color: '#f87171' }}>{formatCurrency(dreResult.conciliacao.saidasCaixa)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a24' }}>
              <span style={{ color: '#aaa' }}>Variação Financeira Líquida do Caixa:</span>
              <strong style={{ color: dreResult.conciliacao.resultadoCaixa >= 0 ? '#10b981' : '#f87171' }}>
                {formatCurrency(dreResult.conciliacao.resultadoCaixa)}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a24' }}>
              <span style={{ color: '#aaa' }}>Lucro Líquido Contábil (DRE):</span>
              <strong style={{ color: dreResult.indicadores.lucroLiquido >= 0 ? '#10b981' : '#f87171' }}>
                {formatCurrency(dreResult.indicadores.lucroLiquido)}
              </strong>
            </div>

            <div style={{
              background: '#16161e',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '6px',
              border: '1px solid #252532'
            }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>
                Diferença Contábil vs Financeiro:
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>
                {formatCurrency(dreResult.conciliacao.diferenca)}
              </span>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Originada por: adiantamentos de clientes, serviços entregues com quitação em mês posterior ou parcelamentos de gastos fixos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MODAL DE REVISÃO E CLASSIFICAÇÃO DE LANÇAMENTOS */}
      {showClassifyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#111116',
            border: '1px solid #2a2a38',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #22222e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem' }}>
                  Classificação Contábil dos Lançamentos
                </h3>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>
                  {selectedMonth} • Vincule despesas e saídas às categorias corretas da DRE
                </span>
              </div>
              <button
                onClick={() => setShowClassifyModal(false)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Lista com scroll */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {dreResult.pendencias.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#4ade80' }}>
                  ✓ Todos os lançamentos deste mês já estão categorizados!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dreResult.pendencias.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: '#16161e',
                        border: '1px solid #252532',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1fr 90px',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block' }}>{item.descricao}</strong>
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          {item.origem} • {item.data}
                        </span>
                      </div>

                      <div style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '0.95rem' }}>
                        {formatCurrency(item.valor)}
                      </div>

                      {/* Dropdown de Categoria */}
                      <div>
                        <select
                          defaultValue={item.categoria_dre !== 'PENDENTE' ? item.categoria_dre : 'DESPESA_ADMINISTRATIVA'}
                          id={`cat_select_${item.id}`}
                          style={{
                            background: '#0a0a0c',
                            color: '#fff',
                            border: '1px solid #3b3b4f',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            width: '100%'
                          }}
                        >
                          {Object.values(CATEGORIAS_DRE).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Botão de Salvar */}
                      <button
                        onClick={() => {
                          const sel = document.getElementById(`cat_select_${item.id}`);
                          if (sel) handleClassificarItem(item, sel.value, item.socio_nome);
                        }}
                        style={{
                          background: '#dc2743',
                          color: '#fff',
                          border: 'none',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Salvar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #22222e',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#0d0d12',
              borderRadius: '0 0 14px 14px'
            }}>
              <button
                onClick={() => setShowClassifyModal(false)}
                style={{
                  background: '#22222e',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL DE AJUSTES CONTÁBEIS AUDITÁVEIS */}
      {showAdjustModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#111116',
            border: '1px solid #2a2a38',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '650px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem' }}>
                Ajustes Contábeis e Rastreabilidade ({selectedMonth})
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Formulário de Novo Ajuste */}
            <form onSubmit={handleCriarAjuste} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Tipo de Ajuste</label>
                  <select
                    value={novoAjuste.tipo}
                    onChange={(e) => setNovoAjuste({ ...novoAjuste, tipo: e.target.value })}
                    style={{ width: '100%', padding: '8px', background: '#0a0a0c', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}
                  >
                    <option value="depreciacao">Depreciação de Equipamentos</option>
                    <option value="variacao_estoque">Variação de Estoque / CMV</option>
                    <option value="ajuste_tributario">Ajuste Tributário (Simples/ISS)</option>
                    <option value="correcao">Correção Contábil</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Categoria DRE</label>
                  <select
                    value={novoAjuste.categoria_dre}
                    onChange={(e) => setNovoAjuste({ ...novoAjuste, categoria_dre: e.target.value })}
                    style={{ width: '100%', padding: '8px', background: '#0a0a0c', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}
                  >
                    {Object.values(CATEGORIAS_DRE).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Descrição do Motivo</label>
                  <input
                    type="text"
                    placeholder="Ex: Depreciação mensal do elevador automotivo"
                    value={novoAjuste.descricao}
                    onChange={(e) => setNovoAjuste({ ...novoAjuste, descricao: e.target.value })}
                    style={{ width: '100%', padding: '8px', background: '#0a0a0c', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={novoAjuste.valor}
                    onChange={(e) => setNovoAjuste({ ...novoAjuste, valor: e.target.value })}
                    style={{ width: '100%', padding: '8px', background: '#0a0a0c', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  background: '#dc2743',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 14px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                + Registrar Ajuste Contábil
              </button>
            </form>

            {/* Lista de Ajustes Já Cadastrados */}
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#cbd5e1' }}>
              Ajustes do Período ({ajustes.length})
            </h4>

            {ajustes.length === 0 ? (
              <p style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Nenhum ajuste registrado para este mês.
              </p>
            ) : (
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ajustes.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: '#16161e',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#fff' }}>{a.descricao}</strong>
                      <span style={{ color: '#64748b', marginLeft: '6px' }}>({a.tipo})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#f87171' }}>{formatCurrency(a.valor)}</span>
                      <button
                        onClick={() => handleRemoverAjuste(a.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DREManager;
