import { useScrollReveal, fadeUpStyle, staggerStyle } from '../../hooks/useScrollReveal'

interface Props { onRegisterClick: () => void; onLoginClick: () => void }

const FEATURES = [
  { icon: '📋', title: 'Patient Records',    desc: 'Doctors add diagnoses, prescriptions, and lab reports directly from the panel. Patients can view their records anytime.' },
  { icon: '📅', title: 'Appointment Queue',  desc: 'See every confirmed booking in real time. Token numbers auto-assigned. No more paper registers.' },
  { icon: '👥', title: 'Patient Management', desc: 'Full patient history at a glance — all visits, medicines, and test results organized by phone number.' },
  { icon: '🔐', title: 'Secure Access',      desc: 'Each hospital gets an isolated panel. Only your hospital\'s data. Approved by MediConnect super admin.' },
]

export default function ForHospitalsSection({ onRegisterClick, onLoginClick }: Props) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.08 })

  return (
    <section
      ref={ref}
      className="py-24 px-4 md:px-8 lg:px-16"
      style={{ background: 'linear-gradient(180deg, #030d18 0%, #051a2e 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div style={fadeUpStyle(visible, 0)}>
            <span className="text-white/30 text-xs font-inter tracking-[0.2em] uppercase">For Healthcare Providers</span>
            <h2 className="font-instrument text-white text-3xl md:text-5xl mt-3 leading-tight">
              Your hospital,<br /><span className="italic">fully connected.</span>
            </h2>
            <p className="text-white/50 font-inter text-sm md:text-base mt-4 leading-relaxed max-w-md">
              Join MediConnect to list your hospital, manage appointments, and give your doctors a dedicated panel to maintain patient records digitally.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={onRegisterClick}
                className="bg-white text-[#030d18] px-8 py-3.5 rounded-full font-inter font-semibold
                           text-sm tracking-wide hover:bg-white/90 hover:scale-105 active:scale-95
                           transition-all duration-300 button-glow"
              >
                Register Your Hospital
              </button>
              <button
                onClick={onLoginClick}
                className="border border-white/20 text-white/70 hover:text-white hover:border-white/40
                           px-8 py-3.5 rounded-full font-inter font-medium text-sm tracking-wide
                           transition-all duration-300"
              >
                Admin Sign In →
              </button>
            </div>

            <p className="text-white/25 font-inter text-xs mt-4">
              Free to register · Reviewed within 1–2 business days · Full data isolation
            </p>
          </div>

          {/* Right — feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                style={staggerStyle(visible, i, 150, 100)}
                className="step-card bg-white/4 border border-white/8 rounded-2xl p-5"
              >
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="text-white font-inter font-semibold text-sm">{f.title}</h3>
                <p className="text-white/45 font-inter text-xs mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
