-- ─────────────────────────────────────────────────────────────────────────────
-- VISTORIA & CHAMADOS — execute no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Campos do proprietário no contrato + token portal do inquilino
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS portal_token      uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS proprietario_nome  text,
  ADD COLUMN IF NOT EXISTS proprietario_email text,
  ADD COLUMN IF NOT EXISTS proprietario_phone text;

-- Preencher token para contratos existentes que ainda não têm
UPDATE public.contratos SET portal_token = gen_random_uuid() WHERE portal_token IS NULL;

-- 2. Tabela de chamados de serviço
CREATE TABLE IF NOT EXISTS public.chamados (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id              uuid        NOT NULL REFERENCES public.contratos(id)  ON DELETE CASCADE,
  corretor_id              uuid        NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  titulo                   text        NOT NULL,
  descricao                text        NOT NULL,
  categoria                text        NOT NULL DEFAULT 'outro'
    CHECK (categoria IN ('hidraulica','eletrica','estrutural','pintura','limpeza','outro')),
  urgencia                 text        NOT NULL DEFAULT 'media'
    CHECK (urgencia IN ('baixa','media','alta','urgente')),
  status                   text        NOT NULL DEFAULT 'aberto'
    CHECK (status IN ('aberto','aprovado_corretor','aprovado_proprietario','em_execucao','concluido','recusado')),
  aberto_por               text        NOT NULL DEFAULT 'corretor'
    CHECK (aberto_por IN ('corretor','inquilino')),
  aberto_por_nome          text,
  midia_urls               text[]      DEFAULT '{}',
  proprietario_token       uuid        DEFAULT gen_random_uuid(),
  comentario_recusa        text,
  aprovado_corretor_em     timestamptz,
  aprovado_proprietario_em timestamptz,
  concluido_em             timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- 3. Histórico / timeline de chamados
CREATE TABLE IF NOT EXISTS public.chamado_historico (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id      uuid        NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo     text        NOT NULL,
  comentario      text,
  autor           text        NOT NULL DEFAULT 'sistema'
    CHECK (autor IN ('corretor','inquilino','proprietario','sistema')),
  autor_nome      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 4. Vistorias (entrada e saída)
CREATE TABLE IF NOT EXISTS public.vistorias (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id               uuid        NOT NULL REFERENCES public.contratos(id)  ON DELETE CASCADE,
  corretor_id               uuid        NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  tipo                      text        NOT NULL CHECK (tipo IN ('entrada','saida')),
  status                    text        NOT NULL DEFAULT 'em_preenchimento'
    CHECK (status IN ('em_preenchimento','finalizada')),
  data_vistoria             date,
  observacoes_gerais        text,
  assinado_por_corretor_em  timestamptz,
  assinado_por_inquilino_em timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- 5. Itens do checklist da vistoria
CREATE TABLE IF NOT EXISTS public.vistoria_itens (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vistoria_id  uuid        NOT NULL REFERENCES public.vistorias(id) ON DELETE CASCADE,
  ambiente     text        NOT NULL,
  item         text        NOT NULL,
  estado       text        NOT NULL DEFAULT 'bom'
    CHECK (estado IN ('otimo','bom','regular','ruim','danificado','nao_aplicavel')),
  observacao   text,
  foto_urls    text[]      DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 6. RLS — chamados
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chamados_corretor_all" ON public.chamados;
DROP POLICY IF EXISTS "chamados_service_all"  ON public.chamados;
CREATE POLICY "chamados_corretor_all" ON public.chamados
  FOR ALL USING (auth.uid() = corretor_id);
CREATE POLICY "chamados_service_all" ON public.chamados
  FOR ALL USING (auth.role() = 'service_role');

-- RLS — chamado_historico
ALTER TABLE public.chamado_historico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chamado_hist_corretor" ON public.chamado_historico;
DROP POLICY IF EXISTS "chamado_hist_service"  ON public.chamado_historico;
CREATE POLICY "chamado_hist_corretor" ON public.chamado_historico
  FOR SELECT USING (
    chamado_id IN (SELECT id FROM public.chamados WHERE corretor_id = auth.uid())
  );
CREATE POLICY "chamado_hist_service" ON public.chamado_historico
  FOR ALL USING (auth.role() = 'service_role');

-- RLS — vistorias
ALTER TABLE public.vistorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vistorias_corretor_all" ON public.vistorias;
DROP POLICY IF EXISTS "vistorias_service_all"  ON public.vistorias;
CREATE POLICY "vistorias_corretor_all" ON public.vistorias
  FOR ALL USING (auth.uid() = corretor_id);
CREATE POLICY "vistorias_service_all" ON public.vistorias
  FOR ALL USING (auth.role() = 'service_role');

-- RLS — vistoria_itens
ALTER TABLE public.vistoria_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vistoria_itens_corretor" ON public.vistoria_itens;
DROP POLICY IF EXISTS "vistoria_itens_service"  ON public.vistoria_itens;
CREATE POLICY "vistoria_itens_corretor" ON public.vistoria_itens
  FOR ALL USING (
    vistoria_id IN (SELECT id FROM public.vistorias WHERE corretor_id = auth.uid())
  );
CREATE POLICY "vistoria_itens_service" ON public.vistoria_itens
  FOR ALL USING (auth.role() = 'service_role');

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_chamados_contrato      ON public.chamados(contrato_id);
CREATE INDEX IF NOT EXISTS idx_chamados_corretor      ON public.chamados(corretor_id);
CREATE INDEX IF NOT EXISTS idx_chamados_status        ON public.chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_prop_token    ON public.chamados(proprietario_token);
CREATE INDEX IF NOT EXISTS idx_chamado_hist_chamado   ON public.chamado_historico(chamado_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_contrato     ON public.vistorias(contrato_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_corretor     ON public.vistorias(corretor_id);
CREATE INDEX IF NOT EXISTS idx_vistoria_itens         ON public.vistoria_itens(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_contratos_portal_token ON public.contratos(portal_token);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STORAGE — criar via dashboard do Supabase (Storage > New Bucket):
--
--   Bucket: chamados  (public: FALSE)
--   Bucket: vistorias (public: FALSE)
--
-- Depois adicione estas políticas em cada bucket:
--
-- [chamados] INSERT — name: "chamados_insert_auth"
--   WITH CHECK: bucket_id = 'chamados' AND auth.role() = 'authenticated'
-- [chamados] SELECT — name: "chamados_select_auth"
--   USING: bucket_id = 'chamados' AND auth.role() = 'authenticated'
-- [chamados] DELETE — name: "chamados_delete_auth"
--   USING: bucket_id = 'chamados' AND auth.role() = 'authenticated'
--
-- (Repetir para bucket 'vistorias')
-- ═══════════════════════════════════════════════════════════════════════════════

-- 8. Verificação final
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('chamados','chamado_historico','vistorias','vistoria_itens');

SELECT column_name FROM information_schema.columns
  WHERE table_name = 'contratos'
  AND column_name IN ('portal_token','proprietario_nome','proprietario_email','proprietario_phone');
