import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso',
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

export default function TermosDeUso() {
  return (
    <div style={{ backgroundColor: '#0E0E0F', minHeight: '100vh', color: '#F0EDE6', padding: '60px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, color: '#9B9690', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← Voltar
        </Link>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: '#C9A84C', marginBottom: 8 }}>
          Termos de Uso
        </h1>
        <p style={{ fontSize: 13, color: '#9B9690', marginBottom: 40 }}>Última atualização: 11 de junho de 2026</p>

        <Section title="1. Aceitação dos termos">
          Ao criar uma conta no BID, você confirma que leu, compreendeu e concorda com estes Termos e com
          nossa{' '}
          <Link href="/privacidade" style={{ color: '#C9A84C' }}>Política de Privacidade</Link>.
          Se não concordar, não utilize a plataforma.
        </Section>

        <Section title="2. Descrição do serviço">
          O BID é uma plataforma SaaS de matching imobiliário que conecta corretores para parcerias,
          permutas e co-mediações. O BID <strong style={{ color: '#F0EDE6' }}>não é parte</strong> em
          nenhuma transação imobiliária realizada entre os usuários.
        </Section>

        <Section title="3. Elegibilidade">
          <ul style={ulStyle}>
            <li>Ser corretor de imóveis com registro ativo no CRECI da sua região.</li>
            <li>Ter capacidade civil plena (18 anos ou mais).</li>
            <li>Fornecer informações verdadeiras e atualizadas no cadastro.</li>
          </ul>
          O BID pode suspender contas com dados falsos ou CRECI inválido sem aviso prévio.
        </Section>

        <Section title="4. Responsabilidades do usuário">
          <ul style={ulStyle}>
            <li>Manter a confidencialidade de suas credenciais de acesso.</li>
            <li>Cadastrar apenas imóveis e solicitações para os quais possui autorização legal.</li>
            <li>Não utilizar a plataforma para fins ilícitos, spam ou concorrência desleal.</li>
            <li>Respeitar a privacidade e os dados de outros corretores na plataforma.</li>
            <li>Informar imediatamente ao BID qualquer uso não autorizado da sua conta.</li>
          </ul>
        </Section>

        <Section title="5. Planos e pagamentos">
          <ul style={ulStyle}>
            <li>O plano Free é gratuito e permanente, com limites definidos na página de planos.</li>
            <li>Planos pagos (Pro, Premium, Imobiliária) são cobrados mensalmente via PIX ou boleto.</li>
            <li>A ativação ocorre após confirmação do pagamento pela equipe BID.</li>
            <li>Não há reembolso proporcional por cancelamento antecipado.</li>
            <li>O BID pode alterar preços com aviso de 30 dias por e-mail.</li>
          </ul>
        </Section>

        <Section title="6. Propriedade intelectual">
          Todo o conteúdo da plataforma (código, design, marca, algoritmo de matching) é propriedade do BID.
          Os dados cadastrados pelos usuários pertencem aos respectivos corretores; ao cadastrá-los, você
          concede ao BID licença de uso para operar o serviço de matching.
        </Section>

        <Section title="7. Limitação de responsabilidade">
          O BID não se responsabiliza por:
          <ul style={{ ...ulStyle, marginTop: 8 }}>
            <li>Negócios não concluídos entre corretores parceiros.</li>
            <li>Precisão das informações inseridas pelos usuários.</li>
            <li>Danos indiretos, lucros cessantes ou perda de dados.</li>
            <li>Indisponibilidades ocasionais por manutenção ou força maior.</li>
          </ul>
        </Section>

        <Section title="8. Suspensão e encerramento">
          O BID pode suspender contas que violem estes termos com ou sem aviso prévio. O usuário pode
          encerrar sua conta pelo painel ou por{' '}
          <a href="mailto:suporte@bid.imob.br" style={{ color: '#C9A84C' }}>suporte@bid.imob.br</a>.
        </Section>

        <Section title="9. Lei aplicável e foro">
          Regidos pelas leis do Brasil. Foro eleito: Comarca de São Paulo – SP.
        </Section>

        <Section title="10. Contato">
          <a href="mailto:suporte@bid.imob.br" style={{ color: '#C9A84C' }}>suporte@bid.imob.br</a>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #232324', fontSize: 12, color: '#9B9690' }}>
          <Link href="/privacidade" style={{ color: '#C9A84C', marginRight: 16 }}>Política de Privacidade</Link>
          <Link href="/" style={{ color: '#9B9690' }}>Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
