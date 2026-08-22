import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getAppointments, formatDate, formatTime, type Appointment } from '../data/appointments'

export default function ConfirmationPage() {
  const { lastAppointmentId, navigate } = useApp()
  const [appt, setAppt] = useState<Appointment | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const all = getAppointments()
    const found = all.find((a) => a.id === lastAppointmentId) ?? null
    setAppt(found)
    setTimeout(() => setVisible(true), 50)
  }, [lastAppointmentId])

  if (!appt) {
    return (
      <div className="min-h-screen bg-[#030d18] flex items-center justify-center">
        <p className="text-white/50 font-inter">Appointment not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030d18] flex items-center justify-center px-4 py-20">
      <div
        className="max-w-lg w-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Success icon */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping-slow" />
            <div className="relative w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 16l5 5 11-10" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="font-instrument text-white text-3xl md:text-4xl text-center mb-2">
          Appointment <span className="italic">Confirmed!</span>
        </h1>
        <p className="text-white/40 font-inter text-sm text-center mb-8">
          Your booking is confirmed. Please arrive 10 minutes early.
        </p>

        {/* Appointment card */}
        <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
          {/* Token banner */}
          <div className="bg-gradient-to-r from-[#0A4267] to-[#20658E] p-6 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-inter uppercase tracking-wide">Token Number</p>
              <p className="text-white font-inter font-bold text-4xl mt-1">#{String(appt.tokenNumber).padStart(2, '0')}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs font-inter uppercase tracking-wide">Appointment ID</p>
              <p className="text-white font-inter font-mono text-sm mt-1">{appt.id}</p>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            {[
              { label: 'Patient', value: appt.patientName },
              { label: 'Doctor', value: appt.doctorName },
              { label: 'Specialty', value: appt.specialty },
              { label: 'Hospital', value: appt.hospitalName },
              { label: 'Date', value: formatDate(appt.date) },
              { label: 'Time', value: formatTime(appt.time) },
              { label: 'Mobile', value: `+91 ${appt.patientPhone}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/6 last:border-0">
                <span className="text-white/40 text-sm font-inter">{label}</span>
                <span className="text-white text-sm font-inter font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info note */}
        <div className="mt-5 bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 flex gap-3">
          <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#60a5fa" strokeWidth="1.2" />
            <path d="M8 7v5M8 5.5v.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-blue-300/70 text-xs font-inter leading-relaxed">
            Show your token number at the hospital reception. The doctor's panel will have your details ready before your slot.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={() => navigate('my-appointments')}
            className="flex-1 bg-white text-[#030d18] py-3.5 rounded-xl font-inter font-semibold text-sm tracking-wide hover:bg-white/90 transition-all duration-200 button-glow"
          >
            View All Appointments
          </button>
          <button
            onClick={() => navigate('hospitals')}
            className="flex-1 bg-white/6 border border-white/10 text-white py-3.5 rounded-xl font-inter font-medium text-sm tracking-wide hover:bg-white/10 transition-all duration-200"
          >
            Book Another
          </button>
        </div>

        <button
          onClick={() => navigate('landing')}
          className="w-full mt-3 text-white/30 hover:text-white/60 text-sm font-inter transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
