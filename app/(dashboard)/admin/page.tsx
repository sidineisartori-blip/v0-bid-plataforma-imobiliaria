import { LABELS } from '@/lib/labels'

export default function AdminDashboardPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      gap: 20,
      color: '#F0EDE6',
    }}>
      <div style={{ fontSize: 48 }}>🛡️</div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 24,
        fontWeight: 700,
        color: '#F0EDE6',
      }}>
        {LABELS.acesso_restrito}
      </div>
      <div style={{
        fontSize: 15,
        color: '#9B9690',
        textAlign: 'center',
        maxWidth: 360,
      }}>
        Esta área é exclusiva para administradores da plataforma BID.
      </div>
    </div>
  )
}
