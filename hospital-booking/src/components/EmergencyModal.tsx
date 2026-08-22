import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getPatientSession, type PatientProfile } from '../data/patientAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AmbulanceDetails {
  id: string
  driver: string
  vehicle: string
  phone: string
  eta: number
  distance: string
  hospital: string
  paramedic: string
  trackingCode: string
}

interface LiveLocation {
  lat: number
  lng: number
  accuracy: number
  address: string
  timestamp: number
}

type Step = 'ready' | 'locating' | 'dispatching' | 'confirmed'

// ─── Mock ambulance pool ──────────────────────────────────────────────────────

const AMBULANCE_POOL = [
  { id: 'AMB-MH-0142', driver: 'Suresh Kumar',  vehicle: 'MH 02 AX 4521', phone: '9820012345', eta: 4, distance: '1.2 km', hospital: 'Apollo City Hospital',         paramedic: 'Ramesh Patil (EMT)'     },
  { id: 'AMB-MH-0087', driver: 'Rajan Mishra',  vehicle: 'MH 03 BZ 7832', phone: '9821023456', eta: 7, distance: '2.8 km', hospital: 'Kokilaben Dhirubhai Hospital',  paramedic: 'Sneha Joshi (Paramedic)' },
  { id: 'AMB-DL-0231', driver: 'Anil Sharma',   vehicle: 'DL 05 CX 1190', phone: '9711034567', eta: 6, distance: '2.1 km', hospital: 'AIIMS New Delhi',               paramedic: 'Vijay Singh (EMT)'      },
  { id: 'AMB-KA-0055', driver: 'Prakash Nair',  vehicle: 'KA 09 MX 3310', phone: '9900123456', eta: 5, distance: '1.8 km', hospital: 'Narayana Health City',          paramedic: 'Meena Das (Paramedic)'  },
]

function pickAmbulance(): AmbulanceDetails {
  const a = AMBULANCE_POOL[Math.floor(Math.random() * AMBULANCE_POOL.length)]
  return { ...a, trackingCode: 'EMG-' + Date.now().toString(36).toUpperCase().slice(0, 8) }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function googleMapsUrl(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`
}

function buildSMS(
  patient: PatientProfile,
  loc: LiveLocation,
  ambulance: AmbulanceDetails,
  emergency: string
): string {
  return [
    `🚨 EMERGENCY ALERT from MediConnect`,
    ``,
    `Patient: ${patient.name} (${patient.age}y, Blood: ${patient.bloodGroup})`,
    `Emergency: ${emergency}`,
    ``,
    `📍 LIVE LOCATION:`,
    `   ${loc.address}`,
    `   GPS: ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
    `   Maps: ${googleMapsUrl(loc.lat, loc.lng)}`,
    `   Accuracy: ±${Math.round(loc.accuracy)}m`,
    ``,
    `🚑 AMBULANCE DISPATCHED:`,
    `   Unit: ${ambulance.id} | Vehicle: ${ambulance.vehicle}`,
    `   Driver: ${ambulance.driver} — 📞 ${ambulance.phone}`,
    `   Paramedic: ${ambulance.paramedic}`,
    `   ETA: ~${ambulance.eta} min (${ambulance.distance} away)`,
    `   Going to: ${ambulance.hospital}`,
    `   Tracking: ${ambulance.trackingCode}`,
    ``,
    patient.knownConditions ? `⚠️ Medical Conditions: ${patient.knownConditions}` : '',
    patient.allergies       ? `⚠️ Allergies: ${patient.allergies}` : '',
    ``,
    `Call ambulance driver directly: ${ambulance.phone}`,
    `— MediConnect Emergency Response`,
  ].filter(l => l !== null).join('\n')
}

// ─── ETA ring timer ───────────────────────────────────────────────────────────

