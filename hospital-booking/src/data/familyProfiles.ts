// ─── Family Health Profiles ───────────────────────────────────────────────────
// Each registered patient can add family members whose healthcare data
// (appointments, prescriptions, lab bookings, medical records) is stored
// under that family member's own unique virtual phone key so every
// existing data module works without modification.

export type Relationship =
  | 'Father'
  | 'Mother'
  | 'Spouse'
  | 'Son'
  | 'Daughter'
  | 'Brother'
  | 'Sister'
  | 'Grandfather'
  | 'Grandmother'
  | 'Uncle'
  | 'Aunt'
  | 'Other'

export type Gender = 'Male' | 'Female' | 'Other'

export type AccessLevel = 'full' | 'view' | 'none'

export interface FamilyMemberPermissions {
  appointments: AccessLevel
  prescriptions: AccessLevel
  medicalRecords: AccessLevel
  labTests: AccessLevel
}

export interface FamilyMember {
  id: string              // 'FAM-' prefix
  ownerPhone: string      // account holder's phone — the primary join key
  // virtual phone used as patientPhone across all data modules
  // format: 'FAM' + ownerPhone.slice(-6) + sequential index
  virtualPhone: string
  name: string
  dateOfBirth: string     // "YYYY-MM-DD"
  gender: Gender
  relationship: Relationship
  bloodGroup: string
  phone: string           // their own phone number (optional, for contact)
  address: string
  knownConditions: string
  allergies: string
  notes: string           // any extra health notes
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  permissions: FamilyMemberPermissions
  avatarInitials: string  // derived from name on save
  createdAt: string
  updatedAt: string
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mediconnect_family_profiles'

export function getAllFamilyMembers(): FamilyMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FamilyMember[]) : []
  } catch { return [] }
}

export function getFamilyMembersByOwner(ownerPhone: string): FamilyMember[] {
  return getAllFamilyMembers()
    .filter((m) => m.ownerPhone === ownerPhone)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function getFamilyMemberById(id: string): FamilyMember | undefined {
  return getAllFamilyMembers().find((m) => m.id === id)
}

export function getFamilyMemberByVirtualPhone(virtualPhone: string): FamilyMember | undefined {
  return getAllFamilyMembers().find((m) => m.virtualPhone === virtualPhone)
}

export function saveFamilyMember(member: FamilyMember): void {
  const all = getAllFamilyMembers()
  const idx = all.findIndex((m) => m.id === member.id)
  if (idx >= 0) all[idx] = { ...member, updatedAt: new Date().toISOString() }
  else all.push(member)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function deleteFamilyMember(id: string): void {
  const all = getAllFamilyMembers().filter((m) => m.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function generateFamilyMemberId(): string {
  return 'FAM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

/**
 * Generates a stable virtual phone number for a family member.
 * Uses owner's last 6 digits + a sequential suffix to ensure uniqueness.
 * The virtual phone is used as patientPhone across appointments, prescriptions, etc.
 */
export function generateVirtualPhone(ownerPhone: string): string {
  const existing = getAllFamilyMembers().filter((m) => m.ownerPhone === ownerPhone)
  const suffix = (existing.length + 1).toString().padStart(4, '0')
  // Prefix with 6 so it looks like a valid Indian mobile number pattern
  return '6' + ownerPhone.slice(1, 6) + suffix
}

/** Get initials from a full name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

/** Calculate age from date of birth */
export function calculateAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob + 'T00:00:00')
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return Math.max(0, age)
}

/** Whether a family member is a minor (< 18) */
export function isMinor(member: FamilyMember): boolean {
  return calculateAge(member.dateOfBirth) < 18
}

// ─── Relationship avatar colours ─────────────────────────────────────────────

export const RELATION_COLORS: Record<Relationship, string> = {
  Father:      'from-blue-700 to-blue-500',
  Mother:      'from-pink-700 to-pink-500',
  Spouse:      'from-purple-700 to-purple-500',
  Son:         'from-cyan-700 to-cyan-500',
  Daughter:    'from-rose-700 to-rose-500',
  Brother:     'from-indigo-700 to-indigo-500',
  Sister:      'from-fuchsia-700 to-fuchsia-500',
  Grandfather: 'from-slate-700 to-slate-500',
  Grandmother: 'from-amber-700 to-amber-500',
  Uncle:       'from-teal-700 to-teal-500',
  Aunt:        'from-orange-700 to-orange-500',
  Other:       'from-gray-700 to-gray-500',
}

export const RELATIONSHIPS: Relationship[] = [
  'Father', 'Mother', 'Spouse', 'Son', 'Daughter',
  'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Other',
]

// ─── Notification helpers ─────────────────────────────────────────────────────

export interface FamilyNotification {
  id: string
  memberName: string
  type: 'appointment' | 'medicine' | 'lab-report' | 'checkup' | 'prescription'
  message: string
  createdAt: string
  read: boolean
}

const NOTIF_KEY = 'mediconnect_family_notifications'

export function getFamilyNotifications(ownerPhone: string): FamilyNotification[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    const all = raw ? (JSON.parse(raw) as FamilyNotification[]) : []
    return all.filter((n) => n.id.startsWith(ownerPhone))
  } catch { return [] }
}

export function addFamilyNotification(ownerPhone: string, notif: Omit<FamilyNotification, 'id' | 'createdAt' | 'read'>): void {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    const all = raw ? (JSON.parse(raw) as FamilyNotification[]) : []
    all.unshift({
      ...notif,
      id: ownerPhone + '-' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      read: false,
    })
    // Keep only last 50 notifications per owner
    const filtered = all.filter((n) => n.id.startsWith(ownerPhone)).slice(0, 50)
    const others = all.filter((n) => !n.id.startsWith(ownerPhone))
    localStorage.setItem(NOTIF_KEY, JSON.stringify([...others, ...filtered]))
  } catch { /* ignore */ }
}

export function markNotificationsRead(ownerPhone: string): void {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    const all = raw ? (JSON.parse(raw) as FamilyNotification[]) : []
    const updated = all.map((n) =>
      n.id.startsWith(ownerPhone) ? { ...n, read: true } : n
    )
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}
