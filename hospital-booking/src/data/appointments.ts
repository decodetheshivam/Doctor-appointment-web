export interface Appointment {
  id: string
  hospitalId: string
  hospitalName: string
  doctorId: string
  doctorName: string
  specialty: string
  patientName: string
  patientPhone: string
  patientAge: string
  date: string        // "YYYY-MM-DD"
  time: string        // "HH:MM"
  status: 'confirmed' | 'cancelled'
  bookedAt: string    // ISO timestamp
  tokenNumber: number
}

const STORAGE_KEY = 'mediconnect_appointments'

export function getAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Appointment[]) : []
  } catch {
    return []
  }
}

export function saveAppointment(appt: Appointment): void {
  const all = getAppointments()
  all.push(appt)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function cancelAppointment(id: string): void {
  const all = getAppointments().map((a) =>
    a.id === id ? { ...a, status: 'cancelled' as const } : a
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

/** Returns all booked (not cancelled) times for a doctor on a given date */
export function getBookedSlots(doctorId: string, date: string): string[] {
  return getAppointments()
    .filter((a) => a.doctorId === doctorId && a.date === date && a.status === 'confirmed')
    .map((a) => a.time)
}

/** Generate all possible time slots for a doctor on a given date */
export function generateSlots(
  startTime: string,
  endTime: string,
  slotDuration: number,
  doctorId: string,
  date: string
): { time: string; available: boolean }[] {
  const booked = getBookedSlots(doctorId, date)
  const slots: { time: string; available: boolean }[] = []

  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let current = sh * 60 + sm
  const end = eh * 60 + em

  while (current + slotDuration <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0')
    const m = (current % 60).toString().padStart(2, '0')
    const timeStr = `${h}:${m}`
    slots.push({ time: timeStr, available: !booked.includes(timeStr) })
    current += slotDuration
  }

  return slots
}

/** Next available token number for doctor on date */
export function getNextToken(doctorId: string, date: string): number {
  const booked = getAppointments().filter(
    (a) => a.doctorId === doctorId && a.date === date && a.status === 'confirmed'
  )
  return booked.length + 1
}

/** Generate unique appointment ID */
export function generateId(): string {
  return 'APT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

/** Format display date */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Format 24h to 12h */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}
