// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmergencyContact {
  name: string
  phone: string
  relation: string
}

export interface PatientProfile {
  id: string
  name: string
  phone: string       // 10-digit, used as unique ID
  age: string
  bloodGroup: string
  address: string
  city: string
  knownConditions: string   // e.g. "Diabetes, Hypertension"
  allergies: string
  emergencyContacts: EmergencyContact[]
  preferredLanguage: string // chatbot default language: en|hi|mr|ta|te|bn
  createdAt: string
  lastLogin: string
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const PATIENTS_KEY = 'mediconnect_patients'
const SESSION_KEY  = 'mediconnect_patient_session'   // stores phone of logged-in patient
const CHAT_LANG_KEY = 'mediconnect_chat_language'    // stores preferred chatbot language

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getAllPatients(): PatientProfile[] {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY)
    return raw ? (JSON.parse(raw) as PatientProfile[]) : []
  } catch { return [] }
}

export function getPatientByPhone(phone: string): PatientProfile | undefined {
  return getAllPatients().find((p) => p.phone === phone)
}

export function savePatient(patient: PatientProfile): void {
  const all = getAllPatients()
  const idx = all.findIndex((p) => p.phone === patient.phone)
  if (idx >= 0) all[idx] = patient
  else all.push(patient)
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(all))
}

export function generatePatientId(): string {
  return 'PAT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function getPatientSession(): PatientProfile | null {
  try {
    const phone = localStorage.getItem(SESSION_KEY)
    if (!phone) return null
    return getPatientByPhone(phone) ?? null
  } catch { return null }
}

export function setPatientSession(phone: string): void {
  localStorage.setItem(SESSION_KEY, phone)
  // Update lastLogin
  const p = getPatientByPhone(phone)
  if (p) savePatient({ ...p, lastLogin: new Date().toISOString() })
}

export function clearPatientSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

// ─── Chatbot language preference ──────────────────────────────────────────────

export function getChatLanguage(): string | null {
  try {
    return localStorage.getItem(CHAT_LANG_KEY)
  } catch { return null }
}

export function setChatLanguage(lang: string): void {
  try {
    localStorage.setItem(CHAT_LANG_KEY, lang)
  } catch { /* ignore */ }
}

// ─── Blood group options ───────────────────────────────────────────────────────

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
