import { useApp } from '../../context/AppContext'

interface FooterProps { onAdminClick?: () => void }

export default function Footer({ onAdminClick }: FooterProps) {
  const { navigate } = useApp()

  return (
    <footer className="bg-[#020b14] border-t border-white/6 px-4 md:px-8 lg:px-16 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <button
              onClick={() => navigate('landing')}
              className="font-dancing text-white text-2xl tracking-wide mb-3 block bg-transparent border-none cursor-pointer"
            >
              MediConnect
            </button>
            <p className="text-white/35 font-inter text-xs leading-relaxed">
              India's smartest hospital appointment platform. Book a slot with any doctor, at any partner hospital, in under 2 minutes.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-white/50 font-inter text-xs uppercase tracking-[0.15em] mb-4">Platform</p>
            <ul className="space-y-2.5">
              {[
                { label: 'Hospitals', page: 'hospitals' as const },
                { label: 'Specialties', page: 'specialties' as const },
                { label: 'Compare Hospitals', page: 'compare-hospitals' as const },
                { label: 'Doctors', page: 'doctors' as const },
                { label: 'Medical Records', page: 'medical-records' as const },
                { label: 'My Appointments', page: 'my-appointments' as const },
              ].map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => navigate(l.page)}
                    className="text-white/40 hover:text-white font-inter text-sm
                               transition-colors duration-200 bg-transparent border-none cursor-pointer"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white/50 font-inter text-xs uppercase tracking-[0.15em] mb-4">Company</p>
            <ul className="space-y-2.5">
              {['About Us', 'Careers', 'Press', 'Blog'].map((item) => (
                <li key={item}>
                  <button className="text-white/40 hover:text-white font-inter text-sm
                                     transition-colors duration-200 bg-transparent border-none cursor-pointer">
                    {item}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => onAdminClick?.()}
                  className="text-white/40 hover:text-white font-inter text-sm
                             transition-colors duration-200 bg-transparent border-none cursor-pointer">
                  Hospital Admin Panel
                </button>
              </li>
            </ul>
          </div>

          {/* Legal + contact */}
          <div>
            <p className="text-white/50 font-inter text-xs uppercase tracking-[0.15em] mb-4">Support</p>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Help Centre', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <button className="text-white/40 hover:text-white font-inter text-sm
                                     transition-colors duration-200 bg-transparent border-none cursor-pointer">
                    {item}
                  </button>
                </li>
              ))}
            </ul>

            {/* Contact link */}
            <a href="#contact"
               className="inline-flex items-center gap-1.5 mt-5 text-white/50 hover:text-white
                          text-sm font-inter transition-colors duration-200">
              Contact Us
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L10 2M4 2h6v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/6 flex flex-col sm:flex-row
                        items-center justify-between gap-3">
          <p className="text-white/20 font-inter text-xs">
            © 2026 MediConnect Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-white/25 font-inter text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
