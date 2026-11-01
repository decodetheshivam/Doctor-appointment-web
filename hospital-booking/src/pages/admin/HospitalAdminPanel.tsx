import { useState, useEffect, useRef } from 'react'
import {
  getHospitalAdminById,
  saveHospitalAdmin,
  updateHospitalPassword,
  clearAdminSession,
  seedHospitalDemoRecords,
  type HospitalAdmin,
} from '../../data/adminAuth'
import {
  getAllRecords,
  saveRecord,
  deleteRecord,
  type MedicalRecord,
  type Medicine,
  type LabReport,
  generateRecordId,
} from '../../data/medicalRecords'
import { getAppointments, formatDate, formatTime } from '../../data/appointments'
import {
  getAllPrescriptions, savePrescription, deletePrescription,
  generatePrescriptionId, generateMedicineId, seedDemoPrescriptions,
  frequencyToTimes, parseDuration,
  type Prescription, type PrescribedMedicine,
} from '../../data/prescriptions'
import {
  getAllLabTests, saveLabTest, deleteLabTest, generateTestId,
  getAllLabBookings, updateBookingStatus,
  saveReport, generateReportId, publishReport, getAllLabReports,
  seedLabDemoData, LAB_STATUS_LABELS, LAB_STATUS_COLORS,
  type LabTestCatalogItem, type LabBooking, type LabReport as LabReportData,
  type LabResultItem, type LabTestStatus,
} from '../../data/labTests'

type PanelTab = 'dashboard' | 'appointments' | 'patients' | 'records' | 'prescriptions' | 'labTests' | 'settings'

const VISIT_COLORS: Record<MedicalRecord['visitType'], string> = {
  consultation:     'bg-blue-500/15 border-blue-500/30 text-blue-300',
  'follow-up':      'bg-purple-500/15 border-purple-500/30 text-purple-300',
  emergency:        'bg-red-500/15 border-red-500/30 text-red-300',
  'routine-checkup':'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
}

const MED_STATUS: Record<Medicine['status'], string> = {
  active:    'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  completed: 'bg-white/8 border-white/15 text-white/40',
  stopped:   'bg-red-500/10 border-red-500/20 text-red-400',
}

const LAB_STATUS: Record<LabReport['status'], string> = {
  normal:   'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  abnormal: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  pending:  'bg-white/8 border-white/15 text-white/40',
}

// ─── Add Record Modal (doctor-only) ──────────────────────────────────────────

const EMPTY_MED: Medicine = { name:'', dosage:'', frequency:'', duration:'', instructions:'', status:'active' }
const EMPTY_LAB: LabReport = { name:'', result:'', value:'', referenceRange:'', status:'normal' }

