-- ─────────────────────────────────────────────────────────────────────────────
-- MELHORIAS BID — execute no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Campo status_financeiro em corretores
ALTER TABLE public.corretores
  ADD COLUMN IF NOT EXISTS status_financeiro text NOT NULL DEFAULT 'normal'
    CHECK (status_financeiro IN ('normal', 'inadimplente', 'suspenso'));

-- 2. Tabela pagamentos (controle de mensalidades)
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id       uuid        NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  plano             text        NOT NULL,
  valor             numeric     NOT NULL DEFAULT 0,
  mes_referencia    text        NOT NULL,  -- formato: 'YYYY-MM'
  data_vencimento   date        NOT NULL,
  data_pagamento    date,
  status            text        NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'pago', 'atrasado', 'isento')),
  forma_pagamento   text        CHECK (forma_pagamento IN ('pix', 'ted', 'boleto', 'outro')),
  comprovante_url   text,
  observacao        text,
  registrado_por    text,       -- admin email/id
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (corretor_id, mes_referencia)
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Apenas service_role (admin) lê/escreve
CREATE POLICY "pagamentos_service_all" ON public.pagamentos
  FOR ALL USING (auth.role() = 'service_role');

-- Corretor pode ver apenas os próprios pagamentos
CREATE POLICY "pagamentos_corretor_select" ON public.pagamentos
  FOR SELECT USING (auth.uid() = corretor_id);

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_corretor_mes
  ON public.pagamentos(corretor_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status
  ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_vencimento
  ON public.pagamentos(data_vencimento);

-- 5. Campos de redes sociais no perfil do corretor
ALTER TABLE public.corretores
  ADD COLUMN IF NOT EXISTS instagram  text,
  ADD COLUMN IF NOT EXISTS linkedin   text,
  ADD COLUMN IF NOT EXISTS facebook   text,
  ADD COLUMN IF NOT EXISTS bio        text;  -- se ainda não existir

-- 4. Verificar
SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'corretores'
    AND column_name = 'status_financeiro';

SELECT * FROM public.pagamentos LIMIT 1;
