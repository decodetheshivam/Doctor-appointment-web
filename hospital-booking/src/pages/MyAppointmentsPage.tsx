import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getAppointments, cancelAppointment, formatDate, formatTime, type Appointment } from '../data/appointments'

export default function MyAppointmentsPage() {
  const { navigate } = useApp()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all')

  useEffect(() => {
    setAppointments(getAppointments().reverse())
  }, [])

  function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    setCancellingId(id)
    setTimeout(() => {
      cancelAppointment(id)
      setAppointments(getAppointments().reverse())
      setCancellingId(null)
    }, 500)
  }

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter)

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-inter mb-6 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Home
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-instrument text-white text-3xl md:text-5xl">
              My <span className="italic">Appointments</span>
            </h1>
            <p className="text-white/40 font-inter text-sm mt-1">
              {appointments.length} total · {appointments.filter((a) => a.status === 'confirmed').length} active
            </p>
          </div>
          <button
            onClick={() => navigate('hospitals')}
            className="bg-white text-[#030d18] px-6 py-3 rounded-full font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow"
          >
            + New Appointment
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'confirmed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-inter font-medium capitalize transition-all duration-200 ${
                filter === f
                  ? 'bg-white text-[#030d18]'
                  : 'bg-white/6 text-white/50 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">📋</span>
            <p className="text-white/40 font-inter text-sm">No appointments found.</p>
            <button
              onClick={() => navigate('hospitals')}
              className="mt-4 text-white/60 hover:text-white text-sm font-inter underline transition-colors"
            >
              Book your first appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                cancelling={cancellingId === appt.id}
                onCancel={() => handleCancel(appt.id)}
                onRebook={() =>
                  navigate('hospital-detail', { selectedHospitalId: appt.hospitalId })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AppointmentCard({
  appt,
  cancelling,
  onCancel,
  onRebook,
}: {
  appt: Appointment
  cancelling: boolean
  onCancel: () => void
  onRebook: () => void
}) {
  const isConfirmed = appt.status === 'confirmed'

  return (
    <div
      className={`bg-white/4 border rounded-2xl overflow-hidden transition-all duration-300 ${
        isConfirmed ? 'border-white/10' : 'border-white/5 opacity-60'
      }`}
    >
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left side */}
          <div className="flex items-start gap-4">
            {/* Token badge */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-inter font-bold text-lg ${
                isConfirmed
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border border-white/10 text-white/30'
              }`}
            >
              #{String(appt.tokenNumber).padStart(2, '0')}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-inter font-semibold text-base">{appt.doctorName}</h3>
                <span
                  className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${
                    isConfirmed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {appt.status}
                </span>
              </div>
              <p className="text-white/50 font-inter text-sm mt-0.5">
                {appt.specialty} · {appt.hospitalName}
              </p>

              {/* Date & time row */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-white/60 text-xs font-inter">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
                    <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                  {formatDate(appt.date)}
                </span>
                <span className="flex items-center gap-1.5 text-white/60 text-xs font-inter">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.1" />
                    <path d="M6 3.5V6l2 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                  {formatTime(appt.time)}
                </span>
                <span className="text-white/30 text-xs font-inter">
                  Patient: {appt.patientName}, {appt.patientAge}y
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isConfirmed ? (
              <button
                onClick={onCancel}
                disabled={cancelling}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-inter px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            ) : (
              <button
                onClick={onRebook}
                className="bg-white/8 hover:bg-white/12 border border-white/10 text-white/60 hover:text-white text-xs font-inter px-4 py-2 rounded-lg transition-all duration-200"
              >
                Rebook
              </button>
            )}
          </div>
        </div>

        {/* Appointment ID */}
        <p className="text-white/20 font-mono text-[10px] mt-4 font-inter">{appt.id}</p>
      </div>
    </div>
  )
}
