// Cliente Resend via fetch — sem dependência extra
const RESEND_API = 'https://api.resend.com/emails'

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return // silencioso em dev sem chave

  // Usa o domínio verificado se houver; senão cai no remetente de teste do Resend.
  const dominio = process.env.RESEND_DOMAIN?.trim()
  const from =
    payload.from ??
    (dominio
      ? `BID Imobiliário <notificacoes@${dominio}>`
      : 'BID Imobiliário <onboarding@resend.dev>')

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        reply_to: payload.replyTo,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[email] Resend error:', res.status, err)
    }
  } catch (err) {
    console.error('[email] Falha ao enviar email:', err)
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

const base = (content: string) => `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0f0f10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .wrap{max-width:560px;margin:32px auto;background:#1a1a1c;border:1px solid #2a2a2c;border-radius:8px;overflow:hidden}
  .header{background:#181715;padding:24px 32px;border-bottom:1px solid #2a2a2c;text-align:center}
  .logo{font-size:22px;font-weight:700;color:#c9a84c;letter-spacing:2px}
  .sub{font-size:10px;color:#6b6860;letter-spacing:3px;text-transform:uppercase;margin-top:2px}
  .body{padding:28px 32px}
  h2{color:#f0ede6;font-size:18px;margin:0 0 16px}
  p{color:#9b9690;font-size:14px;line-height:1.6;margin:0 0 12px}
  .card{background:#252527;border:1px solid #2a2a2c;border-radius:6px;padding:16px;margin:16px 0}
  .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2a2a2c}
  .row:last-child{border-bottom:none}
  .label{color:#6b6860;font-size:12px}
  .value{color:#f0ede6;font-size:13px;font-weight:600}
  .btn{display:inline-block;background:#c9a84c;color:#0f0f10;font-weight:700;font-size:14px;padding:12px 28px;border-radius:4px;text-decoration:none;margin-top:8px}
  .footer{padding:20px 32px;text-align:center;border-top:1px solid #2a2a2c}
  .footer p{color:#3d3d3e;font-size:11px;margin:0}
</style></head><body>
<div class="wrap">
  <div class="header"><div class="logo">BID</div><div class="sub">Balcão Imobiliário Digital</div></div>
  <div class="body">${content}</div>
  <div class="footer"><p>© 2026 BID — Plataforma Imobiliária. Jacareí, SP.</p></div>
</div></body></html>`

// Template 1: Corretor recebe novo lead
export function emailNovoLead(opts: {
  corretorNome: string
  clienteNome: string
  clientePhone: string
  tipoNegocio: string
  tipoImovel: string
  cidade: string
  valorMax?: number
  quartos?: number
  appUrl: string
}) {
  return base(`
    <h2>🔔 Novo lead no BID!</h2>
    <p>Olá${opts.corretorNome ? `, <strong style="color:#f0ede6">${opts.corretorNome}</strong>` : ''}! Um novo cliente se cadastrou na sua página.</p>
    <div class="card">
      <div class="row"><span class="label">Cliente</span><span class="value">${opts.clienteNome}</span></div>
      <div class="row"><span class="label">WhatsApp</span><span class="value">${opts.clientePhone}</span></div>
      <div class="row"><span class="label">Interesse</span><span class="value">${opts.tipoImovel} para ${opts.tipoNegocio}</span></div>
      <div class="row"><span class="label">Cidade</span><span class="value">${opts.cidade}</span></div>
      ${opts.valorMax ? `<div class="row"><span class="label">Orçamento</span><span class="value">até R$ ${opts.valorMax.toLocaleString('pt-BR')}</span></div>` : ''}
      ${opts.quartos ? `<div class="row"><span class="label">Quartos</span><span class="value">${opts.quartos}+</span></div>` : ''}
    </div>
    <p>Entre em contato o quanto antes — leads contatados em menos de 5 min têm 40% mais chance de fechar.</p>
    <a href="${opts.appUrl}/solicitacoes" class="btn">Ver no BID</a>
  `)
}

// Template 2: Lead recebe confirmação
export function emailConfirmacaoLead(opts: {
  clienteNome: string
  corretorNome: string
  tipoNegocio: string
  tipoImovel: string
  cidade: string
}) {
  return base(`
    <h2>Solicitação recebida! ✅</h2>
    <p>Olá, <strong style="color:#f0ede6">${opts.clienteNome}</strong>!</p>
    <p>Recebemos sua solicitação de <strong style="color:#c9a84c">${opts.tipoImovel} para ${opts.tipoNegocio}</strong> em <strong style="color:#c9a84c">${opts.cidade}</strong>.</p>
    <p>O corretor <strong style="color:#f0ede6">${opts.corretorNome}</strong> entrará em contato em breve com as melhores opções do mercado.</p>
    <div class="card">
      <p style="margin:0;color:#6b6860;font-size:12px">📋 Resumo da solicitação</p>
      <div class="row"><span class="label">Tipo</span><span class="value">${opts.tipoImovel} para ${opts.tipoNegocio}</span></div>
      <div class="row"><span class="label">Cidade</span><span class="value">${opts.cidade}</span></div>
    </div>
    <p style="font-size:12px;color:#6b6860">Dúvidas? Responda este email e entraremos em contato.</p>
  `)
}

// Template 3b: Proprietário recebe confirmação de captação
export function emailConfirmacaoProprietario(opts: {
  propNome: string
  corretorNome: string
  corretorPhone: string | null
  tipoNegocio: string
  tipoImovel: string
  cidade: string
  bairro: string | null
}) {
  return base(`
    <h2>Captação registrada com sucesso! ✅</h2>
    <p>Olá, <strong style="color:#f0ede6">${opts.propNome}</strong>!</p>
    <p>Recebemos as informações do seu imóvel para <strong style="color:#c9a84c">${opts.tipoNegocio}</strong> em <strong style="color:#c9a84c">${opts.cidade}${opts.bairro ? ` · ${opts.bairro}` : ''}</strong>.</p>
    <p>O corretor <strong style="color:#f0ede6">${opts.corretorNome}</strong> analisará os dados e entrará em contato em breve.</p>
    <div class="card">
      <p style="margin:0 0 10px;color:#6b6860;font-size:12px">📋 Resumo da captação</p>
      <div class="row"><span class="label">Tipo</span><span class="value">${opts.tipoImovel} para ${opts.tipoNegocio}</span></div>
      <div class="row"><span class="label">Cidade</span><span class="value">${opts.cidade}${opts.bairro ? ` · ${opts.bairro}` : ''}</span></div>
      <div class="row"><span class="label">Corretor</span><span class="value">${opts.corretorNome}</span></div>
      ${opts.corretorPhone ? `<div class="row"><span class="label">WhatsApp</span><span class="value">${opts.corretorPhone}</span></div>` : ''}
    </div>
    <p style="font-size:12px;color:#6b6860">Dúvidas? Responda este email ou entre em contato com o corretor diretamente.</p>
  `)
}

// Template 3c: Corretor recebe novo imóvel captado (email)
export function emailNovaCapitacao(opts: {
  corretorNome: string
  propNome: string
  propPhone: string
  tipoNegocio: string
  tipoImovel: string
  cidade: string
  bairro: string | null
  valor: number
  appUrl: string
}) {
  return base(`
    <h2>🏠 Novo imóvel captado via BID!</h2>
    <p>Olá${opts.corretorNome ? `, <strong style="color:#f0ede6">${opts.corretorNome}</strong>` : ''}! Um proprietário preencheu o formulário na sua página.</p>
    <div class="card">
      <div class="row"><span class="label">Proprietário</span><span class="value">${opts.propNome}</span></div>
      <div class="row"><span class="label">WhatsApp</span><span class="value">${opts.propPhone}</span></div>
      <div class="row"><span class="label">Tipo</span><span class="value">${opts.tipoImovel} para ${opts.tipoNegocio}</span></div>
      <div class="row"><span class="label">Cidade</span><span class="value">${opts.cidade}${opts.bairro ? ` · ${opts.bairro}` : ''}</span></div>
      <div class="row"><span class="label">Valor</span><span class="value">R$ ${opts.valor.toLocaleString('pt-BR')}</span></div>
    </div>
    <p>Entre em contato para agendar a visita e assinar a autorização de venda.</p>
    <a href="${opts.appUrl}/imoveis" class="btn">Ver no BID</a>
  `)
}

// Template 4: Corretor inadimplente — aviso de mensalidade
export function emailAvisoPagamento(opts: {
  corretorNome: string
  plano: string
  valor: number
  mesReferencia: string
  dataVencimento: string
  diasAtraso: number
}) {
  const atrasado = opts.diasAtraso > 0
  return base(`
    <h2>${atrasado ? '⚠️ Pagamento em atraso' : '📅 Lembrete de mensalidade'}</h2>
    <p>Olá${opts.corretorNome ? `, <strong style="color:#f0ede6">${opts.corretorNome}</strong>` : ''}!</p>
    ${atrasado
      ? `<p>Sua mensalidade de <strong style="color:#e05c5c">${opts.mesReferencia}</strong> está <strong style="color:#e05c5c">${opts.diasAtraso} dia(s) em atraso</strong>. Para manter o acesso completo à plataforma, regularize seu pagamento.</p>`
      : `<p>Sua mensalidade de <strong style="color:#c9a84c">${opts.mesReferencia}</strong> vence em <strong style="color:#c9a84c">${opts.dataVencimento}</strong>.</p>`
    }
    <div class="card">
      <div class="row"><span class="label">Plano</span><span class="value">${opts.plano}</span></div>
      <div class="row"><span class="label">Valor</span><span class="value">R$ ${opts.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
      <div class="row"><span class="label">Referência</span><span class="value">${opts.mesReferencia}</span></div>
      <div class="row"><span class="label">Vencimento</span><span class="value">${opts.dataVencimento}</span></div>
    </div>
    <p>Após o pagamento, seu corretor BID confirmará o recebimento e seu acesso continuará normalmente.</p>
    <p style="font-size:12px;color:#6b6860">Dúvidas? Responda este email.</p>
  `)
}

// Template 5: Proprietário recebe chamado para autorizar
export function emailChamadoProprietario(opts: {
  propNome: string
  imovelNome: string
  cidade: string
  titulo: string
  descricao: string
  urgencia: string
  linkAutorizar: string
}) {
  const urgCor = opts.urgencia === 'urgente' ? '#e05c5c' : opts.urgencia === 'alta' ? '#e07a2f' : '#c9a84c'
  return base(`
    <h2>🔧 Chamado de Serviço — Aguarda sua Autorização</h2>
    <p>Olá, <strong style="color:#f0ede6">${opts.propNome}</strong>!</p>
    <p>Um chamado de serviço foi registrado para o seu imóvel e está aguardando sua autorização.</p>
    <div class="card">
      <div class="row"><span class="label">Imóvel</span><span class="value">${opts.imovelNome}${opts.cidade ? ` — ${opts.cidade}` : ''}</span></div>
      <div class="row"><span class="label">Serviço</span><span class="value">${opts.titulo}</span></div>
      <div class="row"><span class="label">Urgência</span><span class="value" style="color:${urgCor}">${opts.urgencia.toUpperCase()}</span></div>
    </div>
    <p style="color:#9b9690">${opts.descricao}</p>
    <p>Clique no botão abaixo para visualizar os detalhes e autorizar ou recusar o chamado:</p>
    <a href="${opts.linkAutorizar}" class="btn">Revisar Chamado</a>
    <p style="font-size:12px;color:#6b6860;margin-top:16px">Dúvidas? Responda este email ou entre em contato com seu corretor.</p>
  `)
}

// Template 6: Inquilino/Corretor — chamado resolvido
export function emailChamadoResolvido(opts: {
  inquilinoNome: string
  titulo: string
  comentario: string
}) {
  return base(`
    <h2>✅ Chamado Resolvido</h2>
    <p>Olá, <strong style="color:#f0ede6">${opts.inquilinoNome}</strong>!</p>
    <p>O chamado de serviço <strong style="color:#c9a84c">${opts.titulo}</strong> foi concluído.</p>
    ${opts.comentario ? `<div class="card"><p style="margin:0;color:#9b9690">${opts.comentario}</p></div>` : ''}
    <p style="font-size:12px;color:#6b6860">Se tiver dúvidas ou o problema persistir, entre em contato com seu corretor.</p>
  `)
}

// Template 3: Corretor recebe alerta de follow-up
export function emailFollowUpAlerta(opts: {
  corretorNome: string
  clienteNome: string
  clientePhone: string
  tipoNegocio: string
  cidade: string
  diasDesde: number
  appUrl: string
}) {
  return base(`
    <h2>⏰ Follow-up pendente</h2>
    <p>Olá${opts.corretorNome ? `, <strong style="color:#f0ede6">${opts.corretorNome}</strong>` : ''}! Já faz <strong style="color:#c9a84c">${opts.diasDesde} dias</strong> desde que este lead entrou em contato.</p>
    <div class="card">
      <div class="row"><span class="label">Cliente</span><span class="value">${opts.clienteNome}</span></div>
      <div class="row"><span class="label">WhatsApp</span><span class="value">${opts.clientePhone}</span></div>
      <div class="row"><span class="label">Interesse</span><span class="value">${opts.tipoNegocio} em ${opts.cidade}</span></div>
    </div>
    <p>Um contato rápido agora pode fazer toda a diferença!</p>
    <a href="${opts.appUrl}/solicitacoes" class="btn">Abrir no BID</a>
  `)
}
