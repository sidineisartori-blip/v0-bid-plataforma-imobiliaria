export default function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: 16,
    }}>
      <style>{`@keyframes bid-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 28, height: 28,
        border: '2px solid rgba(201,168,76,0.15)',
        borderTopColor: '#C9A84C',
        borderRadius: '50%',
        animation: 'bid-spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 12, color: '#9B9690', margin: 0, letterSpacing: '0.08em' }}>
        Carregando...
      </p>
    </div>
  )
}
