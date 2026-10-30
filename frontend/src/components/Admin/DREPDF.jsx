import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { OFICINA } from '../../config/oficina';

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#dc2743',
    paddingBottom: 10,
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopInfo: {
    width: '60%',
  },
  shopName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#dc2743',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  shopSub: {
    fontSize: 7.5,
    color: '#475569',
    lineHeight: 1.3,
  },
  docTitleContainer: {
    width: '40%',
    textAlign: 'right',
  },
  docTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  docSubtitle: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 2,
  },
  metaSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  metaLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 8.5,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  kpiRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    textAlign: 'center',
  },
  kpiLabel: {
    fontSize: 6.5,
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontWeight: 'bold',
    fontSize: 8,
  },
  rowHeaderPos: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  rowHeaderNeg: {
    flexDirection: 'row',
    backgroundColor: '#fff1f2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#fecdd3',
  },
  rowSubtotal: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  rowTotalPos: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: '#10b981',
  },
  rowTotalNeg: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: '#ef4444',
  },
  rowSubItem: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 8,
    paddingLeft: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  colDesc: {
    flex: 3.5,
    fontSize: 8,
  },
  colPerc: {
    flex: 1,
    textAlign: 'right',
    fontSize: 7.5,
    color: '#64748b',
  },
  colValor: {
    flex: 1.5,
    textAlign: 'right',
    fontSize: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2,
  },
  sociosContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  socioCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  socioName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  socioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    marginBottom: 2,
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  signatureBox: {
    width: '22%',
    borderTopWidth: 1,
    borderTopColor: '#64748b',
    paddingTop: 4,
    textAlign: 'center',
  },
  signatureText: {
    fontSize: 7,
    color: '#475569',
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94a3b8',
  }
});

