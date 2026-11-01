import { useState, useEffect } from 'react'
import { getPatientSession } from '../data/patientAuth'
import {
  getPrescriptionsByPatient, getTodaySchedule, getFinishingSoon,
  markAdherence, seedDemoPrescriptions,
  type Prescription, type ScheduledDose,
} from '../data/prescriptions'
import { formatDate, formatTime } from '../data/appointments'

const MED_STATUS: Record<string, string> = {
  active:    'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  completed: 'bg-white/8 border-white/15 text-white/40',
  stopped:   'bg-red-500/10 border-red-500/20 text-red-400',
}

const DOSE_STATUS: Record<string, string> = {
  pending: 'bg-white/5 border-white/10 text-white/40',
  taken:   'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  missed:  'bg-red-500/10 border-red-500/20 text-red-400',
}

type Tab = 'prescriptions' | 'schedule' | 'reminders'

export default function PrescriptionsPage() {
  const [tab, setTab] = useState<Tab>('prescriptions')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [schedule, setSchedule] = useState<ScheduledDose[]>([])
  const [finishing, setFinishing] = useState(getFinishingSoon(''))
  const [expanded, setExpanded] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const patient = getPatientSession()

  useEffect(() => {
    seedDemoPrescriptions()
    if (patient) {
      setPrescriptions(getPrescriptionsByPatient(patient.phone))
      setSchedule(getTodaySchedule(patient.phone))
      setFinishing(getFinishingSoon(patient.phone))
    }
  }, [patient, refreshKey])

  function refresh() { setRefreshKey((k) => k + 1) }

  function handleMarkDose(dose: ScheduledDose, status: 'taken' | 'missed') {
    if (!patient) return
    // Find the prescription this medicine belongs to
    const rx = prescriptions.find((p) =>
      p.medicines.some((m) => m.id === dose.medicineId)
    )
    if (!rx) return
    markAdherence(rx.id, dose.medicineId, dose.date, dose.time, status)
    refresh()
  }

  function downloadPDF(rx: Prescription) {
    const win = window.open('', '_blank')
    if (!win) return
    const medsHtml = rx.medicines.map((m, i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${m.name}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${m.dosage}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${m.frequency}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${m.duration}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${m.instructions}</td>
      </tr>
    `).join('')

    win.document.write(`
      <html><head><title>Prescription ${rx.id}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:800px;margin:0 auto}
        .header{display:flex;justify-content:space-between;border-bottom:2px solid #0A4267;padding-bottom:16px;margin-bottom:24px}
        .hospital{color:#0A4267;font-size:20px;font-weight:bold}
        .rx-id{color:#666;font-size:12px}
        .patient-box{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;display:flex;gap:40px}
        .patient-box div{font-size:13px;color:#374151}
        .patient-box strong{color:#111827}
        table{width:100%;border-collapse:collapse;margin-bottom:20px}
        th{background:#0A4267;color:white;padding:10px 8px;text-align:left;font-size:12px}
      </style></head><body>
        <div class="header">
          <div>
            <div class="hospital">${rx.hospitalName}</div>
            <div style="font-size:12px;color:#666;margin-top:4px">${rx.specialty} · ${rx.doctorName}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:bold">Digital Prescription</div>
            <div class="rx-id">ID: ${rx.id}</div>
            <div class="rx-id">Date: ${formatDate(rx.date)}</div>
          </div>
        </div>
        <div class="patient-box">
          <div><strong>Patient:</strong> ${rx.patientName}</div>
          <div><strong>Phone:</strong> +91 ${rx.patientPhone}</div>
          <div><strong>Diagnosis:</strong> ${rx.diagnosis}</div>
        </div>
        <table>
          <thead><tr>
            <th style="width:30px">#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th>
          </tr></thead>
          <tbody>${medsHtml}</tbody>
        </table>
        ${rx.advice ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin-bottom:16px"><strong>Advice:</strong> ${rx.advice}</div>` : ''}
        <div style="margin-top:40px;border-top:1px solid #e5e7eb;padding-top:16px;display:flex;justify-content:space-between">
          <div style="font-size:11px;color:#9ca3af">This is a digitally generated prescription from MediConnect platform.</div>
          <div style="text-align:right;font-size:12px;color:#374151"><strong>${rx.doctorName}</strong><br>${rx.specialty}</div>
        </div>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <span className="text-5xl mb-4">🔐</span>
        <p className="text-white/40 font-inter text-sm">Please sign in to view your prescriptions.</p>
      </div>
    )
  }

  const activeRx = prescriptions.filter((p) => p.status === 'active')
  const completedRx = prescriptions.filter((p) => p.status === 'completed' || p.status === 'archived')

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-instrument text-white text-3xl md:text-4xl">Prescriptions & Medicines</h1>
          <p className="text-white/35 font-inter text-sm mt-1">
            {activeRx.length} active · {prescriptions.length} total
          </p>
        </div>
        {/* Finishing soon alert */}
        {finishing.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-amber-400 text-lg">⚠️</span>
            <div>
              <p className="text-amber-300 font-inter text-xs font-semibold">Course ending soon</p>
              <p className="text-amber-300/60 font-inter text-[10px]">
                {finishing.map((f) => `${f.medicineName} (${f.daysLeft}d left)`).join(' · ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/4 border border-white/8 rounded-xl p-1 max-w-md">
        {([
          { key: 'prescriptions', label: 'Prescriptions', count: prescriptions.length },
          { key: 'schedule', label: "Today's Schedule", count: schedule.length },
          { key: 'reminders', label: 'Reminders', count: finishing.length },
        ] as { key: Tab; label: string; count: number }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-inter font-medium transition-all
                       ${tab === t.key ? 'bg-white text-[#030d18]' : 'text-white/50 hover:text-white'}`}>
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 ${tab === t.key ? 'text-[#030d18]/50' : 'text-white/30'}`}>({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Prescriptions Tab ── */}
      {tab === 'prescriptions' && (
        <div className="space-y-4">
          {/* Active prescriptions */}
          {activeRx.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-white/50 font-inter text-xs uppercase tracking-widest">Active</h2>
              {activeRx.map((rx) => (
                <PrescriptionCard key={rx.id} rx={rx} expanded={expanded === rx.id}
                  onToggle={() => setExpanded(expanded === rx.id ? null : rx.id)}
                  onDownload={() => downloadPDF(rx)} />
              ))}
            </div>
          )}
          {/* Completed prescriptions */}
          {completedRx.length > 0 && (
            <div className="space-y-3 pt-4">
              <h2 className="text-white/50 font-inter text-xs uppercase tracking-widest">History</h2>
              {completedRx.map((rx) => (
                <PrescriptionCard key={rx.id} rx={rx} expanded={expanded === rx.id}
                  onToggle={() => setExpanded(expanded === rx.id ? null : rx.id)}
                  onDownload={() => downloadPDF(rx)} />
              ))}
            </div>
          )}
          {prescriptions.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <span className="text-5xl mb-4">💊</span>
              <p className="text-white/40 font-inter text-sm">No prescriptions yet.</p>
              <p className="text-white/25 font-inter text-xs mt-1">Your prescriptions will appear here after a doctor's visit.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Schedule Tab ── */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <h2 className="font-instrument text-white text-2xl">Today's Medicine Schedule</h2>
          <p className="text-white/35 font-inter text-sm">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {schedule.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <span className="text-5xl mb-4">✅</span>
              <p className="text-white/40 font-inter text-sm">No medicines scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedule.map((dose, i) => (
                <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-4 flex items-center gap-4">
                  {/* Time */}
                  <div className="text-center shrink-0 w-16">
                    <p className="text-white font-inter font-bold text-sm">{formatTime(dose.time)}</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  {/* Medicine info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💊</span>
                      <p className="text-white font-inter font-semibold text-sm">{dose.medicineName}</p>
                      <span className="text-white/40 font-inter text-xs">{dose.dosage}</span>
                    </div>
                    {dose.instructions && (
                      <p className="text-white/35 font-inter text-xs mt-0.5">{dose.instructions}</p>
                    )}
                  </div>
                  {/* Status badge */}
                  <span className={`text-[10px] font-inter px-2.5 py-0.5 rounded-full border capitalize ${DOSE_STATUS[dose.status]}`}>
                    {dose.status}
                  </span>
                  {/* Action buttons */}
                  {dose.status === 'pending' && (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleMarkDose(dose, 'taken')}
                        className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25
                                   text-xs font-inter px-3 py-1.5 rounded-lg transition-all">
                        ✓ Taken
                      </button>
                      <button onClick={() => handleMarkDose(dose, 'missed')}
                        className="bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/10
                                   text-xs font-inter px-3 py-1.5 rounded-lg transition-all">
                        ✗ Missed
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reminders Tab ── */}
      {tab === 'reminders' && (
        <div className="space-y-6">
          {/* Upcoming doses today */}
          <div>
            <h2 className="font-instrument text-white text-2xl mb-4">Upcoming Reminders</h2>
            {(() => {
              const now = new Date().toTimeString().slice(0, 5)
              const upcoming = schedule.filter((d) => d.status === 'pending' && d.time >= now)
              if (upcoming.length === 0) return (
                <div className="flex flex-col items-center py-12 text-center bg-white/4 border border-white/8 rounded-2xl">
                  <span className="text-3xl mb-3">✅</span>
                  <p className="text-white/40 font-inter text-sm">All caught up! No upcoming reminders.</p>
                </div>
              )
              return (
                <div className="space-y-2">
                  {upcoming.map((dose, i) => (
                    <div key={i} className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-4 flex items-center gap-3">
                      <span className="text-xl">⏰</span>
                      <div className="flex-1">
                        <p className="text-white font-inter text-sm font-medium">{dose.medicineName} {dose.dosage}</p>
                        <p className="text-white/40 font-inter text-xs">at {formatTime(dose.time)} · {dose.instructions || 'No special instructions'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Course finishing alerts */}
          <div>
            <h2 className="font-instrument text-white text-2xl mb-4">Course Ending Soon</h2>
            {finishing.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center bg-white/4 border border-white/8 rounded-2xl">
                <span className="text-3xl mb-3">✅</span>
                <p className="text-white/40 font-inter text-sm">No medicines are running out soon.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {finishing.map((f, i) => (
                  <div key={i} className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-amber-300 font-inter text-sm font-medium">{f.medicineName}</p>
                      <p className="text-amber-300/50 font-inter text-xs">Only {f.daysLeft} day{f.daysLeft !== 1 ? 's' : ''} left in this course</p>
                    </div>
                    <span className="text-amber-400/60 font-inter text-xs">Refill needed</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

// ─── Prescription Card Component ─────────────────────────────────────────────

function PrescriptionCard({ rx, expanded, onToggle, onDownload }: {
  rx: Prescription
  expanded: boolean
  onToggle: () => void
  onDownload: () => void
}) {
  const activeMeds = rx.medicines.filter((m) => m.status === 'active')
  return (
    <div className="bg-white/4 border border-white/8 hover:border-white/15 rounded-2xl overflow-hidden transition-all">
      {/* Header row */}
      <div className="p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[10px] font-inter px-2.5 py-0.5 rounded-full border capitalize ${MED_STATUS[rx.status] || MED_STATUS.active}`}>{rx.status}</span>
              <span className="text-white/20 font-inter text-[10px]">{rx.id}</span>
            </div>
            <p className="text-white font-inter font-semibold">{rx.diagnosis}</p>
            <p className="text-white/40 font-inter text-xs mt-0.5">{rx.doctorName} · {rx.specialty}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-white/30 font-inter text-xs">{formatDate(rx.date)}</p>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); onDownload() }}
                className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/12 hover:border-white/25
                           text-white/60 hover:text-white text-xs font-inter px-3 py-1.5 rounded-lg transition-all">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v8M3 6l3 3 3-3M2 11h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                PDF
              </button>
              <button onClick={onToggle}
                className="bg-white/8 hover:bg-white/15 border border-white/12 hover:border-white/25 text-white/60 hover:text-white
                           text-xs font-inter px-3 py-1.5 rounded-lg transition-all">
                {expanded ? '▲' : '▼'}
              </button>
            </div>
          </div>
        </div>
        {/* Medicine pills */}
        {activeMeds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/6 flex flex-wrap gap-1.5">
            {activeMeds.map((m, i) => (
              <span key={i} className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${MED_STATUS[m.status]}`}>
                {m.name} {m.dosage}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/8 p-5 space-y-4" style={{ animation: 'chatbot-in 0.3s ease both' }}>
          {/* Patient info */}
          <div className="flex gap-6 text-xs font-inter">
            <div><span className="text-white/30">Patient: </span><span className="text-white/70">{rx.patientName}</span></div>
            <div><span className="text-white/30">Hospital: </span><span className="text-white/70">{rx.hospitalName}</span></div>
          </div>

          {/* Advice */}
          {rx.advice && (
            <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3">
              <p className="text-blue-300/70 font-inter text-xs leading-relaxed"><strong className="text-blue-300">Doctor's Advice:</strong> {rx.advice}</p>
            </div>
          )}

          {/* Medicine table */}
          <div>
            <p className="text-white/40 font-inter text-xs uppercase tracking-widest mb-2">Prescribed Medicines</p>
            <div className="space-y-2">
              {rx.medicines.map((m, i) => (
                <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💊</span>
                      <p className="text-white font-inter font-medium text-sm">{m.name}</p>
                      <span className="text-white/40 font-inter text-xs">{m.dosage}</span>
                    </div>
                    <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${MED_STATUS[m.status]}`}>{m.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-inter text-white/40 ml-7">
                    <span>⏰ {m.frequency}</span>
                    <span>📅 {m.duration}</span>
                    {m.instructions && <span>📝 {m.instructions}</span>}
                    {m.reminderTimes.length > 0 && <span>🔔 Reminders: {m.reminderTimes.map((t) => formatTime(t)).join(', ')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
