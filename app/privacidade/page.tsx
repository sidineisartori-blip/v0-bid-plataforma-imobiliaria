export const metadata = {
  title: 'Política de Privacidade — BID Plataforma Imobiliária',
}

export default function PrivacidadePage() {
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
            Política de Privacidade
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
              1. Introdução
            </h2>
            <p style={{ margin: 0 }}>
              A BID Plataforma Imobiliária respeita a privacidade de seus usuários e está comprometida com a proteção de dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Esta política descreve como coletamos, usamos e protegemos suas informações.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              2. Dados Coletados
            </h2>
            <p style={{ margin: '0 0 12px' }}>Coletamos os seguintes dados:</p>
            <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong style={{ color: '#F0EDE6' }}>Dados de cadastro:</strong> nome completo, e-mail, WhatsApp, número do CRECI, estado/cidade de atuação;</li>
              <li><strong style={{ color: '#F0EDE6' }}>Dados profissionais:</strong> tipo de atuação, nome da imobiliária (quando aplicável);</li>
              <li><strong style={{ color: '#F0EDE6' }}>Dados de imóveis:</strong> informações inseridas voluntariamente sobre imóveis cadastrados;</li>
              <li><strong style={{ color: '#F0EDE6' }}>Dados de uso:</strong> logs de acesso, interações com a plataforma, histórico de matches e parcerias;</li>
              <li><strong style={{ color: '#F0EDE6' }}>Comunicações:</strong> mensagens trocadas via chat da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              3. Finalidade do Tratamento
            </h2>
            <p style={{ margin: '0 0 12px' }}>Seus dados são utilizados para:</p>
            <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Criar e gerenciar sua conta na plataforma;</li>
              <li>Realizar o matching entre imóveis, corretores e clientes;</li>
              <li>Facilitar parcerias entre corretores;</li>
              <li>Enviar notificações relevantes sobre atividades na plataforma;</li>
              <li>Verificar a regularidade do CRECI;</li>
              <li>Melhorar continuamente os serviços oferecidos;</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              4. Compartilhamento de Dados
            </h2>
            <p style={{ margin: 0 }}>
              Não vendemos seus dados pessoais. Podemos compartilhá-los com: (a) outros corretores cadastrados, apenas as informações profissionais necessárias para viabilizar parcerias; (b) prestadores de serviço tecnológico contratados pela BID (infraestrutura de nuvem, autenticação), sob contrato de confidencialidade; (c) autoridades públicas, quando exigido por lei.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              5. Segurança
            </h2>
            <p style={{ margin: 0 }}>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. Os dados são armazenados com criptografia em repouso e em trânsito. O acesso interno é restrito a colaboradores com necessidade legítima.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              6. Retenção de Dados
            </h2>
            <p style={{ margin: 0 }}>
              Mantemos seus dados pelo período necessário ao cumprimento das finalidades descritas nesta política, ou pelo prazo mínimo exigido por lei. Após o encerramento da conta, os dados podem ser retidos por até 5 anos para fins de auditoria e cumprimento de obrigações legais.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              7. Seus Direitos (LGPD)
            </h2>
            <p style={{ margin: '0 0 12px' }}>Como titular de dados, você tem direito a:</p>
            <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Confirmar a existência de tratamento de seus dados;</li>
              <li>Acessar os dados que temos sobre você;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Revogar o consentimento, quando aplicável;</li>
              <li>Portabilidade dos dados a outro fornecedor de serviço.</li>
            </ul>
            <p style={{ margin: '12px 0 0' }}>
              Para exercer esses direitos, envie solicitação para{' '}
              <a href="mailto:privacidade@bid.app.br" style={{ color: '#C9A84C', textDecoration: 'none' }}>
                privacidade@bid.app.br
              </a>
              .
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              8. Cookies
            </h2>
            <p style={{ margin: 0 }}>
              Utilizamos cookies estritamente necessários para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento publicitário ou de terceiros para fins de marketing.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              9. Alterações desta Política
            </h2>
            <p style={{ margin: 0 }}>
              Podemos atualizar esta política periodicamente. Usuários cadastrados serão notificados por e-mail ou notificação na plataforma. O uso contínuo após as alterações implica aceitação da versão atualizada.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#F0EDE6', margin: '0 0 16px' }}>
              10. Encarregado de Dados (DPO)
            </h2>
            <p style={{ margin: 0 }}>
              Dúvidas ou solicitações relacionadas à privacidade de dados devem ser direcionadas ao nosso Encarregado pelo e-mail{' '}
              <a href="mailto:privacidade@bid.app.br" style={{ color: '#C9A84C', textDecoration: 'none' }}>
                privacidade@bid.app.br
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
            href="/termos"
            style={{ fontSize: '13px', color: '#C9A84C', textDecoration: 'none' }}
          >
            ← Termos de Uso
          </a>
        </div>
      </div>
    </div>
  )
}
