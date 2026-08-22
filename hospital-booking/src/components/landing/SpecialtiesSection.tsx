import { useScrollReveal, fadeUpStyle, staggerStyle } from '../../hooks/useScrollReveal'
import { useApp } from '../../context/AppContext'

const SPECIALTIES = [
  { name: 'Cardiology',           icon: '❤️',  count: 142 },
  { name: 'Neurology',            icon: '🧠',  count: 98  },
  { name: 'Orthopedics',          icon: '🦴',  count: 115 },
  { name: 'Oncology',             icon: '🔬',  count: 87  },
  { name: 'Pediatrics',           icon: '👶',  count: 134 },
  { name: 'Dermatology',          icon: '🧴',  count: 76  },
  { name: 'Gastroenterology',     icon: '🏥',  count: 63  },
  { name: 'Psychiatry',           icon: '🧘',  count: 55  },
  { name: 'Gynecology',           icon: '🌸',  count: 102 },
  { name: 'Ophthalmology',        icon: '👁️',  count: 88  },
  { name: 'ENT',                  icon: '👂',  count: 71  },
  { name: 'General Medicine',     icon: '💊',  count: 201 },
]

export default function SpecialtiesSection() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.08 })
  const { navigate } = useApp()

  return (
    <section
      ref={ref}
      className="py-24 px-4 md:px-8 lg:px-16 bg-[#030d18]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-12">
          <div style={fadeUpStyle(visible, 0)}>
            <span className="text-white/30 text-xs font-inter tracking-[0.2em] uppercase">
              All departments
            </span>
            <h2 className="font-instrument text-white text-3xl md:text-5xl mt-2">
              Find the right <span className="italic">specialty</span>
            </h2>
          </div>
          <button
            style={fadeUpStyle(visible, 150)}
            onClick={() => navigate('specialties')}
            className="text-white/50 hover:text-white text-sm font-inter flex items-center gap-2
                       transition-colors duration-200 shrink-0"
          >
            View all specialties
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {SPECIALTIES.map((spec, i) => (
            <button
              key={spec.name}
              style={staggerStyle(visible, i, 100, 60)}
              onClick={() => navigate('specialties')}
              className="spec-pill bg-white/4 border border-white/8 rounded-2xl p-4
                         flex flex-col items-center gap-2 group text-center"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                {spec.icon}
              </span>
              <span className="text-white/80 font-inter text-xs font-medium leading-tight">
                {spec.name}
              </span>
              <span className="text-white/25 font-inter text-[10px]">
                {spec.count} doctors
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
