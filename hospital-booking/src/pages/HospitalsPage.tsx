import { useState } from 'react'
import { HOSPITALS } from '../data/hospitals'
import { useApp } from '../context/AppContext'

const ALL_CITIES = ['All', ...Array.from(new Set(HOSPITALS.map((h) => h.city)))]
const ALL_SPECIALTIES = ['All', ...Array.from(new Set(HOSPITALS.flatMap((h) => h.specialties)))]

export default function HospitalsPage() {
  const { navigate, selectedSpecialty } = useApp()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All')
  const [specialty, setSpecialty] = useState(selectedSpecialty ?? 'All')

  const filtered = HOSPITALS.filter((h) => {
    const matchSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.location.toLowerCase().includes(search.toLowerCase())
    const matchCity = city === 'All' || h.city === city
    const matchSpec = specialty === 'All' || h.specialties.includes(specialty)
    return matchSearch && matchCity && matchSpec
  })

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-8 lg:px-16">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-inter mb-6 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Home
        </button>
        <h1 className="font-instrument text-white text-4xl md:text-6xl leading-tight">
          Find a <span className="italic">Hospital</span>
        </h1>
        <p className="text-white/50 font-inter mt-3 text-sm md:text-base">
          {specialty !== 'All'
            ? <><span className="text-white/80 font-medium">{specialty}</span> — hospitals offering this specialty</>
            : <>{HOSPITALS.length} hospitals listed · Select one to view doctors and book a slot</>
          }
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search hospital or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 text-sm font-inter focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* City filter */}
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-inter focus:outline-none focus:border-white/30 transition-colors min-w-[150px]"
        >
          {ALL_CITIES.map((c) => (
            <option key={c} value={c} className="bg-[#0a1628] text-white">
              {c === 'All' ? 'All Cities' : c}
            </option>
          ))}
        </select>

        {/* Specialty filter */}
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-inter focus:outline-none focus:border-white/30 transition-colors min-w-[180px]"
        >
          {ALL_SPECIALTIES.map((s) => (
            <option key={s} value={s} className="bg-[#0a1628] text-white">
              {s === 'All' ? 'All Specialties' : s}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center gap-3">
        <p className="text-white/30 text-xs font-inter tracking-wide">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
        </p>
        {specialty !== 'All' && (
          <span className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-inter px-3 py-1 rounded-full">
            {specialty}
            <button
              onClick={() => setSpecialty('All')}
              className="text-blue-300/60 hover:text-blue-300 ml-0.5 leading-none"
              aria-label="Clear specialty filter"
            >
              ✕
            </button>
          </span>
        )}
      </div>

      {/* Hospital cards grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((hospital) => (
          <div
            key={hospital.id}
            onClick={() => navigate('hospital-detail', { selectedHospitalId: hospital.id })}
            className="group cursor-pointer bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300"
          >
            {/* Card top gradient banner */}
            <div className={`h-28 bg-gradient-to-br ${hospital.image} flex items-end p-5`}>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5v11M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span className="text-white/90 text-xs font-inter tracking-wide">{hospital.beds} beds</span>
              </div>
            </div>

            {/* Card body */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-white font-inter font-semibold text-base leading-tight group-hover:text-white transition-colors">
                  {hospital.name}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="#fbbf24">
                    <path d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.5 3.4 9l.5-2.9-2.1-2 2.9-.4L6 1z" />
                  </svg>
                  <span className="text-yellow-400 text-xs font-inter font-medium">{hospital.rating}</span>
                </div>
              </div>

              <p className="text-white/40 text-xs font-inter mt-1.5 flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 9S1.5 5.9 1.5 3.5a3.5 3.5 0 017 0C8.5 5.9 5 9 5 9z" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="5" cy="3.5" r="1" fill="currentColor" />
                </svg>
                {hospital.location}
              </p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {hospital.specialties.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="bg-white/6 text-white/60 text-[10px] font-inter px-2.5 py-1 rounded-full border border-white/8"
                  >
                    {s}
                  </span>
                ))}
                {hospital.specialties.length > 3 && (
                  <span className="text-white/30 text-[10px] font-inter px-2 py-1">
                    +{hospital.specialties.length - 3} more
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/6">
                <span className="text-white/30 text-xs font-inter">
                  {hospital.doctors.length} doctor{hospital.doctors.length !== 1 ? 's' : ''} available
                </span>
                <span className="text-white/60 group-hover:text-white text-xs font-inter flex items-center gap-1 transition-colors">
                  View doctors
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 8l4-2-4-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🏥</span>
            <p className="text-white/40 font-inter text-sm">No hospitals match your search.</p>
            <button
              onClick={() => { setSearch(''); setCity('All'); setSpecialty('All') }}
              className="mt-4 text-white/60 hover:text-white text-sm font-inter underline transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
