// ─── Lab Test & Report Management ────────────────────────────────────────────
// Data module following the same localStorage CRUD pattern as medicalRecords.ts

export type LabTestStatus =
  | 'pending'
  | 'sample-collected'
  | 'processing'
  | 'completed'
  | 'report-ready'
  | 'cancelled'

export interface LabTestCatalogItem {
  id: string
  name: string
  description: string
  category: string           // "Blood", "Imaging", "Cardiac", "Urine", "Microbiology"
  price: number
  preparationInstructions: string
  reportAvailabilityHours: number  // estimated time for report
  hospitalId: string         // hospital that manages this test ('' = available at all)
  hospitalName: string
  active: boolean
}

export interface LabResultItem {
  parameter: string
  value: string
  unit: string
  referenceRange: string
  status: 'normal' | 'abnormal' | 'borderline'
}

export interface LabReport {
  id: string
  bookingId: string
  testName: string
  patientName: string
  patientPhone: string
  hospitalName: string
  hospitalId: string
  testDate: string            // "YYYY-MM-DD"
  results: LabResultItem[]
  summary: string             // radiologist/pathologist summary
  status: 'draft' | 'published'
  publishedAt?: string
  uploadedBy: string          // admin name who uploaded
  createdAt: string
}

export interface LabBooking {
  id: string
  testId: string
  testName: string
  testCategory: string
  patientName: string
  patientPhone: string
  hospitalId: string
  hospitalName: string
  date: string               // "YYYY-MM-DD" — scheduled test date
  time: string               // "HH:MM"
  price: number
  status: LabTestStatus
  bookingDate: string        // ISO — when booked
  reportId?: string          // link to LabReport when ready
  doctorName?: string        // doctor who ordered (if applicable)
  notes?: string
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const CATALOG_KEY = 'mediconnect_lab_test_catalog'
const BOOKING_KEY = 'mediconnect_lab_bookings'
const REPORT_KEY  = 'mediconnect_lab_reports'

// ─── Catalog CRUD ─────────────────────────────────────────────────────────────

export function getAllLabTests(): LabTestCatalogItem[] {
  try {
    const raw = localStorage.getItem(CATALOG_KEY)
    return raw ? (JSON.parse(raw) as LabTestCatalogItem[]) : []
  } catch { return [] }
}

export function getLabTestsByHospital(hospitalId: string): LabTestCatalogItem[] {
  return getAllLabTests().filter((t) => t.hospitalId === hospitalId && t.active)
}

export function getActiveLabTests(): LabTestCatalogItem[] {
  return getAllLabTests().filter((t) => t.active)
}

export function getLabTestById(id: string): LabTestCatalogItem | undefined {
  return getAllLabTests().find((t) => t.id === id)
}

export function saveLabTest(test: LabTestCatalogItem): void {
  const all = getAllLabTests()
  const idx = all.findIndex((t) => t.id === test.id)
  if (idx >= 0) all[idx] = test
  else all.push(test)
  localStorage.setItem(CATALOG_KEY, JSON.stringify(all))
}

export function deleteLabTest(id: string): void {
  const all = getAllLabTests().filter((t) => t.id !== id)
  localStorage.setItem(CATALOG_KEY, JSON.stringify(all))
}

export function generateTestId(): string {
  return 'TEST-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

// ─── Booking CRUD ─────────────────────────────────────────────────────────────

export function getAllLabBookings(): LabBooking[] {
  try {
    const raw = localStorage.getItem(BOOKING_KEY)
    return raw ? (JSON.parse(raw) as LabBooking[]) : []
  } catch { return [] }
}

export function getBookingsByPatient(phone: string): LabBooking[] {
  return getAllLabBookings()
    .filter((b) => b.patientPhone === phone)
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
}

export function getBookingsByHospital(hospitalId: string): LabBooking[] {
  return getAllLabBookings().filter((b) => b.hospitalId === hospitalId)
}

export function getBookingById(id: string): LabBooking | undefined {
  return getAllLabBookings().find((b) => b.id === id)
}

export function saveBooking(booking: LabBooking): void {
  const all = getAllLabBookings()
  const idx = all.findIndex((b) => b.id === booking.id)
  if (idx >= 0) all[idx] = booking
  else all.push(booking)
  localStorage.setItem(BOOKING_KEY, JSON.stringify(all))
}

export function updateBookingStatus(bookingId: string, status: LabTestStatus): void {
  const all = getAllLabBookings().map((b) =>
    b.id === bookingId ? { ...b, status } : b
  )
  localStorage.setItem(BOOKING_KEY, JSON.stringify(all))
}

export function generateBookingId(): string {
  return 'LAB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

// ─── Report CRUD ─────────────────────────────────────────────────────────────

export function getAllLabReports(): LabReport[] {
  try {
    const raw = localStorage.getItem(REPORT_KEY)
    return raw ? (JSON.parse(raw) as LabReport[]) : []
  } catch { return [] }
}

export function getReportsByPatient(phone: string): LabReport[] {
  return getAllLabReports()
    .filter((r) => r.patientPhone === phone && r.status === 'published')
    .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
}

export function getReportsByHospital(hospitalId: string): LabReport[] {
  return getAllLabReports().filter((r) => r.hospitalId === hospitalId)
}

export function getReportById(id: string): LabReport | undefined {
  return getAllLabReports().find((r) => r.id === id)
}

export function saveReport(report: LabReport): void {
  const all = getAllLabReports()
  const idx = all.findIndex((r) => r.id === report.id)
  if (idx >= 0) all[idx] = report
  else all.push(report)
  localStorage.setItem(REPORT_KEY, JSON.stringify(all))
}

export function publishReport(reportId: string): void {
  const all = getAllLabReports().map((r) =>
    r.id === reportId ? { ...r, status: 'published' as const, publishedAt: new Date().toISOString() } : r
  )
  localStorage.setItem(REPORT_KEY, JSON.stringify(all))

  // Also update the booking status and link report
  const report = all.find((r) => r.id === reportId)
  if (report) {
    const bookings = getAllLabBookings().map((b) =>
      b.id === report.bookingId ? { ...b, status: 'report-ready' as LabTestStatus, reportId } : b
    )
    localStorage.setItem(BOOKING_KEY, JSON.stringify(bookings))
  }
}

export function generateReportId(): string {
  return 'RPT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

// ─── Generate time slots for lab booking ──────────────────────────────────────

export function generateLabSlots(date: string): { time: string; available: boolean }[] {
  const slots: string[] = []
  for (let h = 8; h < 12; h++) slots.push(`${h.toString().padStart(2, '0')}:00`, `${h.toString().padStart(2, '0')}:30`)
  for (let h = 14; h < 18; h++) slots.push(`${h.toString().padStart(2, '0')}:00`, `${h.toString().padStart(2, '0')}:30`)

  const booked = getAllLabBookings()
    .filter((b) => b.date === date && b.status !== 'cancelled')
    .map((b) => b.time)

  return slots.map((time) => ({ time, available: !booked.includes(time) }))
}

// ─── Seed demo data ──────────────────────────────────────────────────────────

const SEED_VERSION = 'v1'
const SEED_KEY = 'mediconnect_lab_tests_seed_version'

export function seedLabDemoData(): void {
  if (localStorage.getItem(SEED_KEY) === SEED_VERSION) return

  // Keep existing real data, strip old demo
  const existingTests = getAllLabTests().filter((t) => !t.id.startsWith('TEST-DEMO-'))
  const existingBookings = getAllLabBookings().filter((b) => !b.id.startsWith('LAB-DEMO-'))
  const existingReports = getAllLabReports().filter((r) => !r.id.startsWith('RPT-DEMO-'))

  const today = new Date()
  const d = (daysBack: number) => {
    const dt = new Date(today); dt.setDate(dt.getDate() - daysBack)
    return dt.toISOString().slice(0, 10)
  }

  // Demo test catalog (available at all hospitals)
  const demoTests: LabTestCatalogItem[] = [
    { id: 'TEST-DEMO-001', name: 'Complete Blood Count (CBC)', description: 'Measures red blood cells, white blood cells, hemoglobin, hematocrit and platelets.', category: 'Blood', price: 350, preparationInstructions: 'No fasting required. Stay hydrated.', reportAvailabilityHours: 6, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-002', name: 'Lipid Profile', description: 'Measures cholesterol levels: total, HDL, LDL, and triglycerides.', category: 'Blood', price: 600, preparationInstructions: 'Fast for 12 hours before test. Water allowed.', reportAvailabilityHours: 12, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-003', name: 'Fasting Blood Glucose', description: 'Measures blood sugar levels after overnight fasting.', category: 'Blood', price: 150, preparationInstructions: 'Fast for 8 hours. No food or drink except water.', reportAvailabilityHours: 4, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-004', name: 'Thyroid Profile (T3, T4, TSH)', description: 'Evaluates thyroid gland function and hormone levels.', category: 'Blood', price: 500, preparationInstructions: 'No fasting required. Avoid thyroid medication on test day.', reportAvailabilityHours: 12, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-005', name: 'HbA1c (Glycated Hemoglobin)', description: 'Measures average blood sugar over the past 2-3 months.', category: 'Blood', price: 450, preparationInstructions: 'No fasting required.', reportAvailabilityHours: 8, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-006', name: 'Liver Function Test (LFT)', description: 'Assesses liver health via enzymes, proteins, and bilirubin.', category: 'Blood', price: 700, preparationInstructions: 'Fast for 8 hours. Avoid alcohol 24 hours prior.', reportAvailabilityHours: 12, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-007', name: 'Kidney Function Test (KFT)', description: 'Evaluates kidney function through creatinine, urea, and electrolytes.', category: 'Blood', price: 650, preparationInstructions: 'Fast for 8 hours. Drink normal water.', reportAvailabilityHours: 12, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-008', name: 'Urine Routine & Microscopy', description: 'Analyzes urine for signs of infection, kidney disease, and diabetes.', category: 'Urine', price: 200, preparationInstructions: 'Collect first morning mid-stream urine.', reportAvailabilityHours: 4, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-009', name: 'Chest X-Ray (PA View)', description: 'Digital X-ray of the chest to evaluate lungs, heart, and bones.', category: 'Imaging', price: 400, preparationInstructions: 'Wear loose clothing. Remove metal objects from chest area.', reportAvailabilityHours: 2, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-010', name: 'ECG (12-Lead)', description: 'Records electrical activity of the heart to detect arrhythmias and cardiac issues.', category: 'Cardiac', price: 300, preparationInstructions: 'No special preparation. Avoid caffeine before test.', reportAvailabilityHours: 1, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-011', name: 'Vitamin D (25-OH)', description: 'Measures vitamin D levels in the blood.', category: 'Blood', price: 800, preparationInstructions: 'No fasting required.', reportAvailabilityHours: 24, hospitalId: '', hospitalName: 'All Hospitals', active: true },
    { id: 'TEST-DEMO-012', name: 'Vitamin B12', description: 'Measures vitamin B12 levels for neurological and blood health.', category: 'Blood', price: 550, preparationInstructions: 'Fast for 6 hours before test.', reportAvailabilityHours: 12, hospitalId: '', hospitalName: 'All Hospitals', active: true },
  ]

  // Demo bookings for Arjun Mehta (9999999999)
  const demoBookings: LabBooking[] = [
    {
      id: 'LAB-DEMO-001', testId: 'TEST-DEMO-002', testName: 'Lipid Profile', testCategory: 'Blood',
      patientName: 'Arjun Mehta', patientPhone: '9999999999',
      hospitalId: 'hosp-001', hospitalName: 'Apollo City Hospital',
      date: d(7), time: '09:00', price: 600, status: 'report-ready',
      bookingDate: new Date(today.getTime() - 10 * 86400000).toISOString(),
      reportId: 'RPT-DEMO-001', doctorName: 'Dr. Priya Sharma',
    },
    {
      id: 'LAB-DEMO-002', testId: 'TEST-DEMO-005', testName: 'HbA1c (Glycated Hemoglobin)', testCategory: 'Blood',
      patientName: 'Arjun Mehta', patientPhone: '9999999999',
      hospitalId: 'hosp-001', hospitalName: 'Apollo City Hospital',
      date: d(2), time: '10:00', price: 450, status: 'processing',
      bookingDate: new Date(today.getTime() - 4 * 86400000).toISOString(),
      doctorName: 'Dr. Priya Sharma', notes: 'Quarterly diabetes check',
    },
    {
      id: 'LAB-DEMO-003', testId: 'TEST-DEMO-010', testName: 'ECG (12-Lead)', testCategory: 'Cardiac',
      patientName: 'Arjun Mehta', patientPhone: '9999999999',
      hospitalId: 'hosp-001', hospitalName: 'Apollo City Hospital',
      date: new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10), time: '11:00',
      price: 300, status: 'pending',
      bookingDate: new Date(today.getTime() - 1 * 86400000).toISOString(),
      notes: 'Routine cardiac screening',
    },
  ]

  // Demo report for the completed lipid profile
  const demoReports: LabReport[] = [
    {
      id: 'RPT-DEMO-001', bookingId: 'LAB-DEMO-001', testName: 'Lipid Profile',
      patientName: 'Arjun Mehta', patientPhone: '9999999999',
      hospitalName: 'Apollo City Hospital', hospitalId: 'hosp-001',
      testDate: d(7), summary: 'Lipid profile shows improvement from previous. LDL reduced from 142 to 118 mg/dL. HDL within normal range. Overall cardiovascular risk is moderate and improving with current therapy.',
      status: 'published',
      publishedAt: new Date(today.getTime() - 6 * 86400000).toISOString(),
      uploadedBy: 'Lab Technician',
      createdAt: new Date(today.getTime() - 6 * 86400000).toISOString(),
      results: [
        { parameter: 'Total Cholesterol', value: '195', unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'normal' },
        { parameter: 'LDL Cholesterol', value: '118', unit: 'mg/dL', referenceRange: '< 130 mg/dL', status: 'normal' },
        { parameter: 'HDL Cholesterol', value: '48', unit: 'mg/dL', referenceRange: '> 40 mg/dL', status: 'normal' },
        { parameter: 'Triglycerides', value: '145', unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'normal' },
        { parameter: 'VLDL Cholesterol', value: '29', unit: 'mg/dL', referenceRange: '10-40 mg/dL', status: 'normal' },
        { parameter: 'Cholesterol/HDL Ratio', value: '4.1', unit: '', referenceRange: '< 5.0', status: 'normal' },
      ],
    },
  ]

  localStorage.setItem(CATALOG_KEY, JSON.stringify([...existingTests, ...demoTests]))
  localStorage.setItem(BOOKING_KEY, JSON.stringify([...existingBookings, ...demoBookings]))
  localStorage.setItem(REPORT_KEY, JSON.stringify([...existingReports, ...demoReports]))
  localStorage.setItem(SEED_KEY, SEED_VERSION)
}

// ─── Status helpers ──────────────────────────────────────────────────────────

export const LAB_STATUS_FLOW: LabTestStatus[] = [
  'pending', 'sample-collected', 'processing', 'completed', 'report-ready',
]

export const LAB_STATUS_LABELS: Record<LabTestStatus, string> = {
  'pending': 'Pending',
  'sample-collected': 'Sample Collected',
  'processing': 'Processing',
  'completed': 'Completed',
  'report-ready': 'Report Ready',
  'cancelled': 'Cancelled',
}

export const LAB_STATUS_COLORS: Record<LabTestStatus, string> = {
  'pending':          'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  'sample-collected': 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  'processing':       'bg-purple-500/15 border-purple-500/30 text-purple-400',
  'completed':        'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  'report-ready':     'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  'cancelled':        'bg-red-500/10 border-red-500/20 text-red-400',
}
