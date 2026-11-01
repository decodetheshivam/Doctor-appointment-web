import { useState, useEffect, useRef } from 'react'
import {
  getPatientByPhone,
  savePatient,
  setPatientSession,
  setChatLanguage,
  generatePatientId,
  BLOOD_GROUPS,
  type PatientProfile,
  type EmergencyContact,
} from '../data/patientAuth'
import { LANGUAGES, type Language } from '../data/chatbotEngine'

type AuthView = 'login' | 'register'
type OtpStage = 'none' | 'login' | 'register'

interface Props {
  onSuccess: () => void
  onSkip?: () => void
  onAdminClick?: () => void
}

const EMPTY_CONTACT: EmergencyContact = { name: '', phone: '', relation: '' }

const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3.5 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'
const sel = `${inp} appearance-none`

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function PatientLoginPage({ onSuccess, onSkip, onAdminClick }: Props) {
  const [view, setView] = useState<AuthView>('login')

  // Login state
  const [loginPhone, setLoginPhone] = useState('')
  const [loginError, setLoginError] = useState('')

  // Register state
  const [form, setForm] = useState<Omit<PatientProfile, 'id' | 'createdAt' | 'lastLogin'>>({
    name: '', phone: '', age: '', bloodGroup: 'Unknown',
    address: '', city: '', knownConditions: '', allergies: '',
    emergencyContacts: [{ ...EMPTY_CONTACT }],
    preferredLanguage: 'en',
  })
  const [regErrors, setRegErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<1 | 2>(1)

  // OTP state
  const [otpStage, setOtpStage]     = useState<OtpStage>('none')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [otpDigits, setOtpDigits]  = useState<string[]>(['', '', '', '', '', ''])
  const [otpError, setOtpError]    = useState('')
  const [otpTimer, setOtpTimer]    = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── OTP timer countdown ──
  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [otpTimer])

  // ── OTP helpers ──

  function resetOtp() {
    setOtpDigits(['', '', '', '', '', ''])
    setOtpError('')
    setGeneratedOtp('')
    setOtpTimer(0)
  }

  function startOtp(stage: OtpStage) {
    const otp = generateOtp()
    setGeneratedOtp(otp)
    setOtpTimer(30)
    setOtpError('')
    setOtpDigits(['', '', '', '', '', ''])
    setOtpStage(stage)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  function resendOtp() {
    const otp = generateOtp()
    setGeneratedOtp(otp)
    setOtpTimer(30)
    setOtpError('')
    setOtpDigits(['', '', '', '', '', ''])
    otpRefs.current[0]?.focus()
  }

  function cancelOtp() {
    setOtpStage('none')
    resetOtp()
  }

  function handleOtpChange(i: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const digits = [...otpDigits]
    digits[i] = value
    setOtpDigits(digits)
    setOtpError('')
    if (value && i < 5) otpRefs.current[i + 1]?.focus()
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const digits = ['', '', '', '', '', '']
      for (let j = 0; j < pasted.length; j++) digits[j] = pasted[j]
      setOtpDigits(digits)
      if (pasted.length < 6) otpRefs.current[pasted.length]?.focus()
      else otpRefs.current[5]?.focus()
    }
  }

  function verifyOtp() {
    const entered = otpDigits.join('')
    if (entered.length !== 6) {
      setOtpError('Please enter the complete 6-digit code')
      return
    }
    if (entered !== generatedOtp) {
      setOtpError('Invalid code. Please try again.')
      setOtpDigits(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
      return
    }

    // ── OTP correct — complete the auth ──
    if (otpStage === 'login') {
      const patient = getPatientByPhone(loginPhone)
      setPatientSession(loginPhone)
      setChatLanguage(patient?.preferredLanguage || 'en')
      onSuccess()
    } else if (otpStage === 'register') {
      const patient: PatientProfile = {
        id: generatePatientId(),
        ...form,
        emergencyContacts: form.emergencyContacts.filter(c => c.name.trim()),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
      savePatient(patient)
      setPatientSession(patient.phone)
      setChatLanguage(form.preferredLanguage)
      onSuccess()
    }
  }

  function switchView(v: AuthView) {
    setView(v)
    setLoginError('')
    setRegErrors({})
    cancelOtp()
  }

  // ── LOGIN ──

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(loginPhone)) {
      setLoginError('Enter a valid 10-digit mobile number')
      return
    }
    const patient = getPatientByPhone(loginPhone)
    if (!patient) {
      setLoginError('No account found. Please register first.')
      return
    }
    // Send OTP instead of logging in directly
    startOtp('login')
  }

  // ── REGISTER ──

  function addContact() {
    if (form.emergencyContacts.length < 5)
      setForm(f => ({ ...f, emergencyContacts: [...f.emergencyContacts, { ...EMPTY_CONTACT }] }))
  }

  function updateContact(i: number, field: keyof EmergencyContact, value: string) {
    const c = [...form.emergencyContacts]
    c[i] = { ...c[i], [field]: value }
    setForm(f => ({ ...f, emergencyContacts: c }))
  }

  function removeContact(i: number) {
    setForm(f => ({ ...f, emergencyContacts: f.emergencyContacts.filter((_, j) => j !== i) }))
  }

  function validateStep1(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name required'
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Valid 10-digit mobile required'
    if (!form.age || Number(form.age) < 1 || Number(form.age) > 120) e.age = 'Valid age required'
    if (getPatientByPhone(form.phone)) e.phone = 'This number is already registered. Please login.'
    setRegErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {}
    form.emergencyContacts.forEach((c, i) => {
      if (c.name.trim() && !/^[6-9]\d{9}$/.test(c.phone))
        e[`cp_${i}`] = 'Valid mobile required'
    })
    setRegErrors(e)
    return Object.keys(e).length === 0
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep2()) return
    // Send OTP before creating the account
    startOtp('register')
  }

  // ── The phone number being verified ──
  const verifyingPhone = otpStage === 'login' ? loginPhone : form.phone

  return (
    <div className="min-h-screen bg-[#030d18] flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <span className="font-dancing text-white text-3xl tracking-wide">MediConnect</span>
          <p className="text-white/35 font-inter text-sm mt-1">Patient Portal</p>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* ── OTP VERIFICATION SCREEN ──                          */}
        {/* ═══════════════════════════════════════════════════ */}
        {otpStage !== 'none' && (
          <div className="bg-white/4 border border-white/8 rounded-2xl p-6 md:p-8 space-y-5"
               style={{ animation: 'chatbot-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            {/* Icon */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20
                              flex items-center justify-center mx-auto mb-3 text-blue-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 6h6M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-white font-inter font-semibold text-lg">Verify your mobile number</h3>
              <p className="text-white/40 font-inter text-sm mt-1.5">
                Enter the 6-digit code sent to{' '}
                <span className="text-white/65 font-medium">+91 {verifyingPhone}</span>
              </p>
            </div>

            {/* Demo OTP — shown because we can't send real SMS */}
            <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-sm shrink-0 mt-0.5">💡</span>
              <p className="text-amber-300/70 font-inter text-xs leading-relaxed">
                <strong className="text-amber-300">Demo code: {generatedOtp}</strong>
                <br/>
                In production, this OTP would be sent to your phone via SMS.
              </p>
            </div>

            {/* OTP input boxes */}
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className={`w-11 h-14 text-center text-xl font-inter font-bold rounded-xl
                             bg-white/5 border text-white focus:outline-none transition-all
                             ${otpError ? 'border-red-500/50' : 'border-white/10 focus:border-blue-400/50'}`}
                />
              ))}
            </div>

            {/* Error */}
            {otpError && (
              <p className="text-red-400 font-inter text-xs text-center">{otpError}</p>
            )}

            {/* Resend */}
            <div className="text-center">
              {otpTimer > 0 ? (
                <p className="text-white/30 font-inter text-xs">
                  Resend code in {otpTimer}s
                </p>
              ) : (
                <button onClick={resendOtp}
                  className="text-white/40 hover:text-white font-inter text-xs underline transition-colors">
                  Resend code
                </button>
              )}
            </div>

            {/* Verify button */}
            <button onClick={verifyOtp}
              className="w-full bg-white text-[#030d18] py-4 rounded-xl font-inter font-semibold
                         text-sm tracking-wide hover:bg-white/90 transition-all button-glow">
              {otpStage === 'login' ? 'Verify & Sign In' : 'Verify & Create Account'}
            </button>

            {/* Back */}
            <button onClick={cancelOtp}
              className="w-full text-white/30 hover:text-white/50 font-inter text-xs transition-colors">
              ← Back
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* ── LOGIN / REGISTER FORMS ──                          */}
        {/* ═══════════════════════════════════════════════════ */}
        {otpStage === 'none' && (
          <>
            {/* Tabs */}
            <div className="flex bg-white/4 border border-white/8 rounded-xl p-1 mb-6">
              {(['login', 'register'] as AuthView[]).map((v) => (
                <button key={v} onClick={() => switchView(v)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-inter font-medium capitalize
                             transition-all duration-200
                             ${view === v ? 'bg-white text-[#030d18]' : 'text-white/50 hover:text-white'}`}>
                  {v === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* ── LOGIN ── */}
            {view === 'login' && (
              <form onSubmit={handleLogin}
                className="bg-white/4 border border-white/8 rounded-2xl p-6 md:p-8 space-y-4">
                <div>
                  <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-inter text-sm">+91</span>
                    <input
                      type="tel" maxLength={10}
                      placeholder="10-digit mobile number"
                      value={loginPhone}
                      onChange={e => { setLoginPhone(e.target.value.replace(/\D/g, '')); setLoginError('') }}
                      className={`${inp} pl-12`}
                    />
                  </div>
                  {loginError && <p className="text-red-400 font-inter text-xs mt-1.5">{loginError}</p>}
                </div>

                <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3">
                  <p className="text-blue-300/70 font-inter text-xs leading-relaxed">
                    Your mobile number is your password. An OTP will be sent to verify
                    your identity each time you sign in.
                  </p>
                </div>

                <button type="submit"
                  className="w-full bg-white text-[#030d18] py-4 rounded-xl font-inter font-semibold
                             text-sm tracking-wide hover:bg-white/90 transition-all button-glow">
                  Send OTP & Sign In
                </button>

                <p className="text-center text-white/30 font-inter text-xs">
                  No account?{' '}
                  <button type="button" onClick={() => switchView('register')}
                    className="text-white/60 hover:text-white underline transition-colors">
                    Register here
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTER ── */}
            {view === 'register' && (
              <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (validateStep1()) setStep(2) } : handleRegister}>
                {/* Step bar */}
                <div className="flex gap-2 mb-5">
                  {[1, 2].map((s) => (
                    <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-400
                                             ${step >= s ? 'bg-white' : 'bg-white/15'}`}/>
                  ))}
                </div>
                <p className="text-white/35 font-inter text-xs mb-4 text-center">
                  {step === 1 ? 'Step 1 of 2 — Personal Details' : 'Step 2 of 2 — Emergency Contacts'}
                </p>

                <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4">

                  {/* ── STEP 1 ── */}
                  {step === 1 && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Full Name *</label>
                          <input className={`${inp} ${regErrors.name ? 'border-red-500/50' : ''}`}
                            placeholder="e.g. Arjun Mehta"
                            value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
                          {regErrors.name && <p className="text-red-400 text-[10px] mt-1 font-inter">{regErrors.name}</p>}
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Preferred Language *</label>
                          <select className={sel} value={form.preferredLanguage}
                            onChange={e => setForm({...form, preferredLanguage: e.target.value})}>
                            {(Object.entries(LANGUAGES) as [Language, string][]).map(([code, label]) =>
                              <option key={code} value={code} className="bg-[#071525]">{label}</option>
                            )}
                          </select>
                          <p className="text-white/25 text-[9px] mt-1 font-inter">The AI chatbot will respond in this language by default</p>
                        </div>
                        <div>
                          <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Mobile Number *</label>
                          <input className={`${inp} ${regErrors.phone ? 'border-red-500/50' : ''}`}
                            type="tel" maxLength={10} placeholder="10-digit"
                            value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g,'')})}/>
                          {regErrors.phone && <p className="text-red-400 text-[10px] mt-1 font-inter">{regErrors.phone}</p>}
                        </div>
                        <div>
                          <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Age *</label>
                          <input className={`${inp} ${regErrors.age ? 'border-red-500/50' : ''}`}
                            type="number" min={1} max={120} placeholder="Age in years"
                            value={form.age} onChange={e => setForm({...form, age: e.target.value})}/>
                          {regErrors.age && <p className="text-red-400 text-[10px] mt-1 font-inter">{regErrors.age}</p>}
                        </div>
                        <div>
                          <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Blood Group</label>
                          <select className={sel} value={form.bloodGroup}
                            onChange={e => setForm({...form, bloodGroup: e.target.value})}>
                            {BLOOD_GROUPS.map(b => <option key={b} value={b} className="bg-[#071525]">{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">City</label>
                          <input className={inp} placeholder="e.g. Mumbai"
                            value={form.city} onChange={e => setForm({...form, city: e.target.value})}/>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Home Address</label>
                          <input className={inp} placeholder="Street, area, landmark"
                            value={form.address} onChange={e => setForm({...form, address: e.target.value})}/>
                        </div>
                        <div>
                          <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Known Medical Conditions</label>
                          <input className={inp} placeholder="e.g. Diabetes, Hypertension"
                            value={form.knownConditions} onChange={e => setForm({...form, knownConditions: e.target.value})}/>
                        </div>
                        <div>
                          <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Known Allergies</label>
                          <input className={inp} placeholder="e.g. Penicillin, Sulfa"
                            value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})}/>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── STEP 2 ── */}
                  {step === 2 && (
                    <>
                      <div className="bg-red-500/6 border border-red-500/15 rounded-xl p-3 flex gap-2">
                        <span className="text-lg shrink-0">🚨</span>
                        <p className="text-red-300/70 font-inter text-xs leading-relaxed">
                          These contacts will receive an <strong>automatic SMS + location alert</strong> when you press
                          Emergency SOS. Add at least one trusted relative.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {form.emergencyContacts.map((c, i) => (
                          <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-white/30 font-inter text-[10px] uppercase tracking-wide">Contact {i + 1}</span>
                              {form.emergencyContacts.length > 1 && (
                                <button type="button" onClick={() => removeContact(i)}
                                  className="text-white/20 hover:text-red-400 transition-colors text-xs font-inter">
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input className={inp} placeholder="Full Name"
                                value={c.name} onChange={e => updateContact(i, 'name', e.target.value)}/>
                              <div>
                                <input className={`${inp} ${regErrors[`cp_${i}`] ? 'border-red-500/50' : ''}`}
                                  placeholder="Mobile" maxLength={10}
                                  value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value.replace(/\D/g,''))}/>
                                {regErrors[`cp_${i}`] && <p className="text-red-400 text-[9px] mt-0.5 font-inter">{regErrors[`cp_${i}`]}</p>}
                              </div>
                              <select className={`${sel}`} value={c.relation}
                                onChange={e => updateContact(i, 'relation', e.target.value)}>
                                <option value="" className="bg-[#071525]">Relation</option>
                                {['Spouse','Parent','Child','Sibling','Friend','Other'].map(r =>
                                  <option key={r} value={r} className="bg-[#071525]">{r}</option>)}
                              </select>
                            </div>
                          </div>
                        ))}
                        {form.emergencyContacts.length < 5 && (
                          <button type="button" onClick={addContact}
                            className="w-full border border-white/12 text-white/40 hover:text-white
                                       hover:border-white/25 py-2.5 rounded-xl text-xs font-inter
                                       transition-all flex items-center justify-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </svg>
                            Add Another Contact
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  {step === 2 && (
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 border border-white/15 text-white/50 hover:text-white py-3.5
                                 rounded-xl font-inter text-sm transition-all">
                      Back
                    </button>
                  )}
                  <button type="submit"
                    className="flex-1 bg-white text-[#030d18] py-3.5 rounded-xl font-inter font-semibold
                               text-sm hover:bg-white/90 transition-all button-glow">
                    {step === 1 ? 'Next →' : 'Create Account & Continue'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Skip (optional — only when browsing is allowed without login) */}
        {otpStage === 'none' && onSkip && (
          <button onClick={onSkip}
            className="w-full mt-4 text-white/25 hover:text-white/50 font-inter text-xs
                       transition-colors text-center">
            Skip for now — browse without signing in
          </button>
        )}

        {/* Hospital Portal (optional) */}
        {otpStage === 'none' && onAdminClick && (
          <button onClick={onAdminClick}
            className="w-full mt-3 text-white/20 hover:text-white/40 font-inter text-xs
                       transition-colors text-center flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3.5 6h5M6 3.5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Hospital Portal
          </button>
        )}
      </div>
    </div>
  )
}
