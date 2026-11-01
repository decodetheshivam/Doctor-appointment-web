import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

// --- Lerp helper ---
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

// --- Clamp helper ---
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function QuoteSection() {
  const { navigate } = useApp()
  const sectionRef = useRef<HTMLDivElement>(null)

  // Refs for animated elements
  const rainbowRef = useRef<HTMLImageElement>(null)
  const leftCloudRef = useRef<HTMLImageElement>(null)
  const rightCloudRef = useRef<HTMLImageElement>(null)

  // Current (lerped) values
  const state = useRef({
    rainbowY: 120,
    leftX: -200,
    leftOpacity: 0,
    rightX: 200,
    rightOpacity: 0,
    cloudY: 0,
  })

  useEffect(() => {
    let rafId: number

    function tick() {
      const section = sectionRef.current
      if (!section) {
        rafId = requestAnimationFrame(tick)
        return
      }

      const rect = section.getBoundingClientRect()
      const wh = window.innerHeight
      const progress = clamp(0, 1, (wh - rect.top) / (wh + rect.height))

      // --- Target values ---
      const targetRainbowY = 120 + ((-160) - 120) * progress   // 120 → -160
      const cloudActive = progress > 0.12 && progress < 0.92
      const targetLeftX = cloudActive ? 0 : -200
      const targetRightX = cloudActive ? 0 : 200
      const targetCloudOpacity = cloudActive ? 1 : 0
      const targetCloudY = progress * -50

      const s = state.current

      // Lerp toward targets
      s.rainbowY = lerp(s.rainbowY, targetRainbowY, 0.06)
      s.leftX = lerp(s.leftX, targetLeftX, 0.04)
      s.rightX = lerp(s.rightX, targetRightX, 0.04)
      s.leftOpacity = lerp(s.leftOpacity, targetCloudOpacity, 0.06)
      s.rightOpacity = lerp(s.rightOpacity, targetCloudOpacity, 0.06)
      s.cloudY = lerp(s.cloudY, targetCloudY, 0.04)

      // Apply to DOM
      if (rainbowRef.current) {
        rainbowRef.current.style.transform = `translate3d(0, ${s.rainbowY}px, 0)`
      }
      if (leftCloudRef.current) {
        leftCloudRef.current.style.transform = `translate3d(${s.leftX}px, ${s.cloudY}px, 0)`
        leftCloudRef.current.style.opacity = String(s.leftOpacity)
      }
      if (rightCloudRef.current) {
        rightCloudRef.current.style.transform = `translate3d(${s.rightX}px, ${s.cloudY}px, 0) scaleX(-1)`
        rightCloudRef.current.style.opacity = String(s.rightOpacity)
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #010A17 0%, #0A4267 30%, #20658E 60%, #6BADC4 100%)',
      }}
    >
      {/* --- Rainbow / light prism image (z-5, BEHIND text) --- */}
      <img
        ref={rainbowRef}
        src="https://soft-zoom-63098134.figma.site/_assets/v11/8d520a7515d06cbfc403d0125e3d05b1a7ccd29c.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-x-0 top-0 w-full object-cover z-[5] pointer-events-none select-none opacity-60"
        style={{ willChange: 'transform', transform: 'translate3d(0, 120px, 0)' }}
      />

      {/* --- Left cloud --- */}
      <img
        ref={leftCloudRef}
        src="https://soft-zoom-63098134.figma.site/_assets/v11/0d6dfd3f90b930f21726f2ed56a3320d79b7a797.png"
        alt=""
        aria-hidden="true"
        className="absolute left-0 bottom-[10%] z-10 pointer-events-none select-none hidden sm:block w-[500px] md:w-[650px]"
        style={{
          marginLeft: '-50%',
          willChange: 'transform',
          opacity: 0,
          transform: 'translate3d(-200px, 0, 0)',
        }}
      />

      {/* --- Right cloud (mirrored) --- */}
      <img
        ref={rightCloudRef}
        src="https://soft-zoom-63098134.figma.site/_assets/v11/0d6dfd3f90b930f21726f2ed56a3320d79b7a797.png"
        alt=""
        aria-hidden="true"
        className="absolute right-0 bottom-[15%] z-10 pointer-events-none select-none hidden sm:block w-[500px] md:w-[650px]"
        style={{
          marginRight: '-75%',
          willChange: 'transform',
          opacity: 0,
          transform: 'translate3d(200px, 0, 0) scaleX(-1)',
        }}
      />

      {/* --- Quote content (z-20) --- */}
      <div className="relative z-20 flex flex-col items-center px-6 max-w-4xl text-center">
        {/* Small label */}
        <span className="text-white/50 text-xs font-inter tracking-[0.2em] uppercase mb-6 md:mb-8">
          Our Mission
        </span>

        {/* Quote */}
        <blockquote className="font-instrument text-white text-xl sm:text-2xl md:text-4xl lg:text-[42px] leading-[1.45] md:leading-[1.5]">
          &#8220;MediConnect was built on the belief that healthcare access should be effortless. We connect patients to the right hospital and the right doctor without the frustration of long waits or phone queues. Every appointment slot is managed in real time — so your time is always respected.&#8221;
        </blockquote>

        {/* Attribution */}
        <p className="mt-6 md:mt-8 text-white/80 text-sm md:text-base tracking-wide font-inter">
          Dr. Arjun Mehta &mdash; Co-founder &amp; Chief Medical Officer
        </p>

        {/* Stats row */}
        <div className="mt-10 md:mt-14 flex flex-wrap items-center justify-center gap-6 md:gap-12">
          {[
            { icon: '🏥', stat: '200+', desc: 'Partner Hospitals' },
            { icon: '⏱️', stat: '< 2 min', desc: 'Average booking time' },
            { icon: '✅', stat: '99.2%', desc: 'Slot accuracy' },
          ].map(({ icon, stat, desc }) => (
            <div key={desc} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{icon}</span>
              <span className="text-white font-inter font-semibold text-lg md:text-xl leading-none mt-1">
                {stat}
              </span>
              <span className="text-white/50 font-inter text-xs tracking-wide">{desc}</span>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <button
          onClick={() => navigate('hospitals')}
          className="mt-10 md:mt-14 bg-white text-[#0A4267] px-10 py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-white/90 transition-all duration-300 button-glow font-inter">
          Browse Hospitals
        </button>
      </div>
    </section>
  )
}
