'use client'

interface ConfirmDialogProps {
  open: boolean
  titulo: string
  descricao: string
  acaoLabel: string
  acaoVariant?: 'gold' | 'red'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  titulo,
  descricao,
  acaoLabel,
  acaoVariant = 'gold',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  const acaoColor = acaoVariant === 'red' ? '#E05C5C' : '#C9A84C'
  const acaoTextColor = acaoVariant === 'red' ? '#F0EDE6' : '#0E0E0F'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-titulo"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        style={{
          width: '380px',
          backgroundColor: '#181819',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: '2px',
          padding: '28px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Titulo */}
        <h2
          id="confirm-titulo"
          style={{
            fontFamily: 'var(--font-serif, Playfair Display, serif)',
            fontSize: '17px',
            fontWeight: 600,
            color: '#F0EDE6',
            margin: 0,
          }}
        >
          {titulo}
        </h2>

        {/* Descricao */}
        <p
          style={{
            fontSize: '13px',
            color: '#9B9690',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {descricao}
        </p>

        {/* Divisor */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#232324',
            margin: '8px 0 4px',
          }}
        />

        {/* Botoes */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: 'transparent',
              color: '#F0EDE6',
              border: '1px solid #2E2E30',
              borderRadius: '2px',
              padding: '8px 20px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: acaoColor,
              color: acaoTextColor,
              border: 'none',
              borderRadius: '2px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {acaoLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
