import { useState } from 'react'
import { useScrollReveal, fadeUpStyle, fadeLeftStyle, fadeRightStyle } from '../../hooks/useScrollReveal'

export default function ContactSection() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.08 })
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setTimeout(() => { setSent(true); setSending(false) }, 900)
  }

  return (
    <section
      ref={ref}
      id="contact"
      className="py-24 px-4 md:px-8 lg:px-16 bg-[#030d18]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14" style={fadeUpStyle(visible, 0)}>
          <span className="text-white/30 text-xs font-inter tracking-[0.2em] uppercase">Get in touch</span>
          <h2 className="font-instrument text-white text-3xl md:text-5xl mt-3">
            Contact <span className="italic">Us</span>
          </h2>
          <p className="text-white/40 font-inter text-sm mt-3 max-w-md mx-auto">
            Have a question, want to list your hospital, or need support? We're here.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left — info */}
          <div className="flex flex-col gap-6" style={fadeLeftStyle(visible, 150)}>
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"
                          stroke="white" strokeWidth="1.5" />
                    <path d="M3 7l7 5 7-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                label: 'Email',
                value: 'support@mediconnect.in',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5a2 2 0 012-2h2l2 4-2 2a10 10 0 005 5l2-2 4 2v2a2 2 0 01-2 2A16 16 0 013 5z"
                          stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                label: 'Phone',
                value: '+91 1800-MED-CONN',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 11a4 4 0 100-8 4 4 0 000 8z" stroke="white" strokeWidth="1.5" />
                    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                label: 'Headquarters',
                value: 'Bandra Kurla Complex, Mumbai 400051',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.5" />
                    <path d="M10 6v4l3 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                label: 'Support Hours',
                value: 'Mon–Sat, 8 AM – 9 PM IST',
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0A4267]/60 to-[#20658E]/40
                                border border-white/10 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-white/40 font-inter text-xs uppercase tracking-wide">{label}</p>
                  <p className="text-white font-inter text-sm font-medium mt-0.5">{value}</p>
                </div>
              </div>
            ))}

            {/* For hospitals CTA */}
            <div className="mt-4 bg-gradient-to-r from-[#0A4267]/30 to-[#20658E]/20
                            border border-white/10 rounded-2xl p-5">
              <p className="text-white font-inter font-semibold text-sm">Are you a hospital?</p>
              <p className="text-white/50 font-inter text-xs mt-1 leading-relaxed">
                Partner with MediConnect to list your facility and let patients book appointments directly.
                Join 200+ hospitals already on the platform.
              </p>
              <button className="mt-3 text-white/70 hover:text-white text-xs font-inter
                                 underline underline-offset-2 transition-colors">
                Apply for partnership →
              </button>
            </div>
          </div>

          {/* Right — form */}
          <div style={fadeRightStyle(visible, 200)}>
            {sent ? (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-10
                              flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40
                                flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M7 14l4.5 4.5L21 9" stroke="#34d399" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-instrument text-2xl">Message sent!</p>
                  <p className="text-white/50 font-inter text-sm mt-2">
                    We'll get back to you within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="text-white/40 hover:text-white text-sm font-inter transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}
                    className="bg-white/4 border border-white/8 rounded-2xl p-7 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text" placeholder="Your Name *" required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/30
                                 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm
                                 font-inter focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <input
                      type="email" placeholder="Email Address *" required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/30
                                 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm
                                 font-inter focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <input
                  type="text" placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30
                             rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm
                             font-inter focus:outline-none transition-colors"
                />
                <textarea
                  placeholder="Your message *" required rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30
                             rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm
                             font-inter focus:outline-none transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-white text-[#030d18] py-4 rounded-xl font-inter font-semibold
                             text-sm tracking-wide hover:bg-white/90 disabled:opacity-50
                             transition-all duration-200 button-glow flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"
                                strokeDasharray="28" strokeDashoffset="10" />
                      </svg>
                      Sending...
                    </>
                  ) : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
