export const dynamic = 'force-dynamic'

export default function ERPPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      gap: 20,
      color: '#F0EDE6',
      textAlign: 'center',
      padding: '40px',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '2px',
        backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', color: '#C9A84C',
      }}>
        ⊞
      </div>
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: '#F0EDE6', marginBottom: '10px' }}>
          ERP Imobiliária
        </h1>
        <p style={{ fontSize: '15px', color: '#9B9690', maxWidth: '400px', lineHeight: 1.7, margin: '0 auto' }}>
          Módulo em desenvolvimento. Em breve você poderá gerenciar contratos de locação e venda,
          proprietários, cobranças e repasses diretamente aqui.
        </p>
      </div>
      <div style={{
        background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 2, padding: '10px 20px', fontSize: 13, color: '#C9A84C',
        letterSpacing: '0.04em',
      }}>
        Previsão: próxima versão
      </div>
    </div>
  )
}
