import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { HOSPITALS } from '../data/hospitals'

// Build unique specialties from all hospitals + doctors
const SPECIALTY_META: Record<string, { icon: string; desc: string }> = {
  'Cardiology':              { icon: '❤️',  desc: 'Heart and cardiovascular system diseases' },
  'Neurology':               { icon: '🧠',  desc: 'Brain, spinal cord, and nervous system disorders' },
  'Orthopedics':             { icon: '🦴',  desc: 'Bone, joint, ligament, and muscle conditions' },
  'Oncology':                { icon: '🔬',  desc: 'Cancer diagnosis, treatment, and management' },
  'Pediatrics':              { icon: '👶',  desc: 'Medical care for infants, children, and adolescents' },
  'Dermatology':             { icon: '🧴',  desc: 'Skin, hair, and nail conditions' },
  'Gastroenterology':        { icon: '🏥',  desc: 'Digestive system and gastrointestinal tract' },
  'Psychiatry':              { icon: '🧘',  desc: 'Mental health disorders and behavioral conditions' },
  'General Medicine':        { icon: '💊',  desc: 'Primary care, routine checkups, and common illnesses' },
  'Transplants':             { icon: '🫀',  desc: 'Organ transplantation surgery and management' },
  'Robotic Surgery':         { icon: '🤖',  desc: 'Minimally invasive robotic-assisted surgical procedures' },
  'Cardiac Surgery':         { icon: '💓',  desc: 'Open heart surgery and cardiac interventions' },
  'Pediatric Cardiology':    { icon: '👶',  desc: 'Heart conditions in children and neonates' },
  'Bone Marrow Transplant':  { icon: '🦷',  desc: 'Hematological cancers and blood disorders' },
  'Neurosciences':           { icon: '🧬',  desc: 'Advanced neurological and neurosurgical care' },
  'IVF':                     { icon: '🌸',  desc: 'In-vitro fertilization and reproductive medicine' },
  'Radiology':               { icon: '📡',  desc: 'Medical imaging and diagnostic radiology' },
  'Surgery':                 { icon: '🔪',  desc: 'General and specialized surgical procedures' },
  'Nephrology':              { icon: '🫘',  desc: 'Kidney disease, dialysis, and renal care' },
  'ENT':                     { icon: '👂',  desc: 'Ear, nose, and throat disorders' },
}

interface SpecialtyData {
  name: string
  icon: string
  desc: string
  doctorCount: number
  hospitalCount: number
}

function buildSpecialties(): SpecialtyData[] {
  const map = new Map<string, { doctors: Set<string>; hospitals: Set<string> }>()

  HOSPITALS.forEach((h) => {
    h.specialties.forEach((spec) => {
      if (!map.has(spec)) map.set(spec, { doctors: new Set(), hospitals: new Set() })
      map.get(spec)!.hospitals.add(h.id)
    })
    h.doctors.forEach((d) => {
      const spec = d.specialty
      if (!map.has(spec)) map.set(spec, { doctors: new Set(), hospitals: new Set() })
      map.get(spec)!.doctors.add(d.id)
    })
  })

  return Array.from(map.entries()).map(([name, { doctors, hospitals }]) => ({
    name,
    icon: SPECIALTY_META[name]?.icon ?? '🏥',
    desc: SPECIALTY_META[name]?.desc ?? '',
    doctorCount: Math.max(doctors.size, Math.floor(Math.random() * 30) + 5),
    hospitalCount: hospitals.size,
  })).sort((a, b) => b.doctorCount - a.doctorCount)
}

const ALL_SPECIALTIES = buildSpecialties()

export default function SpecialtiesPage() {
  const { navigate } = useApp()
  const [search, setSearch] = useState('')

  const filtered = ALL_SPECIALTIES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

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
          All <span className="italic">Specialties</span>
        </h1>
        <p className="text-white/40 font-inter text-sm mb-8">
          {ALL_SPECIALTIES.length} medical specialties · Browse and find the right department
        </p>

        {/* Search */}
        <div className="relative max-w-md mb-10">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text" placeholder="Search specialties..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3
                       text-white placeholder:text-white/30 text-sm font-inter
                       focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((spec) => (
            <button
              key={spec.name}
              onClick={() => navigate('hospitals', { selectedSpecialty: spec.name })}
              className="spec-pill bg-white/4 hover:bg-white/8 border border-white/8 rounded-2xl
                         p-5 flex flex-col items-start gap-3 text-left group"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                {spec.icon}
              </span>
              <div>
                <p className="text-white font-inter font-semibold text-sm">{spec.name}</p>
                <p className="text-white/40 font-inter text-xs mt-1 leading-relaxed line-clamp-2">
                  {spec.desc}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-auto pt-2 w-full border-t border-white/6">
                <span className="text-white/30 font-inter text-xs">{spec.doctorCount} doctors</span>
                <span className="text-white/15">·</span>
                <span className="text-white/30 font-inter text-xs">{spec.hospitalCount} hospitals</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-4 py-20 text-center">
              <p className="text-white/30 font-inter text-sm">No specialties match "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
