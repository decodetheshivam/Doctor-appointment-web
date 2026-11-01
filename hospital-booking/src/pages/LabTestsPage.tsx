import { useState, useEffect } from 'react'
import { getPatientSession } from '../data/patientAuth'
import { HOSPITALS } from '../data/hospitals'
import {
  getActiveLabTests, getBookingsByPatient, getReportsByPatient,
  getReportById, saveBooking, generateBookingId,
  generateLabSlots, seedLabDemoData,
  LAB_STATUS_LABELS, LAB_STATUS_COLORS,
  type LabTestCatalogItem, type LabBooking, type LabReport,
} from '../data/labTests'
import { formatDate, formatTime } from '../data/appointments'

type Tab = 'browse' | 'my-tests' | 'reports'

export default function LabTestsPage() {
  const [tab, setTab] = useState<Tab>('browse')
  const [tests, setTests] = useState<LabTestCatalogItem[]>([])
  const [bookings, setBookings] = useState<LabBooking[]>([])
  const [reports, setReports] = useState<LabReport[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [bookingTest, setBookingTest] = useState<LabTestCatalogItem | null>(null)
  const [viewingReport, setViewingReport] = useState<LabReport | null>(null)
  const patient = getPatientSession()

  useEffect(() => {
    seedLabDemoData()
    setTests(getActiveLabTests())
    if (patient) {
      setBookings(getBookingsByPatient(patient.phone))
      setReports(getReportsByPatient(patient.phone))
    }
  }, [patient])

  const categories = ['all', ...Array.from(new Set(tests.map((t) => t.category)))]

  const filteredTests = tests.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || t.category === category
    return matchSearch && matchCat
  })

  if (!patient) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <span className="text-5xl mb-4">🔐</span>
        <p className="text-white/40 font-inter text-sm">Please sign in to access lab tests.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-instrument text-white text-3xl md:text-4xl">Lab Tests & Reports</h1>
        <p className="text-white/35 font-inter text-sm mt-1">
          {bookings.length} bookings · {reports.length} reports available
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/4 border border-white/8 rounded-xl p-1 max-w-md">
        {([
          { key: 'browse', label: 'Browse Tests', count: tests.length },
          { key: 'my-tests', label: 'My Tests', count: bookings.length },
          { key: 'reports', label: 'Reports', count: reports.length },
        ] as { key: Tab; label: string; count: number }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-inter font-medium transition-all
                       ${tab === t.key ? 'bg-white text-[#030d18]' : 'text-white/50 hover:text-white'}`}>
            {t.label}
            {t.count > 0 && <span className={`ml-1.5 ${tab === t.key ? 'text-[#030d18]/50' : 'text-white/30'}`}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* ── Browse Tab ── */}
      {tab === 'browse' && (
        <div className="space-y-4">
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              <input className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors"
                placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-inter focus:outline-none appearance-none min-w-[140px]"
              value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c} value={c} className="bg-[#071525] capitalize">{c === 'all' ? 'All Categories' : c}</option>)}
            </select>
          </div>

          {/* Test grid */}
          {filteredTests.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <span className="text-5xl mb-4">🧪</span>
              <p className="text-white/40 font-inter text-sm">No tests found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTests.map((test) => (
                <div key={test.id} className="bg-white/4 border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(test.category)}</span>
                      <div>
                        <p className="text-white font-inter font-semibold text-sm">{test.name}</p>
                        <span className="text-white/30 font-inter text-[10px] uppercase tracking-wide">{test.category}</span>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-inter font-bold text-sm">₹{test.price}</span>
                  </div>
                  <p className="text-white/40 font-inter text-xs leading-relaxed mt-2">{test.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] font-inter text-white/35">
                    <span>⏱ Report in ~{test.reportAvailabilityHours}h</span>
                    {test.preparationInstructions && <span>📋 {test.preparationInstructions}</span>}
                  </div>
                  <button onClick={() => setBookingTest(test)}
                    className="mt-4 w-full bg-white/8 hover:bg-white/15 border border-white/12 hover:border-white/25 text-white/70 hover:text-white
                               text-xs font-inter font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    Book Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My Tests Tab ── */}
      {tab === 'my-tests' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <span className="text-5xl mb-4">📅</span>
              <p className="text-white/40 font-inter text-sm">No lab test bookings yet.</p>
              <p className="text-white/25 font-inter text-xs mt-1">Browse tests and book one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white/4 border border-white/8 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-2xl">{getCategoryIcon(b.testCategory)}</span>
                        <div>
                          <p className="text-white font-inter font-semibold text-sm">{b.testName}</p>
                          <p className="text-white/30 font-inter text-[10px]">{b.id}</p>
                        </div>
                      </div>
                      <p className="text-white/40 font-inter text-xs mt-1">
                        {b.hospitalName} · {formatDate(b.date)} at {formatTime(b.time)}
                      </p>
                      {b.doctorName && <p className="text-white/30 font-inter text-xs">Ordered by {b.doctorName}</p>}
                      {b.notes && <p className="text-white/25 font-inter text-xs italic">"{b.notes}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* Status badge */}
                      <span className={`text-[10px] font-inter px-2.5 py-0.5 rounded-full border ${LAB_STATUS_COLORS[b.status]}`}>
                        {LAB_STATUS_LABELS[b.status]}
                      </span>
                      <p className="text-emerald-400/70 font-inter text-xs">₹{b.price}</p>
                    </div>
                  </div>

                  {/* Status progress bar */}
                  <div className="mt-4 pt-3 border-t border-white/6">
                    <div className="flex items-center gap-1">
                      {(['pending', 'sample-collected', 'processing', 'completed', 'report-ready'] as const).map((step, i) => {
                        const stepIdx = ['pending', 'sample-collected', 'processing', 'completed', 'report-ready'].indexOf(b.status)
                        const isActive = i <= stepIdx && b.status !== 'cancelled'
                        return (
                          <div key={step} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`w-full h-1 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-white/10'}`} />
                            <span className={`text-[8px] font-inter ${isActive ? 'text-emerald-400/70' : 'text-white/20'}`}>
                              {LAB_STATUS_LABELS[step].split(' ')[0]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* View report button if ready */}
                  {b.status === 'report-ready' && b.reportId && (
                    <button onClick={() => setViewingReport(getReportById(b.reportId!) || null)}
                      className="mt-3 w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15
                                 text-xs font-inter font-medium py-2 rounded-xl transition-all flex items-center justify-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4h8v6H2zM2 6h8M5 2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      View Report
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reports Tab ── */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <span className="text-5xl mb-4">📄</span>
              <p className="text-white/40 font-inter text-sm">No reports available yet.</p>
              <p className="text-white/25 font-inter text-xs mt-1">Reports will appear here once your tests are completed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="bg-white/4 border border-white/8 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">📄</span>
                        <p className="text-white font-inter font-semibold text-sm">{report.testName}</p>
                      </div>
                      <p className="text-white/40 font-inter text-xs mt-1">
                        {report.hospitalName} · {formatDate(report.testDate)}
                      </p>
                      <p className="text-white/25 font-inter text-[10px] mt-0.5">Report ID: {report.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setViewingReport(report)}
                        className="bg-white/8 hover:bg-white/15 border border-white/12 hover:border-white/25 text-white/60 hover:text-white
                                   text-xs font-inter px-3 py-1.5 rounded-lg transition-all">
                        View
                      </button>
                      <button onClick={() => downloadReportPDF(report)}
                        className="bg-white/8 hover:bg-white/15 border border-white/12 hover:border-white/25 text-white/60 hover:text-white
                                   text-xs font-inter px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v8M3 6l3 3 3-3M2 11h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        PDF
                      </button>
                    </div>
                  </div>
                  {/* Summary */}
                  {report.summary && (
                    <div className="mt-3 pt-3 border-t border-white/6">
                      <p className="text-white/40 font-inter text-xs leading-relaxed">{report.summary}</p>
                    </div>
                  )}
                  {/* Result indicators */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {report.results.map((r, i) => (
                      <span key={i} className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${
                        r.status === 'normal' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : r.status === 'abnormal' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                      }`}>{r.parameter}: {r.value}{r.unit && ' ' + r.unit}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Booking Modal ── */}
      {bookingTest && patient && (
        <BookingModal test={bookingTest} patient={patient}
          onClose={() => setBookingTest(null)}
          onBook={(date, time, hospitalId, hospitalName) => {
            const booking: LabBooking = {
              id: generateBookingId(),
              testId: bookingTest.id,
              testName: bookingTest.name,
              testCategory: bookingTest.category,
              patientName: patient.name,
              patientPhone: patient.phone,
              hospitalId, hospitalName,
              date, time,
              price: bookingTest.price,
              status: 'pending',
              bookingDate: new Date().toISOString(),
            }
            saveBooking(booking)
            setBookings(getBookingsByPatient(patient.phone))
            setBookingTest(null)
            setTab('my-tests')
          }} />
      )}

      {/* ── Report Viewer Modal ── */}
      {viewingReport && (
        <ReportModal report={viewingReport} onClose={() => setViewingReport(null)} onDownload={() => downloadReportPDF(viewingReport)} />
      )}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    Blood: '🩸', Imaging: '🩻', Cardiac: '❤️', Urine: '🧪', Microbiology: '🔬',
  }
  return map[category] || '🧪'
}

function downloadReportPDF(report: LabReport) {
  const win = window.open('', '_blank')
  if (!win) return
  const rowsHtml = report.results.map((r) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600">${r.parameter}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${r.value} ${r.unit}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;color:${r.status === 'normal' ? '#059669' : r.status === 'abnormal' ? '#dc2626' : '#d97706'};font-weight:600">${r.referenceRange}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;color:${r.status === 'normal' ? '#059669' : r.status === 'abnormal' ? '#dc2626' : '#d97706'};font-weight:600;text-transform:capitalize">${r.status}</td>
    </tr>
  `).join('')

  win.document.write(`
    <html><head><title>Lab Report — ${report.testName}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:800px;margin:0 auto}
      .header{display:flex;justify-content:space-between;border-bottom:2px solid #0A4267;padding-bottom:16px;margin-bottom:24px}
      .hospital{color:#0A4267;font-size:20px;font-weight:bold}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th{background:#0A4267;color:white;padding:10px 8px;text-align:left;font-size:12px}
    </style></head><body>
      <div class="header">
        <div>
          <div class="hospital">${report.hospitalName}</div>
          <div style="font-size:12px;color:#666;margin-top:4px">Laboratory Report</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:16px;font-weight:bold">Lab Report</div>
          <div style="font-size:11px;color:#666">ID: ${report.id}</div>
          <div style="font-size:11px;color:#666">Date: ${formatDate(report.testDate)}</div>
        </div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px">
        <div style="display:flex;gap:40px">
          <div style="font-size:13px"><strong>Test:</strong> ${report.testName}</div>
          <div style="font-size:13px"><strong>Patient:</strong> ${report.patientName}</div>
          <div style="font-size:13px"><strong>Phone:</strong> +91 ${report.patientPhone}</div>
        </div>
      </div>
      <table>
        <thead><tr>
          <th>Parameter</th><th style="text-align:center">Result</th><th style="text-align:center">Reference Range</th><th style="text-align:center">Status</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      ${report.summary ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin-bottom:16px"><strong>Summary:</strong> ${report.summary}</div>` : ''}
      <div style="margin-top:40px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:10px;color:#9ca3af">
        This report was generated by MediConnect Laboratory Management System. Published on ${report.publishedAt ? new Date(report.publishedAt).toLocaleString('en-IN') : 'N/A'}.
      </div>
    </body></html>
  `)
  win.document.close()
  setTimeout(() => win.print(), 500)
}

// ─── Booking Modal ────────────────────────────────────────────────────────────

function BookingModal({ test, patient, onClose, onBook }: {
  test: LabTestCatalogItem
  patient: { name: string; phone: string }
  onClose: () => void
  onBook: (date: string, time: string, hospitalId: string, hospitalName: string) => void
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState(generateLabSlots(date))
  const [selectedSlot, setSelectedSlot] = useState('')
  const [hospital, setHospital] = useState(HOSPITALS[0])

  useEffect(() => { setSlots(generateLabSlots(date)); setSelectedSlot('') }, [date])

  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] bg-[#071525] border border-white/12 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-instrument text-xl">Book Lab Test</h2>
            <p className="text-white/35 font-inter text-xs mt-0.5">{test.name} · ₹{test.price}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-4">
          {/* Test info */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getCategoryIcon(test.category)}</span>
              <p className="text-white font-inter text-sm font-medium">{test.name}</p>
            </div>
            <p className="text-white/40 font-inter text-xs">{test.description}</p>
            {test.preparationInstructions && (
              <div className="mt-2 bg-amber-500/8 border border-amber-500/15 rounded-lg p-2.5 flex items-start gap-2">
                <span className="text-amber-400 text-sm shrink-0">📋</span>
                <p className="text-amber-300/70 font-inter text-xs leading-relaxed">{test.preparationInstructions}</p>
              </div>
            )}
          </div>

          {/* Hospital selection */}
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Select Hospital</label>
            <select className={`${inp} appearance-none`} value={hospital.id}
              onChange={(e) => setHospital(HOSPITALS.find((h) => h.id === e.target.value) || HOSPITALS[0])}>
              {HOSPITALS.map((h) => <option key={h.id} value={h.id} className="bg-[#071525]">{h.name} · {h.city}</option>)}
            </select>
          </div>

          {/* Date selection */}
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Test Date</label>
            <input type="date" min={new Date().toISOString().slice(0, 10)} className={inp}
              value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Time slot selection */}
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-2">Available Time Slots</label>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button key={slot.time}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`py-2 rounded-lg text-xs font-inter border transition-all
                    ${selectedSlot === slot.time
                      ? 'bg-white text-[#030d18] border-white'
                      : slot.available
                      ? 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/10'
                      : 'bg-white/3 text-white/15 border-white/5 cursor-not-allowed'}`}>
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          </div>

          {/* Patient confirmation */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0A4267] to-[#20658E] flex items-center justify-center">
              <span className="text-white font-inter font-bold text-xs">{patient.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white font-inter text-sm">{patient.name}</p>
              <p className="text-white/40 font-inter text-xs">+91 {patient.phone}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/8 shrink-0">
          <div>
            <p className="text-white/30 font-inter text-[10px]">Total</p>
            <p className="text-emerald-400 font-inter font-bold text-lg">₹{test.price}</p>
          </div>
          <button onClick={() => selectedSlot && onBook(date, selectedSlot, hospital.id, hospital.name)}
            disabled={!selectedSlot}
            className="bg-white text-[#030d18] px-6 py-3 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all button-glow">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Report Viewer Modal ─────────────────────────────────────────────────────

function ReportModal({ report, onClose, onDownload }: {
  report: LabReport
  onClose: () => void
  onDownload: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#071525] border border-white/12 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-instrument text-xl">{report.testName}</h2>
            <p className="text-white/35 font-inter text-xs mt-0.5">
              {report.hospitalName} · {formatDate(report.testDate)} · {report.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDownload}
              className="bg-white/8 hover:bg-white/15 border border-white/12 hover:border-white/25 text-white/60 hover:text-white
                         text-xs font-inter px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v8M3 6l3 3 3-3M2 11h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Download
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Body — results table */}
        <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-4">
          {/* Summary */}
          {report.summary && (
            <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-4">
              <p className="text-white/40 font-inter text-[10px] uppercase tracking-widest mb-1.5">Summary</p>
              <p className="text-blue-300/70 font-inter text-sm leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Results table */}
          <div>
            <p className="text-white/40 font-inter text-xs uppercase tracking-widest mb-2">Test Results</p>
            <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-white/4 border-b border-white/8">
                <span className="text-white/40 font-inter text-[10px] uppercase tracking-wide">Parameter</span>
                <span className="text-white/40 font-inter text-[10px] uppercase tracking-wide text-center">Value</span>
                <span className="text-white/40 font-inter text-[10px] uppercase tracking-wide text-center">Ref. Range</span>
                <span className="text-white/40 font-inter text-[10px] uppercase tracking-wide text-center">Status</span>
              </div>
              {/* Rows */}
              {report.results.map((r, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-white/5 last:border-0 items-center">
                  <span className="text-white/80 font-inter text-sm">{r.parameter}</span>
                  <span className="text-white font-inter text-sm text-center font-medium">{r.value} {r.unit}</span>
                  <span className="text-white/40 font-inter text-xs text-center">{r.referenceRange}</span>
                  <span className={`text-center`}>
                    <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${
                      r.status === 'normal' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : r.status === 'abnormal' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                    } capitalize`}>{r.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2">
            <span className="text-amber-400/60 text-sm shrink-0">⚠️</span>
            <p className="text-amber-300/50 font-inter text-[11px] leading-relaxed">
              This report is for informational purposes only. Always consult your doctor for interpretation and medical advice.
              Use the AI assistant to understand test values in simple language.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
