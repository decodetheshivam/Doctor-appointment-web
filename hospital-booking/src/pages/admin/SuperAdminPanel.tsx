import { useState, useEffect } from 'react'
import {
  getAllHospitalAdmins,
  updateHospitalStatus,
  updateHospitalPassword,
  clearAdminSession,
  type HospitalAdmin,
  type HospitalStatus,
} from '../../data/adminAuth'
import { getAllRecords } from '../../data/medicalRecords'
import { getAppointments } from '../../data/appointments'
import SystemInfoPanel from './SystemInfoPanel'

type SuperTab = 'overview' | 'hospitals' | 'pending' | 'records' | 'system'
type FilterStatus = 'all' | HospitalStatus

function StatusBadge({ status }: { status: HospitalStatus }) {
  const MAP = {
    approved:  'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    pending:   'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
    rejected:  'bg-red-500/10 border-red-500/20 text-red-400',
    suspended: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  }
  return (
    <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border capitalize ${MAP[status]}`}>
      {status}
    </span>
  )
}

// ─── Hospital row actions modal ───────────────────────────────────────────────

function HospitalActionsModal({ hospital, onClose, onRefresh }: {
  hospital: HospitalAdmin
  onClose: () => void
  onRefresh: () => void
}) {
  const [newPwd, setNewPwd]     = useState('')
  const [rejReason, setRejReason] = useState(hospital.rejectionReason ?? '')
  const [msg, setMsg]           = useState('')

  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'

  function action(status: HospitalStatus) {
    updateHospitalStatus(hospital.id, status, rejReason || undefined)
    setMsg(`Status updated to ${status}`)
    onRefresh()
    setTimeout(onClose, 1200)
  }

  function resetPwd() {
    if (newPwd.length < 6) { setMsg('Password must be at least 6 chars'); return }
    updateHospitalPassword(hospital.id, newPwd)
    setMsg('Password reset successfully')
    setNewPwd('')
    onRefresh()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#071525] border border-white/12 rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div>
            <h2 className="text-white font-instrument text-xl">{hospital.hospitalName}</h2>
            <p className="text-white/35 font-inter text-xs">{hospital.email} · <StatusBadge status={hospital.status} /></p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {msg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <p className="text-emerald-400 font-inter text-sm">{msg}</p>
            </div>
          )}

          {/* Hospital details */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 grid grid-cols-2 gap-2">
            {[
              ['License', hospital.licenseNumber],
              ['Reg No.',  hospital.registrationNumber],
              ['Type',     hospital.hospitalType],
              ['Beds',     hospital.beds.toString()],
              ['City',     `${hospital.city}, ${hospital.state}`],
              ['Phone',    hospital.phone],
              ['Admin',    `${hospital.adminName}`],
              ['Registered', new Date(hospital.registeredAt).toLocaleDateString('en-IN')],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-white/25 font-inter text-[10px] uppercase tracking-wide">{label}</p>
                <p className="text-white/70 font-inter text-xs mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Status actions */}
          <div>
            <p className="text-white/35 text-[11px] font-inter uppercase tracking-widest mb-3">Change Status</p>
            {hospital.status !== 'approved' && (
              <div className="space-y-2 mb-2">
                {hospital.status === 'rejected' || hospital.status === 'pending' ? null : null}
                <input className={inp} placeholder="Rejection reason (optional)" value={rejReason}
                  onChange={e => setRejReason(e.target.value)} />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {hospital.status !== 'approved' && (
                <button onClick={() => action('approved')}
                  className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-inter px-4 py-2 rounded-lg transition-all">
                  ✓ Approve
                </button>
              )}
              {hospital.status !== 'rejected' && (
                <button onClick={() => action('rejected')}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-inter px-4 py-2 rounded-lg transition-all">
                  ✗ Reject
                </button>
              )}
              {hospital.status !== 'suspended' && (
                <button onClick={() => action('suspended')}
                  className="bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-xs font-inter px-4 py-2 rounded-lg transition-all">
                  ⊘ Suspend
                </button>
              )}
              {hospital.status === 'suspended' && (
                <button onClick={() => action('approved')}
                  className="bg-white/8 border border-white/15 text-white/70 hover:bg-white/12 text-xs font-inter px-4 py-2 rounded-lg transition-all">
                  ↺ Reactivate
                </button>
              )}
            </div>
          </div>

          {/* Password reset */}
          <div>
            <p className="text-white/35 text-[11px] font-inter uppercase tracking-widest mb-3">Reset Password</p>
            <div className="flex gap-2">
              <input className={`${inp} flex-1`} type="password" placeholder="New password for hospital admin"
                value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              <button onClick={resetPwd}
                className="bg-white text-[#030d18] px-4 py-3 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow shrink-0">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SuperAdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab]             = useState<SuperTab>('overview')
  const [hospitals, setHospitals] = useState<HospitalAdmin[]>([])
  const [filter, setFilter]       = useState<FilterStatus>('all')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<HospitalAdmin | null>(null)
  // Super admin own password
  const [superPwd, setSuperPwd]   = useState('')
  const [superConfirm, setSuperConfirm] = useState('')
  const [superPwdMsg, setSuperPwdMsg]   = useState('')

  useEffect(() => { loadHospitals() }, [])

  function loadHospitals() {
    setHospitals(getAllHospitalAdmins().sort((a,b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()))
  }

  function handleLogout() { clearAdminSession(); onLogout() }

  const pending   = hospitals.filter((h) => h.status === 'pending')
  const approved  = hospitals.filter((h) => h.status === 'approved')
  const allRecords = getAllRecords()
  const allAppts   = getAppointments()

  const filteredHospitals = hospitals.filter((h) => {
    const matchFilter = filter === 'all' || h.status === filter
    const matchSearch = !search ||
      h.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
      h.email.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase()) ||
      h.licenseNumber.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // Super admin password change (updates localStorage super admin override)
  function handleSuperPwdChange(e: React.FormEvent) {
    e.preventDefault()
    if (superPwd.length < 8) { setSuperPwdMsg('Min 8 characters'); return }
    if (superPwd !== superConfirm) { setSuperPwdMsg('Passwords do not match'); return }
    // Store override in localStorage
    localStorage.setItem('mediconnect_super_pwd_override', superPwd)
    setSuperPwdMsg('Password updated. Takes effect on next login.')
    setSuperPwd(''); setSuperConfirm('')
    setTimeout(() => setSuperPwdMsg(''), 4000)
  }

  const TABS: { key: SuperTab; label: string; icon: string }[] = [
    { key:'overview',  label:'Overview',   icon:'📊' },
    { key:'pending',   label:`Pending (${pending.length})`, icon:'⏳' },
    { key:'hospitals', label:'Hospitals',  icon:'🏥' },
    { key:'records',   label:'All Records', icon:'📋' },
    { key:'system',    label:'System Info',  icon:'🖥️' },
  ]

  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'

  return (
    <div className="min-h-screen bg-[#030d18] flex flex-col">
      {/* Top bar */}
      <header className="bg-[#071525]/90 backdrop-blur-sm border-b border-white/8 px-4 md:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l5 3v4l-5 3-5-3V5z" stroke="white" strokeWidth="1.3"/></svg>
          </div>
          <div>
            <p className="text-white font-inter font-semibold text-sm leading-tight">Super Admin</p>
            <p className="text-white/35 font-inter text-xs">MediConnect Master Panel</p>
          </div>
        </div>
        {pending.length > 0 && (
          <button onClick={() => setTab('pending')}
            className="flex items-center gap-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-inter px-3 py-1.5 rounded-full animate-pulse">
            {pending.length} pending approval{pending.length !== 1 ? 's' : ''}
          </button>
        )}
        <button onClick={handleLogout}
          className="text-white/40 hover:text-white font-inter text-xs border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-lg transition-all">
          Sign Out
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-16 md:w-56 bg-[#050f1e] border-r border-white/6 flex flex-col py-4 shrink-0">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left
                         ${tab === t.key
                           ? 'bg-white/8 text-white border-r-2 border-white'
                           : 'text-white/40 hover:text-white hover:bg-white/4'}`}>
              <span className="text-lg shrink-0">{t.icon}</span>
              <span className="hidden md:block font-inter text-sm">{t.label}</span>
            </button>
          ))}

          {/* Settings / password */}
          <div className="mt-auto px-4 space-y-2">
            <div className="border-t border-white/6 pt-4">
              <p className="text-white/20 font-inter text-[10px] uppercase tracking-wide hidden md:block mb-2">Super Admin</p>
              <form onSubmit={handleSuperPwdChange} className="space-y-2">
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 text-xs font-inter focus:outline-none"
                  type="password" placeholder="New password" value={superPwd} onChange={e=>setSuperPwd(e.target.value)}/>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 text-xs font-inter focus:outline-none"
                  type="password" placeholder="Confirm" value={superConfirm} onChange={e=>setSuperConfirm(e.target.value)}/>
                <button type="submit" className="w-full bg-white/10 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 py-1.5 rounded-lg text-xs font-inter transition-all">
                  Update Password
                </button>
                {superPwdMsg && <p className="text-emerald-400 text-[10px] font-inter">{superPwdMsg}</p>}
              </form>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <h2 className="font-instrument text-white text-2xl md:text-3xl">Platform Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label:'Total Hospitals',    value: hospitals.length,    color:'text-white',       icon:'🏥' },
                  { label:'Approved',           value: approved.length,     color:'text-emerald-400', icon:'✅' },
                  { label:'Pending Review',     value: pending.length,      color:'text-yellow-400',  icon:'⏳' },
                  { label:'Medical Records',    value: allRecords.length,   color:'text-blue-400',    icon:'📋' },
                  { label:'Total Appointments', value: allAppts.length,     color:'text-purple-400',  icon:'📅' },
                  { label:'Confirmed Appts',    value: allAppts.filter(a=>a.status==='confirmed').length, color:'text-emerald-400', icon:'✓' },
                  { label:'Cities',             value: new Set(hospitals.map(h=>h.city)).size, color:'text-cyan-400', icon:'🌆' },
                  { label:'Specialties',        value: new Set(hospitals.flatMap(h=>h.specialties)).size, color:'text-pink-400', icon:'🔬' },
                ].map(({label, value, color, icon}) => (
                  <div key={label} className="bg-white/4 border border-white/8 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{icon}</span>
                      <span className={`font-inter font-bold text-2xl ${color}`}>{value}</span>
                    </div>
                    <p className="text-white/35 font-inter text-xs">{label}</p>
                  </div>
                ))}
              </div>

              {/* Recent registrations */}
              <div>
                <h3 className="text-white font-inter font-semibold mb-3">Recent Hospital Registrations</h3>
                <div className="space-y-2">
                  {hospitals.slice(0,5).map((h) => (
                    <div key={h.id} className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-white/15 transition-all"
                      onClick={() => setSelected(h)}>
                      <div>
                        <p className="text-white font-inter font-medium text-sm">{h.hospitalName}</p>
                        <p className="text-white/40 font-inter text-xs">{h.city}, {h.state} · {h.email}</p>
                      </div>
                      <StatusBadge status={h.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PENDING ── */}
          {tab === 'pending' && (
            <div className="space-y-4">
              <h2 className="font-instrument text-white text-2xl">Pending Approvals ({pending.length})</h2>
              {pending.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <span className="text-5xl mb-4">✅</span>
                  <p className="text-white/40 font-inter text-sm">All caught up! No pending registrations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.map((h) => (
                    <div key={h.id} className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-6">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <StatusBadge status={h.status} />
                            <span className="text-white/20 font-inter text-[10px]">
                              {new Date(h.registeredAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                            </span>
                          </div>
                          <h3 className="text-white font-inter font-semibold text-base">{h.hospitalName}</h3>
                          <p className="text-white/50 font-inter text-sm mt-0.5">{h.adminName} · {h.adminDesignation}</p>
                          <p className="text-white/35 font-inter text-xs mt-0.5">{h.city}, {h.state} · {h.email}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-white/25 font-inter text-[10px] px-2 py-0.5 bg-white/4 rounded-md">{h.hospitalType}</span>
                            <span className="text-white/25 font-inter text-[10px] px-2 py-0.5 bg-white/4 rounded-md">{h.beds} beds</span>
                            <span className="text-white/25 font-inter text-[10px] px-2 py-0.5 bg-white/4 rounded-md">Est. {h.establishedYear}</span>
                            <span className="text-white/25 font-inter text-[10px] px-2 py-0.5 bg-white/4 rounded-md">License: {h.licenseNumber}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { updateHospitalStatus(h.id,'approved'); loadHospitals() }}
                            className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-inter px-4 py-2 rounded-lg transition-all">
                            ✓ Approve
                          </button>
                          <button onClick={() => setSelected(h)}
                            className="bg-white/8 border border-white/15 text-white/60 hover:text-white text-xs font-inter px-4 py-2 rounded-lg transition-all">
                            More
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ALL HOSPITALS ── */}
          {tab === 'hospitals' && (
            <div className="space-y-4">
              <h2 className="font-instrument text-white text-2xl">All Hospitals ({hospitals.length})</h2>
              {/* Filter + search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  <input className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors"
                    placeholder="Search hospital, email, city, license..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-inter focus:outline-none appearance-none min-w-[160px]"
                  value={filter} onChange={e=>setFilter(e.target.value as FilterStatus)}>
                  <option value="all" className="bg-[#071525]">All Status</option>
                  <option value="approved" className="bg-[#071525]">Approved</option>
                  <option value="pending" className="bg-[#071525]">Pending</option>
                  <option value="rejected" className="bg-[#071525]">Rejected</option>
                  <option value="suspended" className="bg-[#071525]">Suspended</option>
                </select>
              </div>

              <div className="space-y-3">
                {filteredHospitals.map((h) => (
                  <div key={h.id}
                    className="bg-white/4 border border-white/8 hover:border-white/15 rounded-2xl p-5 cursor-pointer transition-all duration-200"
                    onClick={() => setSelected(h)}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={h.status} />
                          <span className="text-white/20 font-inter text-[10px]">{h.id}</span>
                        </div>
                        <p className="text-white font-inter font-semibold">{h.hospitalName}</p>
                        <p className="text-white/50 font-inter text-xs mt-0.5">{h.city}, {h.state} · {h.hospitalType}</p>
                        <p className="text-white/30 font-inter text-xs">{h.email} · {h.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 font-inter text-xs">{h.beds} beds · Est. {h.establishedYear}</p>
                        <p className="text-white/25 font-inter text-[10px] mt-1">
                          {new Date(h.registeredAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredHospitals.length === 0 && (
                  <p className="text-white/25 font-inter text-sm text-center py-10">No hospitals match your search.</p>
                )}
              </div>
            </div>
          )}

          {/* ── ALL RECORDS ── */}
          {tab === 'records' && (
            <div className="space-y-4">
              <h2 className="font-instrument text-white text-2xl">All Medical Records ({allRecords.length})</h2>
              {allRecords.length === 0
                ? <p className="text-white/30 font-inter text-sm">No records in the system yet.</p>
                : (
                  <div className="space-y-3">
                    {[...allRecords].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map((r) => (
                      <div key={r.id} className="bg-white/4 border border-white/8 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <p className="text-white font-inter font-semibold text-sm">{r.patientName}</p>
                            <p className="text-white/50 font-inter text-xs mt-0.5">{r.diagnosis}</p>
                            <p className="text-white/30 font-inter text-xs">{r.hospitalName} · {r.doctorName} · +91 {r.patientPhone}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-white/25 font-inter text-[10px]">{r.id}</span>
                            <p className="text-white/40 font-inter text-xs mt-0.5">{new Date(r.date).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* ── SYSTEM INFO ── */}
          {tab === 'system' && <SystemInfoPanel />}
        </main>
      </div>

      {selected && (
        <HospitalActionsModal
          hospital={selected}
          onClose={() => setSelected(null)}
          onRefresh={() => { loadHospitals(); setSelected(null) }}
        />
      )}
    </div>
  )
}
