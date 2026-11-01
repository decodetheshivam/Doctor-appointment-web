import { useState } from 'react'
import {
  SUPER_ADMIN,
  getHospitalAdminByEmail,
  setAdminSession,
} from '../../data/adminAuth'

interface Props {
  onSuccess: (type: 'super' | 'hospital') => void
  onRegisterClick: () => void
  onHomeClick: () => void
}

export default function AdminLoginPage({ onSuccess, onRegisterClick, onHomeClick }: Props) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPwd, setShowPwd]   = useState(false)

  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3.5 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      // Check super admin
      if (email.trim().toLowerCase() === SUPER_ADMIN.email.toLowerCase()) {
        if (password === SUPER_ADMIN.password) {
          setAdminSession({ type: 'super' })
          onSuccess('super')
        } else {
          setError('Incorrect password.')
        }
        setLoading(false)
        return
      }

      // Check hospital admin
      const admin = getHospitalAdminByEmail(email.trim())
      if (!admin) {
        setError('No account found with this email.')
        setLoading(false)
        return
      }
      if (admin.password !== password) {
        setError('Incorrect password.')
        setLoading(false)
        return
      }
      if (admin.status === 'pending') {
        setError('Your registration is under review. You will be notified once approved.')
        setLoading(false)
        return
      }
      if (admin.status === 'rejected') {
        setError(`Your registration was rejected. Reason: ${admin.rejectionReason || 'Contact support.'}`)
        setLoading(false)
        return
      }
      if (admin.status === 'suspended') {
        setError('Your account has been suspended. Contact MediConnect support.')
        setLoading(false)
        return
      }

      setAdminSession({ type: 'hospital', id: admin.id })
      onSuccess('hospital')
      setLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#030d18] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={onHomeClick}
            className="font-dancing text-white text-2xl tracking-wide bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity mb-6 block mx-auto">
            MediConnect
          </button>
          <h1 className="font-instrument text-white text-3xl">Admin <span className="italic">Sign In</span></h1>
          <p className="text-white/40 font-inter text-sm mt-2">Hospital panel &amp; Super admin access</p>
        </div>

        <form onSubmit={handleLogin}
          className="bg-white/4 border border-white/8 rounded-2xl p-7 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
              <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.2"/>
                <path d="M7 4v3.5" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="7" cy="10" r="0.7" fill="#f87171"/>
              </svg>
              <p className="text-red-400 font-inter text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Email Address</label>
            <input className={inp} type="email" placeholder="admin@yourhospital.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div>
            <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Password</label>
            <div className="relative">
              <input className={inp} type={showPwd ? 'text' : 'password'} placeholder="Your password"
                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                {showPwd
                  ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-white text-[#030d18] py-4 rounded-xl font-inter font-semibold text-sm
                       hover:bg-white/90 disabled:opacity-50 transition-all button-glow flex items-center justify-center gap-2">
            {loading
              ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10"/></svg> Signing in...</>
              : 'Sign In to Panel'}
          </button>

          {/* Demo credentials hint */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-1">
            <p className="text-white/30 font-inter text-[11px] uppercase tracking-wide">Demo credentials</p>
            <p className="text-white/45 font-inter text-xs">Hospital: <span className="text-white/60">admin@apollocity.in</span> / <span className="text-white/60">Apollo@123</span></p>
            <p className="text-white/45 font-inter text-xs">Super Admin: <span className="text-white/60">superadmin@mediconnect.in</span> / <span className="text-white/60">Admin@2026</span></p>
          </div>
        </form>

        <div className="flex flex-col items-center gap-3 mt-5">
          <button onClick={onRegisterClick}
            className="text-white/50 hover:text-white font-inter text-sm transition-colors bg-transparent border-none cursor-pointer">
            Register your hospital →
          </button>
          <button onClick={onHomeClick}
            className="text-white/25 hover:text-white/50 font-inter text-xs transition-colors bg-transparent border-none cursor-pointer">
            Back to patient portal
          </button>
        </div>
      </div>
    </div>
  )
}
