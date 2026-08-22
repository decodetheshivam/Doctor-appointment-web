import { useState } from 'react'
import { AppProvider, useApp, type Page } from './context/AppContext'

import Navbar          from './components/Navbar'
import Hero            from './components/Hero'
import QuoteSection    from './components/QuoteSection'
import AIChatbot       from './components/AIChatbot'
import EmergencyModal  from './components/EmergencyModal'
import StatsSection        from './components/landing/StatsSection'
import HowItWorksSection   from './components/landing/HowItWorksSection'
import SpecialtiesSection  from './components/landing/SpecialtiesSection'
import ReviewsSection      from './components/landing/ReviewsSection'
import ForHospitalsSection from './components/landing/ForHospitalsSection'
import ContactSection      from './components/landing/ContactSection'
import Footer              from './components/landing/Footer'
import HospitalsPage       from './pages/HospitalsPage'
import HospitalDetailPage  from './pages/HospitalDetailPage'
import BookingPage         from './pages/BookingPage'
import ConfirmationPage    from './pages/ConfirmationPage'
import MyAppointmentsPage  from './pages/MyAppointmentsPage'
import SpecialtiesPage     from './pages/SpecialtiesPage'
import DoctorsPage         from './pages/DoctorsPage'
import CompareHospitalsPage from './pages/CompareHospitalsPage'
import MedicalRecordsPage  from './pages/MedicalRecordsPage'
import PatientLoginPage    from './pages/PatientLoginPage'
import AdminRouter from './pages/admin/AdminRouter'

const VALID_PAGES: Page[] = [
  'hospitals','hospital-detail','book','confirmation',
  'my-appointments','specialties','doctors','compare-hospitals','medical-records','patient-login',
]

function PageRouter() {
  const { page, navigate } = useApp()
  const [showAdmin, setShowAdmin]         = useState(false)
  const [showEmergency, setShowEmergency] = useState(false)
  const [autoDispatch, setAutoDispatch]   = useState(false)

  const openAdmin     = () => setShowAdmin(true)
  const exitAdmin     = () => { setShowAdmin(false); navigate('landing') }
  // auto=true when voice-triggered, false for manual taps
  const openEmergency = (auto = false) => { setAutoDispatch(auto); setShowEmergency(true) }
  const closeEmergency = () => { setShowEmergency(false); setAutoDispatch(false) }

  function handleChatNav(target: string) {
    const p = target as Page
    if (VALID_PAGES.includes(p)) navigate(p)
    else if (target === 'admin') openAdmin()
  }

  // Shared overlay elements — always rendered on top
  const overlays = (
    <>
      <AIChatbot onNavigate={handleChatNav} onEmergency={openEmergency} />
      {showEmergency && (
        <EmergencyModal autoDispatch={autoDispatch} onClose={closeEmergency} />
      )}
    </>
  )

  if (showAdmin) return <>{<AdminRouter onExitAdmin={exitAdmin} />}{overlays}</>

  if (page === 'patient-login') return (
    <>
      <PatientLoginPage onSuccess={() => navigate('landing')} onSkip={() => navigate('landing')} />
      {overlays}
    </>
  )

  if (page === 'landing') return (
    <>
      <div className="bg-[#030d18]">
        <Hero onAdminClick={openAdmin} onEmergencyClick={openEmergency} />
        <QuoteSection />
        <StatsSection />
        <HowItWorksSection />
        <SpecialtiesSection />
        <ReviewsSection />
        <ForHospitalsSection onRegisterClick={openAdmin} onLoginClick={openAdmin} />
        <ContactSection />
        <Footer onAdminClick={openAdmin} />
      </div>
      {overlays}
    </>
  )

  return (
    <>
      <div className="bg-[#030d18] min-h-screen">
        <Navbar onAdminClick={openAdmin} onEmergencyClick={openEmergency} />
        {page === 'hospitals'       && <HospitalsPage />}
        {page === 'hospital-detail' && <HospitalDetailPage />}
        {page === 'book'            && <BookingPage />}
        {page === 'confirmation'    && <ConfirmationPage />}
        {page === 'my-appointments' && <MyAppointmentsPage />}
        {page === 'specialties'     && <SpecialtiesPage />}
        {page === 'doctors'         && <DoctorsPage />}
        {page === 'compare-hospitals' && <CompareHospitalsPage />}
        {page === 'medical-records' && <MedicalRecordsPage />}
        <Footer onAdminClick={openAdmin} />
      </div>
      {overlays}
    </>
  )
}

export default function App() {
  return <AppProvider><PageRouter /></AppProvider>
}
