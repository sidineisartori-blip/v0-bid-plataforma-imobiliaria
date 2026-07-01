-- =====================================================================
-- MercadoPago Subscriptions + CRM Leads Kanban — BID Setup
-- Execute no SQL Editor do Supabase
-- =====================================================================

-- === 1. MERCADOPAGO: campos na tabela assinaturas ===

ALTER TABLE public.assinaturas
  ADD COLUMN IF NOT EXISTS mp_subscription_id  text,
  ADD COLUMN IF NOT EXISTS mp_status           text,
  ADD COLUMN IF NOT EXISTS mp_checkout_url     text,
  ADD COLUMN IF NOT EXISTS valor               numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS periodo_inicio      date,
  ADD COLUMN IF NOT EXISTS periodo_fim         date;

-- === 2. CRM KANBAN: coluna de pipeline nos leads (solicitacoes) ===

ALTER TABLE public.solicitacoes
  ADD COLUMN IF NOT EXISTS kanban_coluna text NOT NULL DEFAULT 'novo';

CREATE INDEX IF NOT EXISTS idx_solicitacoes_kanban
  ON public.solicitacoes (corretor_id, kanban_coluna);

-- === 3. Verifica se RLS existente já cobre UPDATE em solicitacoes ===
-- Se não houver policy de UPDATE, rodar:
-- CREATE POLICY "corretor_update_own_sol" ON public.solicitacoes
--   FOR UPDATE USING (auth.uid() = corretor_id) WITH CHECK (auth.uid() = corretor_id);
