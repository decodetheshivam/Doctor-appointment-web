import { useState } from 'react'
import {
  saveHospitalAdmin,
  generateAdminId,
  getHospitalAdminByEmail,
  type HospitalAdmin,
} from '../../data/adminAuth'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu & Kashmir','Ladakh',
]

const SPECIALTIES_LIST = [
  'Cardiology','Neurology','Orthopedics','Oncology','Pediatrics','Dermatology',
  'Gastroenterology','Psychiatry','General Medicine','Gynecology','Ophthalmology',
  'ENT','Radiology','Surgery','Nephrology','Urology','Endocrinology','Pulmonology',
]

type Step = 1 | 2 | 3 | 4

interface FormData {
  hospitalName: string; licenseNumber: string; registrationNumber: string
  hospitalType: HospitalAdmin['hospitalType']; specialties: string[]; beds: string
  establishedYear: string; website: string
  address: string; city: string; state: string; pincode: string
  adminName: string; adminDesignation: string; email: string; phone: string
  password: string; confirmPassword: string
}

const EMPTY: FormData = {
  hospitalName:'', licenseNumber:'', registrationNumber:'', hospitalType:'private',
  specialties:[], beds:'', establishedYear:'', website:'',
  address:'', city:'', state:'', pincode:'',
  adminName:'', adminDesignation:'', email:'', phone:'', password:'', confirmPassword:'',
}

interface Props { onSuccess: () => void; onLoginClick: () => void }

