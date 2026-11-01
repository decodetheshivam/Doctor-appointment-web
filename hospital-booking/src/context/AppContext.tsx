import { createContext, useContext, useState, ReactNode } from 'react'

export type Page = 'landing' | 'hospitals' | 'hospital-detail' | 'book' | 'confirmation' | 'my-appointments' | 'specialties' | 'doctors' | 'compare-hospitals' | 'medical-records' | 'admin' | 'patient-login' | 'prescriptions' | 'lab-tests' | 'family'

interface AppState {
  page: Page
  selectedHospitalId: string | null
  selectedDoctorId: string | null
  lastAppointmentId: string | null
  selectedSpecialty: string | null
}

interface AppContextType extends AppState {
  navigate: (page: Page, params?: Partial<Omit<AppState, 'page'>>) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    page: 'landing',
    selectedHospitalId: null,
    selectedDoctorId: null,
    lastAppointmentId: null,
    selectedSpecialty: null,
  })

  function navigate(page: Page, params?: Partial<Omit<AppState, 'page'>>) {
    setState((prev) => ({ ...prev, page, ...params }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AppContext.Provider value={{ ...state, navigate }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
