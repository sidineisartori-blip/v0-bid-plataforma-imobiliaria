-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela planos — permite CRUD real de planos no painel admin
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planos (
  id                   text PRIMARY KEY,              -- slug imutável (ex: 'free', 'pro')
  nome                 text NOT NULL,
  valor                numeric NOT NULL DEFAULT 0,
  cor                  text NOT NULL DEFAULT '#9B9690',
  limite_imoveis       integer NOT NULL DEFAULT 5,     -- -1 = ilimitado
  limite_solicitacoes  integer NOT NULL DEFAULT 10,    -- -1 = ilimitado
  ordem                integer NOT NULL DEFAULT 0,
  ativo                boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

-- Leitura pública (necessário para exibir planos/limites no app)
CREATE POLICY "planos_select_all" ON public.planos FOR SELECT
  USING (true);

-- Escrita: apenas service_role (rotas /api/admin/planos usam service role key)
CREATE POLICY "planos_service_all" ON public.planos FOR ALL
  USING (auth.role() = 'service_role');

-- Seed com os planos que já existiam hardcoded no frontend
INSERT INTO public.planos (id, nome, valor, cor, limite_imoveis, limite_solicitacoes, ordem) VALUES
  ('free',       'Free',       0,   '#9B9690', 5,  10, 1),
  ('pro',        'Pro',        97,  '#5C9BE0', 30, 50, 2),
  ('premium',    'Premium',    240, '#C9A84C', -1, -1, 3),
  ('enterprise', 'Enterprise', 720, '#5CB88A', -1, -1, 4)
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT * FROM public.planos ORDER BY ordem;
