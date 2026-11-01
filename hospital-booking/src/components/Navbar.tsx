import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { getPatientSession, clearPatientSession } from '../data/patientAuth'

// Primary links — always visible in the navbar
const PRIMARY_LINKS = [
  { label: 'Hospitals',       page: 'hospitals'         as const },
  { label: 'Doctors',         page: 'doctors'           as const },
  { label: 'Specialties',     page: 'specialties'       as const },
  { label: 'My Appointments', page: 'my-appointments'   as const },
]

// Secondary links — shown inside the "More" dropdown (no emojis — consistent with primary)
const MORE_LINKS = [
  { label: 'Compare Hospitals', page: 'compare-hospitals' as const },
  { label: 'Medical Records',   page: 'medical-records'   as const },
  { label: 'Prescriptions',     page: 'prescriptions'     as const },
  { label: 'Lab Tests',         page: 'lab-tests'         as const },
  { label: 'My Family',         page: 'family'            as const },
]

// All links — used in the mobile slide-out panel
const ALL_LINKS = [...PRIMARY_LINKS, ...MORE_LINKS]

interface NavbarProps {
  onAdminClick?: () => void
  onEmergencyClick?: (auto?: boolean) => void
  onSignOut?: () => void
}

export default function Navbar({ onAdminClick, onEmergencyClick, onSignOut }: NavbarProps) {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [moreOpen, setMoreOpen]   = useState(false)
  const [scrolled, setScrolled]   = useState(false)
  const [patient, setPatient]     = useState(getPatientSession)
  const { navigate, page }        = useApp()
  const moreRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => { setPatient(getPatientSession()) }, [page])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [moreOpen])

  // Whether any MORE_LINKS page is currently active (to highlight the More button)
  const morePageActive = MORE_LINKS.some(l => l.page === page)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3
                 px-4 lg:px-6 xl:px-10 py-3 transition-all duration-400"
      style={{
        background: scrolled ? 'rgba(3,13,24,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        borderRadius: scrolled ? '0' : '0',
        position: 'relative',
      }}
    >
      {/* ── Animated glow ring — pulses every 5s ── */}
      {/* Outer border glow */}
      <div
        className="nav-ring"
        style={{
          background: 'transparent',
          boxShadow: '0 0 0 1px rgba(100,180,255,0.18), 0 0 18px 1px rgba(100,180,255,0.08)',
          animationDelay: '0s',
        }}
      />
      {/* Bottom sweep line */}
      <div
        className="nav-ring-sweep"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(100,180,255,0.0) 10%, rgba(100,180,255,0.55) 40%, rgba(180,220,255,0.9) 50%, rgba(100,180,255,0.55) 60%, rgba(100,180,255,0.0) 90%, transparent 100%)',
          animationDelay: '0s',
        }}
      />
      {/* ── Brand ── */}
      <button
        onClick={() => navigate('landing')}
        className="font-dancing text-white text-2xl xl:text-3xl select-none tracking-wide shrink-0
                   bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
      >
        MediConnect
      </button>

      {/* ── Desktop nav ── */}
      <div className="hidden lg:flex flex-1 items-center justify-center gap-2 xl:gap-3">

        {/* Emergency SOS */}
        <button
          onClick={() => onEmergencyClick?.()}
          className="btn-emergency flex items-center gap-1.5 bg-red-600 hover:bg-red-500 shrink-0
                     text-white text-[10px] xl:text-xs font-inter font-bold tracking-wider
                     px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-full border border-red-400/50
                     transition-all duration-200 hover:scale-105 active:scale-95 uppercase whitespace-nowrap"
        >
          <span className="relative flex h-1.5 w-1.5 xl:h-2 xl:w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"/>
            <span className="relative inline-flex h-1.5 w-1.5 xl:h-2 xl:w-2 rounded-full bg-white"/>
          </span>
          <span className="xl:hidden">SOS</span>
          <span className="hidden xl:inline">Emergency SOS</span>
        </button>

        <div className="w-px h-4 bg-white/10 shrink-0"/>

        {/* Primary links */}
        {PRIMARY_LINKS.map((link) => (
          <button
            key={link.label}
            onClick={() => navigate(link.page)}
            className={`text-[11px] xl:text-[13px] tracking-wide transition-all duration-200 font-inter
                        bg-transparent border-none cursor-pointer relative group whitespace-nowrap shrink-0
                        ${page === link.page ? 'text-white' : 'text-white/65 hover:text-white'}`}
          >
            {link.label}
            <span className={`absolute -bottom-1 left-0 right-0 h-px bg-white rounded transition-transform
                              duration-300 origin-left
                              ${page === link.page ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}/>
          </button>
        ))}

        {/* ── More dropdown ── */}
        <div ref={moreRef} className="relative shrink-0">
          <button
            onClick={() => setMoreOpen(v => !v)}
            className={`flex items-center gap-1 text-[11px] xl:text-[13px] tracking-wide font-inter
                        transition-all duration-200 cursor-pointer whitespace-nowrap relative group
                        ${morePageActive ? 'text-white' : 'text-white/65 hover:text-white'}`}
          >
            More
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              className={`transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
            >
              <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {/* Active indicator when a "more" page is open */}
            <span className={`absolute -bottom-1 left-0 right-0 h-px bg-white rounded transition-transform
                              duration-300 origin-left
                              ${morePageActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}/>
          </button>

          {/* Dropdown panel */}
          {moreOpen && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 rounded-2xl overflow-hidden shadow-2xl z-50"
              style={{
                background: 'rgba(7,21,37,0.97)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                animation: 'chatbot-in 0.2s cubic-bezier(0.22,1,0.36,1) both',
              }}
            >
              {/* Arrow tip */}
              <div
                className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
                style={{ background: 'rgba(7,21,37,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', borderRight: 'none' }}
              />
              <div className="p-1.5">
                {MORE_LINKS.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => { navigate(link.page); setMoreOpen(false) }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-inter
                                transition-all duration-150 text-left
                                ${page === link.page
                                  ? 'bg-white/10 text-white'
                                  : 'text-white/55 hover:bg-white/6 hover:text-white'}`}
                  >
                    <span className="text-xs">{link.label}</span>
                    {page === link.page && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0"/>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right cluster: desktop CTAs + mobile hamburger ── */}
      <div className="flex items-center justify-end gap-2 xl:gap-3 shrink-0 ml-auto lg:ml-0">

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3">

          {/* Patient avatar / sign-in */}
          {patient ? (
            <div className="flex items-center gap-2 group relative">
              <button className="flex items-center gap-2 bg-white/6 border border-white/10
                                 hover:bg-white/10 rounded-full pl-2 pr-3 py-1.5 transition-all">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0A4267] to-[#20658E]
                                flex items-center justify-center">
                  <span className="text-white font-inter font-bold text-[10px]">
                    {patient.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white/70 font-inter text-xs max-w-[72px] truncate hidden xl:inline">
                  {patient.name.split(' ')[0]}
                </span>
              </button>
              {/* Hover dropdown */}
              <div className="absolute top-full right-0 mt-2 w-44 bg-[#071525] border border-white/10
                              rounded-xl p-1.5 opacity-0 group-hover:opacity-100 pointer-events-none
                              group-hover:pointer-events-auto transition-all duration-200 z-50
                              shadow-xl translate-y-1 group-hover:translate-y-0">
                <button onClick={() => navigate('my-appointments')}
                  className="w-full text-left px-3 py-2 text-white/60 hover:text-white hover:bg-white/6
                             font-inter text-xs rounded-lg transition-all">
                  📅 My Appointments
                </button>
                <button onClick={() => navigate('medical-records')}
                  className="w-full text-left px-3 py-2 text-white/60 hover:text-white hover:bg-white/6
                             font-inter text-xs rounded-lg transition-all">
                  📋 Medical Records
                </button>
                <button onClick={() => navigate('prescriptions')}
                  className="w-full text-left px-3 py-2 text-white/60 hover:text-white hover:bg-white/6
                             font-inter text-xs rounded-lg transition-all">
                  💊 Prescriptions
                </button>
                <button onClick={() => navigate('lab-tests')}
                  className="w-full text-left px-3 py-2 text-white/60 hover:text-white hover:bg-white/6
                             font-inter text-xs rounded-lg transition-all">
                  🧪 Lab Tests
                </button>
                <button onClick={() => navigate('family')}
                  className="w-full text-left px-3 py-2 text-white/60 hover:text-white hover:bg-white/6
                             font-inter text-xs rounded-lg transition-all">
                  👨‍👩‍👧 My Family
                </button>
                <div className="my-1 border-t border-white/8"/>
                <button onClick={() => { clearPatientSession(); setPatient(null); onSignOut?.() }}
                  className="w-full text-left px-3 py-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/8
                             font-inter text-xs rounded-lg transition-all">
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('patient-login')}
              className="text-white/50 hover:text-white text-xs xl:text-sm font-inter tracking-wide
                         transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 12c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Sign In
            </button>
          )}

          <button onClick={onAdminClick}
            className="text-white/35 hover:text-white/70 text-[11px] xl:text-xs font-inter tracking-wide
                       transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 6.5h5M6.5 4v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="hidden xl:inline">Hospital Portal</span>
            <span className="xl:hidden">Portal</span>
          </button>

          <button onClick={() => navigate('hospitals')}
            className="bg-white text-black px-4 py-2 xl:px-5 xl:py-2.5 rounded-full font-medium
                       text-xs xl:text-sm tracking-wide hover:bg-white/90 hover:scale-105 active:scale-95
                       transition-all duration-300 button-glow font-inter whitespace-nowrap">
            Book
            <span className="hidden xl:inline"> Appointment</span>
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden relative w-10 h-10 flex flex-col justify-center items-center z-50"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {[
            menuOpen ? 'rotate(45deg) translateY(9px)' : 'none',
            undefined,
            menuOpen ? 'rotate(-45deg) translateY(-9px)' : 'none',
          ].map((transform, idx) => (
            <span
              key={idx}
              style={{
                transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s',
                transform: transform ?? (menuOpen ? 'scaleX(0)' : 'scaleX(1)'),
                opacity: idx === 1 ? (menuOpen ? 0 : 1) : 1,
              }}
              className={`block w-6 h-[1.5px] bg-white ${idx < 2 ? 'mb-[7px]' : ''}`}
            />
          ))}
        </button>
      </div>

      {/* ── Mobile slide-out panel ── */}
      <div
        style={{
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
        }}
        className="fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-[#030d18]/97
                   backdrop-blur-xl border-l border-white/10 flex flex-col pt-24 pb-10 px-8 z-40"
      >
        {/* Emergency */}
        <button
          style={{ opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'translateX(0)' : 'translateX(32px)', transition: 'opacity 0.4s ease 100ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) 100ms' }}
          onClick={() => { onEmergencyClick?.(); setMenuOpen(false) }}
          className="btn-emergency flex items-center justify-center gap-2 w-full bg-red-600
                     text-white py-3.5 rounded-xl font-inter font-bold text-sm tracking-widest
                     uppercase mb-5 border border-red-400/40"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"/>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white"/>
          </span>
          🚨 Emergency SOS
        </button>

        {/* All links */}
        <div className="flex flex-col gap-0.5 overflow-y-auto scrollbar-hide">
          {ALL_LINKS.map((link, i) => (
            <button
              key={link.label}
              onClick={() => { navigate(link.page); setMenuOpen(false) }}
              style={{
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateX(0)' : 'translateX(32px)',
                transition: `opacity 0.4s ease ${175 + i * 60}ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${175 + i * 60}ms`,
              }}
              className={`flex items-center gap-3 text-base tracking-wide py-3.5 border-b border-white/8
                          font-inter text-left bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer
                          transition-colors duration-200
                          ${page === link.page ? 'text-white' : 'text-white/65 hover:text-white'}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <button
          style={{ opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'translateX(0)' : 'translateX(32px)', transition: `opacity 0.4s ease ${175 + ALL_LINKS.length * 60}ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${175 + ALL_LINKS.length * 60}ms` }}
          onClick={() => { navigate('hospitals'); setMenuOpen(false) }}
          className="mt-8 bg-white text-black px-8 py-4 rounded-full font-medium text-sm
                     tracking-wide hover:bg-white/90 transition-colors duration-300 font-inter"
        >
          Book Appointment
        </button>

        <button
          style={{ opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'translateX(0)' : 'translateX(32px)', transition: `opacity 0.4s ease ${175 + ALL_LINKS.length * 60 + 70}ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${175 + ALL_LINKS.length * 60 + 70}ms` }}
          onClick={() => { onAdminClick?.(); setMenuOpen(false) }}
          className="mt-3 border border-white/15 text-white/60 hover:text-white hover:border-white/30
                     px-8 py-3.5 rounded-full font-medium text-sm tracking-wide
                     transition-colors duration-300 font-inter flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Hospital Portal
        </button>

        <div style={{ opacity: menuOpen ? 1 : 0, transition: 'opacity 0.4s ease 700ms' }} className="mt-auto space-y-3">
          {patient ? (
            <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0A4267] to-[#20658E] flex items-center justify-center">
                  <span className="text-white font-inter font-bold text-[10px]">{patient.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-white/60 font-inter text-xs">{patient.name}</span>
              </div>
              <button onClick={() => { clearPatientSession(); setPatient(null); setMenuOpen(false); onSignOut?.() }}
                className="text-red-400/60 hover:text-red-400 font-inter text-[10px] transition-colors">
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => { navigate('patient-login'); setMenuOpen(false) }}
              className="w-full border border-white/12 text-white/50 hover:text-white hover:border-white/25
                         py-3 rounded-xl font-inter text-sm transition-all flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 13c0-3 2.5-5.5 5.5-5.5S12.5 10 12.5 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Patient Sign In
            </button>
          )}
          <p className="text-white/20 font-inter text-[10px] text-center">200+ hospitals · Instant booking</p>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  )
}
