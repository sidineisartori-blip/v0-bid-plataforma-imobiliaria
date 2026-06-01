interface EmptyStateProps {
  icone: string
  titulo: string
  descricao: string
  acaoLabel?: string
  onAcao?: () => void
}

export default function EmptyState({
  icone,
  titulo,
  descricao,
  acaoLabel,
  onAcao,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        gap: '12px',
        textAlign: 'center',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: '48px',
          lineHeight: 1,
          display: 'block',
          marginBottom: '4px',
        }}
      >
        {icone}
      </span>

      <h3
        style={{
          fontFamily: 'var(--font-serif, Playfair Display, serif)',
          fontSize: '18px',
          fontWeight: 600,
          color: '#F0EDE6',
          margin: 0,
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          fontSize: '13px',
          color: '#9B9690',
          maxWidth: '320px',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {descricao}
      </p>

      {acaoLabel && onAcao && (
        <button
          onClick={onAcao}
          style={{
            marginTop: '8px',
            backgroundColor: '#C9A84C',
            color: '#0E0E0F',
            border: 'none',
            borderRadius: '2px',
            padding: '9px 22px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {acaoLabel}
        </button>
      )}
    </div>
  )
}
