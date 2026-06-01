export default function LoginLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E0E0F',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '2px solid #232324',
          borderTopColor: '#C9A84C',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
