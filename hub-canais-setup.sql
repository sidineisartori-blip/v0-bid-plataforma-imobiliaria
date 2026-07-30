-- =====================================================================
-- Hub de Publicação — Persistência de preferências de canais
-- Execute no SQL Editor do Supabase
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.hub_canais (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id uuid        NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  canal_key   text        NOT NULL,
  ativo       boolean     NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (corretor_id, canal_key)
);

-- Index para queries por corretor
CREATE INDEX IF NOT EXISTS idx_hub_canais_corretor
  ON public.hub_canais (corretor_id);

-- RLS
ALTER TABLE public.hub_canais ENABLE ROW LEVEL SECURITY;

-- DROP antes de CREATE: o Postgres nao aceita CREATE POLICY IF NOT EXISTS,
-- entao sem isto o script quebra se rodar uma segunda vez.
DROP POLICY IF EXISTS "corretor_own_hub_canais" ON public.hub_canais;
CREATE POLICY "corretor_own_hub_canais" ON public.hub_canais
  FOR ALL USING (auth.uid() = corretor_id)
  WITH CHECK (auth.uid() = corretor_id);
