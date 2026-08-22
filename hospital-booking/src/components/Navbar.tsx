import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getPatientSession, clearPatientSession } from '../data/patientAuth'

const NAV_LINKS = [
  { label: 'Hospitals',   short: 'Hospitals',   page: 'hospitals'         as const },
  { label: 'Specialties', short: 'Specialties', page: 'specialties'       as const },
  { label: 'Compare Hospitals', short: 'Compare', page: 'compare-hospitals' as const },
  { label: 'Doctors',     short: 'Doctors',     page: 'doctors'           as const },
  { label: 'Medical Records', short: 'Records', page: 'medical-records'   as const },
  { label: 'My Appointments', short: 'Appointments', page: 'my-appointments' as const },
]

interface NavbarProps {
  onAdminClick?: () => void
  onEmergencyClick?: (auto?: boolean) => void
}

export default function Navbar({ onAdminClick, onEmergencyClick }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [patient, setPatient]   = useState(getPatientSession)
  const { navigate, page }                = useApp()

  // Refresh patient session when page changes (e.g. after login)
  useEffect(() => { setPatient(getPatientSession()) }, [page])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3
                 px-4 lg:px-6 xl:px-10 py-3 transition-all duration-400"
      style={{
        background: scrolled
          ? 'rgba(3,13,24,0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      }}
    >
      {/* Brand */}
      <button
        onClick={() => navigate('landing')}
        className="font-dancing text-white text-2xl xl:text-3xl select-none tracking-wide shrink-0
                   bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
      >
        MediConnect
      </button>

      {/* Desktop links — centered, compact so they never overlap */}
      <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 gap-2 xl:gap-3">
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

        <div className="flex items-center gap-2.5 xl:gap-4 overflow-x-auto scrollbar-hide min-w-0">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.page)}
              className={`text-[11px] xl:text-[13px] tracking-wide transition-all duration-200 font-inter
                          bg-transparent border-none cursor-pointer relative group whitespace-nowrap shrink-0
                          ${page === link.page ? 'text-white' : 'text-white/65 hover:text-white'}`}
            >
              <span className="xl:hidden">{link.short}</span>
              <span className="hidden xl:inline">{link.label}</span>
              <span className={`absolute -bottom-1 left-0 right-0 h-px bg-white rounded transition-transform duration-300
                                origin-left ${page === link.page ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Right cluster: desktop CTAs + mobile menu */}
      <div className="flex items-center justify-end gap-2 xl:gap-3 shrink-0 ml-auto lg:ml-0">
      {/* Desktop CTAs */}
      <div className="hidden lg:flex items-center justify-end gap-2 xl:gap-3">
        {/* Patient sign in / avatar */}
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
            {/* Dropdown on hover */}
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
              <div className="my-1 border-t border-white/8"/>
              <button onClick={() => { clearPatientSession(); setPatient(null) }}
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
          <span className="xl:hidden">Hospital</span>
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
        onClick={() => setMenuOpen((v) => !v)}
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

      {/* Mobile panel */}
      <div
        style={{
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
        }}
        className="fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-[#030d18]/97
                   backdrop-blur-xl border-l border-white/10 flex flex-col pt-24 pb-10 px-8 z-40"
      >
        {/* Emergency button — top of mobile menu */}
        <button
          style={{
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? 'translateX(0)' : 'translateX(32px)',
            transition: 'opacity 0.4s ease 100ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) 100ms',
          }}
          onClick={() => { onEmergencyClick?.(); setMenuOpen(false) }}
          className="btn-emergency flex items-center justify-center gap-2 w-full
                     bg-red-600 text-white py-3.5 rounded-xl font-inter font-bold
                     text-sm tracking-widest uppercase mb-5 border border-red-400/40"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"/>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white"/>
          </span>
          🚨 Emergency SOS
        </button>

        <div className="flex flex-col gap-1">
          {NAV_LINKS.map((link, i) => (
            <button
              key={link.label}
              onClick={() => { navigate(link.page); setMenuOpen(false) }}
              style={{
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateX(0)' : 'translateX(32px)',
                transition: `opacity 0.4s ease ${175 + i * 75}ms,
                             transform 0.4s cubic-bezier(0.22,1,0.36,1) ${175 + i * 75}ms`,
              }}
              className={`text-lg tracking-wide py-3.5 border-b border-white/8 font-inter
                          text-left bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer
                          transition-colors duration-200
                          ${page === link.page ? 'text-white' : 'text-white/65 hover:text-white'}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <button
          style={{
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? 'translateX(0)' : 'translateX(32px)',
            transition: 'opacity 0.4s ease 550ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) 550ms',
          }}
          onClick={() => { navigate('hospitals'); setMenuOpen(false) }}
          className="mt-10 bg-white text-black px-8 py-4 rounded-full font-medium text-sm
                     tracking-wide hover:bg-white/90 transition-colors duration-300 font-inter"
        >
          Book Appointment
        </button>

        {/* Hospital portal link in mobile menu */}
        <button
          style={{
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? 'translateX(0)' : 'translateX(32px)',
            transition: 'opacity 0.4s ease 620ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) 620ms',
          }}
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

        <div
          style={{
            opacity: menuOpen ? 1 : 0,
            transition: 'opacity 0.4s ease 700ms',
          }}
          className="mt-auto space-y-3"
        >
          {/* Patient sign in / out in mobile menu */}
          {patient ? (
            <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0A4267] to-[#20658E]
                                flex items-center justify-center">
                  <span className="text-white font-inter font-bold text-[10px]">
                    {patient.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white/60 font-inter text-xs">{patient.name}</span>
              </div>
              <button onClick={() => { clearPatientSession(); setPatient(null); setMenuOpen(false) }}
                className="text-red-400/60 hover:text-red-400 font-inter text-[10px] transition-colors">
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => { navigate('patient-login'); setMenuOpen(false) }}
              className="w-full border border-white/12 text-white/50 hover:text-white
                         hover:border-white/25 py-3 rounded-xl font-inter text-sm
                         transition-all flex items-center justify-center gap-2">
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
