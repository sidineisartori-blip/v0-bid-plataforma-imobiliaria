-- =====================================================================
-- BID Opções Configuráveis — Sistema de dropdowns dinâmicos
-- Execute no SQL Editor do Supabase
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.bid_opcoes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id uuid        REFERENCES public.corretores(id) ON DELETE CASCADE,
  categoria   text        NOT NULL,
  valor       text        NOT NULL,
  label       text        NOT NULL,
  ativo       boolean     NOT NULL DEFAULT true,
  ordem       integer     NOT NULL DEFAULT 999,
  sistema     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Índice parcial: sistema sem duplicar por categoria+valor
CREATE UNIQUE INDEX IF NOT EXISTS bid_opcoes_sistema_uniq
  ON public.bid_opcoes (categoria, valor) WHERE corretor_id IS NULL;

-- Índice parcial: corretor não duplica por categoria+valor
CREATE UNIQUE INDEX IF NOT EXISTS bid_opcoes_corretor_uniq
  ON public.bid_opcoes (corretor_id, categoria, valor) WHERE corretor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bid_opcoes_cat ON public.bid_opcoes (categoria);

-- RLS
ALTER TABLE public.bid_opcoes ENABLE ROW LEVEL SECURITY;

-- DROP antes de cada CREATE: o Postgres nao aceita CREATE POLICY IF NOT
-- EXISTS, entao sem isto o script quebra se rodar uma segunda vez.

-- Leitura: todos podem ler (sistema e as próprias)
DROP POLICY IF EXISTS "read_bid_opcoes" ON public.bid_opcoes;
CREATE POLICY "read_bid_opcoes" ON public.bid_opcoes
  FOR SELECT USING (corretor_id IS NULL OR corretor_id = auth.uid());

-- Escrita: corretor só gerencia as próprias
DROP POLICY IF EXISTS "write_bid_opcoes" ON public.bid_opcoes;
CREATE POLICY "write_bid_opcoes" ON public.bid_opcoes
  FOR INSERT WITH CHECK (corretor_id = auth.uid());

DROP POLICY IF EXISTS "delete_bid_opcoes" ON public.bid_opcoes;
CREATE POLICY "delete_bid_opcoes" ON public.bid_opcoes
  FOR DELETE USING (corretor_id = auth.uid() AND sistema = false);

DROP POLICY IF EXISTS "update_bid_opcoes" ON public.bid_opcoes;
CREATE POLICY "update_bid_opcoes" ON public.bid_opcoes
  FOR UPDATE USING (corretor_id = auth.uid() AND sistema = false);

-- =====================================================================
-- SEED: opções padrão do sistema
-- =====================================================================

INSERT INTO public.bid_opcoes (categoria, valor, label, ordem, sistema) VALUES
  -- Tipo de Imóvel
  ('tipo_imovel', 'Apartamento',        'Apartamento',        1,  true),
  ('tipo_imovel', 'Casa',               'Casa',               2,  true),
  ('tipo_imovel', 'Casa em Condomínio', 'Casa em Condomínio', 3,  true),
  ('tipo_imovel', 'Terreno',            'Terreno',            4,  true),
  ('tipo_imovel', 'Sala Comercial',     'Sala Comercial',     5,  true),
  ('tipo_imovel', 'Loja',               'Loja',               6,  true),
  ('tipo_imovel', 'Galpão',             'Galpão',             7,  true),
  ('tipo_imovel', 'Chácara / Sítio',   'Chácara / Sítio',   8,  true),
  ('tipo_imovel', 'Flat',               'Flat',               9,  true),
  ('tipo_imovel', 'Studio',             'Studio',             10, true),

  -- Tipo de Negócio (Imóvel — o corretor anuncia)
  ('tipo_negocio_imovel', 'Venda',   'Venda',   1, true),
  ('tipo_negocio_imovel', 'Locação', 'Locação', 2, true),

  -- Tipo de Negócio (Busca — o cliente procura)
  ('tipo_negocio_busca', 'Comprar', 'Comprar', 1, true),
  ('tipo_negocio_busca', 'Alugar',  'Alugar',  2, true),

  -- Garantia (contrato de locação)
  ('garantia', 'Caução',                   'Caução',                   1, true),
  ('garantia', 'Fiador',                   'Fiador',                   2, true),
  ('garantia', 'Seguro Fiança',            'Seguro Fiança',            3, true),
  ('garantia', 'Título de Capitalização',  'Título de Capitalização',  4, true),

  -- Índice de Reajuste
  ('indice_reajuste', 'IGPM',   'IGP-M',  1, true),
  ('indice_reajuste', 'IPCA',   'IPCA',   2, true),
  ('indice_reajuste', 'INPC',   'INPC',   3, true),
  ('indice_reajuste', 'IGP-DI', 'IGP-DI', 4, true),

  -- Formas de Pagamento
  ('forma_pagamento', 'À vista',                          'À vista',                          1, true),
  ('forma_pagamento', 'Financiamento bancário',           'Financiamento bancário',           2, true),
  ('forma_pagamento', 'FGTS',                             'FGTS',                             3, true),
  ('forma_pagamento', 'Permuta',                          'Permuta',                          4, true),
  ('forma_pagamento', 'Parcelado direto com proprietário','Parcelado direto com proprietário', 5, true)

ON CONFLICT DO NOTHING;
