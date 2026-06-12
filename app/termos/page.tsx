export const metadata = {
  title: 'Termos de Uso — BID Plataforma Imobiliária',
}

export default function TermosPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0E0E0F',
        color: '#F0EDE6',
        fontFamily: 'DM Sans, sans-serif',
        padding: '60px 24px',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Cabeçalho */}
        <div style={{ marginBottom: '48px' }}>
          <a
            href="/cadastro"
            style={{
              fontSize: '13px',
              color: '#C9A84C',
              textDecoration: 'none',
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '32px',
            }}
          >
            ← Voltar ao cadastro
          </a>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '40px',
              fontWeight: 700,
              color: '#F0EDE6',
              margin: '0 0 12px',
            }}
          >
            Termos de Uso
          </h1>
          <p style={{ fontSize: '15px', color: '#9B9690', margin: 0 }}>
            Última atualização: Janeiro de 2025
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: '#232324', marginBottom: '40px' }} />

        {/* Conteúdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', lineHeight: 1.8, fontSize: '16px', color: '#C8C2B8' }}>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              1. Aceitação dos Termos
            </h2>
            <p style={{ margin: 0 }}>
              Ao acessar e utilizar a plataforma BID (Plataforma Imobiliária), você concorda com estes Termos de Uso. Se não concordar com alguma disposição, não utilize a plataforma. A BID reserva-se o direito de atualizar estes termos a qualquer momento, com notificação prévia aos usuários cadastrados.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              2. Descrição do Serviço
            </h2>
            <p style={{ margin: 0 }}>
              A BID é uma plataforma digital que conecta corretores de imóveis, facilitando parcerias, matching de imóveis e clientes, além de oferecer ferramentas de gestão (CRM, ERP, chat em tempo real). O acesso é exclusivo para corretores regularmente registrados no CRECI.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              3. Cadastro e Elegibilidade
            </h2>
            <p style={{ margin: '0 0 12px' }}>Para utilizar a plataforma, o usuário deve:</p>
            <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Ser corretor de imóveis com CRECI válido e ativo;</li>
              <li>Fornecer informações verdadeiras e atualizadas no cadastro;</li>
              <li>Ter capacidade legal para firmar contratos eletrônicos;</li>
              <li>Manter a confidencialidade de suas credenciais de acesso.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              4. Uso Aceitável
            </h2>
            <p style={{ margin: '0 0 12px' }}>É vedado ao usuário:</p>
            <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Inserir informações falsas ou enganosas sobre imóveis ou sua qualificação profissional;</li>
              <li>Utilizar a plataforma para fins ilícitos ou que violem legislação vigente;</li>
              <li>Compartilhar credenciais de acesso com terceiros;</li>
              <li>Realizar engenharia reversa, scraping ou qualquer extração automatizada de dados;</li>
              <li>Praticar condutas que prejudiquem outros usuários da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              5. Planos e Pagamentos
            </h2>
            <p style={{ margin: 0 }}>
              A BID oferece diferentes planos de assinatura com funcionalidades distintas. Os valores, ciclos de cobrança e condições de renovação são informados no momento da contratação. O cancelamento pode ser solicitado a qualquer momento, sem multa, com encerramento ao fim do período pago.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              6. Propriedade Intelectual
            </h2>
            <p style={{ margin: 0 }}>
              Todo o conteúdo da plataforma (marca, design, código, textos) é propriedade da BID Plataforma Imobiliária. O usuário recebe apenas uma licença de uso não exclusiva e intransferível. Os dados e conteúdos inseridos pelo usuário permanecem de sua propriedade, sendo a BID responsável apenas pelo armazenamento e exibição.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              7. Limitação de Responsabilidade
            </h2>
            <p style={{ margin: 0 }}>
              A BID atua como intermediadora tecnológica. Não se responsabiliza por negociações realizadas entre corretores, pela veracidade das informações inseridas pelos usuários, ou por eventuais prejuízos decorrentes de parcerias firmadas pela plataforma. A responsabilidade técnica de cada transação imobiliária é exclusiva dos corretores envolvidos.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              8. Rescisão
            </h2>
            <p style={{ margin: 0 }}>
              A BID poderá suspender ou encerrar o acesso de qualquer usuário que viole estes termos, sem aviso prévio, em casos graves. O usuário poderá solicitar o encerramento de sua conta a qualquer momento pelo painel de configurações ou pelo suporte.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              9. Legislação Aplicável
            </h2>
            <p style={{ margin: 0 }}>
              Estes termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca de Presidente Prudente – SP para dirimir quaisquer controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              10. Contato
            </h2>
            <p style={{ margin: 0 }}>
              Dúvidas sobre estes termos podem ser enviadas para{' '}
              <a href="mailto:contato@bid.app.br" style={{ color: '#C9A84C', textDecoration: 'none' }}>
                contato@bid.app.br
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '60px',
            paddingTop: '32px',
            borderTop: '1px solid #232324',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p style={{ fontSize: '13px', color: '#9B9690', margin: 0 }}>
            © 2025 BID Plataforma Imobiliária. Todos os direitos reservados.
          </p>
          <a
            href="/privacidade"
            style={{ fontSize: '13px', color: '#C9A84C', textDecoration: 'none' }}
          >
            Política de Privacidade →
          </a>
        </div>
      </div>
    </div>
  )
}
