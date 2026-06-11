import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  robots: { index: true, follow: true },
}

const ulStyle: React.CSSProperties = {
  paddingLeft: 20, lineHeight: 2, color: '#9B9690', fontSize: 14,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, color: '#F0EDE6', fontWeight: 600, marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#9B9690', lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

export default function PoliticaPrivacidade() {
  return (
    <div style={{ backgroundColor: '#0E0E0F', minHeight: '100vh', color: '#F0EDE6', padding: '60px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, color: '#9B9690', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← Voltar
        </Link>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: '#C9A84C', marginBottom: 8 }}>
          Política de Privacidade
        </h1>
        <p style={{ fontSize: 13, color: '#9B9690', marginBottom: 40 }}>Última atualização: 11 de junho de 2026</p>

        <Section title="1. Quem somos">
          O BID — Balcão Imobiliário Digital ("BID", "nós") é uma plataforma SaaS de matching imobiliário.
          Para dúvidas sobre esta política, entre em contato pelo e-mail{' '}
          <a href="mailto:privacidade@bid.imob.br" style={{ color: '#C9A84C' }}>privacidade@bid.imob.br</a>.
        </Section>

        <Section title="2. Dados que coletamos">
          <ul style={ulStyle}>
            <li><strong style={{ color: '#F0EDE6' }}>Cadastro:</strong> nome completo, e-mail, telefone/WhatsApp, número CRECI e estado.</li>
            <li><strong style={{ color: '#F0EDE6' }}>Uso da plataforma:</strong> imóveis cadastrados, solicitações, matches, mensagens de chat e negociações.</li>
            <li><strong style={{ color: '#F0EDE6' }}>Dados técnicos:</strong> endereço IP, navegador, páginas acessadas e timestamps (logs Vercel/Supabase).</li>
            <li><strong style={{ color: '#F0EDE6' }}>Cookies:</strong> cookie de sessão de autenticação (necessário) e preferências de interface (opcional).</li>
          </ul>
        </Section>

        <Section title="3. Finalidade do tratamento">
          <ul style={ulStyle}>
            <li>Autenticar e manter sua conta ativa na plataforma.</li>
            <li>Realizar o matching entre imóveis e solicitações de corretores.</li>
            <li>Enviar notificações sobre matches, parcerias e atualizações de CRECI.</li>
            <li>Processar solicitações de assinatura e histórico financeiro.</li>
            <li>Melhorar a experiência do produto com base em dados agregados de uso.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
        </Section>

        <Section title="4. Base legal (LGPD — Lei 13.709/2018)">
          <ul style={ulStyle}>
            <li><strong style={{ color: '#F0EDE6' }}>Execução de contrato</strong> (art. 7º, V): dados necessários para prestar o serviço contratado.</li>
            <li><strong style={{ color: '#F0EDE6' }}>Consentimento</strong> (art. 7º, I): cookies não essenciais e comunicações de marketing.</li>
            <li><strong style={{ color: '#F0EDE6' }}>Interesse legítimo</strong> (art. 7º, IX): segurança, prevenção a fraudes e melhoria do produto.</li>
            <li><strong style={{ color: '#F0EDE6' }}>Cumprimento de obrigação legal</strong> (art. 7º, II): quando exigido por autoridade competente.</li>
          </ul>
        </Section>

        <Section title="5. Compartilhamento de dados">
          Seus dados <strong style={{ color: '#F0EDE6' }}>não são vendidos</strong> a terceiros. Compartilhamos apenas com:
          <ul style={{ ...ulStyle, marginTop: 8 }}>
            <li><strong style={{ color: '#F0EDE6' }}>Supabase Inc.</strong> — banco de dados e autenticação (infraestrutura, EUA, SCCs).</li>
            <li><strong style={{ color: '#F0EDE6' }}>Vercel Inc.</strong> — hospedagem e CDN (EUA, Privacy Shield / SCCs).</li>
            <li><strong style={{ color: '#F0EDE6' }}>Outros corretores na plataforma</strong> — nome, CRECI e informações profissionais visíveis para parceiros de match.</li>
          </ul>
        </Section>

        <Section title="6. Retenção de dados">
          Mantemos seus dados enquanto sua conta estiver ativa. Após solicitação de exclusão, removemos ou
          anonimizamos os dados em até <strong style={{ color: '#F0EDE6' }}>30 dias</strong>, salvo obrigação legal de retenção.
        </Section>

        <Section title="7. Seus direitos (LGPD art. 18)">
          Você pode, a qualquer momento:
          <ul style={{ ...ulStyle, marginTop: 8 }}>
            <li>Confirmar a existência de tratamento dos seus dados.</li>
            <li>Acessar, corrigir ou atualizar seus dados.</li>
            <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Revogar consentimento para cookies e comunicações de marketing.</li>
            <li>Solicitar portabilidade dos seus dados em formato estruturado.</li>
            <li>Excluir sua conta e todos os dados associados.</li>
          </ul>
          Para exercer seus direitos: <a href="mailto:privacidade@bid.imob.br" style={{ color: '#C9A84C' }}>privacidade@bid.imob.br</a>.
        </Section>

        <Section title="8. Segurança">
          Adotamos: autenticação via Supabase Auth com JWT, Row Level Security no banco de dados,
          HTTPS obrigatório e acesso restrito por função. Nenhum sistema é 100% inviolável.
        </Section>

        <Section title="9. Cookies">
          Utilizamos cookies estritamente necessários para autenticação de sessão. Você pode recusar
          cookies não essenciais pelo banner de consentimento sem perda de funcionalidade principal.
        </Section>

        <Section title="10. Alterações">
          Eventuais alterações serão publicadas nesta página. Para mudanças materiais, notificaremos
          pelo e-mail cadastrado com antecedência de 15 dias.
        </Section>

        <Section title="11. Contato e DPO">
          Encarregado de Proteção de Dados:{' '}
          <a href="mailto:privacidade@bid.imob.br" style={{ color: '#C9A84C' }}>privacidade@bid.imob.br</a>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #232324', fontSize: 12, color: '#9B9690' }}>
          <Link href="/termos" style={{ color: '#C9A84C', marginRight: 16 }}>Termos de Uso</Link>
          <Link href="/" style={{ color: '#9B9690' }}>Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
