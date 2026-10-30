import { supabase } from './supabase';

const LS_CLASSIFICACOES = 'kadosh_dre_classificacoes';
const LS_FECHAMENTOS = 'kadosh_dre_fechamentos';
const LS_AJUSTES = 'kadosh_dre_ajustes';

// Helper de localStorage com try/catch
function getLocalItem(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.warn(`Erro ao ler ${key} local:`, e);
    return defaultValue;
  }
}

function setLocalItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Erro ao salvar ${key} local:`, e);
  }
}

// ==========================================
// 1. CLASSIFICAÇÕES CONTÁBEIS DA DRE
// ==========================================

export async function fetchDREClassificacoes(mesCompetencia) {
  try {
    let query = supabase.from('dre_classificacoes').select('*');
    if (mesCompetencia) {
      query = query.eq('mes_competencia', mesCompetencia);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) {
      // Mesclar no localStorage para manter cache atualizado
      const local = getLocalItem(LS_CLASSIFICACOES, []);
      const map = new Map();
      local.forEach(item => map.set(item.id, item));
      data.forEach(item => map.set(item.id, item));
      setLocalItem(LS_CLASSIFICACOES, Array.from(map.values()));
      return data;
    }
  } catch (err) {
    // Falha silenciosa no Supabase -> fallback seguro no localStorage
  }

  const local = getLocalItem(LS_CLASSIFICACOES, []);
  if (mesCompetencia) {
    return local.filter(c => c.mes_competencia === mesCompetencia);
  }
  return local;
}

export async function saveDREClassificacao(classificacao) {
  const item = {
    ...classificacao,
    updated_at: new Date().toISOString()
  };

  // 1. Atualizar localmente
  const local = getLocalItem(LS_CLASSIFICACOES, []);
  const index = local.findIndex(c => c.id === item.id);
  if (index >= 0) {
    local[index] = item;
  } else {
    local.push(item);
  }
  setLocalItem(LS_CLASSIFICACOES, local);

  // 2. Tentar persistir no Supabase
  try {
    await supabase.from('dre_classificacoes').upsert([item]);
  } catch (e) {
    // Ignora se tabela ainda não criada no SQL
  }

  return item;
}

export async function saveDREClassificacoesBatch(list) {
  if (!list || list.length === 0) return [];

  const local = getLocalItem(LS_CLASSIFICACOES, []);
  const map = new Map();
  local.forEach(i => map.set(i.id, i));
  list.forEach(i => {
    map.set(i.id, { ...i, updated_at: new Date().toISOString() });
  });
  const updatedList = Array.from(map.values());
  setLocalItem(LS_CLASSIFICACOES, updatedList);

  try {
    await supabase.from('dre_classificacoes').upsert(list);
  } catch (e) {
    // Ignora se tabela ainda não criada no SQL
  }

  return list;
}

// ==========================================
// 2. FECHAMENTOS MENSAIS CONGELADOS
// ==========================================

export async function fetchDREFechamento(mesAno) {
  try {
    const { data, error } = await supabase
      .from('dre_fechamentos')
      .select('*')
      .eq('mes_ano', mesAno)
      .maybeSingle();

    if (!error && data) {
      const local = getLocalItem(LS_FECHAMENTOS, {});
      local[mesAno] = data;
      setLocalItem(LS_FECHAMENTOS, local);
      return data;
    }
  } catch (e) {
    // Fallback
  }

  const local = getLocalItem(LS_FECHAMENTOS, {});
  return local[mesAno] || null;
}

export async function saveDREFechamento(mesAno, dadosDre, encerradoPor, observacoes = '') {
  const payload = {
    mes_ano: mesAno,
    status: 'encerrado',
    dados_dre: dadosDre,
    encerrado_por: encerradoPor || 'Administração Kairós',
    data_encerramento: new Date().toISOString(),
    observacoes,
    updated_at: new Date().toISOString()
  };

  const local = getLocalItem(LS_FECHAMENTOS, {});
  local[mesAno] = payload;
  setLocalItem(LS_FECHAMENTOS, local);

  try {
    await supabase.from('dre_fechamentos').upsert([payload]);
  } catch (e) {}

  return payload;
}

export async function reabrirDREFechamento(mesAno) {
  const local = getLocalItem(LS_FECHAMENTOS, {});
  if (local[mesAno]) {
    local[mesAno].status = 'aberto';
    local[mesAno].reaberto_em = new Date().toISOString();
    setLocalItem(LS_FECHAMENTOS, local);
  }

  try {
    await supabase
      .from('dre_fechamentos')
      .update({ status: 'aberto', updated_at: new Date().toISOString() })
      .eq('mes_ano', mesAno);
  } catch (e) {}

  return true;
}

// ==========================================
// 3. AJUSTES CONTÁBEIS
// ==========================================

export async function fetchDREAJustes(mesAno) {
  try {
    const { data, error } = await supabase
      .from('dre_ajustes')
      .select('*')
      .eq('mes_ano', mesAno)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const local = getLocalItem(LS_AJUSTES, []);
      const outros = local.filter(a => a.mes_ano !== mesAno);
      setLocalItem(LS_AJUSTES, [...outros, ...data]);
      return data;
    }
  } catch (e) {}

  const local = getLocalItem(LS_AJUSTES, []);
  return local.filter(a => a.mes_ano === mesAno);
}

export async function saveDREAJuste(ajuste) {
  const item = {
    id: ajuste.id || `ajuste_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...ajuste,
    created_at: ajuste.created_at || new Date().toISOString()
  };

  const local = getLocalItem(LS_AJUSTES, []);
  local.push(item);
  setLocalItem(LS_AJUSTES, local);

  try {
    await supabase.from('dre_ajustes').insert([item]);
  } catch (e) {}

  return item;
}

export async function deleteDREAJuste(id) {
  const local = getLocalItem(LS_AJUSTES, []);
  setLocalItem(LS_AJUSTES, local.filter(a => a.id !== id));

  try {
    await supabase.from('dre_ajustes').delete().eq('id', id);
  } catch (e) {}

  return true;
}
