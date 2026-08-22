import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import {
  getRecordsByPatient,
  deleteRecord,
  seedDemoRecords,
  type MedicalRecord,
  type Medicine,
  type LabReport,
} from '../data/medicalRecords'
import { formatDate } from '../data/appointments'

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Tab = 'records' | 'medicines' | 'reports'

const VISIT_LABELS: Record<MedicalRecord['visitType'], string> = {
  consultation: 'Consultation',
  'follow-up': 'Follow-up',
  emergency: 'Emergency',
  'routine-checkup': 'Routine Checkup',
}

const VISIT_COLORS: Record<MedicalRecord['visitType'], string> = {
  consultation:    'bg-blue-500/15 border-blue-500/30 text-blue-300',
  'follow-up':     'bg-purple-500/15 border-purple-500/30 text-purple-300',
  emergency:       'bg-red-500/15 border-red-500/30 text-red-300',
  'routine-checkup':'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
}

const MED_STATUS_COLORS: Record<Medicine['status'], string> = {
  active:    'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  completed: 'bg-white/8 border-white/15 text-white/40',
  stopped:   'bg-red-500/10 border-red-500/20 text-red-400/70',
}

const LAB_STATUS_COLORS: Record<LabReport['status'], string> = {
  normal:   'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  abnormal: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  pending:  'bg-white/8 border-white/15 text-white/40',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VitalChip({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col items-center bg-white/5 border border-white/8 rounded-xl px-4 py-3 min-w-[90px]">
      <span className="text-white font-inter font-semibold text-sm">{value}</span>
      <span className="text-white/35 font-inter text-[10px] mt-0.5 text-center">{label}</span>
    </div>
  )
}

