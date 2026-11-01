// ─── Types ────────────────────────────────────────────────────────────────────

export type HospitalStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface HospitalAdmin {
  id: string
  // Hospital details
  hospitalName: string
  licenseNumber: string
  registrationNumber: string
  hospitalType: 'government' | 'private' | 'trust' | 'clinic'
  specialties: string[]
  beds: number
  establishedYear: number
  website: string
  // Location
  address: string
  city: string
  state: string
  pincode: string
  // Contact
  adminName: string
  adminDesignation: string
  email: string
  phone: string
  // Auth
  password: string   // plain text for demo (in real: hashed)
  status: HospitalStatus
  registeredAt: string
  approvedAt?: string
  rejectionReason?: string
  // Stats (updated from appointments)
  totalAppointments: number
  totalPatients: number
}

export interface SuperAdmin {
  email: string
  password: string
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const HOSPITALS_KEY   = 'mediconnect_hospital_admins'
const SESSION_KEY     = 'mediconnect_admin_session'   // { type: 'hospital'|'super', id?: string }

// ─── Super admin credentials (hardcoded for demo) ─────────────────────────────
export const SUPER_ADMIN: SuperAdmin = {
  email: 'superadmin@mediconnect.in',
  password: 'Admin@2026',
}

// ─── Hospital admin CRUD ──────────────────────────────────────────────────────

export function getAllHospitalAdmins(): HospitalAdmin[] {
  try {
    const raw = localStorage.getItem(HOSPITALS_KEY)
    return raw ? (JSON.parse(raw) as HospitalAdmin[]) : []
  } catch { return [] }
}

export function getHospitalAdminById(id: string): HospitalAdmin | undefined {
  return getAllHospitalAdmins().find((h) => h.id === id)
}

export function getHospitalAdminByEmail(email: string): HospitalAdmin | undefined {
  return getAllHospitalAdmins().find((h) => h.email.toLowerCase() === email.toLowerCase())
}

export function saveHospitalAdmin(admin: HospitalAdmin): void {
  const all = getAllHospitalAdmins()
  const idx = all.findIndex((h) => h.id === admin.id)
  if (idx >= 0) all[idx] = admin
  else all.push(admin)
  localStorage.setItem(HOSPITALS_KEY, JSON.stringify(all))
}

export function updateHospitalStatus(id: string, status: HospitalStatus, reason?: string): void {
  const all = getAllHospitalAdmins().map((h) => {
    if (h.id !== id) return h
    return {
      ...h,
      status,
      approvedAt: status === 'approved' ? new Date().toISOString() : h.approvedAt,
      rejectionReason: reason ?? h.rejectionReason,
    }
  })
  localStorage.setItem(HOSPITALS_KEY, JSON.stringify(all))
}

export function updateHospitalPassword(id: string, newPassword: string): void {
  const all = getAllHospitalAdmins().map((h) =>
    h.id === id ? { ...h, password: newPassword } : h
  )
  localStorage.setItem(HOSPITALS_KEY, JSON.stringify(all))
}

export function generateAdminId(): string {
  return 'HOSP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export type AdminSession =
  | { type: 'super' }
  | { type: 'hospital'; id: string }

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AdminSession) : null
  } catch { return null }
}

