import AuthBackground from '../(auth)/AuthBackground'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <AuthBackground />
      <div style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        {children}
      </div>
    </div>
  )
}