function AddRecordModal({ hospital, onSave, onClose }: {
  hospital: HospitalAdmin
  onSave: () => void
  onClose: () => void
}) {
  const [step, setStep] = useState<1|2|3>(1)
  const [form, setForm] = useState({
    patientName:'', patientPhone:'', date: new Date().toISOString().slice(0,10),
    doctorName:'', specialty:'', visitType: 'consultation' as MedicalRecord['visitType'],
    chiefComplaint:'', diagnosis:'', notes:'',
    bloodPressure:'', temperature:'', weight:'', heartRate:'', followUpDate:'',
    medicines: [] as Medicine[], labReports: [] as LabReport[],
  })
  const [newMed, setNewMed] = useState<Medicine>({...EMPTY_MED})
  const [newLab, setNewLab] = useState<LabReport>({...EMPTY_LAB})

  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'
  const sel = `${inp} appearance-none`

  function save() {
    if (!form.patientName || !form.patientPhone || !form.diagnosis) return
    const rec: MedicalRecord = {
      id: generateRecordId(),
      patientName: form.patientName,
      patientPhone: form.patientPhone,
      date: form.date,
      doctorName: form.doctorName,
      doctorId: '',
      specialty: form.specialty,
      hospitalName: hospital.hospitalName,
      hospitalId: hospital.id,
      appointmentId: '',
      visitType: form.visitType,
      chiefComplaint: form.chiefComplaint,
      diagnosis: form.diagnosis,
      notes: form.notes,
      medicines: form.medicines,
      labReports: form.labReports,
      bloodPressure: form.bloodPressure || undefined,
      temperature: form.temperature || undefined,
      weight: form.weight || undefined,
      heartRate: form.heartRate || undefined,
      followUpDate: form.followUpDate || undefined,
      createdAt: new Date().toISOString(),
    }
    saveRecord(rec)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#071525] border border-white/12 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-instrument text-xl">Add Patient Record</h2>
            <p className="text-white/35 font-inter text-xs">{hospital.hospitalName} · Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Step pills */}
        <div className="flex gap-1 px-5 pt-4 shrink-0">
          {(['Visit Info','Medicines','Lab Reports'] as const).map((label, i) => (
            <button key={label} onClick={() => step > i+1 && setStep((i+1) as 1|2|3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${step === i+1 ? 'bg-white/12 text-white border border-white/15' : step > i+1 ? 'text-emerald-400' : 'text-white/25'}`}>
              {step > i+1 ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-3">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input className={inp} placeholder="Patient Name *" value={form.patientName} onChange={e=>setForm({...form,patientName:e.target.value})}/>
                <input className={inp} type="tel" placeholder="Mobile Number *" maxLength={10} value={form.patientPhone} onChange={e=>setForm({...form,patientPhone:e.target.value.replace(/\D/g,'')})}/>
                <input className={inp} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
                <select className={sel} value={form.visitType} onChange={e=>setForm({...form,visitType:e.target.value as MedicalRecord['visitType']})}>
                  <option value="consultation" className="bg-[#071525]">Consultation</option>
                  <option value="follow-up" className="bg-[#071525]">Follow-up</option>
                  <option value="emergency" className="bg-[#071525]">Emergency</option>
                  <option value="routine-checkup" className="bg-[#071525]">Routine Checkup</option>
                </select>
                <input className={inp} placeholder="Doctor Name" value={form.doctorName} onChange={e=>setForm({...form,doctorName:e.target.value})}/>
                <input className={inp} placeholder="Specialty" value={form.specialty} onChange={e=>setForm({...form,specialty:e.target.value})}/>
              </div>
              <textarea className={`${inp} resize-none`} rows={2} placeholder="Chief Complaint" value={form.chiefComplaint} onChange={e=>setForm({...form,chiefComplaint:e.target.value})}/>
              <textarea className={`${inp} resize-none`} rows={2} placeholder="Diagnosis *" value={form.diagnosis} onChange={e=>setForm({...form,diagnosis:e.target.value})}/>
              <textarea className={`${inp} resize-none`} rows={3} placeholder="Doctor's Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input className={inp} placeholder="BP e.g.120/80" value={form.bloodPressure} onChange={e=>setForm({...form,bloodPressure:e.target.value})}/>
                <input className={inp} placeholder="Heart Rate" value={form.heartRate} onChange={e=>setForm({...form,heartRate:e.target.value})}/>
                <input className={inp} placeholder="Temperature" value={form.temperature} onChange={e=>setForm({...form,temperature:e.target.value})}/>
                <input className={inp} placeholder="Weight" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})}/>
              </div>
              <input className={inp} type="date" value={form.followUpDate} onChange={e=>setForm({...form,followUpDate:e.target.value})}/>
            </>
          )}

          {step === 2 && (
            <>
              {form.medicines.map((m,i) => (
                <div key={i} className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl p-3">
                  <div className="flex-1"><p className="text-white font-inter text-sm">{m.name} <span className="text-white/40">{m.dosage}</span></p><p className="text-white/35 font-inter text-xs">{m.frequency} · {m.duration}</p></div>
                  <button onClick={()=>setForm(f=>({...f,medicines:f.medicines.filter((_,j)=>j!==i)}))} className="text-white/25 hover:text-red-400 transition-colors"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></button>
                </div>
              ))}
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} placeholder="Name *" value={newMed.name} onChange={e=>setNewMed({...newMed,name:e.target.value})}/>
                  <input className={inp} placeholder="Dosage" value={newMed.dosage} onChange={e=>setNewMed({...newMed,dosage:e.target.value})}/>
                  <input className={inp} placeholder="Frequency" value={newMed.frequency} onChange={e=>setNewMed({...newMed,frequency:e.target.value})}/>
                  <input className={inp} placeholder="Duration" value={newMed.duration} onChange={e=>setNewMed({...newMed,duration:e.target.value})}/>
                  <input className={`${inp} col-span-2`} placeholder="Instructions" value={newMed.instructions} onChange={e=>setNewMed({...newMed,instructions:e.target.value})}/>
                  <select className={sel} value={newMed.status} onChange={e=>setNewMed({...newMed,status:e.target.value as Medicine['status']})}>
                    <option value="active" className="bg-[#071525]">Active</option>
                    <option value="completed" className="bg-[#071525]">Completed</option>
                    <option value="stopped" className="bg-[#071525]">Stopped</option>
                  </select>
                </div>
                <button onClick={()=>{if(!newMed.name)return;setForm(f=>({...f,medicines:[...f.medicines,{...newMed}]}));setNewMed({...EMPTY_MED})}}
                  className="w-full border border-white/15 text-white/50 hover:text-white hover:border-white/30 py-2 rounded-xl text-sm font-inter transition-all flex items-center justify-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Add Medicine
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {form.labReports.map((r,i) => (
                <div key={i} className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl p-3">
                  <div className="flex-1"><p className="text-white font-inter text-sm">{r.name}</p><p className="text-white/35 font-inter text-xs">{r.result}{r.value?` · ${r.value}`:''}</p></div>
                  <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${LAB_STATUS[r.status]}`}>{r.status}</span>
                  <button onClick={()=>setForm(f=>({...f,labReports:f.labReports.filter((_,j)=>j!==i)}))} className="text-white/25 hover:text-red-400 transition-colors"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></button>
                </div>
              ))}
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className={`${inp} col-span-2`} placeholder="Test name *" value={newLab.name} onChange={e=>setNewLab({...newLab,name:e.target.value})}/>
                  <input className={inp} placeholder="Result" value={newLab.result} onChange={e=>setNewLab({...newLab,result:e.target.value})}/>
                  <input className={inp} placeholder="Value e.g. 12.4 g/dL" value={newLab.value} onChange={e=>setNewLab({...newLab,value:e.target.value})}/>
                  <input className={inp} placeholder="Reference range" value={newLab.referenceRange} onChange={e=>setNewLab({...newLab,referenceRange:e.target.value})}/>
                  <select className={sel} value={newLab.status} onChange={e=>setNewLab({...newLab,status:e.target.value as LabReport['status']})}>
                    <option value="normal" className="bg-[#071525]">Normal</option>
                    <option value="abnormal" className="bg-[#071525]">Abnormal</option>
                    <option value="pending" className="bg-[#071525]">Pending</option>
                  </select>
                </div>
                <button onClick={()=>{if(!newLab.name)return;setForm(f=>({...f,labReports:[...f.labReports,{...newLab}]}));setNewLab({...EMPTY_LAB})}}
                  className="w-full border border-white/15 text-white/50 hover:text-white hover:border-white/30 py-2 rounded-xl text-sm font-inter transition-all flex items-center justify-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Add Report
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-white/8 shrink-0">
          <button onClick={()=>step>1?setStep(s=>(s-1) as 1|2|3):onClose()}
            className="text-white/40 hover:text-white font-inter text-sm transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {step>1?'Back':'Cancel'}
          </button>
          {step < 3
            ? <button onClick={()=>setStep(s=>(s+1) as 1|2|3)} disabled={step===1&&(!form.patientName||!form.diagnosis)}
                className="bg-white text-[#030d18] px-5 py-2.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all flex items-center gap-1.5">
                Next <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            : <button onClick={save} disabled={!form.patientName||!form.diagnosis}
                className="bg-white text-[#030d18] px-5 py-2.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all button-glow">
                Save Record
              </button>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Edit Record Modal ────────────────────────────────────────────────────────

function EditRecordModal({ record, onSave, onClose }: {
  record: MedicalRecord
  onSave: () => void
  onClose: () => void
}) {
  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'
  const sel = `${inp} appearance-none`

  const [form, setForm] = useState({
    patientName:    record.patientName,
    patientPhone:   record.patientPhone,
    date:           record.date,
    doctorName:     record.doctorName,
    specialty:      record.specialty,
    visitType:      record.visitType,
    chiefComplaint: record.chiefComplaint,
    diagnosis:      record.diagnosis,
    notes:          record.notes,
    bloodPressure:  record.bloodPressure  ?? '',
    heartRate:      record.heartRate      ?? '',
    temperature:    record.temperature    ?? '',
    weight:         record.weight         ?? '',
    followUpDate:   record.followUpDate   ?? '',
  })
  const [medicines, setMedicines] = useState<Medicine[]>([...record.medicines])
  const [labReports, setLabReports] = useState<LabReport[]>([...record.labReports])
  const [tab, setTab] = useState<'info' | 'medicines' | 'labs'>('info')

  // New medicine / lab row
  const [newMed, setNewMed] = useState<Medicine>({ name:'', dosage:'', frequency:'', duration:'', instructions:'', status:'active' })
  const [newLab, setNewLab] = useState<LabReport>({ name:'', result:'', value:'', referenceRange:'', status:'normal' })

  function save() {
    const updated: MedicalRecord = {
      ...record,
      ...form,
      bloodPressure:  form.bloodPressure  || undefined,
      heartRate:      form.heartRate      || undefined,
      temperature:    form.temperature    || undefined,
      weight:         form.weight         || undefined,
      followUpDate:   form.followUpDate   || undefined,
      medicines,
      labReports,
    }
    saveRecord(updated)
    onSave()
    onClose()
  }

  const MED_STATUS_COLORS: Record<Medicine['status'], string> = {
    active:    'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    completed: 'bg-white/8 border-white/15 text-white/40',
    stopped:   'bg-red-500/10 border-red-500/20 text-red-400',
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[92vh] bg-[#071525] border border-white/12 rounded-2xl
                      overflow-hidden flex flex-col shadow-2xl"
           style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-instrument text-xl">Edit Medical Record</h2>
            <p className="text-white/30 font-inter text-xs mt-0.5">{record.id} · {record.patientName}</p>
          </div>
          <button onClick={onClose}
            className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 shrink-0">
          {(['info', 'medicines', 'labs'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-inter capitalize transition-all duration-200
                         ${tab === t ? 'bg-white/10 text-white border border-white/15' : 'text-white/40 hover:text-white/70'}`}>
              {t === 'info' ? 'Visit Info' : t === 'medicines' ? `Medicines (${medicines.length})` : `Lab Reports (${labReports.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-3">

          {/* ── VISIT INFO ── */}
          {tab === 'info' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Patient Name</label>
                  <input className={inp} value={form.patientName} onChange={e=>setForm({...form,patientName:e.target.value})}/>
                </div>
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Mobile</label>
                  <input className={inp} value={form.patientPhone} maxLength={10} onChange={e=>setForm({...form,patientPhone:e.target.value.replace(/\D/g,'')})}/>
                </div>
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Date</label>
                  <input className={inp} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
                </div>
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Visit Type</label>
                  <select className={sel} value={form.visitType} onChange={e=>setForm({...form,visitType:e.target.value as MedicalRecord['visitType']})}>
                    <option value="consultation" className="bg-[#071525]">Consultation</option>
                    <option value="follow-up" className="bg-[#071525]">Follow-up</option>
                    <option value="emergency" className="bg-[#071525]">Emergency</option>
                    <option value="routine-checkup" className="bg-[#071525]">Routine Checkup</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Doctor</label>
                  <input className={inp} value={form.doctorName} onChange={e=>setForm({...form,doctorName:e.target.value})}/>
                </div>
                <div>
                  <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Specialty</label>
                  <input className={inp} value={form.specialty} onChange={e=>setForm({...form,specialty:e.target.value})}/>
                </div>
              </div>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Chief Complaint</label>
                <textarea className={`${inp} resize-none`} rows={2} value={form.chiefComplaint} onChange={e=>setForm({...form,chiefComplaint:e.target.value})}/>
              </div>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Diagnosis</label>
                <textarea className={`${inp} resize-none`} rows={2} value={form.diagnosis} onChange={e=>setForm({...form,diagnosis:e.target.value})}/>
              </div>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Doctor's Notes</label>
                <textarea className={`${inp} resize-none`} rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([['bloodPressure','BP e.g. 120/80'],['heartRate','Heart Rate'],['temperature','Temperature'],['weight','Weight']] as [keyof typeof form, string][]).map(([key,ph])=>(
                  <div key={key}>
                    <label className="text-white/25 text-[10px] font-inter uppercase tracking-wide block mb-1">{ph}</label>
                    <input className={inp} placeholder={ph} value={form[key] as string} onChange={e=>setForm({...form,[key]:e.target.value})}/>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-white/35 text-[10px] font-inter uppercase tracking-wide block mb-1">Follow-up Date</label>
                <input className={inp} type="date" value={form.followUpDate} onChange={e=>setForm({...form,followUpDate:e.target.value})}/>
              </div>
            </>
          )}

          {/* ── MEDICINES ── */}
          {tab === 'medicines' && (
            <>
              <div className="space-y-2 mb-3">
                {medicines.map((m,i) => (
                  <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-inter text-sm font-medium truncate">{m.name}</p>
                        <span className="text-white/40 font-inter text-xs">{m.dosage}</span>
                        <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${MED_STATUS_COLORS[m.status]}`}>{m.status}</span>
                      </div>
                      <p className="text-white/35 font-inter text-xs">{m.frequency} · {m.duration}</p>
                    </div>
                    {/* Status toggle */}
                    <select
                      value={m.status}
                      onChange={e => {
                        const updated = [...medicines]
                        updated[i] = { ...updated[i], status: e.target.value as Medicine['status'] }
                        setMedicines(updated)
                      }}
                      className="bg-white/5 border border-white/10 text-white/60 text-xs font-inter rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="active" className="bg-[#071525]">Active</option>
                      <option value="completed" className="bg-[#071525]">Completed</option>
                      <option value="stopped" className="bg-[#071525]">Stopped</option>
                    </select>
                    <button onClick={() => setMedicines(medicines.filter((_,j)=>j!==i))}
                      className="text-white/25 hover:text-red-400 transition-colors shrink-0">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                {medicines.length === 0 && <p className="text-white/25 font-inter text-xs text-center py-4">No medicines added.</p>}
              </div>
              {/* Add new */}
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
                <p className="text-white/35 text-[10px] font-inter uppercase tracking-wide">Add Medicine</p>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} placeholder="Name *" value={newMed.name} onChange={e=>setNewMed({...newMed,name:e.target.value})}/>
                  <input className={inp} placeholder="Dosage" value={newMed.dosage} onChange={e=>setNewMed({...newMed,dosage:e.target.value})}/>
                  <input className={inp} placeholder="Frequency" value={newMed.frequency} onChange={e=>setNewMed({...newMed,frequency:e.target.value})}/>
                  <input className={inp} placeholder="Duration" value={newMed.duration} onChange={e=>setNewMed({...newMed,duration:e.target.value})}/>
                  <input className={`${inp} col-span-2`} placeholder="Instructions" value={newMed.instructions} onChange={e=>setNewMed({...newMed,instructions:e.target.value})}/>
                  <select className={sel} value={newMed.status} onChange={e=>setNewMed({...newMed,status:e.target.value as Medicine['status']})}>
                    <option value="active" className="bg-[#071525]">Active</option>
                    <option value="completed" className="bg-[#071525]">Completed</option>
                    <option value="stopped" className="bg-[#071525]">Stopped</option>
                  </select>
                </div>
                <button onClick={()=>{if(!newMed.name)return;setMedicines([...medicines,{...newMed}]);setNewMed({name:'',dosage:'',frequency:'',duration:'',instructions:'',status:'active'})}}
                  className="w-full border border-white/15 text-white/50 hover:text-white hover:border-white/30 py-2 rounded-xl text-sm font-inter transition-all flex items-center justify-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Add Medicine
                </button>
              </div>
            </>
          )}

          {/* ── LAB REPORTS ── */}
          {tab === 'labs' && (
            <>
              <div className="space-y-2 mb-3">
                {labReports.map((r,i) => (
                  <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-inter text-sm font-medium">{r.name}</p>
                      <p className="text-white/35 font-inter text-xs">{r.result}{r.value?` · ${r.value}`:''}</p>
                    </div>
                    <select
                      value={r.status}
                      onChange={e => {
                        const updated = [...labReports]
                        updated[i] = { ...updated[i], status: e.target.value as LabReport['status'] }
                        setLabReports(updated)
                      }}
                      className="bg-white/5 border border-white/10 text-white/60 text-xs font-inter rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="normal" className="bg-[#071525]">Normal</option>
                      <option value="abnormal" className="bg-[#071525]">Abnormal</option>
                      <option value="pending" className="bg-[#071525]">Pending</option>
                    </select>
                    <button onClick={() => setLabReports(labReports.filter((_,j)=>j!==i))}
                      className="text-white/25 hover:text-red-400 transition-colors shrink-0">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                {labReports.length === 0 && <p className="text-white/25 font-inter text-xs text-center py-4">No lab reports added.</p>}
              </div>
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
                <p className="text-white/35 text-[10px] font-inter uppercase tracking-wide">Add Lab Report</p>
                <div className="grid grid-cols-2 gap-2">
                  <input className={`${inp} col-span-2`} placeholder="Test name *" value={newLab.name} onChange={e=>setNewLab({...newLab,name:e.target.value})}/>
                  <input className={inp} placeholder="Result" value={newLab.result} onChange={e=>setNewLab({...newLab,result:e.target.value})}/>
                  <input className={inp} placeholder="Value e.g. 12.4 g/dL" value={newLab.value} onChange={e=>setNewLab({...newLab,value:e.target.value})}/>
                  <input className={inp} placeholder="Reference range" value={newLab.referenceRange} onChange={e=>setNewLab({...newLab,referenceRange:e.target.value})}/>
                  <select className={sel} value={newLab.status} onChange={e=>setNewLab({...newLab,status:e.target.value as LabReport['status']})}>
                    <option value="normal" className="bg-[#071525]">Normal</option>
                    <option value="abnormal" className="bg-[#071525]">Abnormal</option>
                    <option value="pending" className="bg-[#071525]">Pending</option>
                  </select>
                </div>
                <button onClick={()=>{if(!newLab.name)return;setLabReports([...labReports,{...newLab}]);setNewLab({name:'',result:'',value:'',referenceRange:'',status:'normal'})}}
                  className="w-full border border-white/15 text-white/50 hover:text-white hover:border-white/30 py-2 rounded-xl text-sm font-inter transition-all flex items-center justify-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Add Report
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/8 shrink-0">
          <button onClick={onClose}
            className="text-white/40 hover:text-white font-inter text-sm transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Cancel
          </button>
          <button onClick={save} disabled={!form.patientName || !form.diagnosis}
            className="bg-white text-[#030d18] px-6 py-2.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all button-glow flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Uptime Widget ─────────────────────────────────────────────────────────────

function UptimeWidget() {
  // Get or create session start time
  const startRef = useRef<number>(0)
  if (startRef.current === 0) {
    const stored = sessionStorage.getItem('mediconnect_hospital_start')
    if (stored) {
      startRef.current = Number(stored)
    } else {
      const t = Date.now()
      sessionStorage.setItem('mediconnect_hospital_start', String(t))
      startRef.current = t
    }
  }
  const [secs, setSecs] = useState(Math.round((Date.now() - startRef.current) / 1000))

  useEffect(() => {
    const t = setInterval(() => setSecs(Math.round((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const fmt = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`

  return (
    <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/10 border border-emerald-500/20
                    rounded-2xl p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-emerald-400/60 font-inter text-[10px] uppercase tracking-widest mb-1">Panel Session Uptime</p>
        <p className="text-emerald-400 font-inter font-bold text-2xl tabular-nums">{fmt}</p>
        <p className="text-white/25 font-inter text-[10px] mt-0.5">
          Since {new Date(startRef.current).toLocaleTimeString('en-IN')}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-inter">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
          Online
        </span>
        <span className="text-white/25 font-inter text-[10px]">
          {new Date().toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
        </span>
      </div>
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function HospitalAdminPanel({ adminId, onLogout }: { adminId: string; onLogout: () => void }) {
  const [tab, setTab]           = useState<PanelTab>('dashboard')
  const [admin, setAdmin]       = useState<HospitalAdmin | null>(null)
  const [records, setRecords]   = useState<MedicalRecord[]>([])
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const [searchPatient, setSearchPatient] = useState('')
  // Prescriptions state
  const [prescriptions, setPrescriptions]   = useState<Prescription[]>([])
  const [showAddRx, setShowAddRx]           = useState(false)
  // Lab tests state
  const [labTests, setLabTests]             = useState<LabTestCatalogItem[]>([])
  const [labBookings, setLabBookings]       = useState<LabBooking[]>([])
  const [labReports, setLabReports]         = useState<LabReportData[]>([])
  const [showAddTest, setShowAddTest]       = useState(false)
  const [editingTest, setEditingTest]       = useState<LabTestCatalogItem | null>(null)
  const [editingBooking, setEditingBooking] = useState<LabBooking | null>(null)
  const [uploadingFor, setUploadingFor]     = useState<LabBooking | null>(null)
  // Settings state
  const [newPwd, setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg]     = useState<{ type:'success'|'error'; msg:string } | null>(null)

  useEffect(() => {
    const a = getHospitalAdminById(adminId)
    setAdmin(a ?? null)
    if (a) {
      // Seed demo records for this hospital on first login
      seedHospitalDemoRecords(a.id, a.hospitalName)
      // Seed demo prescriptions and lab data
      seedDemoPrescriptions()
      seedLabDemoData()
    }
    loadRecords(a)
    loadPrescriptions(a)
    loadLabData(a)
  }, [adminId])

  function loadPrescriptions(a?: HospitalAdmin | null) {
    const adm = a ?? admin
    if (!adm) return
    const all = getAllPrescriptions()
    setPrescriptions(all.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()))
  }

  function loadLabData(a?: HospitalAdmin | null) {
    const adm = a ?? admin
    if (!adm) return
    setLabTests(getAllLabTests())
    setLabBookings(getAllLabBookings().sort((x, y) => new Date(y.bookingDate).getTime() - new Date(x.bookingDate).getTime()))
    setLabReports(getAllLabReports().sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()))
  }

  function loadRecords(a?: HospitalAdmin | null) {
    const adm = a ?? admin
    if (!adm) return
    // Show ALL records in the system — doctors need to see any patient's history.
    // Records created by this hospital are highlighted. Others are shown for reference.
    const all = getAllRecords()
    setRecords(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  function handleLogout() {
    clearAdminSession()
    onLogout()
  }

  function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    if (!admin) return
    if (newPwd.length < 8) { setPwdMsg({type:'error', msg:'Password must be at least 8 characters'}); return }
    if (newPwd !== confirmPwd) { setPwdMsg({type:'error', msg:'Passwords do not match'}); return }
    updateHospitalPassword(admin.id, newPwd)
    const updated = { ...admin, password: newPwd }
    saveHospitalAdmin(updated)
    setAdmin(updated)
    setNewPwd(''); setConfirmPwd('')
    setPwdMsg({type:'success', msg:'Password updated successfully'})
    setTimeout(() => setPwdMsg(null), 3000)
  }

  if (!admin) return <div className="min-h-screen bg-[#030d18] flex items-center justify-center"><p className="text-white/40 font-inter">Loading...</p></div>

  // Derive stats
  const appointments = getAppointments().filter((a) =>
    a.hospitalId === admin.id || a.hospitalName === admin.hospitalName
  )
  const todayStr = new Date().toISOString().slice(0,10)
  const todayAppts = appointments.filter((a) => a.date === todayStr && a.status === 'confirmed')
  const uniquePatients = new Set(records.map((r) => r.patientPhone)).size
  // Records specifically from this hospital
  const myRecords = records.filter((r) => r.hospitalId === admin.id || r.hospitalName === admin.hospitalName)

  const filteredRecords = records.filter((r) =>
    !searchPatient || r.patientName.toLowerCase().includes(searchPatient.toLowerCase()) ||
    r.patientPhone.includes(searchPatient)
  )

  function isMyRecord(r: { hospitalId: string; hospitalName: string }) {
    return r.hospitalId === admin!.id || r.hospitalName === admin!.hospitalName
  }

  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'

  const TABS: { key: PanelTab; label: string; icon: string }[] = [
    { key:'dashboard',    label:'Dashboard',    icon:'📊' },
    { key:'appointments', label:'Appointments', icon:'📅' },
    { key:'patients',     label:'Patients',     icon:'👥' },
    { key:'records',      label:'Records',      icon:'📋' },
    { key:'prescriptions',label:'Prescriptions', icon:'💊' },
    { key:'labTests',     label:'Lab Tests',   icon:'🧪' },
    { key:'settings',     label:'Settings',     icon:'⚙️' },
  ]

  return (
    <div className="min-h-screen bg-[#030d18] flex flex-col">
      {/* Top bar */}
      <header className="bg-[#071525]/90 backdrop-blur-sm border-b border-white/8 px-4 md:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A4267] to-[#20658E] flex items-center justify-center text-white font-inter font-bold text-sm">
            {admin.hospitalName.charAt(0)}
          </div>
          <div>
            <p className="text-white font-inter font-semibold text-sm leading-tight">{admin.hospitalName}</p>
            <p className="text-white/35 font-inter text-xs">Hospital Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 text-xs font-inter">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>Approved
          </span>
          <button onClick={handleLogout}
            className="text-white/40 hover:text-white font-inter text-xs border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-lg transition-all">
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-16 md:w-56 bg-[#050f1e] border-r border-white/6 flex flex-col py-4 shrink-0">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left
                         ${tab === t.key
                           ? 'bg-white/8 text-white border-r-2 border-white'
                           : 'text-white/40 hover:text-white hover:bg-white/4'}`}>
              <span className="text-lg shrink-0">{t.icon}</span>
              <span className="hidden md:block font-inter text-sm">{t.label}</span>
            </button>
          ))}
          <div className="mt-auto px-4 py-3">
            <button onClick={() => setShowAddRecord(true)}
              className="w-full bg-white text-[#030d18] py-2.5 rounded-xl font-inter font-semibold text-xs
                         hover:bg-white/90 transition-all button-glow flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span className="hidden md:block">Add Record</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-instrument text-white text-2xl md:text-3xl">
                  Welcome, <span className="italic">{admin.adminName.split(' ')[0]}</span>
                </h2>
                <p className="text-white/40 font-inter text-sm mt-1">
                  {new Date().toLocaleDateString('en-IN', {weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </p>
              </div>

              {/* Uptime widget */}
              <UptimeWidget />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Today's Appointments", value: todayAppts.length,    icon:'📅', color:'text-blue-400' },
                  { label: 'Records (This Hospital)', value: myRecords.length,  icon:'📋', color:'text-white' },
                  { label: 'All Patients (System)',  value: uniquePatients,      icon:'👥', color:'text-emerald-400' },
                  { label: 'Total Appointments',    value: appointments.length,  icon:'✅', color:'text-purple-400' },
                ].map(({label, value, icon, color}) => (
                  <div key={label} className="bg-white/4 border border-white/8 rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{icon}</span>
                      <span className={`font-inter font-bold text-2xl ${color}`}>{value}</span>
                    </div>
                    <p className="text-white/40 font-inter text-xs mt-2">{label}</p>
                  </div>
                ))}
              </div>

              {/* Today's appointments */}
              <div>
                <h3 className="text-white font-inter font-semibold text-base mb-3">Today's Appointments</h3>
                {todayAppts.length === 0 ? (
                  <p className="text-white/30 font-inter text-sm bg-white/3 border border-white/6 rounded-xl p-4">No appointments today.</p>
                ) : (
                  <div className="space-y-2">
                    {todayAppts.map((a) => (
                      <div key={a.id} className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-white font-inter text-sm font-medium">{a.patientName}</p>
                          <p className="text-white/45 font-inter text-xs">{a.doctorName} · {a.specialty}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs font-inter px-2.5 py-1 rounded-full">Token #{String(a.tokenNumber).padStart(2,'0')}</span>
                          <span className="text-white/60 font-inter text-sm font-medium">{formatTime(a.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent records */}
              <div>
                <h3 className="text-white font-inter font-semibold text-base mb-3">Recent Medical Records</h3>
                {records.slice(0,5).length === 0 ? (
                  <p className="text-white/30 font-inter text-sm bg-white/3 border border-white/6 rounded-xl p-4">No records yet. Add your first patient record.</p>
                ) : (
                  <div className="space-y-2">
                    {records.slice(0,5).map((r) => (
                      <div key={r.id} className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-white font-inter text-sm font-medium">{r.patientName}</p>
                          <p className="text-white/45 font-inter text-xs">{r.diagnosis}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${VISIT_COLORS[r.visitType]}`}>{r.visitType}</span>
                          <p className="text-white/25 font-inter text-[10px] mt-1">{formatDate(r.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── APPOINTMENTS ── */}
          {tab === 'appointments' && (
            <div className="space-y-4">
              <h2 className="font-instrument text-white text-2xl">Appointments</h2>
              {appointments.length === 0 ? (
                <p className="text-white/30 font-inter text-sm">No appointments booked for this hospital yet.</p>
              ) : (
                <div className="space-y-3">
                  {appointments.sort((a,b)=>new Date(b.bookedAt).getTime()-new Date(a.bookedAt).getTime()).map((a) => (
                    <div key={a.id} className="bg-white/4 border border-white/8 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-500/15 border border-blue-500/25 text-blue-300 text-[10px] font-inter px-2 py-0.5 rounded-full">Token #{String(a.tokenNumber).padStart(2,'0')}</span>
                            <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${a.status==='confirmed'?'bg-emerald-500/15 border-emerald-500/30 text-emerald-400':'bg-red-500/10 border-red-500/20 text-red-400'}`}>{a.status}</span>
                          </div>
                          <p className="text-white font-inter font-semibold text-sm">{a.patientName}, {a.patientAge}y</p>
                          <p className="text-white/50 font-inter text-xs mt-0.5">{a.doctorName} · {a.specialty}</p>
                          <p className="text-white/30 font-inter text-[10px] mt-1">+91 {a.patientPhone} · {a.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-inter font-semibold">{formatTime(a.time)}</p>
                          <p className="text-white/40 font-inter text-xs">{formatDate(a.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PATIENTS ── */}
          {tab === 'patients' && (
            <div className="space-y-4">
              <h2 className="font-instrument text-white text-2xl">Patients ({uniquePatients})</h2>
              {(() => {
                const map = new Map<string, { name:string; phone:string; count:number; last:string }>()
                records.forEach((r) => {
                  if (!map.has(r.patientPhone))
                    map.set(r.patientPhone, { name:r.patientName, phone:r.patientPhone, count:0, last:r.date })
                  const entry = map.get(r.patientPhone)!
                  entry.count++
                  if (r.date > entry.last) entry.last = r.date
                })
                const patients = Array.from(map.values())
                return patients.length === 0
                  ? <p className="text-white/30 font-inter text-sm">No patients yet.</p>
                  : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patients.map((p) => (
                        <div key={p.phone} className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A4267] to-[#20658E] flex items-center justify-center shrink-0">
                            <span className="text-white font-inter font-bold text-sm">{p.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-inter font-semibold text-sm">{p.name}</p>
                            <p className="text-white/40 font-inter text-xs">+91 {p.phone}</p>
                            <p className="text-white/25 font-inter text-[10px] mt-0.5">{p.count} visit{p.count!==1?'s':''} · Last: {formatDate(p.last)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
              })()}
            </div>
          )}

          {/* ── RECORDS ── */}
          {tab === 'records' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-instrument text-white text-2xl">Medical Records</h2>
                  <p className="text-white/35 font-inter text-xs mt-1">
                    <span className="text-white/60">{myRecords.length} from {admin.hospitalName}</span>
                    <span className="text-white/20"> · </span>
                    <span className="text-white/35">{records.length} total in system</span>
                  </p>
                </div>
                <button onClick={() => setShowAddRecord(true)}
                  className="flex items-center gap-2 bg-white text-[#030d18] px-5 py-2.5 rounded-full font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Add Record
                </button>
              </div>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <input className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors"
                  placeholder="Search by patient name or phone..."
                  value={searchPatient} onChange={(e) => setSearchPatient(e.target.value)} />
              </div>
              {filteredRecords.length === 0 ? (
                <p className="text-white/30 font-inter text-sm py-10 text-center">No records found.</p>
              ) : (
                <div className="space-y-3">
                  {filteredRecords.map((r) => (
                    <div key={r.id} className="bg-white/4 border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all duration-200">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[10px] font-inter px-2.5 py-0.5 rounded-full border ${VISIT_COLORS[r.visitType]}`}>{r.visitType}</span>
                            {isMyRecord(r) ? (
                              <span className="text-[10px] font-inter px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300">
                                ✦ This Hospital
                              </span>
                            ) : (
                              <span className="text-[10px] font-inter px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30">
                                {r.hospitalName}
                              </span>
                            )}
                            <span className="text-white/15 font-inter text-[10px]">{r.id}</span>
                          </div>
                          <p className="text-white font-inter font-semibold">{r.patientName}</p>
                          <p className="text-white/50 font-inter text-sm mt-0.5">{r.diagnosis}</p>
                          <p className="text-white/35 font-inter text-xs mt-0.5">{r.doctorName} · +91 {r.patientPhone}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-white/30 font-inter text-xs">{formatDate(r.date)}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingRecord(r)}
                              className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/12
                                         hover:border-white/25 text-white/60 hover:text-white text-xs font-inter
                                         px-3 py-1.5 rounded-lg transition-all duration-200"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.2"
                                      strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (!confirm('Delete this record?')) return
                                deleteRecord(r.id)
                                loadRecords()
                              }}
                              className="text-white/20 hover:text-red-400 text-xs font-inter px-2 py-1.5
                                         rounded-lg transition-all duration-200"
                            >
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M2 3h9M4.5 3V2h4v1M5 5.5v4M8 5.5v4M2.5 3l.7 8h6.6l.7-8"
                                      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Medicines quick view */}
                      {r.medicines.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/6 flex flex-wrap gap-1.5">
                          {r.medicines.map((m,i) => (
                            <span key={i} className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${MED_STATUS[m.status]}`}>
                              {m.name} {m.dosage}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PRESCRIPTIONS ── */}
          {tab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-instrument text-white text-2xl">Digital Prescriptions</h2>
                  <p className="text-white/35 font-inter text-xs mt-1">{prescriptions.length} prescriptions in system</p>
                </div>
                <button onClick={() => setShowAddRx(true)}
                  className="flex items-center gap-2 bg-white text-[#030d18] px-5 py-2.5 rounded-full font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Create Prescription
                </button>
              </div>
              {prescriptions.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <span className="text-5xl mb-4">💊</span>
                  <p className="text-white/40 font-inter text-sm">No prescriptions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="bg-white/4 border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[10px] font-inter px-2.5 py-0.5 rounded-full border ${rx.status === 'active' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/8 border-white/15 text-white/40'}`}>{rx.status}</span>
                            <span className="text-white/15 font-inter text-[10px]">{rx.id}</span>
                          </div>
                          <p className="text-white font-inter font-semibold">{rx.patientName} · +91 {rx.patientPhone}</p>
                          <p className="text-white/50 font-inter text-sm mt-0.5">{rx.diagnosis}</p>
                          <p className="text-white/35 font-inter text-xs mt-0.5">{rx.doctorName} · {rx.specialty} · {formatDate(rx.date)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-white/30 font-inter text-xs">{rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''}</p>
                          <button onClick={() => { if (confirm('Delete this prescription?')) { deletePrescription(rx.id); loadPrescriptions() } }}
                            className="text-white/20 hover:text-red-400 text-xs font-inter px-2 py-1.5 rounded-lg transition-all">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M4.5 3V2h4v1M5 5.5v4M8 5.5v4M2.5 3l.7 8h6.6l.7-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                          </button>
                        </div>
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
            </div>
          )}

          {/* ── LAB TESTS ── */}
          {tab === 'labTests' && (
            <LabManagementTab
              labTests={labTests} labBookings={labBookings} labReports={labReports}
              onRefresh={() => loadLabData()}
              setShowAddTest={setShowAddTest}
              setEditingTest={setEditingTest}
              setEditingBooking={setEditingBooking}
              setUploadingFor={setUploadingFor}
            />
          )}

          {/* ── SETTINGS ── */}
          {tab === 'settings' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-instrument text-white text-2xl">Settings</h2>

              {/* Hospital info (read-only) */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-3">
                <p className="text-white/40 text-xs font-inter uppercase tracking-widest mb-1">Hospital Information</p>
                {[
                  ['Name',         admin.hospitalName],
                  ['License',      admin.licenseNumber],
                  ['Registration', admin.registrationNumber],
                  ['Type',         admin.hospitalType],
                  ['City',         `${admin.city}, ${admin.state}`],
                  ['Admin',        `${admin.adminName} (${admin.adminDesignation})`],
                  ['Email',        admin.email],
                  ['Phone',        admin.phone],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4">
                    <span className="text-white/30 font-inter text-xs w-24 shrink-0">{label}</span>
                    <span className="text-white/70 font-inter text-xs break-all">{value}</span>
                  </div>
                ))}
              </div>

              {/* Change password */}
              <form onSubmit={handlePasswordReset} className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4">
                <p className="text-white/40 text-xs font-inter uppercase tracking-widest">Change Password</p>
                {pwdMsg && (
                  <div className={`rounded-xl px-4 py-3 border text-sm font-inter
                                   ${pwdMsg.type==='success'
                                     ?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                     :'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {pwdMsg.msg}
                  </div>
                )}
                <input className={inp} type="password" placeholder="New password (min 8 chars)"
                  value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                <input className={inp} type="password" placeholder="Confirm new password"
                  value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                <button type="submit"
                  className="bg-white text-[#030d18] px-6 py-3 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
                  Update Password
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {showAddRecord && admin && (
        <AddRecordModal hospital={admin} onSave={()=>loadRecords()} onClose={()=>setShowAddRecord(false)} />
      )}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onSave={() => loadRecords()}
          onClose={() => setEditingRecord(null)}
        />
      )}
      {showAddRx && admin && (
        <AddPrescriptionModal hospital={admin} onSave={() => loadPrescriptions()} onClose={() => setShowAddRx(false)} />
      )}
      {showAddTest && admin && (
        <AddLabTestModal hospitalId={admin.id} hospitalName={admin.hospitalName} onSave={() => loadLabData()} onClose={() => setShowAddTest(false)} />
      )}
      {editingTest && (
        <EditLabTestModal test={editingTest} onSave={() => loadLabData()} onClose={() => setEditingTest(null)} />
      )}
      {editingBooking && (
        <EditLabBookingModal booking={editingBooking} onSave={() => loadLabData()} onClose={() => setEditingBooking(null)} />
      )}
      {uploadingFor && admin && (
        <UploadReportModal booking={uploadingFor} adminName={admin.adminName} onSave={() => loadLabData()} onClose={() => setUploadingFor(null)} />
      )}
    </div>
  )
}

// ─── Lab Management Tab (sub-component) ─────────────────────────────────────

function LabManagementTab({ labTests, labBookings, labReports, onRefresh,
  setShowAddTest, setEditingTest, setEditingBooking, setUploadingFor }: {
  labTests: LabTestCatalogItem[]
  labBookings: LabBooking[]
  labReports: LabReportData[]
  onRefresh: () => void
  setShowAddTest: (v: boolean) => void
  setEditingTest: (v: LabTestCatalogItem | null) => void
  setEditingBooking: (v: LabBooking | null) => void
  setUploadingFor: (v: LabBooking | null) => void
}) {
  const [subTab, setSubTab] = useState<'catalog' | 'bookings' | 'reports'>('catalog')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-instrument text-white text-2xl">Lab Test Management</h2>
        {subTab === 'catalog' && (
          <button onClick={() => setShowAddTest(true)}
            className="flex items-center gap-2 bg-white text-[#030d18] px-5 py-2.5 rounded-full font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Add Test
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 bg-white/4 border border-white/8 rounded-xl p-1 max-w-sm">
        {([
          { key: 'catalog', label: 'Test Catalog', count: labTests.length },
          { key: 'bookings', label: 'Bookings', count: labBookings.length },
          { key: 'reports', label: 'Reports', count: labReports.length },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-inter font-medium transition-all ${subTab === t.key ? 'bg-white text-[#030d18]' : 'text-white/50 hover:text-white'}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* ── Catalog ── */}
      {subTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {labTests.length === 0 ? (
            <p className="text-white/30 font-inter text-sm col-span-2 text-center py-10">No tests in catalog.</p>
          ) : (
            labTests.map((t) => (
              <div key={t.id} className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-white font-inter font-semibold text-sm">{t.name}</p>
                    <span className="text-white/30 font-inter text-[10px] uppercase">{t.category}</span>
                  </div>
                  <span className="text-emerald-400 font-inter font-bold text-sm">₹{t.price}</span>
                </div>
                <p className="text-white/40 font-inter text-xs leading-relaxed">{t.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/6">
                  <span className={`text-[10px] font-inter px-2 py-0.5 rounded-full border ${t.active ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/8 border-white/15 text-white/40'}`}>
                    {t.active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingTest(t)}
                      className="text-white/40 hover:text-white text-xs font-inter px-2 py-1 rounded-lg hover:bg-white/8 transition-all">Edit</button>
                    <button onClick={() => { if (confirm('Delete this test?')) { deleteLabTest(t.id); onRefresh() } }}
                      className="text-white/20 hover:text-red-400 text-xs font-inter px-2 py-1 rounded-lg transition-all">Del</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Bookings ── */}
      {subTab === 'bookings' && (
        <div className="space-y-3">
          {labBookings.length === 0 ? (
            <p className="text-white/30 font-inter text-sm text-center py-10">No lab bookings yet.</p>
          ) : (
            labBookings.map((b) => (
              <div key={b.id} className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-white font-inter font-semibold text-sm">{b.testName}</p>
                    <p className="text-white/40 font-inter text-xs mt-0.5">{b.patientName} · +91 {b.patientPhone}</p>
                    <p className="text-white/30 font-inter text-xs mt-0.5">{b.hospitalName} · {formatDate(b.date)} at {formatTime(b.time)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-inter px-2.5 py-0.5 rounded-full border ${LAB_STATUS_COLORS[b.status]}`}>
                      {LAB_STATUS_LABELS[b.status]}
                    </span>
                    <button onClick={() => setEditingBooking(b)}
                      className="bg-white/8 hover:bg-white/15 border border-white/12 text-white/60 hover:text-white text-xs font-inter px-3 py-1.5 rounded-lg transition-all">
                      Update
                    </button>
                  </div>
                </div>
                {b.status === 'completed' && !b.reportId && (
                  <button onClick={() => setUploadingFor(b)}
                    className="mt-3 w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 text-xs font-inter font-medium py-2 rounded-xl transition-all">
                    📄 Upload Report
                  </button>
                )}
                {b.reportId && (
                  <p className="mt-2 text-emerald-400/60 font-inter text-xs">✓ Report published</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Reports ── */}
      {subTab === 'reports' && (
        <div className="space-y-3">
          {labReports.length === 0 ? (
            <p className="text-white/30 font-inter text-sm text-center py-10">No reports uploaded yet.</p>
          ) : (
            labReports.map((r) => (
              <div key={r.id} className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-white font-inter font-semibold text-sm">{r.testName}</p>
                    <p className="text-white/40 font-inter text-xs mt-0.5">{r.patientName} · +91 {r.patientPhone}</p>
                    <p className="text-white/30 font-inter text-xs mt-0.5">{r.hospitalName} · {formatDate(r.testDate)} · {r.results.length} parameters</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-inter px-2.5 py-0.5 rounded-full border ${r.status === 'published' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'}`}>
                      {r.status}
                    </span>
                    {r.status === 'draft' && (
                      <button onClick={() => { publishReport(r.id); onRefresh() }}
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 text-xs font-inter px-3 py-1.5 rounded-lg transition-all">
                        Publish
                      </button>
                    )}
                  </div>
                </div>
                {r.summary && <p className="mt-2 pt-2 border-t border-white/6 text-white/40 font-inter text-xs">{r.summary}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Add Prescription Modal ──────────────────────────────────────────────────

function AddPrescriptionModal({ hospital, onSave, onClose }: {
  hospital: HospitalAdmin
  onSave: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    patientName: '', patientPhone: '', date: new Date().toISOString().slice(0, 10),
    doctorName: hospital.adminName, specialty: '', diagnosis: '', advice: '',
  })
  const [medicines, setMedicines] = useState<PrescribedMedicine[]>([])
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'

  function save() {
    if (!form.patientName || !form.patientPhone || !form.diagnosis) return
    const rx: Prescription = {
      id: generatePrescriptionId(),
      patientName: form.patientName,
      patientPhone: form.patientPhone,
      doctorName: form.doctorName,
      doctorId: '',
      specialty: form.specialty,
      hospitalName: hospital.hospitalName,
      hospitalId: hospital.id,
      appointmentId: '',
      date: form.date,
      diagnosis: form.diagnosis,
      advice: form.advice,
      medicines,
      adherence: [],
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    savePrescription(rx)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#071525] border border-white/12 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-instrument text-xl">Create Prescription</h2>
            <p className="text-white/35 font-inter text-xs">{hospital.hospitalName}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} placeholder="Patient Name *" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <input className={inp} type="tel" maxLength={10} placeholder="Mobile *" value={form.patientPhone} onChange={e => setForm({ ...form, patientPhone: e.target.value.replace(/\D/g, '') })} />
            <input className={inp} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <input className={inp} placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
          </div>
          <input className={inp} placeholder="Prescribing Doctor" value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} />
          <textarea className={`${inp} resize-none`} rows={2} placeholder="Diagnosis *" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
          <textarea className={`${inp} resize-none`} rows={2} placeholder="Additional medical advice" value={form.advice} onChange={e => setForm({ ...form, advice: e.target.value })} />

          {/* Medicines */}
          <p className="text-white/40 text-xs font-inter uppercase tracking-widest pt-2">Medicines</p>
          {medicines.map((m, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl p-3">
              <div className="flex-1">
                <p className="text-white font-inter text-sm">{m.name} <span className="text-white/40">{m.dosage}</span></p>
                <p className="text-white/35 font-inter text-xs">{m.frequency} · {m.duration}{m.instructions ? ` · ${m.instructions}` : ''}</p>
              </div>
              <button onClick={() => setMedicines(medicines.filter((_, j) => j !== i))} className="text-white/25 hover:text-red-400 transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} placeholder="Medicine Name *" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} />
              <input className={inp} placeholder="Dosage e.g. 500mg" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} />
              <input className={inp} placeholder="Frequency e.g. Twice daily" value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} />
              <input className={inp} placeholder="Duration e.g. 7 days" value={newMed.duration} onChange={e => setNewMed({ ...newMed, duration: e.target.value })} />
              <input className={`${inp} col-span-2`} placeholder="Instructions e.g. After meals" value={newMed.instructions} onChange={e => setNewMed({ ...newMed, instructions: e.target.value })} />
            </div>
            <button onClick={() => {
              if (!newMed.name) return
              setMedicines([...medicines, {
                id: generateMedicineId(),
                name: newMed.name, dosage: newMed.dosage, frequency: newMed.frequency || 'Once daily',
                duration: newMed.duration || '7 days', instructions: newMed.instructions,
                status: 'active' as const,
                reminderTimes: frequencyToTimes(newMed.frequency || 'Once daily'),
                totalDays: parseDuration(newMed.duration || '7 days'),
                startDate: form.date,
              }])
              setNewMed({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
            }} className="w-full border border-white/15 text-white/50 hover:text-white hover:border-white/30 py-2 rounded-xl text-sm font-inter transition-all flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Add Medicine
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end p-5 border-t border-white/8 shrink-0">
          <button onClick={save} disabled={!form.patientName || !form.patientPhone || !form.diagnosis}
            className="bg-white text-[#030d18] px-5 py-2.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all button-glow">
            Save Prescription
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Lab Test Modal ──────────────────────────────────────────────────────

function AddLabTestModal({ hospitalId, hospitalName, onSave, onClose }: {
  hospitalId: string
  hospitalName: string
  onSave: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState<LabTestCatalogItem>({
    id: '', name: '', description: '', category: 'Blood', price: 0,
    preparationInstructions: '', reportAvailabilityHours: 6,
    hospitalId, hospitalName, active: true,
  })
  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'
  const sel = `${inp} appearance-none`

  function save() {
    if (!form.name || form.price <= 0) return
    saveLabTest({ ...form, id: generateTestId() })
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#071525] border border-white/12 rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h2 className="text-white font-instrument text-xl">Add Lab Test</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="p-5 space-y-3">
          <input className={inp} placeholder="Test Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <textarea className={`${inp} resize-none`} rows={2} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className={sel} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['Blood', 'Imaging', 'Cardiac', 'Urine', 'Microbiology'].map(c => <option key={c} value={c} className="bg-[#071525]">{c}</option>)}
            </select>
            <input className={inp} type="number" placeholder="Price ₹" value={form.price || ''} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
          </div>
          <textarea className={`${inp} resize-none`} rows={2} placeholder="Preparation Instructions" value={form.preparationInstructions} onChange={e => setForm({ ...form, preparationInstructions: e.target.value })} />
          <input className={inp} type="number" placeholder="Report availability (hours)" value={form.reportAvailabilityHours || ''} onChange={e => setForm({ ...form, reportAvailabilityHours: parseInt(e.target.value) || 0 })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-blue-500" />
            <label htmlFor="active" className="text-white/50 font-inter text-sm">Active (available for booking)</label>
          </div>
        </div>
        <div className="flex items-center justify-end p-5 border-t border-white/8">
          <button onClick={save} disabled={!form.name || form.price <= 0}
            className="bg-white text-[#030d18] px-5 py-2.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all button-glow">
            Add Test
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Lab Test Modal ─────────────────────────────────────────────────────

function EditLabTestModal({ test, onSave, onClose }: {
  test: LabTestCatalogItem
  onSave: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState(test)
  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'
  const sel = `${inp} appearance-none`

  function save() {
    saveLabTest(form)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#071525] border border-white/12 rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h2 className="text-white font-instrument text-xl">Edit Lab Test</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="p-5 space-y-3">
          <input className={inp} placeholder="Test Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <textarea className={`${inp} resize-none`} rows={2} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className={sel} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['Blood', 'Imaging', 'Cardiac', 'Urine', 'Microbiology'].map(c => <option key={c} value={c} className="bg-[#071525]">{c}</option>)}
            </select>
            <input className={inp} type="number" placeholder="Price ₹" value={form.price || ''} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
          </div>
          <textarea className={`${inp} resize-none`} rows={2} placeholder="Preparation Instructions" value={form.preparationInstructions} onChange={e => setForm({ ...form, preparationInstructions: e.target.value })} />
          <input className={inp} type="number" placeholder="Report availability (hours)" value={form.reportAvailabilityHours || ''} onChange={e => setForm({ ...form, reportAvailabilityHours: parseInt(e.target.value) || 0 })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="edactive" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-blue-500" />
            <label htmlFor="edactive" className="text-white/50 font-inter text-sm">Active (available for booking)</label>
          </div>
        </div>
        <div className="flex items-center justify-end p-5 border-t border-white/8">
          <button onClick={save} className="bg-white text-[#030d18] px-5 py-2.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Lab Booking Modal (status update) ─────────────────────────────────

function EditLabBookingModal({ booking, onSave, onClose }: {
  booking: LabBooking
  onSave: () => void
  onClose: () => void
}) {
  const [status, setStatus] = useState<LabTestStatus>(booking.status)
  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white text-sm font-inter focus:outline-none transition-colors appearance-none'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#071525] border border-white/12 rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h2 className="text-white font-instrument text-xl">Update Booking</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <p className="text-white font-inter text-sm font-medium">{booking.testName}</p>
            <p className="text-white/40 font-inter text-xs mt-0.5">{booking.patientName} · +91 {booking.patientPhone}</p>
            <p className="text-white/30 font-inter text-xs mt-0.5">{formatDate(booking.date)} at {formatTime(booking.time)}</p>
          </div>
          <div>
            <label className="text-white/35 text-xs font-inter uppercase tracking-wide block mb-1.5">Update Status</label>
            <select className={inp} value={status} onChange={e => setStatus(e.target.value as LabTestStatus)}>
              {(['pending', 'sample-collected', 'processing', 'completed', 'report-ready', 'cancelled'] as LabTestStatus[]).map(s => (
                <option key={s} value={s} className="bg-[#071525]">{LAB_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <button onClick={() => { updateBookingStatus(booking.id, status); onSave(); onClose() }}
            className="w-full bg-white text-[#030d18] py-3.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 transition-all button-glow">
            Update Status
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Report Modal ─────────────────────────────────────────────────────

function UploadReportModal({ booking, adminName, onSave, onClose }: {
  booking: LabBooking
  adminName: string
  onSave: () => void
  onClose: () => void
}) {
  const [summary, setSummary] = useState('')
  const [results, setResults] = useState<LabResultItem[]>([
    { parameter: '', value: '', unit: '', referenceRange: '', status: 'normal' },
  ])
  const inp = 'w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm font-inter focus:outline-none transition-colors'
  const sel = `${inp} appearance-none`

  function save() {
    if (results.length === 0 || !results[0].parameter) return
    const report: LabReportData = {
      id: generateReportId(),
      bookingId: booking.id,
      testName: booking.testName,
      patientName: booking.patientName,
      patientPhone: booking.patientPhone,
      hospitalName: booking.hospitalName,
      hospitalId: booking.hospitalId,
      testDate: booking.date,
      results: results.filter(r => r.parameter.trim()),
      summary,
      status: 'published',
      publishedAt: new Date().toISOString(),
      uploadedBy: adminName,
      createdAt: new Date().toISOString(),
    }
    saveReport(report)
    // Also publish it and link to booking
    publishReport(report.id)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#071525] border border-white/12 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-instrument text-xl">Upload Lab Report</h2>
            <p className="text-white/35 font-inter text-xs">{booking.testName} · {booking.patientName}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 scrollbar-hide space-y-3">
          <textarea className={`${inp} resize-none`} rows={2} placeholder="Report Summary" value={summary} onChange={e => setSummary(e.target.value)} />
          <p className="text-white/40 text-xs font-inter uppercase tracking-widest">Test Results</p>
          {results.map((r, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-center">
              <input className={inp} placeholder="Parameter" value={r.parameter} onChange={e => { const u = [...results]; u[i] = { ...u[i], parameter: e.target.value }; setResults(u) }} />
              <input className={inp} placeholder="Value" value={r.value} onChange={e => { const u = [...results]; u[i] = { ...u[i], value: e.target.value }; setResults(u) }} />
              <input className={inp} placeholder="Ref. Range" value={r.referenceRange} onChange={e => { const u = [...results]; u[i] = { ...u[i], referenceRange: e.target.value }; setResults(u) }} />
              <div className="flex gap-1">
                <select className={sel} value={r.status} onChange={e => { const u = [...results]; u[i] = { ...u[i], status: e.target.value as LabResultItem['status'] }; setResults(u) }}>
                  <option value="normal" className="bg-[#071525]">Normal</option>
                  <option value="abnormal" className="bg-[#071525]">Abnormal</option>
                  <option value="borderline" className="bg-[#071525]">Borderline</option>
                </select>
                {results.length > 1 && (
                  <button onClick={() => setResults(results.filter((_, j) => j !== i))} className="text-white/25 hover:text-red-400 px-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={() => setResults([...results, { parameter: '', value: '', unit: '', referenceRange: '', status: 'normal' }])}
            className="w-full border border-white/15 text-white/50 hover:text-white hover:border-white/30 py-2 rounded-xl text-sm font-inter transition-all flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Add Parameter
          </button>
        </div>
        <div className="flex items-center justify-end p-5 border-t border-white/8 shrink-0">
          <button onClick={save} disabled={!results[0]?.parameter}
            className="bg-white text-[#030d18] px-5 py-2.5 rounded-xl font-inter font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all button-glow">
            Publish Report
          </button>
        </div>
      </div>
    </div>
  )
}
