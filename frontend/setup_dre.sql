-- ==============================================================================
-- SCRIPT DE CRIAÇÃO E CONFIGURAÇÃO DO MÓDULO DE DRE — KAIRÓS CENTRO AUTOMOTIVO
-- ==============================================================================
-- Instruções:
-- 1. Acesse o Supabase (https://supabase.com/dashboard)
-- 2. Selecione seu projeto Kairós / Kadosh
-- 3. Abra o menu "SQL Editor" na barra lateral esquerda
-- 4. Cole todo este código e clique em "RUN"
-- ==============================================================================

-- 1. Adicionar colunas complementares seguras na tabela de Orçamentos (se não existirem)
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS data_conclusao DATE,
  ADD COLUMN IF NOT EXISTS custo_pecas NUMERIC DEFAULT 0;

-- 2. Adicionar colunas complementares seguras na tabela de Gastos Fixos (se não existirem)
ALTER TABLE public.gastos_fixos
  ADD COLUMN IF NOT EXISTS mes_competencia TEXT,
  ADD COLUMN IF NOT EXISTS dre_categoria TEXT;

-- 3. Tabela de Classificações Contábeis da DRE (Satélite aos lançamentos)
CREATE TABLE IF NOT EXISTS public.dre_classificacoes (
  id TEXT PRIMARY KEY,
  origem_tipo TEXT NOT NULL, -- 'fluxo_caixa_saida', 'fluxo_caixa_entrada', 'gasto_fixo', 'orcamento', 'manual'
  origem_id TEXT NOT NULL,
  origem_ref TEXT,
  item_index INTEGER DEFAULT 0,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  categoria_dre TEXT NOT NULL,
  subcategoria_dre TEXT,
  socio_nome TEXT, -- 'Rafael', 'Thaís', 'Ákysa' ou NULL
  mes_competencia TEXT NOT NULL, -- 'YYYY-MM'
  status TEXT NOT NULL DEFAULT 'classificado', -- 'classificado', 'pendente'
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dre_class_mes_competencia ON public.dre_classificacoes(mes_competencia);
CREATE INDEX IF NOT EXISTS idx_dre_class_categoria ON public.dre_classificacoes(categoria_dre);
CREATE INDEX IF NOT EXISTS idx_dre_class_status ON public.dre_classificacoes(status);

ALTER TABLE public.dre_classificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo em dre_classificacoes" ON public.dre_classificacoes;
CREATE POLICY "Permitir tudo em dre_classificacoes" ON public.dre_classificacoes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Tabela de Fechamentos Mensais Congelados (Auditabilidade)
CREATE TABLE IF NOT EXISTS public.dre_fechamentos (
  mes_ano TEXT PRIMARY KEY, -- 'YYYY-MM'
  status TEXT NOT NULL DEFAULT 'aberto', -- 'aberto', 'encerrado'
  dados_dre JSONB NOT NULL DEFAULT '{}'::jsonb,
  encerrado_por TEXT,
  data_encerramento TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.dre_fechamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo em dre_fechamentos" ON public.dre_fechamentos;
CREATE POLICY "Permitir tudo em dre_fechamentos" ON public.dre_fechamentos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Tabela de Ajustes Contábeis e Rastreabilidade
CREATE TABLE IF NOT EXISTS public.dre_ajustes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes_ano TEXT NOT NULL, -- 'YYYY-MM'
  tipo TEXT NOT NULL, -- 'depreciacao', 'variacao_estoque', 'ajuste_tributario', 'correcao', 'outros'
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  natureza TEXT NOT NULL, -- 'receita', 'custo', 'despesa'
  categoria_dre TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dre_ajustes_mes_ano ON public.dre_ajustes(mes_ano);

ALTER TABLE public.dre_ajustes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo em dre_ajustes" ON public.dre_ajustes;
CREATE POLICY "Permitir tudo em dre_ajustes" ON public.dre_ajustes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Adicionar à Publicação Realtime do Supabase
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dre_classificacoes;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dre_fechamentos;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dre_ajustes;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
