// ─── Digital Prescription & Medicine Tracker ─────────────────────────────────
// Data module following the same localStorage CRUD pattern as medicalRecords.ts

export interface PrescribedMedicine {
  id: string
  name: string
  dosage: string           // "500mg"
  frequency: string         // "Twice daily"
  duration: string          // "7 days" | "Ongoing"
  instructions: string      // "After meals"
  status: 'active' | 'completed' | 'stopped'
  // Medicine tracker
  reminderTimes: string[]  // ["08:00", "20:00"]
  totalDays: number         // parsed from duration, 0 = ongoing
  startDate: string         // "YYYY-MM-DD"
}

export interface AdherenceEntry {
  medicineId: string  // which medicine this adherence record is for
  date: string      // "YYYY-MM-DD"
  time: string      // "08:00"
  status: 'taken' | 'missed' | 'pending'
  takenAt?: string  // ISO timestamp
}

export interface Prescription {
  id: string
  patientName: string
  patientPhone: string
  doctorName: string
  doctorId: string
  specialty: string
  hospitalName: string
  hospitalId: string
  appointmentId: string
  date: string              // "YYYY-MM-DD" — prescription issue date
  diagnosis: string
  advice: string            // additional medical advice
  medicines: PrescribedMedicine[]
  adherence: AdherenceEntry[]  // flat log of all adherence records
  status: 'active' | 'completed' | 'archived'
  createdAt: string
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mediconnect_prescriptions'

export function getAllPrescriptions(): Prescription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Prescription[]) : []
  } catch { return [] }
}

