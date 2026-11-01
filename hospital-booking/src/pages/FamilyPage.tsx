import { useState, useEffect } from 'react'
import { getPatientSession } from '../data/patientAuth'
import { HOSPITALS } from '../data/hospitals'
import { BLOOD_GROUPS } from '../data/patientAuth'
import {
  getFamilyMembersByOwner, saveFamilyMember, deleteFamilyMember,
  generateFamilyMemberId, generateVirtualPhone, getInitials, calculateAge, isMinor,
  RELATION_COLORS, RELATIONSHIPS, getFamilyNotifications, markNotificationsRead,
  addFamilyNotification,
  type FamilyMember, type Relationship, type Gender, type FamilyMemberPermissions,
} from '../data/familyProfiles'
import { getAppointments, cancelAppointment, saveAppointment, generateId, getNextToken, generateSlots, formatDate, formatTime } from '../data/appointments'
import { getRecordsByPatient } from '../data/medicalRecords'
import { getPrescriptionsByPatient, getTodaySchedule } from '../data/prescriptions'
import { getBookingsByPatient, getReportsByPatient, getActiveLabTests, saveBooking, generateBookingId, generateLabSlots, LAB_STATUS_LABELS, LAB_STATUS_COLORS } from '../data/labTests'

// ─── Shared input class strings (same as all other pages) ────────────────────
const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'
const sel = `${inp} appearance-none`

// ─── Types ────────────────────────────────────────────────────────────────────
type MainView = 'dashboard' | 'member-profile'

// ─── Empty member template ────────────────────────────────────────────────────
function emptyMember(ownerPhone: string): Omit<FamilyMember, 'id' | 'virtualPhone' | 'avatarInitials' | 'createdAt' | 'updatedAt'> {
  return {
    ownerPhone,
    name: '', dateOfBirth: '', gender: 'Male', relationship: 'Father',
    bloodGroup: 'Unknown', phone: '', address: '',
    knownConditions: '', allergies: '', notes: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    permissions: { appointments: 'full', prescriptions: 'full', medicalRecords: 'full', labTests: 'full' },
  }
}

