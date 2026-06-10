-- ============================================================
-- BID Plataforma Imobiliária — SQL de Setup Completo
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- ──────────────────────────────────────────
-- 1. TABELA: corretores
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corretores (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         text NOT NULL,
  email             text NOT NULL UNIQUE,
  phone             text,
  creci             text,
  estado_creci      text,
  creci_status      text NOT NULL DEFAULT 'pendente',  -- pendente | ativo | suspenso
  tipo              text NOT NULL DEFAULT 'PF',         -- PF | PJ
  nome_imobiliaria  text,
  cidade            text,
  slug              text UNIQUE,
  plano             text NOT NULL DEFAULT 'free',       -- free | pro | premium | imobiliaria
  is_active         boolean NOT NULL DEFAULT true,
  matching_ativo    boolean NOT NULL DEFAULT false,
  nota_media        numeric(3,2) DEFAULT 0,
  total_avaliacoes  integer DEFAULT 0,
  deals_closed      integer DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;

-- Corretor vê/edita apenas o próprio perfil
CREATE POLICY "corretores_select_own" ON public.corretores
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "corretores_update_own" ON public.corretores
  FOR UPDATE USING (auth.uid() = id);

-- Service role pode fazer tudo (usado pelo onboarding e admin)
CREATE POLICY "corretores_service_role_all" ON public.corretores
  FOR ALL USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────
-- 2. TABELA: admin_users
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name     text NOT NULL,
  role          text NOT NULL DEFAULT 'master',
  is_active     boolean NOT NULL DEFAULT true,
  permissions   jsonb,
  last_login    timestamptz,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa admin_users
CREATE POLICY "admin_users_service_role_only" ON public.admin_users
  FOR ALL USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────
-- 3. TABELA: audit_log
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   uuid REFERENCES public.admin_users(id),
  acao       text NOT NULL,
  detalhes   jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_service_role_only" ON public.audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────
-- 4. TRIGGER: confirmação automática de e-mail (ambiente de TESTES)
--    Remove ou desative em produção
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirmar_usuario_teste()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS automatic_email_confirm ON auth.users;
CREATE TRIGGER automatic_email_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.confirmar_usuario_teste();

-- ──────────────────────────────────────────
-- 5. TRIGGER: onboarding automático (fallback)
--    Cria row em corretores quando um user é inserido em auth.users
--    com metadata de corretor. Complementa a chamada via API.
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
  v_slug text;
BEGIN
  -- Só cria perfil de corretor se tiver CRECI no metadata
  IF NEW.raw_user_meta_data->>'creci' IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar se já existe (idempotente)
  IF EXISTS (SELECT 1 FROM public.corretores WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  v_slug := COALESCE(
    NEW.raw_user_meta_data->>'slug',
    NEW.id::text
  );

  INSERT INTO public.corretores (
    id,
    full_name,
    email,
    phone,
    creci,
    estado_creci,
    creci_status,
    tipo,
    nome_imobiliaria,
    cidade,
    slug,
    plano,
    is_active,
    matching_ativo,
    nota_media,
    total_avaliacoes,
    deals_closed,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'creci',
    COALESCE(NEW.raw_user_meta_data->>'estado_creci', 'SP'),
    'pendente',
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'PF'),
    NEW.raw_user_meta_data->>'nome_imobiliaria',
    COALESCE(NEW.raw_user_meta_data->>'cidade', ''),
    v_slug,
    'free',
    true,
    false,
    0,
    0,
    0,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- segurança extra contra race condition

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_onboarding();

-- ──────────────────────────────────────────
-- 6. TABELA: parcerias
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parcerias (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          uuid NOT NULL,
  corretor_id       uuid NOT NULL REFERENCES public.corretores(id),
  parceiro_id       uuid NOT NULL REFERENCES public.corretores(id),
  percentual        integer NOT NULL DEFAULT 50,
  status            text NOT NULL DEFAULT 'pendente',  -- pendente | aceita | recusada | cancelada
  mensagem          text,
  prazo_dias        integer DEFAULT 30,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.parcerias ENABLE ROW LEVEL SECURITY;

-- Corretor pode ver e criar parcerias onde é proponente ou parceiro
CREATE POLICY "parcerias_select" ON public.parcerias
  FOR SELECT USING (
    auth.uid() = corretor_id OR auth.uid() = parceiro_id
  );

CREATE POLICY "parcerias_insert" ON public.parcerias
  FOR INSERT WITH CHECK (auth.uid() = corretor_id);

CREATE POLICY "parcerias_update" ON public.parcerias
  FOR UPDATE USING (
    auth.uid() = corretor_id OR auth.uid() = parceiro_id
  );

-- ──────────────────────────────────────────
-- 7. TABELA: negociacoes
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.negociacoes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parceria_id  uuid REFERENCES public.parcerias(id),
  corretor_id  uuid NOT NULL REFERENCES public.corretores(id),
  titulo       text,
  status       text NOT NULL DEFAULT 'contato',
  etapa        text NOT NULL DEFAULT 'contato',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.negociacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "negociacoes_own" ON public.negociacoes
  FOR ALL USING (auth.uid() = corretor_id);

-- ──────────────────────────────────────────
-- 8. TABELA: notificacoes
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id  uuid NOT NULL REFERENCES public.corretores(id),
  tipo         text NOT NULL,
  titulo       text NOT NULL,
  mensagem     text,
  lida         boolean NOT NULL DEFAULT false,
  payload      jsonb,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificacoes_own" ON public.notificacoes
  FOR ALL USING (auth.uid() = corretor_id);

-- ──────────────────────────────────────────
-- 9. FUNÇÃO: atualizar updated_at automaticamente
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_corretores_updated_at
  BEFORE UPDATE ON public.corretores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_parcerias_updated_at
  BEFORE UPDATE ON public.parcerias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_negociacoes_updated_at
  BEFORE UPDATE ON public.negociacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
