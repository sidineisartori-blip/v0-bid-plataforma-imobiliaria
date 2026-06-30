-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 1a — Tabela solicitacao_eventos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.solicitacao_eventos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  corretor_id    uuid,                         -- autor; null = sistema (cron)
  tipo           text NOT NULL,                -- contato | imovel_enviado | mensagem_auto | status | nota
  canal          text,                         -- whatsapp | email | app | null
  sucesso        boolean,                      -- p/ mensagem_auto: resultado REAL do envio
  imovel_id      uuid,                         -- p/ imovel_enviado
  detalhe        text,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sol_eventos_sol_idx  ON public.solicitacao_eventos (solicitacao_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sol_eventos_tipo_idx ON public.solicitacao_eventos (tipo);

ALTER TABLE public.solicitacao_eventos ENABLE ROW LEVEL SECURITY;

-- Leitura: corretor dono da solicitação (via JWT auth.uid())
CREATE POLICY "sol_eventos_select_own" ON public.solicitacao_eventos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.solicitacoes s
    WHERE s.id = solicitacao_id AND s.corretor_id = auth.uid()
  ));

-- Escrita: apenas service_role (cron e API routes usam service role key)
CREATE POLICY "sol_eventos_service_all" ON public.solicitacao_eventos FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 1b — Campos derivados em solicitacoes
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS ultimo_contato_em       timestamptz;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS qtd_imoveis_enviados    integer NOT NULL DEFAULT 0;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS ultimo_followup_status  text;  -- enviado | falhou | agendado
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS ultimo_followup_em      timestamptz;

-- Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'solicitacoes'
  AND column_name IN ('ultimo_contato_em','qtd_imoveis_enviados','ultimo_followup_status','ultimo_followup_em')
ORDER BY column_name;

SELECT COUNT(*) AS total_eventos FROM public.solicitacao_eventos;