function ETATimer({ initialEta }: { initialEta: number }) {
  const [secs, setSecs] = useState(initialEta * 60)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const m = Math.floor(secs / 60)
  const s = secs % 60
  const pct = Math.round((1 - secs / (initialEta * 60)) * 100)
  const r = 40
  const circ = 2 * Math.PI * r

  return (
    <div className="relative w-28 h-28">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="7"/>
        <circle cx="56" cy="56" r={r} fill="none" stroke="#ef4444" strokeWidth="7"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ * (1 - pct / 100)}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-inter font-bold text-2xl tabular-nums leading-none">
          {m}:{String(s).padStart(2,'0')}
        </span>
        <span className="text-white/35 font-inter text-[10px] mt-0.5">ETA</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { onClose: () => void; autoDispatch?: boolean }

export default function EmergencyModal({ onClose, autoDispatch = false }: Props) {
  const patient                       = getPatientSession()
  const [step, setStep]               = useState<Step>('ready')
  const [emergency, setEmergency]     = useState('Cardiac Arrest')
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null)
  const [locError, setLocError]       = useState('')
  const [ambulance, setAmbulance]     = useState<AmbulanceDetails | null>(null)
  const [notifLog, setNotifLog]       = useState<string[]>([])
  const [dispatchPct, setDispatchPct] = useState(0)
  const [watchId, setWatchId]         = useState<number | null>(null)
  // Auto-dispatch countdown (5 → 0)
  const [countdown, setCountdown]     = useState(autoDispatch ? 5 : -1)
  const [cancelled, setCancelled]     = useState(false)
  const countdownRef                  = useRef<ReturnType<typeof setInterval> | null>(null)

  // Lock body scroll + Escape to close
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && step !== 'dispatching') onClose() }
    document.addEventListener('keydown', h)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', h)
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [onClose, step, watchId])

  // ── Auto-dispatch countdown with continuous siren ──
  useEffect(() => {
    if (!autoDispatch || countdown < 0) return

    // ── Continuous siren for full 5s ──
    let sirenCtx: AudioContext | null = null
    let sirenStopped = false

    function startSiren() {
      try {
        const AudioCtx = window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioCtx) return
        sirenCtx = new AudioCtx()

        // Speak Hindi announcement first
        const utt = new SpeechSynthesisUtterance(
          'इमरजेंसी डिटेक्ट हुई। 5 सेकंड में एम्बुलेंस भेजी जाएगी। रद्द करने के लिए कैंसिल दबाएं।'
        )
        utt.lang = 'hi-IN'
        utt.rate = 1.05
        window.speechSynthesis?.cancel()
        window.speechSynthesis?.speak(utt)

        // Loop siren sweeps for 5 seconds
        function playSweep(startAt: number) {
          if (sirenStopped || !sirenCtx) return
          if (startAt > sirenCtx.currentTime + 5.2) return // stop after 5s

          const osc  = sirenCtx.createOscillator()
          const gain = sirenCtx.createGain()
          osc.connect(gain)
          gain.connect(sirenCtx.destination)
          osc.type = 'sawtooth'
          gain.gain.setValueAtTime(0.22, startAt)
          gain.gain.setValueAtTime(0.22, startAt + 0.45)
          gain.gain.linearRampToValueAtTime(0, startAt + 0.5)
          // Up sweep: 500Hz → 1400Hz
          osc.frequency.setValueAtTime(500, startAt)
          osc.frequency.linearRampToValueAtTime(1400, startAt + 0.5)
          osc.start(startAt)
          osc.stop(startAt + 0.5)

          // Down sweep
          const osc2  = sirenCtx.createOscillator()
          const gain2 = sirenCtx.createGain()
          osc2.connect(gain2)
          gain2.connect(sirenCtx.destination)
          osc2.type = 'sawtooth'
          gain2.gain.setValueAtTime(0.22, startAt + 0.5)
          gain2.gain.setValueAtTime(0.22, startAt + 0.95)
          gain2.gain.linearRampToValueAtTime(0, startAt + 1.0)
          osc2.frequency.setValueAtTime(1400, startAt + 0.5)
          osc2.frequency.linearRampToValueAtTime(500, startAt + 1.0)
          osc2.start(startAt + 0.5)
          osc2.stop(startAt + 1.0)

          // Schedule next sweep 1s later
          setTimeout(() => playSweep(startAt + 1.0), 900)
        }

        playSweep(sirenCtx.currentTime)
      } catch { /* audio not supported */ }
    }

    startSiren()

    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(t)
          sirenStopped = true
          sirenCtx?.close().catch(() => {})
          window.speechSynthesis?.cancel()
          return 0
        }
        return c - 1
      })
    }, 1000)

    countdownRef.current = t
    return () => {
      clearInterval(t)
      sirenStopped = true
      sirenCtx?.close().catch(() => {})
    }
  }, [autoDispatch])

  // When countdown hits 0 and not cancelled — fire dispatch
  useEffect(() => {
    if (countdown === 0 && !cancelled && autoDispatch) {
      handleDispatch()
    }
  }, [countdown])

  // ── Get live GPS location ──
  function startLocation(): Promise<LiveLocation> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        // Fallback with approximate coords
        resolve({ lat: 19.0760, lng: 72.8777, accuracy: 1000, address: 'Mumbai, Maharashtra (approximate)', timestamp: Date.now() })
        return
      }
      // High-accuracy watch for live updates
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const loc: LiveLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            address: `${pos.coords.latitude.toFixed(5)}°N, ${pos.coords.longitude.toFixed(5)}°E`,
            timestamp: pos.timestamp,
          }
          setLiveLocation(loc)
          resolve(loc)
        },
        () => {
          const fallback: LiveLocation = { lat: 19.0760, lng: 72.8777, accuracy: 1000, address: 'Mumbai, Maharashtra (approximate — GPS denied)', timestamp: Date.now() }
          setLiveLocation(fallback)
          resolve(fallback)
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
      setWatchId(id)
    })
  }

  // ── Main dispatch flow ──
  async function handleDispatch() {
    if (!patient) return
    setStep('locating')
    setLocError('')

    let loc: LiveLocation
    try {
      loc = await startLocation()
    } catch {
      loc = { lat: 19.0760, lng: 72.8777, accuracy: 1000, address: 'Location unavailable', timestamp: Date.now() }
      setLiveLocation(loc)
    }
    setLiveLocation(loc)
    setStep('dispatching')

    // Progress animation
    let pct = 0
    const interval = setInterval(() => {
      pct += Math.random() * 18 + 8
      setDispatchPct(Math.min(pct, 100))
      if (pct >= 100) {
        clearInterval(interval)
        const amb = pickAmbulance()
        setAmbulance(amb)

        // Build notification messages
        const validContacts = patient.emergencyContacts.filter(c => c.name.trim() && c.phone.trim())
        const logs: string[] = []
        if (validContacts.length === 0) {
          logs.push(`📡 No emergency contacts saved.\nAlert sent to MediConnect Dispatch Centre.\nTracking: ${amb.trackingCode}`)
        } else {
          validContacts.forEach(c => {
            logs.push(`✅ SMS + WhatsApp sent to ${c.name} (${c.relation || 'Contact'}) — +91 ${c.phone}\n\n${buildSMS(patient, loc, amb, emergency)}`)
          })
        }
        setNotifLog(logs)
        setStep('confirmed')
      }
    }, 160)
  }

  const EMERGENCY_TYPES = [
    'Cardiac Arrest', 'Stroke / Paralysis', 'Accident / Trauma',
    'Breathing Difficulty', 'Severe Chest Pain', 'Unconscious',
    'Severe Bleeding', 'Burns', 'Poisoning / Overdose', 'Other Emergency',
  ]

  const modal = (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="w-full max-w-lg max-h-[93vh] bg-[#0d0404] border border-red-500/30 rounded-2xl
                   overflow-hidden flex flex-col shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(239,68,68,0.25), 0 0 120px rgba(239,68,68,0.08)',
                 animation: 'emergency-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/60 to-red-800/40 border-b border-red-500/25
                        px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40
                              flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L16 15H2L9 2z" stroke="#ef4444" strokeWidth="1.8" strokeLinejoin="round"/>
                  <path d="M9 7.5v3.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="13" r="0.8" fill="#ef4444"/>
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"/>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"/>
            </div>
            <div>
              <h2 className="text-white font-inter font-bold text-lg leading-tight">🚨 EMERGENCY SOS</h2>
              {patient && (
                <p className="text-red-300/70 font-inter text-xs">
                  {patient.name} · {patient.bloodGroup} · {patient.age}y
                </p>
              )}
            </div>
          </div>
          {step !== 'dispatching' && step !== 'locating' && (
            <button onClick={onClose}
              className="text-white/30 hover:text-white w-8 h-8 flex items-center justify-center
                         rounded-lg hover:bg-white/8 transition-all">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* ── STEP: READY (one-tap for logged-in users) ── */}
        {step === 'ready' && patient && (
          <>
            <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-5">
              {/* Patient info summary */}
              <div className="bg-white/4 border border-white/10 rounded-2xl p-4 space-y-2">
                <p className="text-white/35 text-[10px] font-inter uppercase tracking-widest mb-3">Your Saved Profile</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {[
                    ['Name',       patient.name],
                    ['Mobile',     `+91 ${patient.phone}`],
                    ['Age',        `${patient.age} years`],
                    ['Blood',      patient.bloodGroup],
                    ['City',       patient.city || '—'],
                    ['Contacts',   `${patient.emergencyContacts.length} saved`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-white/25 font-inter text-[10px] uppercase tracking-wide">{label}</p>
                      <p className="text-white/75 font-inter text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
                {patient.knownConditions && (
                  <div className="mt-2 pt-2 border-t border-white/6">
                    <p className="text-yellow-400/70 font-inter text-xs">
                      ⚠️ Conditions: {patient.knownConditions}
                    </p>
                  </div>
                )}
              </div>

              {/* Emergency contacts preview */}
              {patient.emergencyContacts.length > 0 && (
                <div>
                  <p className="text-white/35 text-[10px] font-inter uppercase tracking-widest mb-2">
                    Alerts will be sent to:
                  </p>
                  <div className="space-y-2">
                    {patient.emergencyContacts.map((c, i) => (
                      <div key={i}
                        className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-900/40 to-red-800/30
                                        border border-red-500/20 flex items-center justify-center shrink-0">
                          <span className="text-red-300 font-inter font-bold text-[10px]">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white/70 font-inter text-sm font-medium">{c.name}</p>
                          <p className="text-white/30 font-inter text-xs">{c.relation} · +91 {c.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency type */}
              <div>
                <p className="text-white/35 text-[10px] font-inter uppercase tracking-widest mb-2">Emergency Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMERGENCY_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setEmergency(t)}
                      className={`text-[11px] font-inter px-3 py-1.5 rounded-full border transition-all
                                 ${emergency === t
                                   ? 'bg-red-500/25 border-red-500/50 text-red-300'
                                   : 'bg-white/4 border-white/10 text-white/45 hover:border-red-500/30'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location note */}
              <div className="flex items-start gap-2 bg-blue-500/8 border border-blue-500/15 rounded-xl p-3">
                <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#60a5fa" strokeWidth="1.2"/>
                  <path d="M7 5v4" stroke="#60a5fa" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="7" cy="4" r="0.6" fill="#60a5fa"/>
                </svg>
                <p className="text-blue-300/70 font-inter text-xs leading-relaxed">
                  Pressing SOS will automatically capture your <strong>live GPS location</strong> and
                  send it to your emergency contacts along with ambulance details.
                </p>
              </div>

              {locError && (
                <p className="text-red-400 font-inter text-xs bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2">
                  ⚠️ {locError}
                </p>
              )}
            </div>

            {/* One-tap dispatch / auto-countdown */}
            <div className="p-4 border-t border-red-500/15 shrink-0">

              {/* Auto-dispatch countdown (voice-triggered) */}
              {autoDispatch && countdown >= 0 && !cancelled && (
                <div className="mb-3">
                  <div className="bg-red-900/40 border border-red-500/40 rounded-xl p-4 flex items-center gap-4">
                    {/* Countdown ring */}
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="-rotate-90 absolute inset-0" width="56" height="56" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="4"/>
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#ef4444" strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 22}`}
                          strokeDashoffset={`${2 * Math.PI * 22 * (countdown / 5)}`}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s linear' }}/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-red-400 font-inter font-black text-xl tabular-nums">{countdown}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-red-300 font-inter font-bold text-sm animate-pulse">
                        🚨 Voice Emergency Detected!
                      </p>
                      <p className="text-white/50 font-inter text-xs mt-0.5">
                        Auto-dispatching in <strong className="text-red-400">{countdown}s</strong> — tap Cancel to stop
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCancelled(true)
                        if (countdownRef.current) clearInterval(countdownRef.current)
                        setCountdown(-1)
                        // Stop siren and speech
                        window.speechSynthesis?.cancel()
                        // Close AudioContext by navigating countdown to -1
                      }}
                      className="shrink-0 bg-white text-red-600 font-inter font-bold text-xs
                                 px-4 py-2 rounded-lg hover:bg-white/90 transition-all
                                 border-2 border-white/80"
                    >
                      CANCEL
                    </button>
                  </div>
                  {/* Siren bar visualizer */}
                  <div className="flex items-end justify-center gap-0.5 h-5 mt-2">
                    {Array.from({length: 20}, (_, i) => (
                      <div key={i}
                        className="w-1.5 bg-red-500/60 rounded-sm"
                        style={{
                          height: `${30 + Math.sin((i + countdown * 3) * 0.8) * 70}%`,
                          transition: 'height 0.3s ease',
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled notice */}
              {cancelled && (
                <div className="mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <p className="text-emerald-400 font-inter text-sm font-medium">
                    ✓ Auto-dispatch cancelled. You can still dispatch manually below.
                  </p>
                </div>
              )}

              <button onClick={handleDispatch}
                className="w-full max-w-sm mx-auto bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl
                           font-inter font-semibold text-sm tracking-wide
                           transition-all hover:scale-[1.01] active:scale-[0.98]
                           flex items-center justify-center gap-2"
                style={{ boxShadow: '0 0 18px rgba(239,68,68,0.35)' }}>
                🚑 Tap to dispatch ambulance
              </button>
              <p className="text-white/20 font-inter text-[10px] text-center mt-2">
                One tap · No forms · Live location sent automatically
              </p>
            </div>
          </>
        )}

        {/* ── NOT LOGGED IN ── */}
        {step === 'ready' && !patient && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
            <div className="text-5xl">🔐</div>
            <div>
              <p className="text-white font-instrument text-2xl">Sign in required</p>
              <p className="text-white/40 font-inter text-sm mt-2 max-w-xs">
                Create a patient account to enable one-tap emergency dispatch with your saved
                details and emergency contacts.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button onClick={onClose}
                className="bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl font-inter
                           font-semibold text-sm transition-all button-glow"
                // Close modal so user can go to login
              >
                Go to Patient Login →
              </button>
              <p className="text-white/20 font-inter text-[10px]">
                Close this dialog → click "Sign In" in navbar
              </p>
            </div>
          </div>
        )}

        {/* ── LOCATING ── */}
        {step === 'locating' && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-blue-500/60 flex items-center justify-center animate-spin"
                     style={{ animationDuration: '1.2s' }}>
                  <div className="w-2.5 h-2.5 bg-blue-400 rounded-full"/>
                </div>
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-2xl">📍</span>
            </div>
            <p className="text-blue-300 font-inter font-semibold text-base animate-pulse">Getting your live location...</p>
            <p className="text-white/30 font-inter text-xs">High-accuracy GPS · Please allow location access</p>
            {liveLocation && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-center">
                <p className="text-emerald-400 font-inter text-xs font-medium">✓ Location acquired</p>
                <p className="text-white/40 font-mono text-[10px] mt-0.5">
                  {liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)} ± {Math.round(liveLocation.accuracy)}m
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── DISPATCHING ── */}
        {step === 'dispatching' && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-red-500/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-red-500/60 flex items-center justify-center animate-spin"
                     style={{ animationDuration: '1.4s' }}>
                  <div className="w-3 h-3 bg-red-500 rounded-full"/>
                </div>
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">🚑</span>
            </div>
            <div className="text-center">
              <p className="text-red-400 font-inter font-bold text-lg animate-pulse">Dispatching Emergency Response...</p>
              <p className="text-white/35 font-inter text-xs mt-1">Locating nearest available ambulance unit</p>
            </div>
            <div className="w-full bg-white/8 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded-full transition-all duration-150"
                   style={{ width: `${dispatchPct}%` }}/>
            </div>
            <p className="text-white/30 font-inter text-xs">
              {dispatchPct < 30  ? '🔍 Scanning ambulance fleet...' :
               dispatchPct < 60  ? '📡 Contacting nearest unit...' :
               dispatchPct < 85  ? '✅ Ambulance assigned — notifying crew...' :
               '📱 Sending location alerts to relatives...'}
            </p>
          </div>
        )}

        {/* ── CONFIRMED ── */}
        {step === 'confirmed' && ambulance && patient && liveLocation && (
          <>
            <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-4">
              {/* Success */}
              <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/25
                              rounded-2xl p-4 flex items-start gap-3">
                <span className="text-4xl shrink-0">🚑</span>
                <div>
                  <p className="text-red-300 font-inter font-bold text-lg">Ambulance Dispatched!</p>
                  <p className="text-white/55 font-inter text-sm mt-0.5">
                    ETA: <span className="text-red-400 font-semibold">~{ambulance.eta} min</span> · {ambulance.distance}
                  </p>
                  <p className="text-white/25 font-inter text-xs mt-1">
                    Code: <span className="font-mono text-red-300/70">{ambulance.trackingCode}</span>
                  </p>
                </div>
              </div>

              {/* ETA timer */}
              <div className="flex items-center justify-center py-2">
                <ETATimer initialEta={ambulance.eta} />
              </div>

              {/* Live location */}
              <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"/>
                  <p className="text-blue-300 font-inter font-semibold text-sm">Live Location Shared</p>
                </div>
                <p className="text-white/50 font-mono text-xs">
                  {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
                </p>
                <p className="text-white/30 font-inter text-[10px] mt-0.5">
                  Accuracy: ±{Math.round(liveLocation.accuracy)}m · Updated: {new Date(liveLocation.timestamp).toLocaleTimeString()}
                </p>
                <a href={googleMapsUrl(liveLocation.lat, liveLocation.lng)} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300
                             font-inter text-xs transition-colors">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 9L9 2M4 2h5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Open in Google Maps
                </a>
              </div>

              {/* Ambulance details */}
              <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-red-500/10 border-b border-red-500/15 px-4 py-2.5">
                  <p className="text-red-300 font-inter font-semibold text-sm">🚑 Ambulance Details</p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2.5">
                  {[
                    ['Unit ID',     ambulance.id],
                    ['Vehicle',     ambulance.vehicle],
                    ['Driver',      ambulance.driver],
                    ['Driver Tel',  ambulance.phone],
                    ['Paramedic',   ambulance.paramedic],
                    ['Hospital',    ambulance.hospital],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-white/25 font-inter text-[10px] uppercase tracking-wide">{label}</p>
                      <p className="text-white/80 font-inter text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <a href={`tel:${ambulance.phone}`}
                    className="flex items-center justify-center gap-2 w-full bg-emerald-500/15
                               border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25
                               py-3 rounded-xl font-inter font-semibold text-sm transition-all">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M3 4a1 1 0 011-1h1.5l1.5 3.5-1.5 1.5a8.5 8.5 0 004 4l1.5-1.5L14 12v1.5a1 1 0 01-1 1A12 12 0 013 4z"
                            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    Call Driver: {ambulance.phone}
                  </a>
                </div>
              </div>

              {/* Notifications sent */}
              {notifLog.length > 0 && (
                <div>
                  <p className="text-white/30 text-[10px] font-inter uppercase tracking-widest mb-2">
                    📱 Alerts Sent to Contacts
                  </p>
                  <div className="space-y-2">
                    {notifLog.map((log, i) => (
                      <div key={i}
                        className="bg-white/3 border border-white/8 rounded-xl p-3 max-h-36
                                   overflow-y-auto scrollbar-hide">
                        <pre className="text-white/45 font-mono text-[10px] leading-relaxed
                                        whitespace-pre-wrap break-words">{log}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* First aid tips */}
              <div className="bg-yellow-500/6 border border-yellow-500/15 rounded-xl p-4">
                <p className="text-yellow-300 font-inter text-sm font-semibold mb-2">While waiting:</p>
                <ul className="text-yellow-300/55 font-inter text-xs space-y-1">
                  {[
                    '📍 Stay at this location. Keep your phone on.',
                    '🚪 Unlock the entrance / gate for ambulance.',
                    emergency.includes('Cardiac') ? '🫀 If trained, start CPR immediately.' :
                    emergency.includes('Bleeding') ? '🩸 Apply firm pressure on the wound.' :
                    emergency.includes('Burn') ? '💧 Cool with room-temperature water.' :
                    '🛌 Keep the patient still and calm.',
                    '⛔ Do NOT give food, water, or medication.',
                  ].map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-red-500/15 shrink-0 space-y-2">
              {/* Cancel Dispatch — stops ambulance */}
              {ambulance && (
                <button
                  onClick={() => {
                    // Stop any TTS / siren
                    window.speechSynthesis?.cancel()
                    // Reset to ready state — ambulance "cancelled"
                    setStep('ready')
                    setAmbulance(null)
                    setNotifLog([])
                    setDispatchPct(0)
                    setLiveLocation(null)
                    // Show a cancellation toast via a temp state
                    setCancelled(true)
                    setTimeout(() => setCancelled(false), 4000)
                  }}
                  className="w-full bg-red-500/15 border border-red-500/40 text-red-300
                             hover:bg-red-500/25 py-3 rounded-xl font-inter font-semibold
                             text-sm transition-all flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 0 15px rgba(239,68,68,0.15)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M5 8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  ⛔ Cancel Ambulance Dispatch
                </button>
              )}

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 border border-white/12 text-white/45 hover:text-white py-3
                             rounded-xl font-inter text-sm transition-all">Close</button>
                <button onClick={() => { setStep('ready'); setAmbulance(null); setNotifLog([]); setDispatchPct(0); setLiveLocation(null) }}
                  className="flex-1 bg-red-600/20 border border-red-500/30 text-red-300
                             hover:bg-red-600/30 py-3 rounded-xl font-inter text-sm transition-all">
                  New SOS
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
