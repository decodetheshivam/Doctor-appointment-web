import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { HOSPITALS, type Doctor, type Hospital } from '../data/hospitals'

interface DoctorWithHospital {
  doctor: Doctor
  hospital: Hospital
}

function buildAllDoctors(): DoctorWithHospital[] {
  return HOSPITALS.flatMap((h) => h.doctors.map((d) => ({ doctor: d, hospital: h })))
}

const ALL_DOCTORS = buildAllDoctors()
const ALL_SPECIALTIES = ['All', ...Array.from(new Set(ALL_DOCTORS.map((d) => d.doctor.specialty)))]

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="#fbbf24">
        <path d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.5 3.4 9l.5-2.9-2.1-2 2.9-.4L6 1z" />
      </svg>
      <span className="text-yellow-400 text-xs font-inter">{rating}</span>
    </div>
  )
}

export default function DoctorsPage() {
  const { navigate } = useApp()
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('All')

  const filtered = ALL_DOCTORS.filter(({ doctor }) => {
    const matchSearch =
      doctor.name.toLowerCase().includes(search.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(search.toLowerCase())
    const matchSpec = specialty === 'All' || doctor.specialty === specialty
    return matchSearch && matchSpec
  })

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-inter mb-6 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Home
        </button>

        <h1 className="font-instrument text-white text-4xl md:text-6xl mb-2">
          Our <span className="italic">Doctors</span>
        </h1>
        <p className="text-white/40 font-inter text-sm mb-8">
          {ALL_DOCTORS.length} verified doctors · Search by name or specialty
        </p>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text" placeholder="Search doctor or specialty..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3
                         text-white placeholder:text-white/30 text-sm font-inter
                         focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <select
            value={specialty} onChange={(e) => setSpecialty(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
                       text-sm font-inter focus:outline-none focus:border-white/30 transition-colors min-w-[180px]"
          >
            {ALL_SPECIALTIES.map((s) => (
              <option key={s} value={s} className="bg-[#0a1628] text-white">
                {s === 'All' ? 'All Specialties' : s}
              </option>
            ))}
          </select>
        </div>

        <p className="text-white/25 text-xs font-inter mb-6">
          {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(({ doctor, hospital }) => (
            <div
              key={doctor.id}
              className="bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/20
                         rounded-2xl p-5 card-glow transition-all duration-300 flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${hospital.image}
                                 flex items-center justify-center shrink-0`}>
                  <span className="text-white font-inter font-semibold text-base">{doctor.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-inter font-semibold text-sm leading-tight">{doctor.name}</h3>
                    <Stars rating={doctor.rating} />
                  </div>
                  <p className="text-white/55 font-inter text-xs mt-0.5">{doctor.specialty}</p>
                  <p className="text-white/30 font-inter text-[11px] mt-0.5 truncate">{hospital.name}</p>
                </div>
              </div>

              {/* Qualification */}
              <p className="text-white/35 font-inter text-xs leading-relaxed border-t border-white/6 pt-3">
                {doctor.qualification}
              </p>

              {/* Details row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/4 rounded-xl p-2.5 text-center">
                  <p className="text-white font-inter text-sm font-semibold">{doctor.experience}y</p>
                  <p className="text-white/30 font-inter text-[10px]">Experience</p>
                </div>
                <div className="bg-white/4 rounded-xl p-2.5 text-center">
                  <p className="text-white font-inter text-sm font-semibold">{doctor.slotDuration}m</p>
                  <p className="text-white/30 font-inter text-[10px]">Per slot</p>
                </div>
              </div>

              {/* Available days */}
              <div className="flex gap-1.5 flex-wrap">
                {['Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => (
                  <span
                    key={day}
                    className={`text-[10px] font-inter px-2 py-1 rounded-md ${
                      doctor.availableDays.includes(day)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/4 text-white/20 border border-white/6'
                    }`}
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Book CTA */}
              <button
                onClick={() => navigate('book', {
                  selectedHospitalId: hospital.id,
                  selectedDoctorId: doctor.id,
                })}
                className="w-full bg-white text-[#030d18] py-3 rounded-xl font-inter font-semibold
                           text-sm hover:bg-white/90 hover:scale-[1.02] active:scale-95
                           transition-all duration-200 button-glow"
              >
                Book Appointment
              </button>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 py-20 text-center">
              <span className="text-4xl">👨‍⚕️</span>
              <p className="text-white/30 font-inter text-sm mt-3">No doctors match your search.</p>
              <button
                onClick={() => { setSearch(''); setSpecialty('All') }}
                className="mt-3 text-white/50 hover:text-white text-sm font-inter underline transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