export default function HospitalRegisterPage({ onSuccess, onLoginClick }: Props) {
  const [step, setStep]     = useState<Step>(1)
  const [form, setForm]     = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'general', string>>>({})
  const [done, setDone]     = useState(false)

  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'
  const sel = `${inp} appearance-none`
  const err = (k: keyof typeof errors) => errors[k] ? <p className="text-red-400 text-xs mt-1 font-inter">{errors[k]}</p> : null

  function toggleSpecialty(s: string) {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }))
  }

  function validateStep(): boolean {
    const e: typeof errors = {}
    if (step === 1) {
      if (!form.hospitalName.trim()) e.hospitalName = 'Hospital name is required'
      if (!form.licenseNumber.trim()) e.licenseNumber = 'License number is required'
      if (!form.registrationNumber.trim()) e.registrationNumber = 'Registration number is required'
      if (!form.beds || Number(form.beds) < 1) e.beds = 'Number of beds is required'
      if (!form.establishedYear || Number(form.establishedYear) < 1900 || Number(form.establishedYear) > 2026)
        e.establishedYear = 'Enter a valid year'
      if (form.specialties.length === 0) e.specialties = 'Select at least one specialty'
    }
    if (step === 2) {
      if (!form.address.trim()) e.address = 'Address is required'
      if (!form.city.trim()) e.city = 'City is required'
      if (!form.state) e.state = 'State is required'
      if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode'
    }
    if (step === 3) {
      if (!form.adminName.trim()) e.adminName = 'Admin name is required'
      if (!form.adminDesignation.trim()) e.adminDesignation = 'Designation is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
      if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number'
    }
    if (step === 4) {
      if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
      if (!/[A-Z]/.test(form.password)) e.password = 'Must contain an uppercase letter'
      if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
      if (getHospitalAdminByEmail(form.email)) e.general = 'This email is already registered'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (!validateStep()) return
    if (step < 4) { setStep((s) => (s + 1) as Step); return }
    // Submit
    const admin: HospitalAdmin = {
      id: generateAdminId(),
      hospitalName: form.hospitalName.trim(),
      licenseNumber: form.licenseNumber.trim(),
      registrationNumber: form.registrationNumber.trim(),
      hospitalType: form.hospitalType,
      specialties: form.specialties,
      beds: Number(form.beds),
      establishedYear: Number(form.establishedYear),
      website: form.website.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state,
      pincode: form.pincode,
      adminName: form.adminName.trim(),
      adminDesignation: form.adminDesignation.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone,
      password: form.password,
      status: 'pending',
      registeredAt: new Date().toISOString(),
      totalAppointments: 0,
      totalPatients: 0,
    }
    saveHospitalAdmin(admin)
    setDone(true)
  }

  const STEPS = ['Hospital Info', 'Location', 'Admin Contact', 'Set Password']

  if (done) return (
    <div className="min-h-screen bg-[#030d18] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30
                        flex items-center justify-center mx-auto mb-6">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M9 18l6 6 12-12" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="font-instrument text-white text-3xl mb-3">Registration Submitted!</h2>
        <p className="text-white/50 font-inter text-sm leading-relaxed mb-2">
          Your hospital registration has been submitted for review by the MediConnect team.
        </p>
        <p className="text-white/40 font-inter text-sm leading-relaxed mb-8">
          You will receive an email at <span className="text-white/70">{form.email}</span> once your account is approved. This usually takes 1–2 business days.
        </p>
        <button onClick={onSuccess}
          className="bg-white text-[#030d18] px-8 py-3.5 rounded-full font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
          Back to Home
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#030d18] flex items-start justify-center p-4 pt-20">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <button onClick={onSuccess}
            className="font-dancing text-white text-2xl tracking-wide bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity mb-6 block mx-auto">
            MediConnect
          </button>
          <h1 className="font-instrument text-white text-3xl md:text-4xl">
            Register Your <span className="italic">Hospital</span>
          </h1>
          <p className="text-white/40 font-inter text-sm mt-2">
            Join 200+ hospitals. Step {step} of 4 — {STEPS[step - 1]}
          </p>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-full h-1 rounded-full transition-all duration-500
                               ${i + 1 < step ? 'bg-emerald-500' :
                                 i + 1 === step ? 'bg-white' : 'bg-white/10'}`} />
              <span className={`text-[10px] font-inter hidden sm:block transition-colors
                               ${i + 1 === step ? 'text-white' : 'text-white/25'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 md:p-8 space-y-4">
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 font-inter text-sm">{errors.general}</p>
            </div>
          )}

          {/* ── STEP 1: Hospital Info ── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Hospital Name *</label>
                  <input className={inp} placeholder="e.g. Apollo City Hospital" value={form.hospitalName}
                    onChange={(e) => setForm({...form, hospitalName: e.target.value})} />
                  {err('hospitalName')}
                </div>
                <div>
                  <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">License Number *</label>
                  <input className={inp} placeholder="e.g. MH-HOSP-2024-001234" value={form.licenseNumber}
                    onChange={(e) => setForm({...form, licenseNumber: e.target.value})} />
                  {err('licenseNumber')}
                </div>
                <div>
                  <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Registration Number *</label>
                  <input className={inp} placeholder="e.g. REG-2024-XXXX" value={form.registrationNumber}
                    onChange={(e) => setForm({...form, registrationNumber: e.target.value})} />
                  {err('registrationNumber')}
                </div>
                <div>
                  <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Hospital Type *</label>
                  <select className={sel} value={form.hospitalType}
                    onChange={(e) => setForm({...form, hospitalType: e.target.value as HospitalAdmin['hospitalType']})}>
                    <option value="private" className="bg-[#071525]">Private</option>
                    <option value="government" className="bg-[#071525]">Government</option>
                    <option value="trust" className="bg-[#071525]">Trust / NGO</option>
                    <option value="clinic" className="bg-[#071525]">Clinic / Polyclinic</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Number of Beds *</label>
                  <input className={inp} type="number" placeholder="e.g. 250" value={form.beds}
                    onChange={(e) => setForm({...form, beds: e.target.value})} />
                  {err('beds')}
                </div>
                <div>
                  <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Established Year *</label>
                  <input className={inp} type="number" placeholder="e.g. 2005" value={form.establishedYear}
                    onChange={(e) => setForm({...form, establishedYear: e.target.value})} />
                  {err('establishedYear')}
                </div>
                <div>
                  <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Website (optional)</label>
                  <input className={inp} placeholder="www.yourhospital.com" value={form.website}
                    onChange={(e) => setForm({...form, website: e.target.value})} />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-2">
                  Specialties * <span className="text-white/20 normal-case">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES_LIST.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                      className={`text-xs font-inter px-3 py-1.5 rounded-full border transition-all duration-200
                                 ${form.specialties.includes(s)
                                   ? 'bg-white text-[#030d18] border-white'
                                   : 'bg-white/4 text-white/50 border-white/10 hover:border-white/25 hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                {err('specialties')}
              </div>
            </>
          )}

          {/* ── STEP 2: Location ── */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Street Address *</label>
                <textarea className={`${inp} resize-none`} rows={2} placeholder="Building, street, area..."
                  value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
                {err('address')}
              </div>
              <div>
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">City *</label>
                <input className={inp} placeholder="e.g. Mumbai" value={form.city}
                  onChange={(e) => setForm({...form, city: e.target.value})} />
                {err('city')}
              </div>
              <div>
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">State *</label>
                <select className={sel} value={form.state}
                  onChange={(e) => setForm({...form, state: e.target.value})}>
                  <option value="" className="bg-[#071525]">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s} className="bg-[#071525]">{s}</option>
                  ))}
                </select>
                {err('state')}
              </div>
              <div>
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Pincode *</label>
                <input className={inp} placeholder="6-digit pincode" maxLength={6} value={form.pincode}
                  onChange={(e) => setForm({...form, pincode: e.target.value.replace(/\D/g,'')})} />
                {err('pincode')}
              </div>
            </div>
          )}

          {/* ── STEP 3: Admin Contact ── */}
          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Admin Full Name *</label>
                <input className={inp} placeholder="e.g. Rajiv Kapoor" value={form.adminName}
                  onChange={(e) => setForm({...form, adminName: e.target.value})} />
                {err('adminName')}
              </div>
              <div>
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Designation *</label>
                <input className={inp} placeholder="e.g. CEO / Medical Director" value={form.adminDesignation}
                  onChange={(e) => setForm({...form, adminDesignation: e.target.value})} />
                {err('adminDesignation')}
              </div>
              <div className="sm:col-span-2">
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Official Email *</label>
                <input className={inp} type="email" placeholder="admin@yourhospital.com" value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})} />
                {err('email')}
              </div>
              <div className="sm:col-span-2">
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Mobile Number *</label>
                <input className={inp} type="tel" placeholder="10-digit mobile" maxLength={10} value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value.replace(/\D/g,'')})} />
                {err('phone')}
              </div>
              <div className="sm:col-span-2 bg-blue-500/8 border border-blue-500/15 rounded-xl p-4">
                <p className="text-blue-300/80 font-inter text-xs leading-relaxed">
                  This email and mobile will be used for all communications including account approval, appointment notifications, and password reset.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 4: Password ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Password *</label>
                <input className={inp} type="password" placeholder="Min 8 chars, uppercase, number" value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})} />
                {err('password')}
              </div>
              <div>
                <label className="text-white/40 text-xs font-inter uppercase tracking-wide block mb-1.5">Confirm Password *</label>
                <input className={inp} type="password" placeholder="Re-enter password" value={form.confirmPassword}
                  onChange={(e) => setForm({...form, confirmPassword: e.target.value})} />
                {err('confirmPassword')}
              </div>
              {/* Summary */}
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
                <p className="text-white/40 text-xs font-inter uppercase tracking-wide mb-3">Registration Summary</p>
                {[
                  ['Hospital', form.hospitalName],
                  ['License', form.licenseNumber],
                  ['Location', `${form.city}, ${form.state}`],
                  ['Admin', `${form.adminName} (${form.adminDesignation})`],
                  ['Email', form.email],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-white/30 font-inter text-xs w-20 shrink-0">{label}</span>
                    <span className="text-white/70 font-inter text-xs">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/25 font-inter text-xs leading-relaxed">
                By registering, you confirm that all details are accurate and you have authority to register this hospital on MediConnect. Your application will be reviewed within 1–2 business days.
              </p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between mt-5 gap-3">
          <button
            onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : onSuccess()}
            className="flex items-center gap-2 text-white/50 hover:text-white font-inter text-sm transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {step > 1 ? 'Back' : 'Home'}
          </button>
          <button onClick={handleNext}
            className="bg-white text-[#030d18] px-8 py-3 rounded-full font-inter font-semibold text-sm
                       hover:bg-white/90 hover:scale-105 active:scale-95 transition-all button-glow flex items-center gap-2">
            {step === 4 ? 'Submit Registration' : 'Next'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <p className="text-center text-white/25 font-inter text-xs mt-6">
          Already registered?{' '}
          <button onClick={onLoginClick}
            className="text-white/60 hover:text-white underline transition-colors bg-transparent border-none cursor-pointer">
            Sign in to your panel
          </button>
        </p>
      </div>
    </div>
  )
}
