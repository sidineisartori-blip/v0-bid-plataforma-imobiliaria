import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0E0E0F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans, DM Sans, sans-serif)',
      }}
    >
      {/* Radial gradient sutil */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 600px 400px at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Conteudo */}
      <div style={{ position: 'relative', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Logo */}
        <p
          style={{
            fontFamily: 'var(--font-serif, Playfair Display, serif)',
            fontSize: '14px',
            letterSpacing: '0.25em',
            color: '#C9A84C',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          BID
        </p>

        {/* Codigo */}
        <h1
          style={{
            fontFamily: 'var(--font-serif, Playfair Display, serif)',
            fontSize: '72px',
            fontWeight: 700,
            color: '#F0EDE6',
            lineHeight: 1,
            margin: 0,
          }}
        >
          404
        </h1>

        {/* Titulo */}
        <h2
          style={{
            fontFamily: 'var(--font-serif, Playfair Display, serif)',
            fontSize: '22px',
            fontWeight: 400,
            color: '#F0EDE6',
            margin: 0,
          }}
        >
          Página não encontrada
        </h2>

        {/* Descricao */}
        <p
          style={{
            fontSize: '14px',
            color: '#9B9690',
            maxWidth: '340px',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          O link pode estar incorreto ou a página foi removida.
        </p>

        {/* Divisor */}
        <div
          style={{
            width: '40px',
            height: '1px',
            backgroundColor: 'rgba(201,168,76,0.3)',
            margin: '8px 0',
          }}
        />

        {/* Botoes */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/dashboard"
            style={{
              backgroundColor: '#C9A84C',
              color: '#0E0E0F',
              border: 'none',
              borderRadius: '2px',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Voltar ao Dashboard
          </Link>
          <Link
            href="/login"
            style={{
              backgroundColor: 'transparent',
              color: '#F0EDE6',
              border: '1px solid #2E2E30',
              borderRadius: '2px',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: 400,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Ir para o Login
          </Link>
        </div>
      </div>
    </div>
  )
}
