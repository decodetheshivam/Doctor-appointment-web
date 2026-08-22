import { useScrollReveal, fadeUpStyle, staggerStyle } from '../../hooks/useScrollReveal'

const STEPS = [
  {
    number: '01',
    title: 'Search Your Hospital',
    desc: 'Browse 200+ partner hospitals by city, specialty, or doctor name. Filter by rating, availability, and distance.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="13" cy="13" r="8" stroke="white" strokeWidth="2" />
        <path d="M19 19l5 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Choose a Doctor',
    desc: 'View doctor profiles, specialties, qualifications, experience, and patient ratings to make an informed choice.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="10" r="5" stroke="white" strokeWidth="2" />
        <path d="M4 24c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Pick a Time Slot',
    desc: 'See real-time availability. Booked slots are automatically greyed out. Your slot is reserved the moment you select it.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="5" width="22" height="20" rx="3" stroke="white" strokeWidth="2" />
        <path d="M3 11h22M9 3v4M19 3v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 16h4M8 20h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Get Instant Confirmation',
    desc: "Receive your unique token number and appointment ID instantly. The doctor's panel is updated automatically.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="white" strokeWidth="2" />
        <path d="M9 14l3.5 3.5L19 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function HowItWorksSection() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.08 })

  return (
    <section
      ref={ref}
      className="py-24 px-4 md:px-8 lg:px-16"
      style={{ background: 'linear-gradient(180deg, #030d18 0%, #051525 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16" style={fadeUpStyle(visible, 0)}>
          <span className="text-white/30 text-xs font-inter tracking-[0.2em] uppercase">
            Simple process
          </span>
          <h2 className="font-instrument text-white text-3xl md:text-5xl mt-3">
            Book in <span className="italic">4 easy steps</span>
          </h2>
          <p className="text-white/40 font-inter text-sm md:text-base mt-3 max-w-md mx-auto">
            No phone calls. No waiting rooms before your visit. Just a confirmed slot.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {/* Connector line on desktop */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px
                          bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none z-0" />

          {STEPS.map((step, i) => (
            <div
              key={step.number}
              style={staggerStyle(visible, i, 150, 120)}
              className="step-card relative z-10 bg-white/4 border border-white/8 rounded-2xl
                         p-6 flex flex-col gap-4"
            >
              {/* Number */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A4267]/60 to-[#20658E]/40
                                border border-white/10 flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="text-white/10 font-inter font-bold text-4xl">{step.number}</span>
              </div>

              <div>
                <h3 className="text-white font-inter font-semibold text-base">{step.title}</h3>
                <p className="text-white/45 font-inter text-sm mt-2 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
