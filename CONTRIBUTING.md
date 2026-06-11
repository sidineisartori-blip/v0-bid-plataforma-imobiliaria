# Guia de Contribuição — BID Plataforma Imobiliária

## Dois agentes, responsabilidades distintas

Este repositório é editado por dois agentes em paralelo. Para evitar conflitos, cada um tem um domínio exclusivo.

---

## Branches

| Branch | Quem usa | Finalidade |
|---|---|---|
| `main` | Ninguém escreve direto | Produção — só recebe PRs revisados |
| `claude/dev` | Claude (Anthropic) | Lógica, segurança, fixes, API, auth |
| `v0/sidineisartori-*` | v0 (Vercel) | UI, componentes visuais, páginas novas |

**Regra:** Nunca fazer push direto na `main`. Sempre via PR revisado pelo Sidinei.

**Ordem de merge:** Claude primeiro → v0 depois (evita regressão de segurança).

---

## Domínio do Claude — arquivos que só o Claude toca

```
middleware.ts
app/api/**
lib/**
types/**
.env.example
app/(auth)/**/page.tsx       ← tem lógica de auth
app/admin/**/page.tsx         ← tem JWT
app/(dashboard)/layout.tsx    ← tem lógica server-side
```

**O Claude pode tocar em componentes visuais APENAS para corrigir bugs de lógica** (ex: try/catch faltando, estado incorreto). Nunca para redesign.

---

## Domínio da v0 — arquivos que só a v0 toca

```
components/**                 ← componentes visuais
app/(dashboard)/**/page.tsx   ← páginas do dashboard (sem lógica de auth)
app/termos/page.tsx
app/privacidade/page.tsx
public/**
globals.css
```

**A v0 nunca toca em:** `middleware.ts`, `app/api/`, `lib/`, `types/`, qualquer arquivo de autenticação.

---

## Fluxo de trabalho

```
1. Claude trabalha em claude/dev
   └── commit → push → PR para main

2. v0 trabalha em v0/sidineisartori-xxx (automático)
   └── Create PR no v0.app

3. Sidinei revisa os dois PRs
   └── Avisa o Claude antes de mergear qualquer um

4. Claude faz diff do PR da v0
   └── Confirma que não há conflito com claude/dev

5. Merge em ordem: claude/dev primeiro, v0 depois
```

---

## Antes de mergear o PR da v0 — checklist

- [ ] `middleware.ts` não foi alterado
- [ ] Nenhum arquivo em `app/api/` foi alterado  
- [ ] Nenhum arquivo em `lib/` foi alterado
- [ ] Nenhum arquivo em `types/` foi alterado
- [ ] `npx tsc --noEmit` passa sem erros após o merge

---

## Design system (referência para os dois agentes)

```
Fundo:        #0E0E0F
Card:         #181819
Input bg:     #232324
Borda input:  #2E2E30
Dourado:      #C9A84C
Dourado hover:#B8942F
Texto:        #F0EDE6
Secundário:   #9B9690
Erro:         #E05C5C
Sucesso:      #5CB88A
Info:         #5C9BE0

Fonte títulos: Playfair Display, serif
Fonte corpo:   DM Sans, sans-serif
Border-radius: 2px
```