export function getPrescriptionsByPatient(phone: string): Prescription[] {
  return getAllPrescriptions()
    .filter((p) => p.patientPhone === phone)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPrescriptionsByHospital(hospitalId: string): Prescription[] {
  return getAllPrescriptions().filter((p) => p.hospitalId === hospitalId)
}

export function getPrescriptionsByAppointment(appointmentId: string): Prescription[] {
  return getAllPrescriptions().filter((p) => p.appointmentId === appointmentId)
}

export function getPrescriptionById(id: string): Prescription | undefined {
  return getAllPrescriptions().find((p) => p.id === id)
}

export function savePrescription(rx: Prescription): void {
  const all = getAllPrescriptions()
  const idx = all.findIndex((p) => p.id === rx.id)
  if (idx >= 0) all[idx] = rx
  else all.push(rx)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function deletePrescription(id: string): void {
  const all = getAllPrescriptions().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function generatePrescriptionId(): string {
  return 'PRE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

export function generateMedicineId(): string {
  return 'MED-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 4).toUpperCase()
}

// ─── Adherence helpers ───────────────────────────────────────────────────────

/** Mark a medicine dose as taken or missed for a specific date+time */
export function markAdherence(
  prescriptionId: string,
  medicineId: string,
  date: string,
  time: string,
  status: 'taken' | 'missed'
): void {
  const rx = getPrescriptionById(prescriptionId)
  if (!rx) return
  const entry: AdherenceEntry = {
    medicineId,
    date, time, status,
    takenAt: status === 'taken' ? new Date().toISOString() : undefined,
  }
  // Remove any existing entry for this date+time, then add new
  const filtered = rx.adherence.filter(
    (a) => !(a.date === date && a.time === time)
  )
  filtered.push(entry)
  savePrescription({ ...rx, adherence: filtered })
}

/** Get today's medicine schedule from a prescription */
export interface ScheduledDose {
  medicineId: string
  medicineName: string
  dosage: string
  instructions: string
  time: string
  date: string
  status: 'taken' | 'missed' | 'pending'
}

export function getTodaySchedule(phone: string): ScheduledDose[] {
  const today = new Date().toISOString().slice(0, 10)
  const prescriptions = getPrescriptionsByPatient(phone).filter((p) => p.status === 'active')
  const doses: ScheduledDose[] = []

  for (const rx of prescriptions) {
    for (const med of rx.medicines) {
      if (med.status !== 'active') continue
      for (const time of med.reminderTimes) {
        // Check adherence for this specific medicine + date + time
        const entry = rx.adherence.find((a) => a.date === today && a.time === time && a.medicineId === med.id)
        const status: 'taken' | 'missed' | 'pending' = entry?.status || 'pending'
        doses.push({
          medicineId: med.id,
          medicineName: med.name,
          dosage: med.dosage,
          instructions: med.instructions,
          time,
          date: today,
          status,
        })
      }
    }
  }

  return doses.sort((a, b) => a.time.localeCompare(b.time))
}

/** Check if a medicine course is about to finish (within 3 days) */
export interface FinishingSoon {
  prescriptionId: string
  medicineName: string
  daysLeft: number
}

export function getFinishingSoon(phone: string): FinishingSoon[] {
  const today = new Date()
  const prescriptions = getPrescriptionsByPatient(phone).filter((p) => p.status === 'active')
  const result: FinishingSoon[] = []

  for (const rx of prescriptions) {
    for (const med of rx.medicines) {
      if (med.status !== 'active' || med.totalDays === 0) continue // 0 = ongoing
      const start = new Date(med.startDate + 'T00:00:00')
      const end = new Date(start)
      end.setDate(end.getDate() + med.totalDays)
      const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000)
      if (daysLeft > 0 && daysLeft <= 3) {
        result.push({ prescriptionId: rx.id, medicineName: med.name, daysLeft })
      }
    }
  }
  return result
}

// ─── Parse duration string to days ────────────────────────────────────────────

export function parseDuration(duration: string): number {
  const lower = duration.toLowerCase()
  if (lower.includes('ongoing') || lower.includes('lifelong') || lower.includes('indefinite')) return 0
  const match = lower.match(/(\d+)\s*(day|week|month)/)
  if (!match) return 7 // default
  const num = parseInt(match[1])
  const unit = match[2]
  if (unit === 'day') return num
  if (unit === 'week') return num * 7
  if (unit === 'month') return num * 30
  return 7
}

/** Generate reminder times from a frequency string */
export function frequencyToTimes(frequency: string): string[] {
  const f = frequency.toLowerCase()
  if (f.includes('once') || f.includes('daily') && !f.includes('twice') && !f.includes('thrice'))
    return ['09:00']
  if (f.includes('twice') || f.includes('two') || f.includes('2'))
    return ['09:00', '21:00']
  if (f.includes('thrice') || f.includes('three') || f.includes('3'))
    return ['08:00', '14:00', '20:00']
  if (f.includes('four') || f.includes('4'))
    return ['08:00', '13:00', '18:00', '22:00']
  if (f.includes('bedtime') || f.includes('night'))
    return ['22:00']
  if (f.includes('morning'))
    return ['09:00']
  if (f.includes('evening'))
    return ['19:00']
  return ['09:00', '21:00'] // default: twice daily
}

// ─── Seed demo data ──────────────────────────────────────────────────────────

const SEED_VERSION = 'v1'
const SEED_KEY = 'mediconnect_prescriptions_seed_version'

export function seedDemoPrescriptions(): void {
  if (localStorage.getItem(SEED_KEY) === SEED_VERSION) return
  const existing = getAllPrescriptions().filter((p) => !p.id.startsWith('PRE-DEMO-'))
  const today = new Date()
  const d = (daysBack: number) => {
    const dt = new Date(today); dt.setDate(dt.getDate() - daysBack)
    return dt.toISOString().slice(0, 10)
  }

  const demo: Prescription[] = [
    {
      id: 'PRE-DEMO-001',
      patientName: 'Arjun Mehta',
      patientPhone: '9999999999',
      doctorName: 'Dr. Priya Sharma',
      doctorId: 'd-001',
      specialty: 'Cardiology',
      hospitalName: 'Apollo City Hospital',
      hospitalId: 'hosp-001',
      appointmentId: '',
      date: d(5),
      diagnosis: 'Controlled hypertension. Continue current medication regimen.',
      advice: 'Maintain low-sodium diet. 30 minutes brisk walk daily. Monitor BP at home weekly. Avoid stress.',
      medicines: [
        { id: generateMedicineId(), name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'Morning with water', status: 'active', reminderTimes: ['09:00'], totalDays: 0, startDate: d(5) },
        { id: generateMedicineId(), name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'After breakfast', status: 'active', reminderTimes: ['09:00'], totalDays: 0, startDate: d(5) },
        { id: generateMedicineId(), name: 'Rosuvastatin', dosage: '10mg', frequency: 'Once at bedtime', duration: 'Ongoing', instructions: 'For cholesterol', status: 'active', reminderTimes: ['22:00'], totalDays: 0, startDate: d(5) },
      ],
      adherence: [],
      status: 'active',
      createdAt: new Date(today.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: 'PRE-DEMO-002',
      patientName: 'Arjun Mehta',
      patientPhone: '9999999999',
      doctorName: 'Dr. Priya Sharma',
      doctorId: 'd-001',
      specialty: 'Cardiology',
      hospitalName: 'Apollo City Hospital',
      hospitalId: 'hosp-001',
      appointmentId: '',
      date: d(30),
      diagnosis: 'Mild hypertension Grade 1. Initial pharmacotherapy.',
      advice: 'Lifestyle modification. Low-sodium diet. Daily walking. Reduce stress.',
      medicines: [
        { id: generateMedicineId(), name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Morning with water', status: 'completed', reminderTimes: ['09:00'], totalDays: 30, startDate: d(30) },
        { id: generateMedicineId(), name: 'Alprazolam', dosage: '0.25mg', frequency: 'At bedtime if needed', duration: '10 days', instructions: 'Only when anxious', status: 'completed', reminderTimes: ['22:00'], totalDays: 10, startDate: d(30) },
      ],
      adherence: [],
      status: 'completed',
      createdAt: new Date(today.getTime() - 30 * 86400000).toISOString(),
    },
  ]

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, ...demo]))
  localStorage.setItem(SEED_KEY, SEED_VERSION)
}
