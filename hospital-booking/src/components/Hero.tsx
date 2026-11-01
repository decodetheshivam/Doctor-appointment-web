import Navbar from './Navbar'
import { useApp } from '../context/AppContext'

interface HeroProps { onAdminClick: () => void; onEmergencyClick?: (auto?: boolean) => void; onSignOut?: () => void }

export default function Hero({ onAdminClick, onEmergencyClick, onSignOut }: HeroProps) {
  const { navigate } = useApp()

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
        autoPlay muted loop playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#010d1a]/70 via-[#021628]/50 to-[#010A17]/90" />

      <Navbar onAdminClick={onAdminClick} onEmergencyClick={onEmergencyClick} onSignOut={onSignOut} />

      {/* ── Center content ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-20 pb-4">

        {/* Live badge — sits above heading with clear gap */}
        <div className="animate-badge-in flex items-center gap-2 bg-white/8 border border-white/15
                        rounded-full px-4 py-1.5 mb-6 whitespace-nowrap">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-white/70 text-xs font-inter tracking-wide">
            200+ hospitals &nbsp;·&nbsp; Instant booking
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-instrument text-white text-[30px] sm:text-[42px] md:text-6xl lg:text-[88px]
                       leading-[0.95] tracking-tight text-center text-glow max-w-4xl">
          <span className="block animate-word-in-1">Skip the wait.</span>
          <span className="block italic animate-word-in-2">Book your doctor</span>
          <span className="block animate-word-in-3">now.</span>
        </h1>

        {/* Subtext */}
        <p className="animate-word-in-4 text-white/60 text-sm md:text-base text-center
                      mt-4 md:mt-5 max-w-md font-inter leading-relaxed">
          Search any hospital, choose a specialist, and get a confirmed appointment
          slot in under two minutes — no calls, no queues.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 md:mt-8 animate-word-in-4">
          <button
            onClick={() => navigate('hospitals')}
            className="bg-white text-black px-8 py-3.5 rounded-full font-medium text-sm
                       tracking-wide hover:bg-white/90 hover:scale-105 active:scale-95
                       transition-all duration-300 button-glow font-inter"
          >
            Find a Hospital
          </button>
          <button
            onClick={() => navigate('my-appointments')}
            className="liquid-glass border border-white/15 text-white/80 hover:text-white
                       px-8 py-3.5 rounded-full font-medium text-sm tracking-wide
                       hover:border-white/30 hover:scale-105 active:scale-95
                       transition-all duration-300 font-inter"
          >
            My Appointments
          </button>
        </div>

        {/* Trust stats — always below CTAs with fixed gap */}
        <div className="flex items-center gap-6 md:gap-10 mt-8 md:mt-10 animate-word-in-4">
          {[
            { value: '200+',   label: 'Hospitals' },
            { value: '1,800+', label: 'Doctors' },
            { value: '50k+',   label: 'Appointments' },
            { value: '25+',    label: 'Cities' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center group">
              <span className="text-white font-inter font-semibold text-base md:text-lg
                               leading-none group-hover:text-glow transition-all duration-300">
                {value}
              </span>
              <span className="text-white/40 font-inter text-[10px] md:text-xs mt-1 tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom-left — Hospital portal entry + ECG */}
      <div className="hidden md:flex absolute bottom-8 left-8 items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center
                          justify-center liquid-glass animate-float">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <path d="M0 6h3l2-5 3 10 2-8 2 5h4"
                    stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-white/60 text-xs font-inter leading-tight">Real-time</p>
            <p className="text-white/60 text-xs font-inter leading-tight">availability</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <button
          onClick={onAdminClick}
          className="flex items-center gap-2 text-white/40 hover:text-white/80
                     text-xs font-inter tracking-wide transition-colors duration-200 group"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Hospital Portal
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
               className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200">
            <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Bottom-center scroll hint */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 items-center gap-2
                      text-white/40 text-xs font-inter tracking-wide">
        <span>Scroll to explore</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
             className="animate-bounce">
          <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor"
                strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}