function RecordDetailModal({
  record,
  onClose,
}: {
  record: MedicalRecord
  onClose: () => void
}) {
  const [tab, setTab] = useState<'overview' | 'medicines' | 'reports'>('overview')
  const ref = useRef<HTMLDivElement>(null)

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const activeMeds = record.medicines.filter((m) => m.status === 'active')
  const pastMeds   = record.medicines.filter((m) => m.status !== 'active')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        ref={ref}
        className="w-full max-w-2xl max-h-[90vh] bg-[#071525] border border-white/12 rounded-2xl
                   overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-white/8 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-inter px-2.5 py-0.5 rounded-full border
                               ${VISIT_COLORS[record.visitType]}`}>
                {VISIT_LABELS[record.visitType]}
              </span>
              <span className="text-white/25 text-xs font-inter">{record.id}</span>
            </div>
            <h2 className="text-white font-instrument text-2xl">{record.diagnosis}</h2>
            <p className="text-white/45 font-inter text-sm mt-0.5">
              {formatDate(record.date)} · {record.doctorName} · {record.hospitalName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors shrink-0
                       w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {(['overview', 'medicines', 'reports'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-inter capitalize transition-all duration-200
                         ${tab === t
                           ? 'bg-white/10 text-white border border-white/15'
                           : 'text-white/40 hover:text-white/70'}`}
            >
              {t === 'medicines' ? `Medicines (${record.medicines.length})` :
               t === 'reports'   ? `Lab Reports (${record.labReports.length})` :
               'Overview'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 scrollbar-hide">
          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Vitals */}
              {(record.bloodPressure || record.temperature || record.weight || record.heartRate) && (
                <div>
                  <p className="text-white/35 text-[11px] font-inter uppercase tracking-widest mb-3">Vitals</p>
                  <div className="flex flex-wrap gap-2">
                    <VitalChip label="Blood Pressure" value={record.bloodPressure} />
                    <VitalChip label="Heart Rate"     value={record.heartRate} />
                    <VitalChip label="Temperature"    value={record.temperature} />
                    <VitalChip label="Weight"         value={record.weight} />
                  </div>
                </div>
              )}

              {/* Chief Complaint */}
              <div>
                <p className="text-white/35 text-[11px] font-inter uppercase tracking-widest mb-2">Chief Complaint</p>
                <p className="text-white/75 font-inter text-sm leading-relaxed bg-white/3 border border-white/6 rounded-xl p-4">
                  {record.chiefComplaint}
                </p>
              </div>

              {/* Diagnosis */}
              <div>
                <p className="text-white/35 text-[11px] font-inter uppercase tracking-widest mb-2">Diagnosis</p>
                <p className="text-white/80 font-inter text-sm leading-relaxed bg-white/3 border border-white/6 rounded-xl p-4">
                  {record.diagnosis}
                </p>
              </div>

              {/* Doctor Notes */}
              <div>
                <p className="text-white/35 text-[11px] font-inter uppercase tracking-widest mb-2">Doctor's Notes</p>
                <p className="text-white/65 font-inter text-sm leading-relaxed bg-white/3 border border-white/6 rounded-xl p-4">
                  {record.notes}
                </p>
              </div>

              {/* Follow-up */}
              {record.followUpDate && (
                <div className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="3" width="14" height="13" rx="2" stroke="#60a5fa" strokeWidth="1.3"/>
                    <path d="M2 7h14M6 2v2M12 2v2" stroke="#60a5fa" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <p className="text-blue-300 font-inter text-sm font-medium">
                      Follow-up scheduled
                    </p>
                    <p className="text-blue-300/60 font-inter text-xs mt-0.5">
                      {formatDate(record.followUpDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MEDICINES TAB ── */}
          {tab === 'medicines' && (
            <div className="space-y-4">
              {record.medicines.length === 0 ? (
                <p className="text-white/30 font-inter text-sm text-center py-10">
                  No medicines recorded for this visit.
                </p>
              ) : (
                <>
                  {activeMeds.length > 0 && (
                    <div>
                      <p className="text-emerald-400 text-[11px] font-inter uppercase tracking-widest mb-3">
                        Active ({activeMeds.length})
                      </p>
                      <div className="space-y-3">
                        {activeMeds.map((m, i) => (
                          <MedicineCard key={i} medicine={m} />
                        ))}
                      </div>
                    </div>
                  )}
                  {pastMeds.length > 0 && (
                    <div>
                      <p className="text-white/30 text-[11px] font-inter uppercase tracking-widest mb-3 mt-5">
                        Past / Completed ({pastMeds.length})
                      </p>
                      <div className="space-y-3">
                        {pastMeds.map((m, i) => (
                          <MedicineCard key={i} medicine={m} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── REPORTS TAB ── */}
          {tab === 'reports' && (
            <div className="space-y-3">
              {record.labReports.length === 0 ? (
                <p className="text-white/30 font-inter text-sm text-center py-10">
                  No lab reports for this visit.
                </p>
              ) : (
                record.labReports.map((r, i) => (
                  <LabReportCard key={i} report={r} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MedicineCard({ medicine: m }: { medicine: Medicine }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0A4267]/60 to-[#20658E]/40
                        border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="6" width="12" height="4" rx="2" stroke="white" strokeWidth="1.3"/>
            <path d="M8 6V3M8 10v3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="text-white font-inter font-semibold text-sm">{m.name}</p>
          <p className="text-white/50 font-inter text-xs mt-0.5">
            {m.dosage} · {m.frequency}
          </p>
          <p className="text-white/35 font-inter text-xs mt-1">{m.instructions}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border capitalize
                         ${MED_STATUS_COLORS[m.status]}`}>
          {m.status}
        </span>
        <span className="text-white/25 font-inter text-[10px]">{m.duration}</span>
      </div>
    </div>
  )
}

function LabReportCard({ report: r }: { report: LabReport }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-white font-inter font-semibold text-sm">{r.name}</p>
        <p className="text-white/60 font-inter text-xs mt-0.5">{r.result}</p>
        {r.value && (
          <p className="text-white/80 font-inter text-sm font-medium mt-1">{r.value}</p>
        )}
        {r.referenceRange && (
          <p className="text-white/25 font-inter text-[10px] mt-0.5">
            Reference: {r.referenceRange}
          </p>
        )}
      </div>
      <span className={`shrink-0 text-[10px] font-inter px-2.5 py-1 rounded-full border capitalize
                       ${LAB_STATUS_COLORS[r.status]}`}>
        {r.status}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MedicalRecordsPage() {
  const { navigate } = useApp()
  const [phone, setPhone]           = useState('')
  const [inputPhone, setInputPhone] = useState('')
  const [records, setRecords]       = useState<MedicalRecord[]>([])
  const [activeTab, setActiveTab]   = useState<Tab>('records')
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [deletingId, setDeletingId]         = useState<string | null>(null)
  const [searched, setSearched]     = useState(false)  // seed demo data on mount
  useEffect(() => { seedDemoRecords() }, [])

  function loadRecords(p: string) {
    setRecords(getRecordsByPatient(p))
    setSearched(true)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(inputPhone)) return
    setPhone(inputPhone)
    loadRecords(inputPhone)
  }

  function refresh() {
    if (phone) loadRecords(phone)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this record? This cannot be undone.')) return
    setDeletingId(id)
    setTimeout(() => {
      deleteRecord(id)
      refresh()
      setDeletingId(null)
    }, 400)
  }

  // ── Derived data for Medicines and Reports tabs ──
  const allMedicines: (Medicine & { recordId: string; date: string; doctorName: string })[] =
    records.flatMap((r) => r.medicines.map((m) => ({ ...m, recordId: r.id, date: r.date, doctorName: r.doctorName })))

  const allReports: (LabReport & { recordId: string; date: string; doctorName: string })[] =
    records.flatMap((r) => r.labReports.map((l) => ({ ...l, recordId: r.id, date: r.date, doctorName: r.doctorName })))

  const activeMeds   = allMedicines.filter((m) => m.status === 'active')
  const abnormalLabs = allReports.filter((r) => r.status === 'abnormal')

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto">

        {/* ── Back ── */}
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-inter mb-6 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-instrument text-white text-4xl md:text-6xl leading-tight">
              Medical <span className="italic">Records</span>
            </h1>
            <p className="text-white/40 font-inter text-sm mt-2">
              View your complete health history — visits, prescriptions, and lab reports
            </p>
          </div>
          {phone && (
            <div className="flex items-center gap-2 bg-blue-500/8 border border-blue-500/15 rounded-xl px-4 py-2.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#60a5fa" strokeWidth="1.2"/>
                <path d="M7 4.5v3.5" stroke="#60a5fa" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="7" cy="10" r="0.6" fill="#60a5fa"/>
              </svg>
              <p className="text-blue-300/70 font-inter text-xs">
                Records are added by your doctor at the hospital
              </p>
            </div>
          )}
        </div>

        {/* ── Phone search card ── */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 mb-8">
          <p className="text-white/50 text-xs font-inter uppercase tracking-widest mb-3">
            Find your records by mobile number
          </p>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-inter text-sm">+91</span>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl
                           pl-12 pr-4 py-3 text-white placeholder:text-white/25 text-sm font-inter
                           focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!/^[6-9]\d{9}$/.test(inputPhone)}
              className="bg-white text-[#030d18] px-6 py-3 rounded-xl font-inter font-semibold text-sm
                         hover:bg-white/90 disabled:opacity-40 transition-all button-glow"
            >
              Search
            </button>
          </form>
          <p className="text-white/20 font-inter text-xs mt-2">
            Try <button onClick={() => { setInputPhone('9999999999'); }}
              className="text-blue-400/60 hover:text-blue-400 underline transition-colors bg-transparent border-none cursor-pointer">
              9999999999
            </button> to see demo records.
          </p>
        </div>

        {/* ── Results ── */}
        {searched && phone && (
          <>
            {/* Summary pills */}
            {records.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { label: 'Total Visits',   value: records.length,       color: 'text-white' },
                  { label: 'Active Medicines', value: activeMeds.length,  color: 'text-emerald-400' },
                  { label: 'Abnormal Reports', value: abnormalLabs.length, color: abnormalLabs.length > 0 ? 'text-yellow-400' : 'text-white' },
                ].map(({ label, value, color }) => (
                  <div key={label}
                    className="bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className={`font-inter font-bold text-lg ${color}`}>{value}</span>
                    <span className="text-white/40 font-inter text-xs">{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            {records.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
                {([
                  { key: 'records',   label: `Visit Records (${records.length})` },
                  { key: 'medicines', label: `All Medicines (${allMedicines.length})` },
                  { key: 'reports',   label: `Lab Reports (${allReports.length})` },
                ] as { key: Tab; label: string }[]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-5 py-2.5 rounded-full text-sm font-inter font-medium whitespace-nowrap
                                transition-all duration-200
                                ${activeTab === key
                                  ? 'bg-white text-[#030d18]'
                                  : 'bg-white/6 text-white/50 hover:text-white border border-white/10 hover:border-white/20'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── RECORDS TAB ── */}
            {activeTab === 'records' && (
              records.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <span className="text-5xl mb-4">📋</span>
                  <p className="text-white/40 font-inter text-sm">No records found for this number.</p>
                  <p className="text-white/25 font-inter text-xs mt-2">
                    Records are added by your doctor after each visit.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className={`bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/18
                                  rounded-2xl p-5 transition-all duration-300 card-glow
                                  ${deletingId === record.id ? 'opacity-40 scale-95' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        {/* Left */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Icon */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A4267]/60 to-[#20658E]/40
                                          border border-white/10 flex items-center justify-center shrink-0">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M4 4h12v14H4zM7 4V2h6v2" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                              <path d="M7 9h6M7 12h4" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border
                                               ${VISIT_COLORS[record.visitType]}`}>
                                {VISIT_LABELS[record.visitType]}
                              </span>
                              <span className="text-white/25 font-inter text-[10px]">{formatDate(record.date)}</span>
                            </div>
                            <h3 className="text-white font-inter font-semibold text-base truncate">
                              {record.diagnosis}
                            </h3>
                            <p className="text-white/50 font-inter text-sm mt-0.5">
                              {record.doctorName}{record.specialty ? ` · ${record.specialty}` : ''}
                            </p>
                            {record.hospitalName && (
                              <p className="text-white/30 font-inter text-xs mt-0.5">{record.hospitalName}</p>
                            )}
                            {/* Mini pills */}
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              {record.medicines.filter(m=>m.status==='active').length > 0 && (
                                <span className="flex items-center gap-1 text-emerald-400 text-xs font-inter">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1"/>
                                    <path d="M3 5h4M5 3v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                                  </svg>
                                  {record.medicines.filter(m=>m.status==='active').length} active med{record.medicines.filter(m=>m.status==='active').length!==1?'s':''}
                                </span>
                              )}
                              {record.labReports.filter(r=>r.status==='abnormal').length > 0 && (
                                <span className="flex items-center gap-1 text-yellow-400 text-xs font-inter">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M5 1l4 8H1z" stroke="currentColor" strokeWidth="1"/>
                                    <path d="M5 4v2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                                  </svg>
                                  {record.labReports.filter(r=>r.status==='abnormal').length} abnormal
                                </span>
                              )}
                              {record.followUpDate && (
                                <span className="text-blue-300/60 text-xs font-inter">
                                  Follow-up: {formatDate(record.followUpDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="bg-white/8 hover:bg-white/15 border border-white/12 text-white/70
                                       hover:text-white text-xs font-inter px-4 py-2 rounded-lg
                                       transition-all duration-200 flex items-center gap-1.5"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                              <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.2"/>
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deletingId === record.id}
                            className="text-white/20 hover:text-red-400 text-xs font-inter px-2 py-2
                                       rounded-lg transition-all duration-200"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 3.5h10M5 3.5V2.5h4v1M5.5 6v4M8.5 6v4M3 3.5l.7 8h6.6l.7-8"
                                    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── MEDICINES TAB ── */}
            {activeTab === 'medicines' && (
              <div className="space-y-8">

                {/* ── Currently Active ── */}
                {activeMeds.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse"/>
                      <p className="text-emerald-400 text-xs font-inter font-semibold uppercase tracking-widest">
                        Currently Active — {activeMeds.length} medicine{activeMeds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeMeds.map((m, i) => (
                        <div key={i}
                          className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5
                                     border border-emerald-500/25 rounded-2xl p-5
                                     hover:border-emerald-500/40 transition-all duration-200">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-3">
                              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25
                                              flex items-center justify-center shrink-0">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                  <rect x="2" y="7" width="14" height="4" rx="2" stroke="#34d399" strokeWidth="1.4"/>
                                  <path d="M9 7V4M9 11v3" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                              </div>
                              <div>
                                <p className="text-white font-inter font-semibold text-sm">{m.name}</p>
                                <p className="text-white/55 font-inter text-xs mt-0.5">{m.dosage}</p>
                              </div>
                            </div>
                            <span className="shrink-0 bg-emerald-500/15 border border-emerald-500/30
                                             text-emerald-400 text-[10px] font-inter px-2.5 py-1 rounded-full">
                              Active
                            </span>
                          </div>
                          {/* Details chips */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {[
                              { icon: '🕐', label: m.frequency },
                              { icon: '📅', label: m.duration },
                            ].filter(c => c.label).map((chip) => (
                              <span key={chip.label}
                                className="flex items-center gap-1.5 bg-white/5 border border-white/8
                                           text-white/55 font-inter text-[11px] px-2.5 py-1 rounded-lg">
                                {chip.icon} {chip.label}
                              </span>
                            ))}
                          </div>
                          {m.instructions && (
                            <p className="text-white/35 font-inter text-xs bg-white/3 rounded-lg px-3 py-2 mb-3">
                              ℹ️ {m.instructions}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-2 border-t border-white/6">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <circle cx="5" cy="5" r="4" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                              <path d="M5 2.5V5l1.5 1.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                                    strokeLinecap="round"/>
                            </svg>
                            <span className="text-white/25 font-inter text-[10px]">
                              Prescribed by {m.doctorName} · {formatDate(m.date)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/3 border border-white/6 rounded-2xl p-5 flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3"/>
                      <path d="M9 5v4l2.5 2.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <p className="text-white/30 font-inter text-sm">No active medicines at this time.</p>
                  </div>
                )}

                {/* ── Past Medicines ── */}
                {(() => {
                  const pastAll = allMedicines.filter((m) => m.status !== 'active')
                  if (pastAll.length === 0 && allMedicines.length > 0) return (
                    <p className="text-white/20 font-inter text-xs text-center py-4">No past medicines.</p>
                  )
                  if (pastAll.length === 0) return null

                  // Group by visit date + doctor
                  const grouped = new Map<string, typeof pastAll>()
                  pastAll.forEach((m) => {
                    const key = `${m.date}||${m.doctorName}`
                    if (!grouped.has(key)) grouped.set(key, [])
                    grouped.get(key)!.push(m)
                  })

                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/20 inline-block"/>
                        <p className="text-white/40 text-xs font-inter font-semibold uppercase tracking-widest">
                          Past Medicines — {pastAll.length} total
                        </p>
                      </div>

                      {/* Summary bar */}
                      <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-4 mb-5 flex flex-wrap gap-6">
                        {[
                          { label: 'Completed',
                            count: pastAll.filter(m=>m.status==='completed').length,
                            color: 'text-white/50' },
                          { label: 'Stopped',
                            count: pastAll.filter(m=>m.status==='stopped').length,
                            color: 'text-red-400/70' },
                          { label: 'Visits',
                            count: grouped.size,
                            color: 'text-blue-400/70' },
                        ].map(({ label, count, color }) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className={`font-inter font-bold text-lg ${color}`}>{count}</span>
                            <span className="text-white/25 font-inter text-xs">{label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Grouped by visit */}
                      <div className="space-y-5">
                        {Array.from(grouped.entries()).map(([key, meds]) => {
                          const [date, doctor] = key.split('||')
                          return (
                            <div key={key}
                              className="border border-white/8 rounded-2xl overflow-hidden">
                              {/* Visit header */}
                              <div className="flex items-center justify-between px-5 py-3
                                              bg-white/4 border-b border-white/6">
                                <div className="flex items-center gap-3">
                                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <rect x="1" y="2" width="11" height="10" rx="1.5"
                                          stroke="rgba(255,255,255,0.3)" strokeWidth="1.1"/>
                                    <path d="M1 5.5h11M4 1v2M9 1v2" stroke="rgba(255,255,255,0.3)"
                                          strokeWidth="1.1" strokeLinecap="round"/>
                                  </svg>
                                  <span className="text-white/55 font-inter text-xs font-medium">
                                    {formatDate(date)}
                                  </span>
                                </div>
                                <span className="text-white/30 font-inter text-xs">{doctor}</span>
                              </div>

                              {/* Medicine rows */}
                              <div className="divide-y divide-white/5">
                                {meds.map((m, i) => (
                                  <div key={i}
                                    className="flex items-start justify-between gap-4 px-5 py-4
                                               hover:bg-white/3 transition-colors duration-150">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      {/* Status colour dot */}
                                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                                        m.status === 'completed' ? 'bg-white/30' : 'bg-red-400/60'
                                      }`}/>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-white/75 font-inter font-medium text-sm">
                                            {m.name}
                                          </p>
                                          {m.dosage && (
                                            <span className="text-white/30 font-inter text-xs
                                                             bg-white/5 px-2 py-0.5 rounded-md border border-white/8">
                                              {m.dosage}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-white/30 font-inter text-xs mt-0.5">
                                          {[m.frequency, m.duration].filter(Boolean).join(' · ')}
                                        </p>
                                        {m.instructions && (
                                          <p className="text-white/20 font-inter text-[11px] mt-0.5 italic">
                                            {m.instructions}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <span className={`shrink-0 text-[10px] font-inter px-2.5 py-1
                                                     rounded-full border capitalize ${MED_STATUS_COLORS[m.status]}`}>
                                      {m.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {allMedicines.length === 0 && (
                  <div className="py-20 text-center">
                    <span className="text-4xl mb-4 block">💊</span>
                    <p className="text-white/35 font-inter text-sm">No medicines recorded yet.</p>
                    <p className="text-white/20 font-inter text-xs mt-1">
                      Your doctor will add medicines after your visit.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── REPORTS TAB ── */}
            {activeTab === 'reports' && (
              <div className="space-y-5">
                {abnormalLabs.length > 0 && (
                  <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4 flex items-start gap-3">
                    <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2l6 12H2z" stroke="#fbbf24" strokeWidth="1.3"/>
                      <path d="M8 7v3" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="8" cy="12" r="0.6" fill="#fbbf24"/>
                    </svg>
                    <div>
                      <p className="text-yellow-300 font-inter text-sm font-medium">
                        {abnormalLabs.length} abnormal result{abnormalLabs.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-yellow-300/50 font-inter text-xs mt-0.5">
                        Please consult your doctor about these results.
                      </p>
                    </div>
                  </div>
                )}

                {allReports.length === 0 ? (
                  <div className="py-20 text-center">
                    <span className="text-4xl">🔬</span>
                    <p className="text-white/30 font-inter text-sm mt-3">No lab reports recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allReports.map((r, i) => (
                      <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-5
                                              hover:border-white/15 transition-all duration-200">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-white font-inter font-semibold text-sm">{r.name}</p>
                            <p className="text-white/60 font-inter text-xs mt-0.5">{r.result}</p>
                            {r.value && (
                              <p className="text-white/85 font-inter font-medium text-sm mt-1">{r.value}</p>
                            )}
                            {r.referenceRange && (
                              <p className="text-white/25 font-inter text-[10px] mt-0.5">
                                Ref: {r.referenceRange}
                              </p>
                            )}
                            <p className="text-white/20 font-inter text-[10px] mt-2">
                              {r.doctorName} · {formatDate(r.date)}
                            </p>
                          </div>
                          <span className={`shrink-0 text-[10px] font-inter px-2.5 py-1 rounded-full
                                           border capitalize ${LAB_STATUS_COLORS[r.status]}`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Not searched yet */}
        {!searched && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A4267]/40 to-[#20658E]/30
                            border border-white/10 flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M8 8h20v24H8z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13 16h10M13 21h7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13 11h5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-white/60 font-instrument text-2xl">Your health story, all in one place</p>
            <p className="text-white/30 font-inter text-sm mt-2 max-w-xs">
              Enter your mobile number above to access your complete medical history, prescriptions, and lab reports.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedRecord && (
        <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  )
}