export function setAdminSession(session: AdminSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

// ─── Seed demo hospital ───────────────────────────────────────────────────────

export function seedDemoHospitalAdmin(): void {
  if (getHospitalAdminByEmail('admin@apollocity.in')) return
  saveHospitalAdmin({
    id: 'HOSP-DEMO-001',
    hospitalName: 'Apollo City Hospital',
    licenseNumber: 'MH-HOSP-2024-001234',
    registrationNumber: 'REG-2024-APOLLO-001',
    hospitalType: 'private',
    specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology'],
    beds: 420,
    establishedYear: 1995,
    website: 'www.apollocity.in',
    address: 'Survey No. 12, Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    adminName: 'Rajiv Kapoor',
    adminDesignation: 'CEO & Managing Director',
    email: 'admin@apollocity.in',
    phone: '9876543210',
    password: 'Apollo@123',
    status: 'approved',
    registeredAt: '2026-01-10T08:00:00.000Z',
    approvedAt: '2026-01-11T09:00:00.000Z',
    totalAppointments: 0,
    totalPatients: 0,
  })
}

// ─── Seed per-hospital demo records ──────────────────────────────────────────
// Creates realistic demo medical records tagged to the specific hospital
// so every hospital admin sees populated data when they first log in.

export function seedHospitalDemoRecords(hospitalId: string, hospitalName: string): void {
  const KEY = `mediconnect_hospital_seeded_${hospitalId}`
  if (localStorage.getItem(KEY)) return          // already done for this hospital

  // Import inline to avoid circular deps — use dynamic localStorage write
  const RECORDS_KEY = 'mediconnect_medical_records'
  let all: unknown[] = []
  try { all = JSON.parse(localStorage.getItem(RECORDS_KEY) ?? '[]') } catch { all = [] }

  const now = new Date()
  const d = (daysBack: number) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() - daysBack)
    return dt.toISOString().slice(0, 10)
  }

  const newRecords = [
    {
      id: `REC-${hospitalId.slice(0,8)}-H001`,
      patientName: 'Ravi Shankar',
      patientPhone: '9812345678',
      date: d(3),
      doctorName: 'Dr. (House Doctor)',
      doctorId: '',
      specialty: 'General Medicine',
      hospitalName,
      hospitalId,
      appointmentId: '',
      visitType: 'consultation',
      chiefComplaint: 'Fever and throat pain for 4 days. Difficulty swallowing.',
      diagnosis: 'Acute tonsillo-pharyngitis. Bacterial aetiology likely (GAS). Antibiotic course initiated.',
      notes: 'Throat congested, tonsils grade II, exudate present. RDT for strep positive. No breathlessness. Advised soft diet, warm saline gargle, adequate rest. Review if no improvement in 5 days.',
      medicines: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'Thrice daily', duration: '7 days', instructions: 'After meals. Complete full course.', status: 'active' },
        { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours if fever', duration: '5 days', instructions: 'With water', status: 'active' },
        { name: 'Betadine Gargle', dosage: '10mL diluted', frequency: 'Gargle 3x daily', duration: '7 days', instructions: 'Do not swallow', status: 'active' },
      ],
      labReports: [
        { name: 'Rapid Strep Test (RDT)', result: 'Positive — Group A Streptococcus', status: 'abnormal' },
        { name: 'Complete Blood Count', result: 'Leucocytosis', value: 'WBC: 12,400 /µL', referenceRange: '4,000–11,000 /µL', status: 'abnormal' },
      ],
      bloodPressure: '114/72 mmHg',
      temperature: '101.4°F',
      weight: '68 kg',
      heartRate: '94 bpm',
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: `REC-${hospitalId.slice(0,8)}-H002`,
      patientName: 'Sunita Agarwal',
      patientPhone: '9723456789',
      date: d(10),
      doctorName: 'Dr. (House Doctor)',
      doctorId: '',
      specialty: 'Orthopedics',
      hospitalName,
      hospitalId,
      appointmentId: '',
      visitType: 'follow-up',
      chiefComplaint: 'Follow-up for lower back pain. Started physiotherapy 2 weeks ago.',
      diagnosis: 'Lumbar disc bulge L4-L5 with radiculopathy (right leg). Improving with conservative management.',
      notes: 'Straight leg raise test: 60° (improved from 45° last visit). Physiotherapy compliance good — 3 sessions/week. Neurological deficit resolving. MRI reviewed — disc bulge not progressed. Continue current management. Surgical option not indicated.',
      medicines: [
        { name: 'Etoricoxib', dosage: '90mg', frequency: 'Once daily after food', duration: '10 days', instructions: 'Take with food, avoid on empty stomach', status: 'active' },
        { name: 'Pregabalin', dosage: '75mg', frequency: 'Twice daily', duration: '30 days', instructions: 'For nerve pain. May cause drowsiness.', status: 'active' },
        { name: 'Thiocolchicoside', dosage: '4mg', frequency: 'Twice daily', duration: '7 days', instructions: 'Muscle relaxant — do not drive', status: 'completed' },
        { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily before breakfast', duration: '10 days', instructions: 'Stomach protection with NSAID', status: 'active' },
      ],
      labReports: [
        { name: 'MRI Lumbar Spine', result: 'L4-L5 disc bulge, mild neural foraminal narrowing (R)', status: 'abnormal' },
        { name: 'X-Ray Lumbar Spine (AP+Lat)', result: 'Reduced disc space L4-L5. No fracture.', status: 'abnormal' },
      ],
      followUpDate: d(-14),
      bloodPressure: '122/78 mmHg',
      temperature: '98.2°F',
      weight: '62 kg',
      heartRate: '72 bpm',
      createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
    },
    {
      id: `REC-${hospitalId.slice(0,8)}-H003`,
      patientName: 'Mohammed Iqbal',
      patientPhone: '9634567890',
      date: d(21),
      doctorName: 'Dr. (House Doctor)',
      doctorId: '',
      specialty: 'Cardiology',
      hospitalName,
      hospitalId,
      appointmentId: '',
      visitType: 'routine-checkup',
      chiefComplaint: 'Routine cardiac check. Patient is 58 years old with 10-year history of diabetes and hypertension.',
      diagnosis: 'Well-controlled Type 2 Diabetes Mellitus. Hypertension — optimally controlled. Mild dyslipidaemia.',
      notes: 'HbA1c 7.1% — target range achieved. BP 132/80 — well controlled. No chest pain, no breathlessness. Peripheral pulses intact. Feet examination normal. Eyes: cataract noted, ophthalmology referral given. ECG normal. Advised annual nephrology review.',
      medicines: [
        { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily with meals', duration: 'Ongoing', instructions: 'With breakfast and dinner', status: 'active' },
        { name: 'Glimepiride', dosage: '2mg', frequency: 'Once daily before breakfast', duration: 'Ongoing', instructions: 'Monitor for hypoglycaemia', status: 'active' },
        { name: 'Telmisartan', dosage: '40mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'Morning', status: 'active' },
        { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once at bedtime', duration: 'Ongoing', instructions: 'For cholesterol', status: 'active' },
        { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily after food', duration: 'Ongoing', instructions: 'Cardioprotective', status: 'active' },
      ],
      labReports: [
        { name: 'HbA1c', result: 'Target achieved', value: '7.1%', referenceRange: '< 7.5% (diabetic target)', status: 'normal' },
        { name: 'Fasting Blood Sugar', result: 'Controlled', value: '118 mg/dL', referenceRange: '70–130 mg/dL (diabetic)', status: 'normal' },
        { name: 'Post-Prandial Blood Sugar', result: 'Slightly high', value: '174 mg/dL', referenceRange: '< 180 mg/dL', status: 'normal' },
        { name: 'Lipid Profile — LDL', result: 'Acceptable', value: '108 mg/dL', referenceRange: '< 100 mg/dL (diabetic)', status: 'abnormal' },
        { name: 'Serum Creatinine', result: 'Normal', value: '1.1 mg/dL', referenceRange: '0.6–1.2 mg/dL', status: 'normal' },
        { name: 'Urine Microalbumin', result: 'Trace', value: '38 mg/g Cr', referenceRange: '< 30 mg/g Cr', status: 'abnormal' },
        { name: 'ECG', result: 'Normal sinus rhythm. No ischaemic changes.', status: 'normal' },
      ],
      followUpDate: d(-90),
      bloodPressure: '132/80 mmHg',
      temperature: '98.4°F',
      weight: '78 kg',
      heartRate: '76 bpm',
      createdAt: new Date(now.getTime() - 21 * 86400000).toISOString(),
    },
    {
      id: `REC-${hospitalId.slice(0,8)}-H004`,
      patientName: 'Deepa Krishnamurthy',
      patientPhone: '9545678901',
      date: d(35),
      doctorName: 'Dr. (House Doctor)',
      doctorId: '',
      specialty: 'Gynaecology',
      hospitalName,
      hospitalId,
      appointmentId: '',
      visitType: 'consultation',
      chiefComplaint: 'Irregular and heavy periods for 6 months. Pelvic pain during menstruation.',
      diagnosis: 'Uterine fibroids (intramural, 2.8cm × 2.4cm on USG). Mild iron-deficiency anaemia secondary to menorrhagia.',
      notes: 'USG pelvis: single intramural fibroid noted, uterus slightly bulky. Haemoglobin 9.8 g/dL. Patient keen to avoid surgery. Medical management initiated. Follow-up USG in 3 months. If fibroids enlarge or symptoms worsen, surgical options (myomectomy/HIFU) to be discussed.',
      medicines: [
        { name: 'Tranexamic Acid', dosage: '500mg', frequency: 'Three times daily during periods', duration: 'As needed (menstrual days)', instructions: 'Reduces blood loss. Take only during heavy bleeding days.', status: 'active' },
        { name: 'Mefenamic Acid', dosage: '500mg', frequency: 'Thrice daily during periods', duration: 'As needed', instructions: 'For pain and blood loss reduction', status: 'active' },
        { name: 'Ferrous Fumarate + Folic Acid', dosage: '200mg', frequency: 'Once daily', duration: '60 days', instructions: 'For anaemia. Take with orange juice.', status: 'active' },
        { name: 'Norethisterone', dosage: '5mg', frequency: 'Twice daily (Day 5–25 of cycle)', duration: '3 months', instructions: 'To regulate menstrual cycle', status: 'active' },
      ],
      labReports: [
        { name: 'USG Pelvis (Transvaginal)', result: 'Single intramural fibroid 2.8×2.4cm. Bulky uterus.', status: 'abnormal' },
        { name: 'Haemoglobin', result: 'Anaemic', value: '9.8 g/dL', referenceRange: '12–15 g/dL', status: 'abnormal' },
        { name: 'Serum Ferritin', result: 'Low', value: '8 ng/mL', referenceRange: '12–150 ng/mL', status: 'abnormal' },
        { name: 'Thyroid Profile (TSH)', result: 'Normal — fibroid not thyroid-related', value: '2.4 mIU/L', referenceRange: '0.5–4.5 mIU/L', status: 'normal' },
        { name: 'CA-125', result: 'Normal — malignancy excluded', value: '18 U/mL', referenceRange: '< 35 U/mL', status: 'normal' },
      ],
      followUpDate: d(-90),
      bloodPressure: '110/70 mmHg',
      temperature: '98.6°F',
      weight: '58 kg',
      heartRate: '80 bpm',
      createdAt: new Date(now.getTime() - 35 * 86400000).toISOString(),
    },
  ]

  // Append new records without duplicating
  const existingIds = new Set((all as { id: string }[]).map((r) => r.id))
  const toAdd = newRecords.filter((r) => !existingIds.has(r.id))
  localStorage.setItem(RECORDS_KEY, JSON.stringify([...(all as unknown[]), ...toAdd]))
  localStorage.setItem(KEY, '1')
}
