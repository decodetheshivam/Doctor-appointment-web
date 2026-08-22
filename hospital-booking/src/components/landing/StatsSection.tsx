import { useScrollReveal, fadeUpStyle, staggerStyle } from '../../hooks/useScrollReveal'
import { useCounter } from '../../hooks/useCounter'

const STATS = [
  { value: 200,   suffix: '+',  label: 'Partner Hospitals',     icon: '🏥', desc: 'Across 25+ cities in India' },
  { value: 1800,  suffix: '+',  label: 'Verified Doctors',      icon: '👨‍⚕️', desc: 'Across 40+ specialties' },
  { value: 50000, suffix: '+',  label: 'Appointments Booked',   icon: '📅', desc: 'And growing every day' },
  { value: 25,    suffix: '+',  label: 'Cities Covered',        icon: '🌆', desc: 'Metro & tier-2 cities' },
  { value: 99,    suffix: '.2%',label: 'Slot Accuracy',         icon: '✅', desc: 'Confirmed & on-time' },
  { value: 2,     suffix: ' min',label: 'Avg Booking Time',     icon: '⚡', desc: 'From search to confirmed' },
]

function StatCard({ stat, index, visible }: { stat: typeof STATS[0]; index: number; visible: boolean }) {
  const count = useCounter(stat.value, 1800, visible)
  return (
    <div
      style={staggerStyle(visible, index, 100, 100)}
      className="bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/20
                 rounded-2xl p-6 text-center card-glow transition-all duration-300 group cursor-default"
    >
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
        {stat.icon}
      </div>
      <div className="font-inter font-bold text-white text-3xl md:text-4xl leading-none">
        {count.toLocaleString('en-IN')}{stat.suffix}
      </div>
      <div className="text-white/80 font-inter font-medium text-sm mt-2">{stat.label}</div>
      <div className="text-white/30 font-inter text-xs mt-1">{stat.desc}</div>
    </div>
  )
}

export default function StatsSection() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 })

  return (
    <section ref={ref} className="py-24 px-4 md:px-8 lg:px-16 bg-[#030d18]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14" style={fadeUpStyle(visible, 0)}>
          <span className="text-white/30 text-xs font-inter tracking-[0.2em] uppercase">
            By the numbers
          </span>
          <h2 className="font-instrument text-white text-3xl md:text-5xl mt-3">
            India's <span className="italic">fastest growing</span>
            <br />hospital booking network
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  )
}
