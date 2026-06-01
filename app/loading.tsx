export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0E0E0F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'var(--font-sans, DM Sans, sans-serif)',
      }}
    >
      <style>{`
        @keyframes bid-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes bid-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Logo pulsando */}
      <p
        style={{
          fontFamily: 'var(--font-serif, Playfair Display, serif)',
          fontSize: '32px',
          fontWeight: 700,
          color: '#C9A84C',
          letterSpacing: '0.15em',
          margin: 0,
          animation: 'bid-pulse 1.8s ease-in-out infinite',
        }}
      >
        BID
      </p>

      {/* Spinner */}
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '2px solid rgba(201,168,76,0.2)',
          borderTopColor: '#C9A84C',
          borderRadius: '50%',
          animation: 'bid-spin 0.8s linear infinite',
        }}
      />

      {/* Subtitulo */}
      <p
        style={{
          fontSize: '12px',
          color: '#9B9690',
          margin: 0,
          letterSpacing: '0.08em',
        }}
      >
        Carregando...
      </p>
    </div>
  )
}
