import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { getDoctorById } from '../data/hospitals'
import {
  generateSlots,
  saveAppointment,
  getNextToken,
  generateId,
  formatTime,
} from '../data/appointments'

// Get next 14 available dates (skipping days doctor isn't available)
function getAvailableDates(availableDays: string[]): { date: string; display: string; dayShort: string }[] {
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const allowedNums = availableDays.map((d) => dayMap[d])
  const results: { date: string; display: string; dayShort: string }[] = []
  const today = new Date()
  let d = new Date(today)
  d.setDate(d.getDate() + 1) // start from tomorrow

  while (results.length < 14) {
    if (allowedNums.includes(d.getDay())) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      results.push({
        date: `${yyyy}-${mm}-${dd}`,
        display: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        dayShort: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return results
}

interface FormData {
  patientName: string
  patientPhone: string
  patientAge: string
  reason: string
}

export default function BookingPage() {
  const { selectedHospitalId, selectedDoctorId, navigate } = useApp()
  const result = getDoctorById(selectedDoctorId ?? '')

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [form, setForm] = useState<FormData>({ patientName: '', patientPhone: '', patientAge: '', reason: '' })
  const [errors, setErrors] = useState<Partial<FormData & { date: string; time: string }>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!result) {
    return (
      <div className="min-h-screen bg-[#030d18] flex items-center justify-center">
        <p className="text-white/50 font-inter">Doctor not found.</p>
      </div>
    )
  }

  const { hospital, doctor } = result

  const availableDates = useMemo(() => getAvailableDates(doctor.availableDays), [doctor.availableDays])

  const slots = useMemo(() => {
    if (!selectedDate) return []
    return generateSlots(doctor.startTime, doctor.endTime, doctor.slotDuration, doctor.id, selectedDate)
  }, [selectedDate, doctor])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!selectedDate) e.date = 'Please select a date'
    if (!selectedTime) e.time = 'Please select a time slot'
    if (!form.patientName.trim()) e.patientName = 'Name is required'
    if (!/^[6-9]\d{9}$/.test(form.patientPhone)) e.patientPhone = 'Enter a valid 10-digit mobile number'
    if (!form.patientAge || Number(form.patientAge) < 1 || Number(form.patientAge) > 120)
      e.patientAge = 'Enter a valid age'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)

    // Simulate slight async delay
    setTimeout(() => {
      const id = generateId()
      const token = getNextToken(doctor.id, selectedDate)

      saveAppointment({
        id,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        patientName: form.patientName.trim(),
        patientPhone: form.patientPhone,
        patientAge: form.patientAge,
        date: selectedDate,
        time: selectedTime,
        status: 'confirmed',
        bookedAt: new Date().toISOString(),
        tokenNumber: token,
      })

      navigate('confirmation', { lastAppointmentId: id })
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('hospital-detail', { selectedHospitalId })}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-inter mb-6 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Doctors
        </button>

        <h1 className="font-instrument text-white text-3xl md:text-5xl mb-2">
          Book <span className="italic">Appointment</span>
        </h1>
        <p className="text-white/40 font-inter text-sm mb-8">
          Fill in patient details and choose a convenient slot
        </p>

        {/* Doctor summary card */}
        <div className={`flex items-center gap-4 bg-gradient-to-r ${hospital.image} bg-opacity-20 border border-white/10 rounded-2xl p-5 mb-8`}>
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${hospital.image} flex items-center justify-center shrink-0`}>
            <span className="text-white font-inter font-semibold text-base">{doctor.avatar}</span>
          </div>
          <div>
            <p className="text-white font-inter font-semibold">{doctor.name}</p>
            <p className="text-white/60 font-inter text-sm">{doctor.specialty} · {hospital.name}</p>
            <p className="text-white/40 font-inter text-xs mt-0.5">{doctor.slotDuration} min per appointment</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ---- Date selection ---- */}
          <div>
            <label className="text-white/50 text-xs font-inter tracking-[0.15em] uppercase block mb-3">
              Select Date
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {availableDates.map(({ date, display, dayShort }) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => { setSelectedDate(date); setSelectedTime('') }}
                  className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border transition-all duration-200 min-w-[68px] ${
                    selectedDate === date
                      ? 'bg-white text-[#030d18] border-white'
                      : 'bg-white/4 text-white/60 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-inter font-medium tracking-wide uppercase">{dayShort}</span>
                  <span className="text-sm font-inter font-semibold mt-0.5">{display}</span>
                </button>
              ))}
            </div>
            {errors.date && <p className="text-red-400 text-xs font-inter mt-2">{errors.date}</p>}
          </div>

          {/* ---- Time slots ---- */}
          {selectedDate && (
            <div>
              <label className="text-white/50 text-xs font-inter tracking-[0.15em] uppercase block mb-3">
                Select Time Slot
              </label>
              {slots.length === 0 ? (
                <p className="text-white/30 font-inter text-sm">No slots available for this date.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {slots.map(({ time, available }) => (
                    <button
                      key={time}
                      type="button"
                      disabled={!available}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2.5 rounded-xl text-xs font-inter font-medium transition-all duration-200 ${
                        !available
                          ? 'bg-white/3 text-white/15 border border-white/5 cursor-not-allowed line-through'
                          : selectedTime === time
                          ? 'bg-white text-[#030d18] border-white'
                          : 'bg-white/6 text-white/70 border border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
              )}
              {errors.time && <p className="text-red-400 text-xs font-inter mt-2">{errors.time}</p>}

              {/* Slot legend */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-white/6 border border-white/10" />
                  <span className="text-white/30 text-[10px] font-inter">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-white/3 border border-white/5" />
                  <span className="text-white/30 text-[10px] font-inter">Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-white border-white" />
                  <span className="text-white/30 text-[10px] font-inter">Selected</span>
                </div>
              </div>
            </div>
          )}

          {/* ---- Patient details ---- */}
          <div>
            <label className="text-white/50 text-xs font-inter tracking-[0.15em] uppercase block mb-3">
              Patient Details
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors ${
                    errors.patientName ? 'border-red-500/50' : 'border-white/10 focus:border-white/30'
                  }`}
                />
                {errors.patientName && <p className="text-red-400 text-xs font-inter mt-1">{errors.patientName}</p>}
              </div>

              {/* Phone */}
              <div>
                <input
                  type="tel"
                  placeholder="Mobile Number *"
                  value={form.patientPhone}
                  maxLength={10}
                  onChange={(e) => setForm({ ...form, patientPhone: e.target.value.replace(/\D/g, '') })}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors ${
                    errors.patientPhone ? 'border-red-500/50' : 'border-white/10 focus:border-white/30'
                  }`}
                />
                {errors.patientPhone && <p className="text-red-400 text-xs font-inter mt-1">{errors.patientPhone}</p>}
              </div>

              {/* Age */}
              <div>
                <input
                  type="number"
                  placeholder="Age *"
                  value={form.patientAge}
                  min={1}
                  max={120}
                  onChange={(e) => setForm({ ...form, patientAge: e.target.value })}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors ${
                    errors.patientAge ? 'border-red-500/50' : 'border-white/10 focus:border-white/30'
                  }`}
                />
                {errors.patientAge && <p className="text-red-400 text-xs font-inter mt-1">{errors.patientAge}</p>}
              </div>

              {/* Reason */}
              <div>
                <input
                  type="text"
                  placeholder="Reason for visit (optional)"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3.5 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-white text-[#030d18] py-4 rounded-xl font-inter font-semibold text-sm tracking-wide hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 button-glow flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" />
                </svg>
                Confirming your appointment...
              </>
            ) : (
              'Confirm Appointment'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
