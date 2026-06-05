# BID - Plataforma Imobiliaria

Plataforma completa para corretores de imoveis com matching inteligente, CRM Kanban, site publico personalizavel e painel administrativo.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sidineisartori-5503s-projects/v0-bid-plataforma-imobiliaria)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/nyiUkbUYaJa)

## Funcionalidades

- **Dashboard** - Visao geral de imoveis, solicitacoes e matches
- **Matching Inteligente** - Algoritmo que conecta imoveis a compradores/locatarios
- **CRM Kanban** - Gestao visual de negociacoes em andamento
- **Parcerias** - Sistema de split de comissao entre corretores
- **Site Publico** - Pagina personalizavel para cada corretor
- **Painel Admin** - Gestao de usuarios, planos e metricas

## Configuracao

### Pre-requisitos

- Node.js 18+
- pnpm (recomendado) ou npm
- Conta no [Supabase](https://supabase.com)

### Instalacao

1. Clone o repositorio:
```bash
git clone https://github.com/sidineisartori-blip/v0-bid-plataforma-imobiliaria.git
cd v0-bid-plataforma-imobiliaria
```

2. Instale as dependencias:
```bash
pnpm install
```

3. Configure as variaveis de ambiente:
```bash
cp .env.example .env.local
```

4. Preencha o `.env.local` com suas credenciais do Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave publica
   - `SUPABASE_SERVICE_ROLE_KEY` - Chave service_role
   - `ADMIN_JWT_SECRET` - Gere com `openssl rand -base64 64`

5. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
```

### Criando o Primeiro Admin

1. Adicione a variavel `ADMIN_SETUP_KEY` no `.env.local`:
```bash
ADMIN_SETUP_KEY=$(openssl rand -base64 32)
```

2. Acesse `/admin/setup` e preencha o formulario

3. **IMPORTANTE**: Remova a variavel `ADMIN_SETUP_KEY` apos criar o admin

## Seguranca

**NUNCA commite arquivos `.env` com credenciais reais.**

O `.gitignore` ja inclui `.env*`, mas sempre verifique antes de fazer commit:

```bash
git status
```

Se por engano commitou credenciais:
1. Rotacione imediatamente as chaves no Supabase
2. Use `git filter-branch` ou BFG para remover do historico

## Estrutura do Projeto

```
app/
  (dashboard)/     # Rotas protegidas do corretor
  admin/           # Painel administrativo
  api/             # API Routes
  corretor/[slug]/ # Site publico do corretor
components/
  dashboard/       # Componentes do dashboard
  crm/             # Componentes do CRM Kanban
  imoveis/         # Modais e listagens de imoveis
  site/            # Componentes do site publico
lib/
  supabase/        # Clientes Supabase (client/server)
  utils.ts         # Funcoes utilitarias
types/
  bid.ts           # Tipos TypeScript do projeto
```

## Deployment

O projeto esta configurado para deploy automatico no Vercel:

**[https://vercel.com/sidineisartori-5503s-projects/v0-bid-plataforma-imobiliaria](https://vercel.com/sidineisartori-5503s-projects/v0-bid-plataforma-imobiliaria)**

Configure as variaveis de ambiente no Vercel via Settings > Environment Variables.

## Desenvolvimento com v0

Continue construindo o app em:

**[https://v0.app/chat/nyiUkbUYaJa](https://v0.app/chat/nyiUkbUYaJa)**

Alteracoes feitas no v0 sao automaticamente sincronizadas com este repositorio.