// ─── Add / Edit Member Modal ──────────────────────────────────────────────────
function MemberModal({ ownerPhone, editing, onSave, onClose }: {
  ownerPhone: string
  editing: FamilyMember | null
  onSave: () => void
  onClose: () => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState(() =>
    editing
      ? { name: editing.name, dateOfBirth: editing.dateOfBirth, gender: editing.gender as Gender,
          relationship: editing.relationship as Relationship, bloodGroup: editing.bloodGroup,
          phone: editing.phone, address: editing.address, knownConditions: editing.knownConditions,
          allergies: editing.allergies, notes: editing.notes,
          emergencyContactName: editing.emergencyContactName,
          emergencyContactPhone: editing.emergencyContactPhone,
          emergencyContactRelation: editing.emergencyContactRelation,
          permissions: { ...editing.permissions } }
      : { ...emptyMember(ownerPhone), permissions: { appointments: 'full', prescriptions: 'full', medicalRecords: 'full', labTests: 'full' } as FamilyMemberPermissions }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate1() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function save() {
    if (!validate1()) return
    const now = new Date().toISOString()
    const member: FamilyMember = editing
      ? { ...editing, ...form, avatarInitials: getInitials(form.name), updatedAt: now }
      : {
          id: generateFamilyMemberId(),
          ownerPhone,
          virtualPhone: generateVirtualPhone(ownerPhone),
          ...form,
          avatarInitials: getInitials(form.name),
          createdAt: now,
          updatedAt: now,
        }
    saveFamilyMember(member)
    if (!editing) {
      addFamilyNotification(ownerPhone, {
        memberName: form.name,
        type: 'checkup',
        message: `${form.name} has been added to your family health profile.`,
      })
    }
    onSave()
    onClose()
  }

  const f = form as typeof form & { permissions: FamilyMemberPermissions }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] bg-[#071525] border border-white/12 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-instrument text-xl">{editing ? 'Edit Member' : 'Add Family Member'}</h2>
            <p className="text-white/35 font-inter text-xs mt-0.5">Step {step} of 2 — {step === 1 ? 'Personal Details' : 'Health & Permissions'}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Step bar */}
        <div className="flex gap-2 px-5 pt-4 shrink-0">
          {[1, 2].map(s => <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-white' : 'bg-white/15'}`}/>)}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-3">
          {step === 1 && (
            <>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Full Name *</label>
                <input className={`${inp} ${errors.name ? 'border-red-500/50' : ''}`} placeholder="e.g. Ramesh Kumar"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
                {errors.name && <p className="text-red-400 text-[10px] mt-1 font-inter">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Date of Birth *</label>
                  <input type="date" className={`${inp} ${errors.dateOfBirth ? 'border-red-500/50' : ''}`}
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})}/>
                  {errors.dateOfBirth && <p className="text-red-400 text-[10px] mt-1 font-inter">{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Gender *</label>
                  <select className={sel} value={form.gender} onChange={e => setForm({...form, gender: e.target.value as Gender})}>
                    {(['Male','Female','Other'] as Gender[]).map(g => <option key={g} value={g} className="bg-[#071525]">{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Relationship *</label>
                  <select className={sel} value={form.relationship} onChange={e => setForm({...form, relationship: e.target.value as Relationship})}>
                    {RELATIONSHIPS.map(r => <option key={r} value={r} className="bg-[#071525]">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Blood Group</label>
                  <select className={sel} value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})}>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b} className="bg-[#071525]">{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Contact Number</label>
                <input className={inp} type="tel" maxLength={10} placeholder="10-digit mobile"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g,'')})}/>
              </div>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Address</label>
                <input className={inp} placeholder="Street, area, city"
                  value={form.address} onChange={e => setForm({...form, address: e.target.value})}/>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Known Medical Conditions</label>
                <input className={inp} placeholder="e.g. Diabetes, Hypertension"
                  value={form.knownConditions} onChange={e => setForm({...form, knownConditions: e.target.value})}/>
              </div>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Known Allergies</label>
                <input className={inp} placeholder="e.g. Penicillin, Peanuts"
                  value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})}/>
              </div>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Additional Health Notes</label>
                <textarea className={`${inp} resize-none`} rows={2} placeholder="Any other relevant info"
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/>
              </div>
              {/* Emergency contact */}
              <p className="text-white/40 text-[10px] font-inter uppercase tracking-widest pt-1">Emergency Contact</p>
              <div className="grid grid-cols-3 gap-2">
                <input className={inp} placeholder="Name"
                  value={form.emergencyContactName} onChange={e => setForm({...form, emergencyContactName: e.target.value})}/>
                <input className={inp} placeholder="Mobile" maxLength={10}
                  value={form.emergencyContactPhone} onChange={e => setForm({...form, emergencyContactPhone: e.target.value.replace(/\D/g,'')})}/>
                <input className={inp} placeholder="Relation"
                  value={form.emergencyContactRelation} onChange={e => setForm({...form, emergencyContactRelation: e.target.value})}/>
              </div>
              {/* Permissions */}
              <p className="text-white/40 text-[10px] font-inter uppercase tracking-widest pt-1">Access Permissions</p>
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
                {(['appointments','prescriptions','medicalRecords','labTests'] as (keyof FamilyMemberPermissions)[]).map(key => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-white/60 font-inter text-xs capitalize">{key === 'medicalRecords' ? 'Medical Records' : key === 'labTests' ? 'Lab Tests' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <select
                      className="bg-white/5 border border-white/10 text-white/60 text-xs font-inter rounded-lg px-2 py-1.5 focus:outline-none appearance-none"
                      value={f.permissions[key]}
                      onChange={e => setForm({...form, permissions: {...f.permissions, [key]: e.target.value as 'full'|'view'|'none'}})}
                    >
                      <option value="full" className="bg-[#071525]">Full access</option>
                      <option value="view" className="bg-[#071525]">View only</option>
                      <option value="none" className="bg-[#071525]">No access</option>
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/8 shrink-0">
          <button onClick={step === 1 ? onClose : () => setStep(1)}
            className="text-white/40 hover:text-white font-inter text-sm transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step === 1
            ? <button onClick={() => { if (validate1()) setStep(2) }}
                className="bg-white text-[#030d18] px-5 py-2.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow flex items-center gap-1.5">
                Next <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            : <button onClick={save}
                className="bg-white text-[#030d18] px-5 py-2.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
                {editing ? 'Save Changes' : 'Add Member'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Book Appointment Modal for a family member ───────────────────────────────
function BookForMemberModal({ member, onClose, onBooked }: {
  member: FamilyMember
  onClose: () => void
  onBooked: () => void
}) {
  const [hospital, setHospital] = useState(HOSPITALS[0])
  const [doctor, setDoctor] = useState(HOSPITALS[0].doctors[0])
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [slots, setSlots] = useState(() => generateSlots(HOSPITALS[0].doctors[0].startTime, HOSPITALS[0].doctors[0].endTime, HOSPITALS[0].doctors[0].slotDuration, HOSPITALS[0].doctors[0].id, new Date().toISOString().slice(0,10)))
  const [time, setTime] = useState('')

  function updateHospital(hId: string) {
    const h = HOSPITALS.find(x => x.id === hId) || HOSPITALS[0]
    setHospital(h)
    setDoctor(h.doctors[0])
    setSlots(generateSlots(h.doctors[0].startTime, h.doctors[0].endTime, h.doctors[0].slotDuration, h.doctors[0].id, date))
    setTime('')
  }

  function updateDoctor(dId: string) {
    const d = hospital.doctors.find(x => x.id === dId) || hospital.doctors[0]
    setDoctor(d)
    setSlots(generateSlots(d.startTime, d.endTime, d.slotDuration, d.id, date))
    setTime('')
  }

  function updateDate(d: string) {
    setDate(d)
    setSlots(generateSlots(doctor.startTime, doctor.endTime, doctor.slotDuration, doctor.id, d))
    setTime('')
  }

  function book() {
    if (!time) return
    const token = getNextToken(doctor.id, date)
    saveAppointment({
      id: generateId(),
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      patientName: member.name,
      patientPhone: member.virtualPhone,
      patientAge: calculateAge(member.dateOfBirth).toString(),
      date, time,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
      tokenNumber: token,
    })
    onBooked()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] bg-[#071525] border border-white/12 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-instrument text-xl">Book Appointment</h2>
            <p className="text-white/35 font-inter text-xs mt-0.5">for {member.name} ({member.relationship})</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-3">
          {/* Patient info */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${RELATION_COLORS[member.relationship]} flex items-center justify-center shrink-0`}>
              <span className="text-white font-inter font-bold text-sm">{member.avatarInitials}</span>
            </div>
            <div>
              <p className="text-white font-inter text-sm font-medium">{member.name}</p>
              <p className="text-white/40 font-inter text-xs">{calculateAge(member.dateOfBirth)} yrs · {member.bloodGroup} · {member.relationship}</p>
            </div>
          </div>
          {/* Hospital */}
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Hospital</label>
            <select className={`${sel}`} value={hospital.id} onChange={e => updateHospital(e.target.value)}>
              {HOSPITALS.map(h => <option key={h.id} value={h.id} className="bg-[#071525]">{h.name} · {h.city}</option>)}
            </select>
          </div>
          {/* Doctor */}
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Doctor</label>
            <select className={`${sel}`} value={doctor.id} onChange={e => updateDoctor(e.target.value)}>
              {hospital.doctors.map(d => <option key={d.id} value={d.id} className="bg-[#071525]">{d.name} · {d.specialty}</option>)}
            </select>
          </div>
          {/* Date */}
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Date</label>
            <input type="date" className={inp} min={new Date().toISOString().slice(0,10)} value={date} onChange={e => updateDate(e.target.value)}/>
          </div>
          {/* Time slots */}
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-2">Available Slots</label>
            <div className="grid grid-cols-4 gap-2">
              {slots.map(s => (
                <button key={s.time} disabled={!s.available} onClick={() => setTime(s.time)}
                  className={`py-2 rounded-lg text-xs font-inter border transition-all
                    ${time === s.time ? 'bg-white text-[#030d18] border-white'
                    : s.available ? 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/10'
                    : 'bg-white/3 text-white/15 border-white/5 cursor-not-allowed'}`}>
                  {formatTime(s.time)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end p-5 border-t border-white/8 shrink-0">
          <button onClick={book} disabled={!time}
            className="bg-white text-[#030d18] px-6 py-3 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all button-glow">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Book Lab Test Modal for a family member ─────────────────────────────────
function BookLabForMemberModal({ member, onClose, onBooked }: {
  member: FamilyMember
  onClose: () => void
  onBooked: () => void
}) {
  const tests = getActiveLabTests()
  const [selectedTest, setSelectedTest] = useState(tests[0])
  const [hospital, setHospital] = useState(HOSPITALS[0])
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [slots, setSlots] = useState(() => generateLabSlots(new Date().toISOString().slice(0,10)))
  const [time, setTime] = useState('')

  function book() {
    if (!time || !selectedTest) return
    saveBooking({
      id: generateBookingId(),
      testId: selectedTest.id,
      testName: selectedTest.name,
      testCategory: selectedTest.category,
      patientName: member.name,
      patientPhone: member.virtualPhone,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      date, time,
      price: selectedTest.price,
      status: 'pending',
      bookingDate: new Date().toISOString(),
    })
    onBooked()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] bg-[#071525] border border-white/12 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-instrument text-xl">Book Lab Test</h2>
            <p className="text-white/35 font-inter text-xs mt-0.5">for {member.name}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-3">
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Test</label>
            <select className={`${sel}`} value={selectedTest?.id} onChange={e => { const t = tests.find(x => x.id === e.target.value); if (t) setSelectedTest(t) }}>
              {tests.map(t => <option key={t.id} value={t.id} className="bg-[#071525]">{t.name} · ₹{t.price}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Hospital</label>
            <select className={`${sel}`} value={hospital.id} onChange={e => setHospital(HOSPITALS.find(h => h.id === e.target.value) || HOSPITALS[0])}>
              {HOSPITALS.map(h => <option key={h.id} value={h.id} className="bg-[#071525]">{h.name} · {h.city}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Date</label>
            <input type="date" className={inp} min={new Date().toISOString().slice(0,10)} value={date}
              onChange={e => { setDate(e.target.value); setSlots(generateLabSlots(e.target.value)); setTime('') }}/>
          </div>
          <div>
            <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-2">Time Slot</label>
            <div className="grid grid-cols-4 gap-2">
              {slots.map(s => (
                <button key={s.time} disabled={!s.available} onClick={() => setTime(s.time)}
                  className={`py-2 rounded-lg text-xs font-inter border transition-all
                    ${time === s.time ? 'bg-white text-[#030d18] border-white'
                    : s.available ? 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/10'
                    : 'bg-white/3 text-white/15 border-white/5 cursor-not-allowed'}`}>
                  {formatTime(s.time)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-white/8 shrink-0">
          <p className="text-emerald-400 font-inter font-bold">₹{selectedTest?.price || 0}</p>
          <button onClick={book} disabled={!time}
            className="bg-white text-[#030d18] px-6 py-3 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all button-glow">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Member Profile Page ──────────────────────────────────────────────────────
function MemberProfile({ member, onBack, onEdit, onRefresh }: {
  member: FamilyMember
  onBack: () => void
  onEdit: () => void
  onRefresh: () => void
}) {
  const [tab, setTab] = useState<'overview' | 'appointments' | 'prescriptions' | 'lab' | 'records'>('overview')
  const [showBookAppt, setShowBookAppt] = useState(false)
  const [showBookLab, setShowBookLab] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [aFilter, setAFilter] = useState<'all'|'confirmed'|'cancelled'>('all')

  // Load data by virtualPhone — re-runs when refreshKey changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  void refreshKey // ensures re-render when refreshKey changes
  const allAppts = getAppointments().filter(a => a.patientPhone === member.virtualPhone)
  const prescriptions = getPrescriptionsByPatient(member.virtualPhone)
  const labBookings = getBookingsByPatient(member.virtualPhone)
  const labReports = getReportsByPatient(member.virtualPhone)
  const medRecords = getRecordsByPatient(member.virtualPhone)
  const todayDoses = getTodaySchedule(member.virtualPhone)
  const age = calculateAge(member.dateOfBirth)

  const filteredAppts = allAppts.filter(a => aFilter === 'all' || a.status === aFilter)

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'appointments', label: `Appointments (${allAppts.length})` },
    { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})` },
    { key: 'lab', label: `Lab Tests (${labBookings.length})` },
    { key: 'records', label: `Records (${medRecords.length})` },
  ] as const

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-inter transition-colors">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Family
      </button>

      {/* Profile header card */}
      <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${RELATION_COLORS[member.relationship]} flex items-center justify-center shrink-0`}>
              <span className="text-white font-inter font-bold text-xl">{member.avatarInitials}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white font-instrument text-2xl">{member.name}</h2>
                {isMinor(member) && (
                  <span className="text-[10px] font-inter px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400">Minor</span>
                )}
              </div>
              <p className="text-white/50 font-inter text-sm">{member.relationship} · {member.gender} · {age} years old</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs font-inter text-white/35">
                {member.bloodGroup !== 'Unknown' && <span className="bg-red-500/10 border border-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{member.bloodGroup}</span>}
                {member.phone && <span>📞 +91 {member.phone}</span>}
                {member.knownConditions && <span>🏥 {member.knownConditions}</span>}
                {member.allergies && <span>⚠️ Allergies: {member.allergies}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { setShowBookAppt(true) }}
              className="bg-white text-[#030d18] px-4 py-2 rounded-xl font-inter font-semibold text-xs hover:bg-white/90 transition-all button-glow">
              + Book Appointment
            </button>
            <button onClick={() => { setShowBookLab(true) }}
              className="bg-white/8 hover:bg-white/15 border border-white/12 text-white/70 hover:text-white px-4 py-2 rounded-xl text-xs font-inter transition-all">
              + Lab Test
            </button>
            <button onClick={onEdit}
              className="bg-white/8 hover:bg-white/15 border border-white/12 text-white/60 hover:text-white px-4 py-2 rounded-xl text-xs font-inter transition-all">
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-inter font-medium whitespace-nowrap transition-all
              ${tab === t.key ? 'bg-white text-[#030d18]' : 'bg-white/5 border border-white/8 text-white/50 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Stat cards */}
          {[
            { label: 'Total Appointments', value: allAppts.length, icon: '📅', color: 'text-blue-400' },
            { label: 'Active Prescriptions', value: prescriptions.filter(p => p.status === 'active').length, icon: '💊', color: 'text-emerald-400' },
            { label: 'Lab Bookings', value: labBookings.length, icon: '🧪', color: 'text-purple-400' },
            { label: 'Reports Available', value: labReports.length, icon: '📄', color: 'text-cyan-400' },
            { label: 'Medical Records', value: medRecords.length, icon: '📋', color: 'text-yellow-400' },
            { label: "Today's Doses", value: todayDoses.length, icon: '⏰', color: 'text-pink-400' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white/4 border border-white/8 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                <span className={`font-inter font-bold text-2xl ${color}`}>{value}</span>
              </div>
              <p className="text-white/35 font-inter text-xs">{label}</p>
            </div>
          ))}

          {/* Today's medicine schedule */}
          {todayDoses.length > 0 && (
            <div className="md:col-span-2 lg:col-span-3 bg-white/4 border border-white/8 rounded-2xl p-5">
              <p className="text-white/40 font-inter text-xs uppercase tracking-widest mb-3">Today's Medicine Schedule</p>
              <div className="flex flex-wrap gap-2">
                {todayDoses.map((d, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-inter ${
                    d.status === 'taken' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : d.status === 'missed' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-white/5 border-white/10 text-white/60'}`}>
                    <span>{formatTime(d.time)}</span>
                    <span className="text-white/40">·</span>
                    <span>{d.medicineName} {d.dosage}</span>
                    <span className="capitalize opacity-60">({d.status})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming appointments */}
          {allAppts.filter(a => a.status === 'confirmed').slice(0, 2).map(a => (
            <div key={a.id} className="bg-blue-500/8 border border-blue-500/15 rounded-2xl p-4">
              <p className="text-white/40 font-inter text-[10px] uppercase tracking-widest mb-2">Upcoming Appointment</p>
              <p className="text-white font-inter font-medium text-sm">{a.doctorName}</p>
              <p className="text-white/50 font-inter text-xs">{a.specialty} · {a.hospitalName}</p>
              <p className="text-blue-300/70 font-inter text-xs mt-1">{formatDate(a.date)} at {formatTime(a.time)} · Token #{a.tokenNumber}</p>
            </div>
          ))}

          {/* Emergency contact */}
          {member.emergencyContactName && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
              <p className="text-white/40 font-inter text-[10px] uppercase tracking-widest mb-2">Emergency Contact</p>
              <p className="text-white font-inter font-medium text-sm">{member.emergencyContactName}</p>
              <p className="text-white/50 font-inter text-xs">+91 {member.emergencyContactPhone} · {member.emergencyContactRelation}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Appointments ── */}
      {tab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['all','confirmed','cancelled'] as const).map(f => (
              <button key={f} onClick={() => setAFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-inter font-medium capitalize transition-all
                  ${aFilter === f ? 'bg-white text-[#030d18]' : 'bg-white/6 border border-white/10 text-white/50 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          {filteredAppts.length === 0 ? (
            <EmptyState icon="📅" message="No appointments found." sub="Book one using the button above." />
          ) : filteredAppts.map(a => (
            <div key={a.id} className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${a.status === 'confirmed' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{a.status}</span>
                    <span className="text-white/20 font-inter text-[10px]">Token #{a.tokenNumber}</span>
                  </div>
                  <p className="text-white font-inter font-semibold text-sm">{a.doctorName}</p>
                  <p className="text-white/50 font-inter text-xs mt-0.5">{a.specialty} · {a.hospitalName}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-white/40 font-inter text-xs">{formatDate(a.date)} at {formatTime(a.time)}</p>
                  {a.status === 'confirmed' && (
                    <button onClick={() => { if (confirm('Cancel this appointment?')) { cancelAppointment(a.id); setRefreshKey(k=>k+1) } }}
                      className="text-red-400/60 hover:text-red-400 text-xs font-inter transition-colors">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Prescriptions ── */}
      {tab === 'prescriptions' && (
        <div className="space-y-3">
          {prescriptions.length === 0 ? (
            <EmptyState icon="💊" message="No prescriptions yet." sub="Prescriptions will appear after a doctor visit." />
          ) : prescriptions.map(rx => (
            <div key={rx.id} className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${rx.status === 'active' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/8 border-white/15 text-white/40'}`}>{rx.status}</span>
                    <span className="text-white/20 font-inter text-[10px]">{rx.id}</span>
                  </div>
                  <p className="text-white font-inter font-semibold text-sm">{rx.diagnosis}</p>
                  <p className="text-white/40 font-inter text-xs mt-0.5">{rx.doctorName} · {formatDate(rx.date)}</p>
                </div>
                <p className="text-white/30 font-inter text-xs">{rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''}</p>
              </div>
              {rx.medicines.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/6 flex flex-wrap gap-1.5">
                  {rx.medicines.map((m, i) => (
                    <span key={i} className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${m.status === 'active' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/8 border-white/15 text-white/40'}`}>
                      {m.name} {m.dosage}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Lab Tests ── */}
      {tab === 'lab' && (
        <div className="space-y-3">
          {labBookings.length === 0 ? (
            <EmptyState icon="🧪" message="No lab tests booked." sub="Book a test using the button above." />
          ) : labBookings.map(b => (
            <div key={b.id} className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-white font-inter font-semibold text-sm">{b.testName}</p>
                  <p className="text-white/40 font-inter text-xs mt-0.5">{b.hospitalName} · {formatDate(b.date)} at {formatTime(b.time)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] font-inter px-2.5 py-0.5 rounded-full border ${LAB_STATUS_COLORS[b.status]}`}>{LAB_STATUS_LABELS[b.status]}</span>
                  <p className="text-emerald-400/70 font-inter text-xs">₹{b.price}</p>
                </div>
              </div>
              {/* Progress */}
              <div className="mt-3 pt-3 border-t border-white/6">
                <div className="flex gap-1">
                  {(['pending','sample-collected','processing','completed','report-ready'] as const).map((step, i) => {
                    const stepIdx = ['pending','sample-collected','processing','completed','report-ready'].indexOf(b.status)
                    return (
                      <div key={step} className="flex-1">
                        <div className={`h-1 rounded-full ${i <= stepIdx && b.status !== 'cancelled' ? 'bg-emerald-400' : 'bg-white/10'}`}/>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
          {labReports.length > 0 && (
            <div className="pt-2">
              <p className="text-white/40 font-inter text-xs uppercase tracking-widest mb-2">Reports</p>
              {labReports.map(r => (
                <div key={r.id} className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-white font-inter font-semibold text-sm">{r.testName}</p>
                      <p className="text-white/40 font-inter text-xs">{r.hospitalName} · {formatDate(r.testDate)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {r.results.slice(0, 3).map((res, i) => (
                        <span key={i} className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${res.status === 'normal' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : res.status === 'abnormal' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                          {res.parameter}: {res.value} {res.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                  {r.summary && <p className="text-white/35 font-inter text-xs mt-2 leading-relaxed">{r.summary}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Medical Records ── */}
      {tab === 'records' && (
        <div className="space-y-3">
          {medRecords.length === 0 ? (
            <EmptyState icon="📋" message="No medical records yet." sub="Records will appear after hospital visits." />
          ) : medRecords.map(r => (
            <div key={r.id} className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-inter px-2 py-0.5 rounded-full border bg-blue-500/15 border-blue-500/25 text-blue-300 capitalize">{r.visitType}</span>
                    <span className="text-white/20 font-inter text-[10px]">{r.id}</span>
                  </div>
                  <p className="text-white font-inter font-semibold text-sm">{r.diagnosis}</p>
                  <p className="text-white/40 font-inter text-xs mt-0.5">{r.doctorName} · {r.specialty}</p>
                </div>
                <p className="text-white/30 font-inter text-xs">{formatDate(r.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showBookAppt && (
        <BookForMemberModal member={member} onClose={() => setShowBookAppt(false)} onBooked={() => { setRefreshKey(k => k+1); onRefresh() }} />
      )}
      {showBookLab && (
        <BookLabForMemberModal member={member} onClose={() => setShowBookLab(false)} onBooked={() => { setRefreshKey(k => k+1); onRefresh() }} />
      )}
    </div>
  )
}

// ─── Empty state helper ───────────────────────────────────────────────────────
function EmptyState({ icon, message, sub }: { icon: string; message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center py-14 text-center bg-white/3 border border-white/6 rounded-2xl">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-white/40 font-inter text-sm">{message}</p>
      {sub && <p className="text-white/25 font-inter text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ─── Main FamilyPage ──────────────────────────────────────────────────────────
export default function FamilyPage() {
  const patient = getPatientSession()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [view, setView] = useState<MainView>('dashboard')
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [showNotifs, setShowNotifs] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (patient) {
      setMembers(getFamilyMembersByOwner(patient.phone))
    }
  }, [patient, refreshKey])

  function refresh() { setRefreshKey(k => k + 1) }

  if (!patient) {
    return (
      <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4">🔐</span>
          <p className="text-white/40 font-inter text-sm">Please sign in to manage family health profiles.</p>
        </div>
      </div>
    )
  }

  const notifications = getFamilyNotifications(patient.phone)
  const unreadCount = notifications.filter(n => !n.read).length

  // Dashboard summary stats
  const allFamilyPhones = members.map(m => m.virtualPhone)
  const allFamilyAppts = getAppointments().filter(a => allFamilyPhones.includes(a.patientPhone))
  const upcomingAppts = allFamilyAppts.filter(a => a.status === 'confirmed' && a.date >= new Date().toISOString().slice(0,10))
  const allPrescriptions = members.flatMap(m => getPrescriptionsByPatient(m.virtualPhone))
  const activeRx = allPrescriptions.filter(p => p.status === 'active')
  const allLabBookings = members.flatMap(m => getBookingsByPatient(m.virtualPhone))
  const allLabReports = members.flatMap(m => getReportsByPatient(m.virtualPhone))

  return (
    <div className="min-h-screen bg-[#030d18] pt-28 pb-16 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-instrument text-white text-3xl md:text-4xl">My Family</h1>
            <p className="text-white/35 font-inter text-sm mt-1">
              {members.length} member{members.length !== 1 ? 's' : ''} · Manage everyone's health from one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Notifications bell */}
            <div className="relative">
              <button onClick={() => { setShowNotifs(v => !v); markNotificationsRead(patient.phone) }}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all relative">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2a4 4 0 0 0-4 4v2l-1.5 2.5h11L12 8V6a4 4 0 0 0-4-4zM6 13a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-inter font-bold">{unreadCount}</span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-[#071525] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{ animation: 'chatbot-in 0.2s cubic-bezier(0.22,1,0.36,1) both' }}>
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-white font-inter text-sm font-semibold">Notifications</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-hide">
                    {notifications.length === 0 ? (
                      <p className="text-white/30 font-inter text-xs text-center py-6">No notifications</p>
                    ) : notifications.slice(0, 10).map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/3">
                        <p className="text-white/70 font-inter text-xs font-medium">{n.memberName}</p>
                        <p className="text-white/45 font-inter text-xs mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-white/20 font-inter text-[10px] mt-1">{new Date(n.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => { setEditingMember(null); setShowAddModal(true) }}
              className="flex items-center gap-2 bg-white text-[#030d18] px-5 py-2.5 rounded-full font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Add Member
            </button>
          </div>
        </div>

        {/* ── Member profile view ── */}
        {view === 'member-profile' && selectedMember && (
          <MemberProfile
            member={selectedMember}
            onBack={() => setView('dashboard')}
            onEdit={() => { setEditingMember(selectedMember); setShowAddModal(true) }}
            onRefresh={refresh}
          />
        )}

        {/* ── Dashboard ── */}
        {view === 'dashboard' && (
          <>
            {/* Summary stats */}
            {members.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Upcoming Appointments', value: upcomingAppts.length, icon: '📅', color: 'text-blue-400' },
                  { label: 'Active Prescriptions', value: activeRx.length, icon: '💊', color: 'text-emerald-400' },
                  { label: 'Lab Bookings', value: allLabBookings.length, icon: '🧪', color: 'text-purple-400' },
                  { label: 'Reports Ready', value: allLabReports.length, icon: '📄', color: 'text-cyan-400' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-white/4 border border-white/8 rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xl">{icon}</span>
                      <span className={`font-inter font-bold text-2xl ${color}`}>{value}</span>
                    </div>
                    <p className="text-white/30 font-inter text-xs">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming appointments across all family */}
            {upcomingAppts.length > 0 && (
              <div>
                <p className="text-white/40 font-inter text-xs uppercase tracking-widest mb-3">Upcoming Family Appointments</p>
                <div className="space-y-2">
                  {upcomingAppts.slice(0, 4).map(a => {
                    const m = members.find(x => x.virtualPhone === a.patientPhone)
                    return (
                      <div key={a.id} className="bg-white/4 border border-white/8 rounded-xl p-3.5 flex items-center gap-3">
                        {m && (
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${RELATION_COLORS[m.relationship]} flex items-center justify-center shrink-0`}>
                            <span className="text-white font-inter font-bold text-xs">{m.avatarInitials}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-inter text-sm font-medium">{a.patientName}</p>
                          <p className="text-white/40 font-inter text-xs">{a.doctorName} · {a.hospitalName}</p>
                        </div>
                        <p className="text-white/30 font-inter text-xs shrink-0">{formatDate(a.date)} at {formatTime(a.time)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Member cards */}
            {members.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center bg-white/3 border border-dashed border-white/10 rounded-2xl">
                <span className="text-6xl mb-4">👨‍👩‍👧‍👦</span>
                <h3 className="text-white font-instrument text-2xl mb-2">No family members yet</h3>
                <p className="text-white/35 font-inter text-sm max-w-sm">Add your family members to manage everyone's health — appointments, medicines, lab tests and records — all in one place.</p>
                <button onClick={() => setShowAddModal(true)}
                  className="mt-6 bg-white text-[#030d18] px-6 py-3 rounded-full font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
                  Add First Member
                </button>
              </div>
            ) : (
              <div>
                <p className="text-white/40 font-inter text-xs uppercase tracking-widest mb-4">Family Members ({members.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map(member => {
                    const memberAppts = getAppointments().filter(a => a.patientPhone === member.virtualPhone)
                    const memberRx = getPrescriptionsByPatient(member.virtualPhone)
                    const memberLabs = getBookingsByPatient(member.virtualPhone)
                    const age = calculateAge(member.dateOfBirth)
                    const nextAppt = memberAppts.filter(a => a.status === 'confirmed' && a.date >= new Date().toISOString().slice(0,10)).sort((a, b) => a.date.localeCompare(b.date))[0]

                    return (
                      <div key={member.id}
                        className="bg-white/4 border border-white/8 hover:border-white/20 rounded-2xl p-5 transition-all group cursor-pointer"
                        onClick={() => { setSelectedMember(member); setView('member-profile') }}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${RELATION_COLORS[member.relationship]} flex items-center justify-center shrink-0`}>
                              <span className="text-white font-inter font-bold text-base">{member.avatarInitials}</span>
                            </div>
                            <div>
                              <p className="text-white font-inter font-semibold text-sm">{member.name}</p>
                              <p className="text-white/40 font-inter text-xs">{member.relationship} · {age} yrs · {member.gender}</p>
                            </div>
                          </div>
                          {isMinor(member) && (
                            <span className="text-[9px] font-inter px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 shrink-0">Minor</span>
                          )}
                        </div>

                        {/* Health chips */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {member.bloodGroup !== 'Unknown' && (
                            <span className="text-[10px] font-inter px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/15 text-red-300">{member.bloodGroup}</span>
                          )}
                          {member.knownConditions && member.knownConditions.split(',').slice(0,2).map((c, i) => (
                            <span key={i} className="text-[10px] font-inter px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-white/50">{c.trim()}</span>
                          ))}
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 pt-3 border-t border-white/6 text-xs font-inter text-white/35">
                          <span>📅 {memberAppts.length} appts</span>
                          <span>💊 {memberRx.filter(r => r.status === 'active').length} active Rx</span>
                          <span>🧪 {memberLabs.length} labs</span>
                        </div>

                        {/* Next appointment */}
                        {nextAppt && (
                          <div className="mt-3 bg-blue-500/8 border border-blue-500/15 rounded-xl px-3 py-2">
                            <p className="text-blue-300/70 font-inter text-[10px]">
                              Next: {nextAppt.doctorName} on {formatDate(nextAppt.date)}
                            </p>
                          </div>
                        )}

                        {/* Action row */}
                        <div className="flex gap-2 mt-4">
                          <span className="flex-1 text-center text-xs font-inter text-white/50 group-hover:text-white py-2 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl transition-all">
                            View Profile →
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); setEditingMember(member); setShowAddModal(true) }}
                            className="px-3 py-2 text-xs font-inter text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl transition-all">
                            Edit
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); if (confirm(`Remove ${member.name} from your family?`)) { deleteFamilyMember(member.id); refresh() } }}
                            className="px-3 py-2 text-xs font-inter text-white/25 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/8 hover:border-red-500/20 rounded-xl transition-all">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2h3v1M4.5 5.5v4M7.5 5.5v4M2.5 3l.5 7h6l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Add/Edit modal ── */}
        {showAddModal && (
          <MemberModal
            ownerPhone={patient.phone}
            editing={editingMember}
            onSave={() => { refresh(); if (selectedMember && editingMember?.id === selectedMember.id) { const updated = getFamilyMembersByOwner(patient.phone).find(m => m.id === editingMember.id); if (updated) setSelectedMember(updated) } }}
            onClose={() => { setShowAddModal(false); setEditingMember(null) }}
          />
        )}

      </div>
    </div>
  )
}