const formatCurrency = (val) => {
  return (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const DREPDF = ({ dreData, emitidoPor = 'Gestão Kairós' }) => {
  if (!dreData) return null;

  const { periodo, indicadores, linhasDRE, socios, conciliacao } = dreData;
  const isLucroPositivo = indicadores.lucroLiquido >= 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{OFICINA.nome}</Text>
            <Text style={styles.shopSub}>CNPJ: {OFICINA.cnpj || 'Sob consulta'} • Tel: {OFICINA.telefone}</Text>
            <Text style={styles.shopSub}>{OFICINA.endereco}</Text>
          </View>
          <View style={styles.docTitleContainer}>
            <Text style={styles.docTitle}>Demonstração do Resultado (DRE)</Text>
            <Text style={styles.docSubtitle}>Regime de Competência • Exercício {periodo}</Text>
          </View>
        </View>

        {/* Metadados */}
        <View style={styles.metaSection}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Período de Competência</Text>
            <Text style={styles.metaValue}>{periodo}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Data de Emissão</Text>
            <Text style={styles.metaValue}>{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Responsável Emissor</Text>
            <Text style={styles.metaValue}>{emitidoPor}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Critério de Reconhecimento</Text>
            <Text style={styles.metaValue}>Serviços Executados (Competência)</Text>
          </View>
        </View>

        {/* Indicadores Chave (KPIs) */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Receita Líquida</Text>
            <Text style={styles.kpiValue}>{formatCurrency(indicadores.receitaLiquida)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Margem Bruta</Text>
            <Text style={styles.kpiValue}>{indicadores.margemBrutaPercent.toFixed(1)}%</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Resultado Operacional (EBITDA)</Text>
            <Text style={styles.kpiValue}>{formatCurrency(indicadores.resultadoOperacional)}</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: isLucroPositivo ? '#10b981' : '#ef4444' }]}>
            <Text style={styles.kpiLabel}>Lucro Líquido</Text>
            <Text style={[styles.kpiValue, { color: isLucroPositivo ? '#059669' : '#dc2626' }]}>
              {formatCurrency(indicadores.lucroLiquido)}
            </Text>
          </View>
        </View>

        {/* Tabela Estruturada da DRE */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Estrutura de Resultados (Contábil / Gerencial)</Text>
            <Text style={styles.colPerc}>AV %</Text>
            <Text style={styles.colValor}>Valor (R$)</Text>
          </View>

          {linhasDRE.map((linha) => {
            let rowStyle = styles.rowHeaderPos;
            let valStyle = { fontWeight: 'bold' };

            if (linha.tipo === 'header_negativo') {
              rowStyle = styles.rowHeaderNeg;
              valStyle = { fontWeight: 'bold', color: '#b91c1c' };
            } else if (linha.tipo === 'subtotal_destaque') {
              rowStyle = styles.rowSubtotal;
              valStyle = { fontWeight: 'bold', color: '#0f172a' };
            } else if (linha.tipo === 'total_positivo') {
              rowStyle = styles.rowTotalPos;
              valStyle = { fontWeight: 'bold', fontSize: 9.5, color: '#047857' };
            } else if (linha.tipo === 'total_negativo') {
              rowStyle = styles.rowTotalNeg;
              valStyle = { fontWeight: 'bold', fontSize: 9.5, color: '#b91c1c' };
            }

            return (
              <React.Fragment key={linha.id}>
                <View style={rowStyle}>
                  <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>{linha.titulo}</Text>
                  <Text style={styles.colPerc}>{linha.percentual != null ? `${linha.percentual.toFixed(1)}%` : '-'}</Text>
                  <Text style={[styles.colValor, valStyle]}>{formatCurrency(linha.valor)}</Text>
                </View>

                {linha.sublinhas && linha.sublinhas.map((sub, sIdx) => (
                  <View style={styles.rowSubItem} key={sIdx}>
                    <Text style={[styles.colDesc, { color: '#334155' }]}>• {sub.nome}</Text>
                    <Text style={styles.colPerc}>
                      {indicadores.receitaLiquida > 0 ? `${((sub.valor / indicadores.receitaLiquida) * 100).toFixed(1)}%` : '-'}
                    </Text>
                    <Text style={[styles.colValor, { color: '#334155' }]}>{formatCurrency(sub.valor)}</Text>
                  </View>
                ))}
              </React.Fragment>
            );
          })}
        </View>

        {/* Seção dos Sócios */}
        <Text style={styles.sectionTitle}>Movimentações dos Sócios no Período</Text>
        <View style={styles.sociosContainer}>
          {['Rafael', 'Thaís', 'Ákysa'].map((nome) => {
            const data = socios[nome] || { proLabore: 0, distribuicao: 0, aporte: 0 };
            return (
              <View style={styles.socioCard} key={nome}>
                <Text style={styles.socioName}>{nome}</Text>
                <View style={styles.socioRow}>
                  <Text style={{ color: '#64748b' }}>Pró-Labore (Despesa):</Text>
                  <Text style={{ fontWeight: 'bold' }}>{formatCurrency(data.proLabore)}</Text>
                </View>
                <View style={styles.socioRow}>
                  <Text style={{ color: '#64748b' }}>Distribuição de Lucro:</Text>
                  <Text style={{ fontWeight: 'bold', color: '#059669' }}>{formatCurrency(data.distribuicao)}</Text>
                </View>
                <View style={styles.socioRow}>
                  <Text style={{ color: '#64748b' }}>Aportes / Empréstimos:</Text>
                  <Text style={{ fontWeight: 'bold' }}>{formatCurrency(data.aporte)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Conciliação DRE x Fluxo de Caixa */}
        <View style={[styles.metaSection, { marginBottom: 14 }]}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Total Entradas Caixa</Text>
            <Text style={styles.metaValue}>{formatCurrency(conciliacao.entradasCaixa)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Total Saídas Caixa</Text>
            <Text style={styles.metaValue}>{formatCurrency(conciliacao.saidasCaixa)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Saldo Financeiro Caixa</Text>
            <Text style={[styles.metaValue, { color: conciliacao.resultadoCaixa >= 0 ? '#059669' : '#dc2626' }]}>
              {formatCurrency(conciliacao.resultadoCaixa)}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Diferença (DRE x Caixa)</Text>
            <Text style={styles.metaValue}>{formatCurrency(conciliacao.diferenca)}</Text>
          </View>
        </View>

        {/* Bloco de Assinaturas */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Rafael E. dos Santos Taveira</Text>
            <Text style={[styles.signatureText, { fontSize: 6 }]}>Sócio Administrador</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Thaís C. Bariani Taveira</Text>
            <Text style={[styles.signatureText, { fontSize: 6 }]}>Sócia Administradora</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Ákysa</Text>
            <Text style={[styles.signatureText, { fontSize: 6 }]}>Sócia</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Contabilidade Kairós</Text>
            <Text style={[styles.signatureText, { fontSize: 6 }]}>Responsável Técnico</Text>
          </View>
        </View>

        {/* Rodapé Obrigatório */}
        <View style={styles.footer}>
          <Text>© {new Date().getFullYear()} {OFICINA.nome} — Demonstrativo Contábil Oficial</Text>
          <Text>Developed by: Athena Growth Marketing</Text>
        </View>
      </Page>
    </Document>
  );
};
