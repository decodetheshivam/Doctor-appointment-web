import { useState, useEffect } from 'react'
import {
  getAdminSession,
  seedDemoHospitalAdmin,
  type AdminSession,
} from '../../data/adminAuth'
import AdminLoginPage      from './AdminLoginPage'
import HospitalRegisterPage from './HospitalRegisterPage'
import HospitalAdminPanel  from './HospitalAdminPanel'
import SuperAdminPanel     from './SuperAdminPanel'

type AdminView = 'login' | 'register' | 'hospital-panel' | 'super-panel'

interface Props {
  onExitAdmin: () => void
}

export default function AdminRouter({ onExitAdmin }: Props) {
  const [view, setView] = useState<AdminView>('login')
  const [session, setSession] = useState<AdminSession | null>(null)

  useEffect(() => {
    seedDemoHospitalAdmin()
    const s = getAdminSession()
    if (s) {
      setSession(s)
      setView(s.type === 'super' ? 'super-panel' : 'hospital-panel')
    }
  }, [])

  function handleLoginSuccess(type: 'super' | 'hospital') {
    const s = getAdminSession()
    setSession(s)
    setView(type === 'super' ? 'super-panel' : 'hospital-panel')
  }

  function handleLogout() {
    setSession(null)
    setView('login')
  }

  if (view === 'register') {
    return (
      <HospitalRegisterPage
        onSuccess={() => setView('login')}
        onLoginClick={() => setView('login')}
      />
    )
  }

  if (view === 'login') {
    return (
      <AdminLoginPage
        onSuccess={handleLoginSuccess}
        onRegisterClick={() => setView('register')}
        onHomeClick={onExitAdmin}
      />
    )
  }

  if (view === 'super-panel') {
    return <SuperAdminPanel onLogout={handleLogout} />
  }

  if (view === 'hospital-panel' && session?.type === 'hospital') {
    return <HospitalAdminPanel adminId={session.id} onLogout={handleLogout} />
  }

  // Fallback
  return <AdminLoginPage onSuccess={handleLoginSuccess} onRegisterClick={() => setView('register')} onHomeClick={onExitAdmin} />
}
