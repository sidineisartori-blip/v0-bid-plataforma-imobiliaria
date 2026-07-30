-- =====================================================================
-- BID ERP · Fase 02 — Motor financeiro
-- Execute no SQL Editor do Supabase. Re-executavel com seguranca.
-- =====================================================================
-- O que entra aqui:
--   1. contrato_encargos   — composicao da cobranca (aluguel + condominio + IPTU...)
--   2. contrato_parcelas   — colunas de amortizacao, juros, multa e saldo devedor
--   3. parcela_itens       — quebra do que compoe cada parcela
--   4. venda_planos        — plano de venda parcelada (Price / SAC / sem juros)
--   5. indices_economicos  — IGP-M, IPCA, INPC vindos da API do Banco Central
--   6. contrato_reajustes  — historico de reajuste aplicado
--   7. lancamentos         — livro-razao unico de tudo que entra e sai
-- =====================================================================


-- ── 1. Composicao da cobranca ────────────────────────────────────────
-- Hoje o aluguel e um numero so em contratos.valor_aluguel. Condominio,
-- IPTU e seguro ficam embutidos, o que impede cobrar, reajustar e prestar
-- contas de cada um separadamente.
CREATE TABLE IF NOT EXISTS public.contrato_encargos (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid          NOT NULL REFERENCES public.contratos(id)  ON DELETE CASCADE,
  corretor_id uuid          NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  tipo        text          NOT NULL DEFAULT 'outro'
    CHECK (tipo IN ('aluguel','condominio','iptu','seguro_incendio','taxa_admin','outro')),
  descricao   text,
  valor       numeric(14,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  -- Taxa de administracao costuma ser % do aluguel, nao valor fixo.
  percentual  numeric(9,4),
  -- IPTU nao reajusta pelo indice do contrato; aluguel sim.
  reajustavel boolean       NOT NULL DEFAULT true,
  ativo       boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contrato_encargos_contrato
  ON public.contrato_encargos (contrato_id) WHERE ativo;


-- ── 2. Parcelas: amortizacao, encargos e saldo ───────────────────────
ALTER TABLE public.contrato_parcelas
  ADD COLUMN IF NOT EXISTS numero_parcela  integer,
  ADD COLUMN IF NOT EXISTS total_parcelas  integer,
  ADD COLUMN IF NOT EXISTS tipo            text NOT NULL DEFAULT 'aluguel',
  ADD COLUMN IF NOT EXISTS valor_principal numeric(14,2),
  ADD COLUMN IF NOT EXISTS valor_juros     numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_multa     numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_desconto  numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_pago      numeric(14,2),
  ADD COLUMN IF NOT EXISTS saldo_devedor   numeric(14,2);

-- CHECK adicionado a parte: ADD COLUMN IF NOT EXISTS nao aceita CHECK
-- inline de forma idempotente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contrato_parcelas_tipo_check'
  ) THEN
    ALTER TABLE public.contrato_parcelas
      ADD CONSTRAINT contrato_parcelas_tipo_check
      CHECK (tipo IN ('aluguel','venda_parcela','entrada','balao'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_parcelas_contrato_num
  ON public.contrato_parcelas (contrato_id, numero_parcela);


-- ── 3. Quebra da parcela ─────────────────────────────────────────────
-- Permite o inquilino ver "aluguel 1.800 + condominio 420 + IPTU 90"
-- em vez de um total opaco de 2.310.
CREATE TABLE IF NOT EXISTS public.parcela_itens (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id uuid          NOT NULL REFERENCES public.contrato_parcelas(id) ON DELETE CASCADE,
  tipo       text          NOT NULL DEFAULT 'outro',
  descricao  text          NOT NULL,
  valor      numeric(14,2) NOT NULL,
  created_at timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcela_itens_parcela
  ON public.parcela_itens (parcela_id);


-- ── 4. Plano de venda parcelada ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.venda_planos (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id           uuid          NOT NULL UNIQUE REFERENCES public.contratos(id)  ON DELETE CASCADE,
  corretor_id           uuid          NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  sistema               text          NOT NULL DEFAULT 'price'
    CHECK (sistema IN ('price','sac','sem_juros')),
  valor_total           numeric(14,2) NOT NULL CHECK (valor_total > 0),
  valor_entrada         numeric(14,2) NOT NULL DEFAULT 0 CHECK (valor_entrada >= 0),
  num_parcelas          integer       NOT NULL CHECK (num_parcelas BETWEEN 1 AND 600),
  -- Taxa mensal em fracao decimal: 0.01 = 1% a.m.
  taxa_juros_mensal     numeric(9,6)  NOT NULL DEFAULT 0 CHECK (taxa_juros_mensal >= 0),
  indice_correcao       text,
  data_primeira_parcela date          NOT NULL,
  dia_vencimento        integer       CHECK (dia_vencimento BETWEEN 1 AND 31),
  observacoes           text,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),
  CHECK (valor_entrada < valor_total)
);


-- ── 5. Indices economicos ────────────────────────────────────────────
-- Alimentada mensalmente pelo cron /api/cron/indices, que le a API
-- publica do Banco Central (series SGS). percentual e a variacao do mes.
CREATE TABLE IF NOT EXISTS public.indices_economicos (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  indice      text          NOT NULL,
  competencia date          NOT NULL,
  percentual  numeric(10,6) NOT NULL,
  fonte       text          NOT NULL DEFAULT 'bcb',
  created_at  timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (indice, competencia)
);

CREATE INDEX IF NOT EXISTS idx_indices_lookup
  ON public.indices_economicos (indice, competencia DESC);


-- ── 6. Historico de reajuste ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contrato_reajustes (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id    uuid          NOT NULL REFERENCES public.contratos(id)  ON DELETE CASCADE,
  corretor_id    uuid          NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  competencia    date          NOT NULL,
  indice         text          NOT NULL,
  percentual     numeric(10,6) NOT NULL,
  valor_anterior numeric(14,2) NOT NULL,
  valor_novo     numeric(14,2) NOT NULL,
  aplicado_em    timestamptz,
  -- Lei 8.245/91 exige aviso previo; a Fase 08 dispara e carimba aqui.
  notificado_em  timestamptz,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (contrato_id, competencia)
);


-- ── 7. Livro-razao ───────────────────────────────────────────────────
-- Todo dinheiro que entra ou sai vira um lancamento com origem rastreavel.
-- Extrato, resultado por imovel, informe de IR e DIMOB passam a ser
-- consulta sobre esta tabela, em vez de concatenacao feita na tela.
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id   uuid          NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  contrato_id   uuid          REFERENCES public.contratos(id) ON DELETE SET NULL,
  imovel_id     uuid          REFERENCES public.imoveis(id)   ON DELETE SET NULL,
  data          date          NOT NULL,
  tipo          text          NOT NULL CHECK (tipo IN ('entrada','saida')),
  categoria     text          NOT NULL,
  descricao     text          NOT NULL,
  valor         numeric(14,2) NOT NULL CHECK (valor >= 0),
  origem_tabela text,
  origem_id     uuid,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- Idempotencia: um webhook que dispara duas vezes nao pode dobrar a receita.
CREATE UNIQUE INDEX IF NOT EXISTS lancamentos_origem_uniq
  ON public.lancamentos (origem_tabela, origem_id)
  WHERE origem_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lancamentos_corretor_data
  ON public.lancamentos (corretor_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contrato
  ON public.lancamentos (contrato_id);


-- ═════════════════════════════════════════════════════════════════════
-- RLS — o corretor so enxerga o que e dele.
-- indices_economicos e a excecao: dado publico do Banco Central, leitura
-- liberada para qualquer autenticado; escrita so pela serice role do cron.
-- ═════════════════════════════════════════════════════════════════════

ALTER TABLE public.contrato_encargos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcela_itens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_planos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indices_economicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_reajustes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_contrato_encargos" ON public.contrato_encargos;
CREATE POLICY "own_contrato_encargos" ON public.contrato_encargos
  FOR ALL USING (corretor_id = auth.uid()) WITH CHECK (corretor_id = auth.uid());

DROP POLICY IF EXISTS "own_venda_planos" ON public.venda_planos;
CREATE POLICY "own_venda_planos" ON public.venda_planos
  FOR ALL USING (corretor_id = auth.uid()) WITH CHECK (corretor_id = auth.uid());

DROP POLICY IF EXISTS "own_contrato_reajustes" ON public.contrato_reajustes;
CREATE POLICY "own_contrato_reajustes" ON public.contrato_reajustes
  FOR ALL USING (corretor_id = auth.uid()) WITH CHECK (corretor_id = auth.uid());

DROP POLICY IF EXISTS "own_lancamentos" ON public.lancamentos;
CREATE POLICY "own_lancamentos" ON public.lancamentos
  FOR ALL USING (corretor_id = auth.uid()) WITH CHECK (corretor_id = auth.uid());

-- parcela_itens nao tem corretor_id: a dona e a parcela. O acesso e
-- resolvido pelo vinculo, senao qualquer um leria item de parcela alheia.
DROP POLICY IF EXISTS "own_parcela_itens" ON public.parcela_itens;
CREATE POLICY "own_parcela_itens" ON public.parcela_itens
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.contrato_parcelas p
    WHERE p.id = parcela_itens.parcela_id AND p.corretor_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contrato_parcelas p
    WHERE p.id = parcela_itens.parcela_id AND p.corretor_id = auth.uid()
  ));

DROP POLICY IF EXISTS "read_indices" ON public.indices_economicos;
CREATE POLICY "read_indices" ON public.indices_economicos
  FOR SELECT USING (auth.role() = 'authenticated');


-- ═════════════════════════════════════════════════════════════════════
-- Backfill: contratos de locacao ativos que ainda nao tem composicao
-- ganham o aluguel como encargo, para o motor ter de onde partir.
-- ═════════════════════════════════════════════════════════════════════
INSERT INTO public.contrato_encargos (contrato_id, corretor_id, tipo, descricao, valor, reajustavel)
SELECT c.id, c.corretor_id, 'aluguel', 'Aluguel', c.valor_aluguel, true
FROM public.contratos c
WHERE c.tipo = 'locacao'
  AND c.valor_aluguel IS NOT NULL
  AND c.valor_aluguel > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.contrato_encargos e
    WHERE e.contrato_id = c.id AND e.tipo = 'aluguel'
  );
