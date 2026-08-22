import { useScrollReveal, fadeUpStyle, staggerStyle } from '../../hooks/useScrollReveal'

const REVIEWS = [
  {
    name: 'Ananya Sharma',
    city: 'Mumbai',
    avatar: 'AS',
    rating: 5,
    date: 'Aug 2026',
    text: 'I booked an appointment with a cardiologist at Apollo in literally 90 seconds. The slot was confirmed instantly and the token system at the hospital was so smooth. No waiting around.',
    hospital: 'Apollo City Hospital',
  },
  {
    name: 'Rajesh Iyer',
    city: 'Bangalore',
    avatar: 'RI',
    rating: 5,
    date: 'Jul 2026',
    text: 'MediConnect saved me so much time. Previously I would spend 30 minutes on hold just to book a follow-up. Now it takes two minutes and I get a proper token number.',
    hospital: 'Manipal Hospitals',
  },
  {
    name: 'Priya Nair',
    city: 'Delhi',
    avatar: 'PN',
    rating: 5,
    date: 'Aug 2026',
    text: 'The doctor panel feature is brilliant. When I arrived, my details were already on the screen. The doctor knew who I was before I even sat down. Very professional experience.',
    hospital: 'AIIMS New Delhi',
  },
  {
    name: 'Suresh Mehta',
    city: 'Delhi NCR',
    avatar: 'SM',
    rating: 4,
    date: 'Jul 2026',
    text: "Really impressed with how the slot system works. I could see exactly which times were booked and pick a gap. My mother's appointment was at 11:20 AM and the doctor was ready on time.",
    hospital: 'Fortis Medanta',
  },
  {
    name: 'Kavya Reddy',
    city: 'Bangalore',
    avatar: 'KR',
    rating: 5,
    date: 'Jun 2026',
    text: 'As a working professional I have zero time to waste. This app lets me book during a 2-minute break. The confirmation with token number makes hospital visits so much less stressful.',
    hospital: 'Narayana Health City',
  },
  {
    name: 'Amit Desai',
    city: 'Mumbai',
    avatar: 'AD',
    rating: 5,
    date: 'Aug 2026',
    text: 'Booked an appointment for my father with a senior cardiologist. The whole process was transparent — I could see available days, slots, and even doctor qualifications upfront.',
    hospital: 'Kokilaben Dhirubhai Hospital',
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 12 12" fill={i <= count ? '#fbbf24' : 'rgba(255,255,255,0.1)'}>
          <path d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.5 3.4 9l.5-2.9-2.1-2 2.9-.4L6 1z" />
        </svg>
      ))}
    </div>
  )
}

export default function ReviewsSection() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.08 })

  return (
    <section
      ref={ref}
      className="py-24 px-4 md:px-8 lg:px-16"
      style={{ background: 'linear-gradient(180deg, #051525 0%, #030d18 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14" style={fadeUpStyle(visible, 0)}>
          <span className="text-white/30 text-xs font-inter tracking-[0.2em] uppercase">
            Patient stories
          </span>
          <h2 className="font-instrument text-white text-3xl md:text-5xl mt-3">
            What our patients <span className="italic">say</span>
          </h2>
          <p className="text-white/40 font-inter text-sm mt-3">
            Rated 4.9 / 5 from 12,000+ verified patients
          </p>
          {/* Overall stars */}
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1,2,3,4,5].map((i) => (
              <svg key={i} width="20" height="20" viewBox="0 0 12 12"
                   fill={i < 5 ? '#fbbf24' : 'url(#halfGrad)'}>
                <defs>
                  <linearGradient id="halfGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="90%" stopColor="#fbbf24" />
                    <stop offset="90%" stopColor="rgba(255,255,255,0.15)" />
                  </linearGradient>
                </defs>
                <path d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.5 3.4 9l.5-2.9-2.1-2 2.9-.4L6 1z" />
              </svg>
            ))}
          </div>
        </div>

        {/* Review grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {REVIEWS.map((r, i) => (
            <div
              key={r.name}
              style={staggerStyle(visible, i, 100, 80)}
              className="review-card bg-white/4 border border-white/8 rounded-2xl p-6 flex flex-col gap-4"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A4267] to-[#20658E]
                                  flex items-center justify-center shrink-0">
                    <span className="text-white font-inter font-semibold text-xs">{r.avatar}</span>
                  </div>
                  <div>
                    <p className="text-white font-inter font-medium text-sm">{r.name}</p>
                    <p className="text-white/35 font-inter text-xs">{r.city}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Stars count={r.rating} />
                  <span className="text-white/20 font-inter text-[10px]">{r.date}</span>
                </div>
              </div>

              {/* Review text */}
              <p className="text-white/65 font-inter text-sm leading-relaxed flex-1">
                &ldquo;{r.text}&rdquo;
              </p>

              {/* Hospital tag */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-white/6">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1.5v9M2 6h8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-white/30 font-inter text-[11px]">{r.hospital}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
