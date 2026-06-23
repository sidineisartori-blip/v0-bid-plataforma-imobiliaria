-- ============================================================
-- BID — Cidades e Bairros (lista canônica para o matching)
-- Rodar no SQL Editor do Supabase (projeto BID).
-- Idempotente e MIGRATION-SAFE: funciona se as tabelas não existem E se a
-- tabela `cities` já existe (criada antes sem a coluna `slug`).
-- ============================================================
--
-- O matching compara solicitacoes.cidade vs imoveis.cidade por IGUALDADE EXATA.
-- Grafias divergentes ("Jacarezinho" vs "jacarezinho" vs "Jacarézinho") fazem o
-- match nunca acontecer. A coluna `slug` (sem acento, minúscula, com hífen) + UF
-- bloqueia duplicatas. imoveis.cidade vem do ViaCEP (nome oficial IBGE), por isso
-- as cidades-semente usam a grafia oficial acentuada.

-- ──────────────────────────────────────────
-- 1. cities
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  state       text NOT NULL,
  slug        text,
  active      boolean NOT NULL DEFAULT true,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Se a tabela já existia sem essas colunas, adiciona o que faltar:
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS slug       text;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS state      text;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS active     boolean NOT NULL DEFAULT true;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Backfill do slug das linhas existentes (normalização em SQL puro, sem extensão):
UPDATE public.cities
SET slug = trim(both '-' from regexp_replace(
             translate(lower(name),
               'áàâãäéèêëíìîïóòôõöúùûüçñ',
               'aaaaaeeeeiiiiooooouuuucn'),
             '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- ──────────────────────────────────────────
-- 2. neighborhoods
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id     uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text,
  active      boolean NOT NULL DEFAULT true,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neighborhoods ADD COLUMN IF NOT EXISTS slug       text;
ALTER TABLE public.neighborhoods ADD COLUMN IF NOT EXISTS active     boolean NOT NULL DEFAULT true;
ALTER TABLE public.neighborhoods ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.neighborhoods ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

UPDATE public.neighborhoods
SET slug = trim(both '-' from regexp_replace(
             translate(lower(name),
               'áàâãäéèêëíìîïóòôõöúùûüçñ',
               'aaaaaeeeeiiiiooooouuuucn'),
             '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- ──────────────────────────────────────────
-- 3. Índices de dedup (slug já existe agora). NULLs são distintos no Postgres,
--    então índice único normal não conflita com linhas sem slug/state.
-- ──────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS cities_slug_state_uniq
  ON public.cities (slug, state);
CREATE INDEX IF NOT EXISTS cities_active_name_idx
  ON public.cities (active, name);

CREATE UNIQUE INDEX IF NOT EXISTS neighborhoods_city_slug_uniq
  ON public.neighborhoods (city_id, slug);
CREATE INDEX IF NOT EXISTS neighborhoods_city_active_idx
  ON public.neighborhoods (city_id, active);

-- ──────────────────────────────────────────
-- 4. RLS — leitura pública, escrita só via service_role (rotas /api/localidades)
-- ──────────────────────────────────────────
ALTER TABLE public.cities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cities_select_all" ON public.cities;
CREATE POLICY "cities_select_all" ON public.cities FOR SELECT USING (true);
DROP POLICY IF EXISTS "cities_service_role_all" ON public.cities;
CREATE POLICY "cities_service_role_all" ON public.cities FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "neighborhoods_select_all" ON public.neighborhoods;
CREATE POLICY "neighborhoods_select_all" ON public.neighborhoods FOR SELECT USING (true);
DROP POLICY IF EXISTS "neighborhoods_service_role_all" ON public.neighborhoods;
CREATE POLICY "neighborhoods_service_role_all" ON public.neighborhoods FOR ALL USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────
-- 5. SEED — cidades iniciais (grafia oficial IBGE/ViaCEP)
-- ──────────────────────────────────────────
INSERT INTO public.cities (name, state, slug) VALUES
  ('Jacarezinho',               'PR', 'jacarezinho'),
  ('Ribeirão Claro',            'PR', 'ribeirao-claro'),
  ('Ourinhos',                  'SP', 'ourinhos'),
  ('Cambará',                   'PR', 'cambara'),
  ('Santo Antônio da Platina',  'PR', 'santo-antonio-da-platina')
ON CONFLICT (slug, state) DO NOTHING;

-- Conferência:
-- SELECT name, state, slug, active FROM public.cities ORDER BY name;
